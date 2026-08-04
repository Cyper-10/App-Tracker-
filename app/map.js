'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Cypher Map Icon
const cypherMarkerIcon = new L.Icon({
  iconUrl: '/cypher.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export default function Map() {
  return (
    <div style={styles.outerFrame}>
      {/* Top Cypher Header Banner */}
      <div style={styles.headerBar}>
        <img src="/cypher.png" alt="Cypher" style={styles.headerIcon} />
        <div style={styles.headerTitle}>CYPHER SIGHTINGS TRACKER</div>
        <img src="/cypher.png" alt="Cypher" style={styles.headerIcon} />
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

        {/* Floating Cypher Radar HUD */}
        <div style={styles.radarHud}>
          <div style={styles.radarSweep}></div>
          <span style={{ fontSize: '8px', color: '#00f0ff', position: 'absolute', bottom: '4px' }}>
            RADAR ACTIVE
          </span>
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
  radarHud: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '2px solid #00f0ff',
    backgroundColor: 'rgba(5, 20, 35, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
    pointerEvents: 'none',
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