'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Cypher Map Icon
const cypherMarkerIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Helper component to handle smooth map movement on button click
function MapFlyTo({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, 6, { duration: 1.5 });
  }
  return null;
}

export default function Map() {
  // Initial Sightings Data
  const [sightings, setSightings] = useState([
    { id: 1, type: 'Trapwire', lat: 10.7202, lng: 122.5621, location: 'Iloilo City', note: 'Trapwire active near central hub' },
    { id: 2, type: 'Spy Cam', lat: 35.6762, lng: 139.6503, location: 'Tokyo', note: 'Neural theft stream detected' },
    { id: 3, type: 'Cyber Ping', lat: 52.5200, lng: 13.4050, location: 'Berlin', note: 'Cipher connection active' },
  ]);

  // Modal & View States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);
  const [newSighting, setNewSighting] = useState({
    type: 'Trapwire',
    location: '',
    lat: '',
    lng: '',
    note: ''
  });

  // Add new sighting handler
  const handleAddSighting = (e) => {
    e.preventDefault();
    if (!newSighting.location || !newSighting.lat || !newSighting.lng) return;

    const addedItem = {
      id: Date.now(),
      type: newSighting.type,
      lat: parseFloat(newSighting.lat),
      lng: parseFloat(newSighting.lng),
      location: newSighting.location,
      note: newSighting.note || 'Classified Intel'
    };

    setSightings((prev) => [...prev, addedItem]);
    setTargetCoords([addedItem.lat, addedItem.lng]);
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
          onError={(e) => {
            e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff';
          }}
        />
        <div style={styles.headerTitle}>CYPHER SIGHTINGS TRACKER</div>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          style={styles.headerIcon}
          onError={(e) => {
            e.target.src = 'https://api.iconify.design/pixelarticons:user.svg?color=%2300f0ff';
          }}
        />
      </div>

      {/* Main Screen Container */}
      <div style={styles.monitorContainer}>
        {/* CRT Scanline FX Overlay */}
        <div className="crt-overlay"></div>

        {/* Top Status & Controls Box */}
        <div style={styles.statusBox}>
          <p style={{ margin: 0, fontSize: '9px', color: '#00f0ff' }}>SYS.LOC // ACTIVE SIGHTINGS: {sightings.length}</p>
          <div style={styles.buttonGroup}>
            <button style={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
              + REPORT INTEL
            </button>
            <button style={styles.jumpBtn} onClick={() => setTargetCoords([35.6762, 139.6503])}>TOKYO</button>
            <button style={styles.jumpBtn} onClick={() => setTargetCoords([52.5200, 13.4050])}>BERLIN</button>
            <button style={styles.jumpBtn} onClick={() => setTargetCoords([10.7202, 122.5621])}>ILOILO</button>
          </div>
        </div>

        {/* Tactical Radar HUD with Animated Sweep Line */}
        <div style={styles.radarHud}>
          <div style={styles.radarGridHorizontal}></div>
          <div style={styles.radarGridVertical}></div>
          <div className="radar-sweep-line"></div>
          
          <img 
            src="https://api.iconify.design/pixelarticons:eye.svg?color=%2300f0ff" 
            alt="Spy Cam Radar" 
            style={{ width: '28px', height: '28px', zIndex: 2 }} 
          />
          <span style={styles.radarText}>RADAR SWEEP</span>
        </div>

        {/* Dark Tactical Map */}
        <MapContainer
          center={[10.7202, 122.5621]}
          zoom={3}
          style={{ height: '100%', width: '100%', background: '#08121e' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {targetCoords && <MapFlyTo coords={targetCoords} />}

          {sightings.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={cypherMarkerIcon}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111' }}>
                  <strong>[{s.type.toUpperCase()}] DETECTED</strong><br />
                  📍 {s.location}<br />
                  💬 <em>"{s.note}"</em>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Modal: Add New Sighting Form */}
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h4 style={{ margin: '0 0 10px 0', color: '#00f0ff', fontSize: '12px' }}>
                SUBMIT NEW CYPHER INTEL
              </h4>
              <form onSubmit={handleAddSighting} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Location Name (e.g. Manila)"
                  value={newSighting.location}
                  onChange={(e) => setNewSighting({ ...newSighting, location: e.target.value })}
                  style={styles.inputStyle}
                  required
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newSighting.lat}
                    onChange={(e) => setNewSighting({ ...newSighting, lat: e.target.value })}
                    style={styles.inputStyle}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newSighting.lng}
                    onChange={(e) => setNewSighting({ ...newSighting, lng: e.target.value })}
                    style={styles.inputStyle}
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Intel Note"
                  value={newSighting.note}
                  onChange={(e) => setNewSighting({ ...newSighting, note: e.target.value })}
                  style={styles.inputStyle}
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

      {/* Bottom Marquee Feed */}
      <div style={styles.bottomBar}>
        <span style={styles.marqueeText}>
          CYPHER INTEL FEED: ACTIVE NEURAL THEFT SIMULATIONS IN ISTANBUL ■ LOCAL NETWORK STATUS: OPTIMAL
        </span>
      </div>
    </div>
  );
}

// Retro UI Styles
const styles = {
  outerFrame: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a141d',
    padding: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-pixel), monospace',
  },
  headerBar: {
    backgroundColor: '#0f2333',
    border: '4px solid #00a8ff',
    padding: '8px 18px',
    borderRadius: '10px',
    boxShadow: '0 4px 0 #000, 0 0 12px rgba(0, 168, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  headerTitle: {
    color: '#e0f7fc',
    fontSize: '16px',
    letterSpacing: '2px',
    textShadow: '2px 2px #000',
  },
  monitorContainer: {
    position: 'relative',
    width: '100%',
    height: 'calc(100vh - 170px)',
    border: '6px solid #1a3a52',
    outline: '3px solid #00f0ff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 8px 0 #000',
  },
  statusBox: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: '#0d1e2d',
    border: '3px solid #00f0ff',
    padding: '8px 14px',
    textAlign: 'center',
    borderRadius: '6px',
    boxShadow: '0 4px 0 #000',
  },
  buttonGroup: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    justifyContent: 'center',
  },
  actionBtn: {
    backgroundColor: '#00f0ff',
    color: '#000',
    border: 'none',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  jumpBtn: {
    backgroundColor: '#0f2333',
    color: '#00f0ff',
    border: '1px solid #00f0ff',
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '4px 6px',
    cursor: 'pointer',
  },
  radarHud: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '3px solid #00f0ff',
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
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
    fontSize: '6px',
    color: '#00f0ff',
    marginTop: '2px',
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
  },
  modalContent: {
    backgroundColor: '#0d1e2d',
    border: '3px solid #00f0ff',
    padding: '16px',
    borderRadius: '8px',
    width: '280px',
  },
  inputStyle: {
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
    border: '3px solid #00a8ff',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'center',
    boxShadow: '0 4px 0 #000',
  },
  marqueeText: {
    color: '#00f0ff',
    fontSize: '10px',
    letterSpacing: '1px',
  },
};