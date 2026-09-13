'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ----------------------------------------------------
// RETRO 8-BIT / PIXEL ART ICONS (Fixed Anchor Points)
// ----------------------------------------------------

const liveDevice8BitIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const cypher8BitIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Auto-follow component: smooth pan on device movement & target selection
function MapAutoFollow({ coords, targetCoords, isAutoFollow }) {
  const map = useMap();

  useEffect(() => {
    if (isAutoFollow && coords) {
      map.panTo(coords, { animate: true, duration: 1 });
    }
  }, [coords, isAutoFollow, map]);

  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, 16, { duration: 1.5 });
    }
  }, [targetCoords, map]);

  return null;
}

// Distance Helper (Haversine Formula in KM)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function Map() {
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [accuracyRadius, setAccuracyRadius] = useState(null);
  const [isGpsHardware, setIsGpsHardware] = useState(false);
  const [userIp, setUserIp] = useState('ACQUIRING...');
  const [sightings, setSightings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [isAutoFollow, setIsAutoFollow] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSighting, setNewSighting] = useState({ type: 'Trapwire', location: '', lat: '', lng: '', note: '' });

  const [newsFeed, setNewsFeed] = useState('FETCHING LIVE CYPHER INTEL...');
  const [weather, setWeather] = useState(null);

  const outerWorldBounds = [
    [-90, -180],
    [90, 180],
  ];

  const getWeatherDetails = (code) => {
    if (code === 0) return { cond: 'CLEAR SKIES', icon: '☀️' };
    if (code >= 1 && code <= 3) return { cond: 'PARTLY CLOUDY', icon: '⛅' };
    if (code >= 45 && code <= 48) return { cond: 'FOGGY GRID', icon: '🌫️' };
    if (code >= 51 && code <= 67) return { cond: 'LIGHT RAIN', icon: '🌧️' };
    if (code >= 80 && code <= 82) return { cond: 'HEAVY RAIN', icon: '⛈️' };
    if (code >= 95) return { cond: 'THUNDERSTORM', icon: '⚡' };
    return { cond: 'ATMOSPHERIC DATA', icon: '🌐' };
  };

  // 1. Precise Geolocation Watcher (Hardware First, IP Secondary)
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ip) setUserIp(data.ip);
      })
      .catch((err) => console.warn('IP fetch error:', err));

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDeviceCoords([pos.coords.latitude, pos.coords.longitude]);
          setAccuracyRadius(pos.coords.accuracy);
          setIsGpsHardware(true);
        },
        async () => {
          // Fallback only if browser GPS fails or user denies permissions
          setIsGpsHardware(false);
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
              setDeviceCoords([data.latitude, data.longitude]);
              setAccuracyRadius(null);
            }
          } catch (e) {
            console.warn(e);
          }
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 2. Cyber News Broadcasts
  useEffect(() => {
    async function fetchRealNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        if (data.newsText) setNewsFeed(data.newsText);
      } catch (err) {
        setNewsFeed('CYPHER INTEL FEED: NETWORK OFFLINE ■ LOCAL BACKUP ACTIVE');
      }
    }

    fetchRealNews();
    const interval = setInterval(fetchRealNews, 300000);
    return () => clearInterval(interval);
  }, []);

  // 3. Live Weather Telemetry
  useEffect(() => {
    if (!deviceCoords) return;
    async function fetchTacticalWeather(lat, lng) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
        );
        const data = await res.json();
        if (data && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            wind: Math.round(data.current.wind_speed_10m),
            code: data.current.weather_code,
          });
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    }

    fetchTacticalWeather(deviceCoords[0], deviceCoords[1]);
  }, [deviceCoords]);

  // 4. Road Route Geometry via OSRM
  useEffect(() => {
    if (!deviceCoords || !targetCoords) {
      setRoutePath([]);
      return;
    }

    async function fetchRoadRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${deviceCoords[1]},${deviceCoords[0]};${targetCoords[1]},${targetCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
          setRoutePath(coords);
        } else {
          setRoutePath([deviceCoords, targetCoords]);
        }
      } catch (err) {
        setRoutePath([deviceCoords, targetCoords]);
      }
    }

    fetchRoadRoute();
  }, [deviceCoords, targetCoords]);

  // 5. Dynamic Search Handler
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const query = searchQuery.trim();

    const coordMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      const newPin = {
        id: Date.now(),
        type: 'TARGET PING',
        lat,
        lng,
        location: `COORD (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        note: 'Direct coordinate target locked',
      };

      setSightings((prev) => [...prev, newPin]);
      setTargetCoords([lat, lng]);
      setIsSearching(false);
      return;
    }

    const ipMatch = query.match(/^([0-9]{1,3}\.){3}[0-9]{1,3}$/);
    if (ipMatch) {
      try {
        const res = await fetch(`https://ipapi.co/${query}/json/`);
        const data = await res.json();

        if (data && data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          const city = data.city || 'Unknown';
          const country = data.country_name || '';

          const newPin = {
            id: Date.now(),
            type: `IP TARGET: ${query}`,
            lat,
            lng,
            location: `${city}, ${country}`,
            note: `ISP/ORG: ${data.org || 'Unknown ISP'}`,
          };

          setSightings((prev) => [...prev, newPin]);
          setTargetCoords([lat, lng]);
        } else {
          alert(`CYPHER NETWORK UNABLE TO LOCATE IP: ${query}`);
        }
      } catch (err) {
        alert('IP GEOLOCATION SERVICE UNREACHABLE');
      } finally {
        setIsSearching(false);
      }
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const locName = data[0].display_name.split(',')[0];

        const newPin = {
          id: Date.now(),
          type: 'SEARCHED INTEL',
          lat,
          lng,
          location: locName,
          note: 'Location located via search grid',
        };

        setSightings((prev) => [...prev, newPin]);
        setTargetCoords([lat, lng]);
      } else {
        alert('TARGET UNKNOWN TO CYPHER NETWORK');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteSighting = (id) => {
    setSightings((prev) => prev.filter((item) => item.id !== id));
  };

  const handleJumpToDevice = () => {
    if (deviceCoords) {
      setIsAutoFollow(true);
      setTargetCoords(deviceCoords);
    } else {
      alert('ACQUIRING GPS SIGNAL...');
    }
  };

  const handleAddSighting = (e) => {
    e.preventDefault();
    if (!newSighting.location || !newSighting.lat || !newSighting.lng) return;

    const added = {
      id: Date.now(),
      type: newSighting.type,
      lat: parseFloat(newSighting.lat),
      lng: parseFloat(newSighting.lng),
      location: newSighting.location,
      note: newSighting.note || 'Classified Intel',
    };

    setSightings((prev) => [...prev, added]);
    setTargetCoords([added.lat, added.lng]);
    setIsModalOpen(false);
    setNewSighting({ type: 'Trapwire', location: '', lat: '', lng: '', note: '' });
  };

  const activeDistance =
    deviceCoords && targetCoords
      ? calculateDistance(deviceCoords[0], deviceCoords[1], targetCoords[0], targetCoords[1])
      : null;

  return (
    <div className="outer-frame" style={styles.outerFrame}>
      {/* Top Banner Header */}
      <div className="header-bar" style={styles.headerBar}>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          className="header-icon"
          style={styles.headerIcon} 
          onError={(e) => { e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff'; }}
        />
        <div className="header-title" style={styles.headerTitle}>CYPHER TRACKER</div>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          className="header-icon"
          style={styles.headerIcon} 
          onError={(e) => { e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff'; }}
        />
      </div>

      {/* Main Screen Container */}
      <div style={styles.monitorContainer}>
        <div className="crt-overlay"></div>

        {/* Floating Top Control Panel */}
        <div className="status-box" style={styles.statusBox}>
          <p className="status-text" style={styles.statusText}>
            SYS.IP // {userIp} | INTEL: {sightings.length} | MODE: {isGpsHardware ? 'GPS (HARDWARE)' : 'IP (ESTIMATED)'} {activeDistance ? `| RANGE: ${activeDistance} KM` : ''}
          </p>
          
          <div style={styles.controlsRow}>
            <form onSubmit={handleSearchLocation} style={styles.searchForm}>
              <input
                type="text"
                placeholder="IP, City, or Lat, Lng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={styles.searchInput}
              />
              <button type="submit" className="btn-ui" style={styles.searchBtn} disabled={isSearching}>
                {isSearching ? '...' : 'LOCATE'}
              </button>
            </form>

            <div style={styles.btnGroup}>
              <button className="btn-ui" style={styles.homeBtn} onClick={handleJumpToDevice}>
                GPS LOC
              </button>

              <button className="btn-ui" style={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                + REPORT
              </button>
            </div>
          </div>
        </div>

        {/* Weather HUD Widget */}
        <div className="weather-hud" style={styles.weatherHud}>
          <div className="weather-header" style={styles.weatherHeader}>
            ENV.INTEL // LIVE WX
          </div>
          <div className="weather-body" style={styles.weatherBody}>
            <span className="weather-icon" style={{ fontSize: '18px' }}>
              {weather ? getWeatherDetails(weather.code).icon : '🌐'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong className="weather-temp" style={{ color: '#00f0ff', fontSize: '13px' }}>
                {weather ? `${weather.temp}°C` : 'SYNCING...'}
              </strong>
              <span className="weather-cond" style={{ color: '#00a8ff', fontSize: '10px' }}>
                {weather ? getWeatherDetails(weather.code).cond : 'TELEMETRY'}
              </span>
            </div>
          </div>
          <div className="weather-subtext" style={styles.weatherSubtext}>
            {weather
              ? `WIND: ${weather.wind} KM/H | HUM: ${weather.humidity}%`
              : 'INITIALIZING MATRIX...'}
          </div>
        </div>

        {/* Tactical Radar HUD */}
        <div className="radar-hud" style={styles.radarHud}>
          <div style={styles.radarGridHorizontal}></div>
          <div style={styles.radarGridVertical}></div>
          <div className="radar-sweep-line"></div>
          <span className="radar-text" style={styles.radarText}>RADAR</span>
        </div>

        {/* Tactical Leaflet Map */}
        <MapContainer
          key="cypher-map-container"
          center={deviceCoords || [10.7202, 122.5621]}
          zoom={16}
          minZoom={2}
          maxBounds={outerWorldBounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%', background: '#08121e' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_3i1g_1_84bc385403b805786774790e"
            noWrap={true}
            bounds={outerWorldBounds}
          />

          <MapAutoFollow
            coords={deviceCoords}
            targetCoords={targetCoords}
            isAutoFollow={isAutoFollow}
          />

          {/* GPS Hardware Precision Accuracy Circle */}
          {deviceCoords && accuracyRadius && (
            <Circle
              center={deviceCoords}
              radius={accuracyRadius}
              pathOptions={{
                color: '#00f0ff',
                fillColor: '#00f0ff',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '4, 4',
              }}
            />
          )}

          {/* Device Location Marker */}
          {deviceCoords && (
            <Marker position={deviceCoords} icon={liveDevice8BitIcon}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111' }}>
                  📡 <strong>BEACON ACTIVE</strong><br />
                  MODE: {isGpsHardware ? 'GPS HARDWARE' : 'IP NETWORK'}<br />
                  IP: {userIp}<br />
                  LAT: {deviceCoords[0].toFixed(4)} | LNG: {deviceCoords[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Road Path Geometry */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              pathOptions={{ color: '#00f0ff', weight: 3, dashArray: '6, 8', opacity: 0.85 }}
            />
          )}

          {sightings.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={cypher8BitIcon}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111', minWidth: '120px' }}>
                  <strong>[{s.type.toUpperCase()}] DETECTED</strong><br />
                  📍 {s.location}<br />
                  💬 <em>"{s.note}"</em>
                  <hr style={{ margin: '6px 0', borderColor: '#ccc' }} />
                  <button
                    onClick={() => handleDeleteSighting(s.id)}
                    style={{
                      backgroundColor: '#ff3b30',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: '8px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      width: '100%',
                      fontWeight: 'bold',
                    }}
                  >
                    🗑️ DELETE PIN
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h4 style={{ margin: '0 0 10px 0', color: '#00f0ff', fontSize: '11px' }}>
                SUBMIT NEW CYPHER INTEL
              </h4>
              <form onSubmit={handleAddSighting} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Location Name"
                  value={newSighting.location}
                  onChange={(e) => setNewSighting({ ...newSighting, location: e.target.value })}
                  style={styles.modalInput}
                  required
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newSighting.lat}
                    onChange={(e) => setNewSighting({ ...newSighting, lat: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newSighting.lng}
                    onChange={(e) => setNewSighting({ ...newSighting, lng: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Intel Note"
                  value={newSighting.note}
                  onChange={(e) => setNewSighting({ ...newSighting, note: e.target.value })}
                  style={styles.modalInput}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>
                    CANCEL
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    LOG SIGHTING
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Marquee Feed Bar */}
      <div className="bottom-bar" style={styles.bottomBar}>
        <div style={styles.tickerTrack}>
          <span style={styles.tickerText}>{newsFeed}</span>
          <span style={styles.tickerText}>{newsFeed}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes smoothTicker {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Responsive Layout Overrides */
        @media (max-width: 600px) {
          .status-box {
            top: 6px !important;
            padding: 6px 8px !important;
            width: calc(100% - 16px) !important;
          }
          .status-text {
            font-size: 7px !important;
          }
          .search-input {
            font-size: 8px !important;
          }
          .btn-ui {
            font-size: 8px !important;
            padding: 3px 5px !important;
          }
          .weather-hud {
            top: auto !important;
            bottom: 12px !important;
            left: 8px !important;
            padding: 4px 6px !important;
            min-width: 100px !important;
          }
          .radar-hud {
            bottom: 12px !important;
            right: 8px !important;
            width: 48px !important;
            height: 48px !important;
          }
        }

        @media (min-width: 601px) {
          .status-box {
            max-width: 580px !important;
            padding: 8px 14px !important;
            top: 10px !important;
          }
          .weather-hud {
            top: 85px !important;
            left: 12px !important;
            padding: 8px 12px !important;
            min-width: 180px !important;
          }
          .radar-hud {
            bottom: 16px !important;
            right: 16px !important;
            width: 64px !important;
            height: 64px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  outerFrame: {
    height: '100dvh',
    width: '100vw',
    backgroundColor: '#0a141d',
    padding: '6px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-pixel), monospace',
    overflow: 'hidden',
  },
  headerBar: {
    backgroundColor: '#0f2333',
    border: '2px solid #00a8ff',
    padding: '4px 10px',
    borderRadius: '6px',
    boxShadow: '0 2px 0 #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  headerIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
  },
  headerTitle: {
    color: '#e0f7fc',
    fontSize: '11px',
    letterSpacing: '1px',
    textShadow: '1px 1px #000',
    whiteSpace: 'nowrap',
  },
  monitorContainer: {
    position: 'relative',
    width: '100%',
    flex: 1,
    margin: '4px 0',
    border: '2px solid #1a3a52',
    outline: '1px solid #00f0ff',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 3px 0 #000',
  },
  statusBox: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: 'rgba(13, 30, 45, 0.95)',
    border: '1.5px solid #00f0ff',
    padding: '6px 10px',
    textAlign: 'center',
    borderRadius: '4px',
    boxShadow: '0 3px 0 #000',
    width: 'calc(100% - 20px)',
    maxWidth: '460px',
    boxSizing: 'border-box',
  },
  statusText: {
    margin: '0 0 4px 0',
    fontSize: '8px',
    color: '#00f0ff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  controlsRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchForm: {
    display: 'flex',
    gap: '4px',
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#050b10',
    border: '1px solid #00f0ff',
    color: '#00f0ff',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 6px',
    width: '100%',
    borderRadius: '2px',
    boxSizing: 'border-box',
  },
  searchBtn: {
    backgroundColor: '#0f2333',
    color: '#00f0ff',
    border: '1px solid #00f0ff',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnGroup: {
    display: 'flex',
    gap: '4px',
  },
  homeBtn: {
    backgroundColor: '#0f2333',
    color: '#00f0ff',
    border: '1px solid #00a8ff',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  actionBtn: {
    backgroundColor: '#00f0ff',
    color: '#000',
    border: 'none',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  weatherHud: {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    border: '1.5px solid #00f0ff',
    borderRadius: '4px',
    boxShadow: '0 3px 0 #000',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  weatherHeader: {
    fontSize: '6px',
    color: '#00a8ff',
    letterSpacing: '1px',
    borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
    paddingBottom: '2px',
  },
  weatherBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '1px',
  },
  weatherSubtext: {
    fontSize: '6px',
    color: '#00f0ff',
    letterSpacing: '0.5px',
  },
  radarHud: {
    position: 'absolute',
    zIndex: 1000,
    borderRadius: '50%',
    border: '1.5px solid #00f0ff',
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  radarGridHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
  },
  radarGridVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '1px',
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
  },
  radarText: {
    fontSize: '5px',
    color: '#00f0ff',
    letterSpacing: '1px',
    zIndex: 2,
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  },
  modalContent: {
    backgroundColor: '#0d1e2d',
    border: '2px solid #00f0ff',
    padding: '12px',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '280px',
    boxSizing: 'border-box',
  },
  modalInput: {
    backgroundColor: '#050b10',
    border: '1px solid #00a8ff',
    color: '#00f0ff',
    fontFamily: 'var(--font-pixel), monospace',
    fontSize: '9px',
    padding: '5px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    backgroundColor: '#ff3b30',
    color: '#fff',
    border: 'none',
    fontSize: '8px',
    fontFamily: 'inherit',
    padding: '5px 8px',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#00f0ff',
    color: '#000',
    border: 'none',
    fontSize: '8px',
    fontFamily: 'inherit',
    padding: '5px 8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  bottomBar: {
    width: '100%',
    backgroundColor: '#050b10',
    border: '1.5px solid #00a8ff',
    borderRadius: '4px',
    padding: '4px 0',
    boxShadow: '0 2px 0 #000',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  tickerTrack: {
    display: 'flex',
    width: 'max-content',
    animation: 'smoothTicker 25s linear infinite',
  },
  tickerText: {
    color: '#00f0ff',
    fontSize: '9px',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-pixel), monospace',
    paddingRight: '60px',
  },
};