'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ----------------------------------------------------
// RETRO 8-BIT / PIXEL ART ICONS
// ----------------------------------------------------

const liveDevice8BitIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'clean-cypher-icon',
});

const cypher8BitIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'clean-cypher-icon',
});

// Helper component to smoothly fly map view
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 10, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Distance Helper (Haversine Formula in KM)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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
  const [userIp, setUserIp] = useState('ACQUIRING...');
  const [sightings, setSightings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSighting, setNewSighting] = useState({ type: 'Trapwire', location: '', lat: '', lng: '', note: '' });

  const [newsFeed, setNewsFeed] = useState('FETCHING LIVE CYPHER INTEL...');

  // Weather State Data
  const [weather, setWeather] = useState(null);

  const outerWorldBounds = [
    [-90, -180],
    [90, 180],
  ];

  // Map Open-Meteo Weather Codes to Retro Descriptions & Icons
  const getWeatherDetails = (code) => {
    if (code === 0) return { cond: 'CLEAR SKIES', icon: '☀️' };
    if (code >= 1 && code <= 3) return { cond: 'PARTLY CLOUDY', icon: '⛅' };
    if (code >= 45 && code <= 48) return { cond: 'FOGGY GRID', icon: '🌫️' };
    if (code >= 51 && code <= 67) return { cond: 'LIGHT RAIN', icon: '🌧️' };
    if (code >= 80 && code <= 82) return { cond: 'HEAVY RAIN', icon: '⛈️' };
    if (code >= 95) return { cond: 'THUNDERSTORM', icon: '⚡' };
    return { cond: 'ATMOSPHERIC DATA', icon: '🌐' };
  };

  // 1. Precise Geolocation (Prefers Hardware GPS, Falls back to IP Geolocation)
  useEffect(() => {
    // Fetch public IP address for status display
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ip) setUserIp(data.ip);
      })
      .catch((err) => console.warn('IP fetch error:', err));

    // Obtain precise hardware GPS positioning
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDeviceCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
              setDeviceCoords([data.latitude, data.longitude]);
            }
          } catch (e) {
            console.warn(e);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 2. Fetch Live Cyber News Broadcasts
  useEffect(() => {
    async function fetchRealNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        if (data.newsText) setNewsFeed(data.newsText);
      } catch (err) {
        console.warn('News Feed Error:', err);
        setNewsFeed('CYPHER INTEL FEED: NETWORK OFFLINE ■ LOCAL BACKUP ACTIVE');
      }
    }

    fetchRealNews();
    const interval = setInterval(fetchRealNews, 300000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fetch Live Weather using Open-Meteo API whenever deviceCoords update
  useEffect(() => {
    if (!deviceCoords) return;

    async function fetchTacticalWeather() {
      try {
        const [lat, lng] = deviceCoords;
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

    fetchTacticalWeather();
  }, [deviceCoords]);

  // 4. Dynamic Search Handler (Supports Live IPs, Coordinates, or Cities)
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const query = searchQuery.trim();

    // A. Direct Lat, Lng Coordinates (e.g. "10.72, 122.56")
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

    // B. IPv4 Address Detection (e.g. "8.8.8.8")
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
          const isp = data.org || data.asn || 'Unknown ISP';

          const newPin = {
            id: Date.now(),
            type: `IP TARGET: ${query}`,
            lat,
            lng,
            location: `${city}, ${country}`,
            note: `ISP/ORG: ${isp} | REGION: ${data.region || 'N/A'}`,
          };

          setSightings((prev) => [...prev, newPin]);
          setTargetCoords([lat, lng]);
        } else {
          alert(`CYPHER NETWORK UNABLE TO LOCATE IP: ${query}`);
        }
      } catch (err) {
        console.error('IP Search Error:', err);
        alert('IP GEOLOCATION SERVICE UNREACHABLE');
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // C. OpenStreetMap City/Name Search Fallback
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

        {/* Dynamic Status Box */}
        <div className="status-box" style={styles.statusBox}>
          <p className="status-text" style={styles.statusText}>
            SYS.IP // {userIp} | INTEL: {sightings.length} {activeDistance ? `| RANGE: ${activeDistance} KM` : ''}
          </p>
          
          <div style={styles.controlsRow}>
            <form onSubmit={handleSearchLocation} style={styles.searchForm}>
              <input
                type="text"
                placeholder="Enter IP (e.g. 8.8.8.8), City, or Lat, Lng..."
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

        {/* Tactical Weather HUD Widget */}
        {weather && (
          <div className="weather-hud" style={styles.weatherHud}>
            <div className="weather-header" style={styles.weatherHeader}>
              ENV.INTEL // LIVE WX
            </div>
            <div className="weather-body" style={styles.weatherBody}>
              <span className="weather-icon">{getWeatherDetails(weather.code).icon}</span>
              <div>
                <strong className="weather-temp" style={{ color: '#00f0ff' }}>{weather.temp}°C</strong>
                <span className="weather-cond" style={{ color: '#00a8ff' }}>
                  {getWeatherDetails(weather.code).cond}
                </span>
              </div>
            </div>
            <div className="weather-subtext" style={styles.weatherSubtext}>
              WIND: {weather.wind} KM/H | HUM: {weather.humidity}%
            </div>
          </div>
        )}

        {/* Tactical Radar HUD */}
        <div className="radar-hud" style={styles.radarHud}>
          <div style={styles.radarGridHorizontal}></div>
          <div style={styles.radarGridVertical}></div>
          <div className="radar-sweep-line"></div>
          
          <img 
            src="https://api.iconify.design/pixelarticons:eye.svg?color=%2300f0ff" 
            alt="Radar" 
            className="radar-icon"
            style={{ width: '22px', height: '22px', zIndex: 2 }} 
          />
          <span className="radar-text" style={styles.radarText}>RADAR</span>
        </div>

        {/* Dark Tactical Map */}
        <MapContainer
          key="cypher-map-container"
          center={deviceCoords || [10.7202, 122.5621]}
          zoom={3}
          minZoom={2}
          maxBounds={outerWorldBounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%', background: '#08121e' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            noWrap={true}
            bounds={outerWorldBounds}
          />

          {targetCoords && <MapFlyTo coords={targetCoords} />}

          {/* Device GPS Beacon */}
          {deviceCoords && (
            <Marker position={deviceCoords} icon={liveDevice8BitIcon}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111' }}>
                  📡 <strong>GPS HARDWARE BEACON</strong><br />
                  IP: {userIp}<br />
                  LAT: {deviceCoords[0].toFixed(4)} | LNG: {deviceCoords[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Target Trajectory Line & Vector Distance */}
          {deviceCoords && targetCoords && (
            <Polyline
              positions={[deviceCoords, targetCoords]}
              pathOptions={{ color: '#00f0ff', weight: 2, dashArray: '6, 8', opacity: 0.8 }}
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
                  placeholder="Location Name (e.g. Manila)"
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

      {/* Dynamic Live Broadcast Marquee Feed */}
      <div className="bottom-bar" style={styles.bottomBar}>
        <div style={styles.tickerTrack}>
          <span style={styles.tickerText}>{newsFeed}</span>
          <span style={styles.tickerText}>{newsFeed}</span>
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

          /* Isolate marker layer completely to remove cyan background glow */
          :global(.leaflet-marker-pane) {
            mix-blend-mode: normal !important;
            filter: none !important;
          }

          :global(.leaflet-marker-icon),
          :global(.clean-cypher-icon) {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
            filter: none !important;
          }

          /* Desktop Responsive Scaling */
          @media (min-width: 768px) {
            /* Status Control Panel Scaling */
            .status-box {
              max-width: 620px !important;
              padding: 10px 16px !important;
              top: 14px !important;
            }
            .status-text {
              font-size: 12px !important;
              margin-bottom: 8px !important;
            }
            .search-input {
              font-size: 11px !important;
              padding: 6px 10px !important;
            }
            .btn-ui {
              font-size: 11px !important;
              padding: 6px 12px !important;
            }

            /* Weather HUD Scaling */
            .weather-hud {
              padding: 10px 14px !important;
              min-width: 200px !important;
              top: 100px !important;
              left: 16px !important;
              gap: 4px !important;
            }
            .weather-header {
              font-size: 10px !important;
              padding-bottom: 4px !important;
            }
            .weather-icon {
              font-size: 22px !important;
            }
            .weather-temp {
              font-size: 16px !important;
            }
            .weather-cond {
              font-size: 11px !important;
              margin-left: 6px !important;
            }
            .weather-subtext {
              font-size: 9px !important;
              margin-top: 4px !important;
            }
          }
        `}</style>
      </div>
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
    border: '3px solid #00a8ff',
    padding: '6px 12px',
    borderRadius: '8px',
    boxShadow: '0 3px 0 #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  headerIcon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
  },
  headerTitle: {
    color: '#e0f7fc',
    fontSize: '12px',
    letterSpacing: '1px',
    textShadow: '1px 1px #000',
    whiteSpace: 'nowrap',
  },
  monitorContainer: {
    position: 'relative',
    width: '100%',
    flex: 1,
    margin: '6px 0',
    border: '3px solid #1a3a52',
    outline: '2px solid #00f0ff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 4px 0 #000',
  },
  statusBox: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: 'rgba(13, 30, 45, 0.95)',
    border: '2px solid #00f0ff',
    padding: '6px 10px',
    textAlign: 'center',
    borderRadius: '6px',
    boxShadow: '0 4px 0 #000',
    width: 'calc(100% - 24px)',
    maxWidth: '420px',
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
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    gap: '4px',
    flex: '1 1 auto',
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
    top: '70px',
    left: '12px',
    zIndex: 1000,
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    border: '2px solid #00f0ff',
    borderRadius: '6px',
    padding: '6px 8px',
    boxShadow: '0 4px 0 #000',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '130px',
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
    marginTop: '2px',
  },
  weatherSubtext: {
    fontSize: '6px',
    color: '#00f0ff',
    marginTop: '2px',
    letterSpacing: '0.5px',
  },
  radarHud: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    zIndex: 1000,
    width: '65px',
    height: '65px',
    borderRadius: '50%',
    border: '2px solid #00f0ff',
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
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
    marginTop: '1px',
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
    padding: '14px',
    borderRadius: '8px',
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
    padding: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    backgroundColor: '#ff3b30',
    color: '#fff',
    border: 'none',
    fontSize: '8px',
    fontFamily: 'inherit',
    padding: '6px 10px',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#00f0ff',
    color: '#000',
    border: 'none',
    fontSize: '8px',
    fontFamily: 'inherit',
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  bottomBar: {
    width: '100%',
    backgroundColor: '#050b10',
    border: '2px solid #00a8ff',
    borderRadius: '6px',
    padding: '6px 0',
    boxShadow: '0 3px 0 #000',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  tickerTrack: {
    display: 'flex',
    width: 'max-content',
    animation: 'smoothTicker 25s linear infinite',
  },
  tickerText: {
    color: '#00f0ff',
    fontSize: '10px',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-pixel), monospace',
    paddingRight: '80px',
  },
};