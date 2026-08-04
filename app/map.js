'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Cypher Map Icon (falling back to online icon if /cypher.png isn't available)
const cypherMarkerIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export default function Map() {
  return (
    <div style={styles.outerFrame}>
      {/* Top Banner Header */}
      <div style={styles.headerBar}>
        <img 
          src="/cypher.png" 
          alt="Cypher" 
          style={styles.headerIcon}
          onError={(e) => {
            // Fallback to pixel user icon if local file is missing
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
        {/* Top Status Box */}
        <div style={styles.statusBox}>
          <p style={{ margin: 0, fontSize: '9px', color: '#00f0ff' }}>SYS.LOC // 00.00 . 00.00</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#fff' }}>
            63 ACTIVE INTEL SIGHTINGS
          </h3>
        </div>

        {/* Option 1: Cypher Tactical Spy Cam / Radar HUD */}
        <div style={styles.radarHud}>
          {/* Radar Radar Grid Lines */}
          <div style={styles.radarGridHorizontal}></div>
          <div style={styles.radarGridVertical}></div>
          
          {/* Pixel Eye / Spy Cam Icon */}
          <img 
            src="https://api.iconify.design/pixelarticons:eye.svg?color=%2300f0ff" 
            alt="Spy Cam Radar" 
            style={{ width: '32px', height: '32px', zIndex: 2 }} 
          />
          
          <span style={styles.radarText}>RADAR ACTIVE</span>
        </div>

        {/* Dark Tactical Map */}
        <MapContainer
          center={[10.7202, 122.5621]}
          zoom={3}
          style={{ height: '100%', width: '100%', background: '#08121e' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <Marker position={[10.7202, 122.5621]} icon={cypherMarkerIcon}>
            <Popup>
              <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '10px', color: '#111' }}>
                🕵️ <strong>Cypher Trapwire Detected!</strong><br />
                Location: Iloilo City
              </div>
            </Popup>
          </Marker>
        </MapContainer>
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

// Retro Arcade & Tactical UI Styles
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
    padding: '8px 16px',
    textAlign: 'center',
    borderRadius: '6px',
    boxShadow: '0 4px 0 #000',
  },
  // --- Tactical Radar Styles ---
  radarHud: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '3px solid #00f0ff',
    backgroundColor: 'rgba(5, 20, 35, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.2)',
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
    fontSize: '7px',
    color: '#00f0ff',
    marginTop: '4px',
    letterSpacing: '1px',
    zIndex: 2,
  },
  // -----------------------------
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