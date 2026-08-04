'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ----------------------------------------------------
// RETRO 8-BIT / PIXEL ART ICONS
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

export default function Map() {
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSighting, setNewSighting] = useState({ type: 'Trapwire', location: '', lat: '', lng: '', note: '' });

  // Strictly define world bounds to prevent repetition/stretching
  const outerWorldBounds = [
    [-90, -180],
    [90, 180],
  ];

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDeviceCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.warn('Geo Error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      const newPin = {
        id: Date.now(),
        type: 'SEARCHED TARGET',
        lat,
        lng,
        location: `PING (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        note: 'Location located via direct coordinates'
      };

      setSightings((prev) => [...prev, newPin]);
      setTargetCoords([lat, lng]);
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
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
          note: 'Location located via search grid'
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
      alert('ACQUIRING DEVICE SIGNAL...');
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
      note: newSighting.note || 'Classified Intel'
    };

    setSightings((prev) => [...prev, added]);
    setTargetCoords([added.lat, added.lng]);
    setIsModalOpen(false);
    setNewSighting({ type: 'Trapwire', location: '', lat: '', lng: '', note: '' });
  };

  return (
    <div style={styles.outerFrame}>
      {/* Top Banner Header */}
      <div style={styles.headerBar}>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          style={styles.headerIcon} 
          onError={(e) => { e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff'; }}
        />
        <div style={styles.headerTitle}>CYPHER TRACKER</div>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          style={styles.headerIcon} 
          onError={(e) => { e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff'; }}
        />
      </div>

      {/* Main Screen Container */}
      <div style={styles.monitorContainer}>
        {/* CRT Scanline Overlay */}
        <div className="crt-overlay"></div>

        {/* Dynamic Status Box & Search Form */}
        <div style={styles.statusBox}>
          <p style={styles.statusText}>
            SYS.LOC // {deviceCoords ? 'BEACON ACTIVE' : 'ACQUIRING...'} | INTEL: {sightings.length}
          </p>
          
          <div style={styles.controlsRow}>
            <form onSubmit={handleSearchLocation} style={styles.searchForm}>
              <input
                type="text"
                placeholder="Search 'Lat, Lng' or City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn} disabled={isSearching}>
                {isSearching ? '...' : 'LOCATE'}
              </button>
            </form>

            <div style={styles.btnGroup}>
              <button style={styles.homeBtn} onClick={handleJumpToDevice}>
                MY LOC
              </button>

              <button style={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                + REPORT
              </button>
            </div>
          </div>
        </div>

        {/* Tactical Radar HUD */}
        <div style={styles.radarHud}>
          <div style={styles.radarGridHorizontal}></div>
          <div style={styles.radarGridVertical}></div>
          <div className="radar-sweep-line"></div>
          
          <img 
            src="https://api.iconify.design/pixelarticons:eye.svg?color=%2300f0ff" 
            alt="Radar" 
            style={{ width: '22px', height: '22px', zIndex: 2 }} 
          />
          <span style={styles.radarText}>RADAR</span>
        </div>

        {/* Dark Tactical Map */}
        <MapContainer
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

          {/* Live Device Pin */}
          {deviceCoords && (
            <Marker position={deviceCoords} icon={liveDevice8BitIcon}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111' }}>
                  📡 <strong>YOUR LIVE DEVICE SIGNAL</strong><br />
                  LAT: {deviceCoords[0].toFixed(4)} | LNG: {deviceCoords[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Sightings Pins */}
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

        {/* Modal: Report Intel Form */}
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

      {/* Marquee Feed */}
      <div style={styles.bottomBar}>
        <span style={styles.marqueeText}>
          CYPHER INTEL FEED: ACTIVE NEURAL THEFT SIMULATIONS IN ISTANBUL ■ LOCAL NETWORK STATUS: OPTIMAL
        </span>
      </div>
    </div>
  );
}

// Fully Responsive Mobile-Ready Styles
const styles = {
  outerFrame: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a141d',
    padding: '8px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-pixel), monospace',
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
    height: 'calc(100vh - 130px)',
    border: '4px solid #1a3a52',
    outline: '2px solid #00f0ff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 6px 0 #000',
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
    flex: '1 1 180px',
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
    padding: '6px',
    textAlign: 'center',
    boxShadow: '0 3px 0 #000',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  marqueeText: {
    color: '#00f0ff',
    fontSize: '8px',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
  },
};