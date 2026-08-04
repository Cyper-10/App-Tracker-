'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust import path if needed (e.g. '../lib/supabase')
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Click handler component to catch map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function TrackerMap() {
  const [pins, setPins] = useState([]);

  // Load existing pins from Supabase on mount
  useEffect(() => {
    async function loadPins() {
      const { data, error } = await supabase.from('Pins').select('*');
      if (error) {
        console.error('Error loading pins:', error);
      } else {
        setPins(data || []);
      }
    }
    loadPins();
  }, []);

  // Handler for adding a pin when the map is clicked
  const handleAddPin = async (lat, lng) => {
    const title = prompt('Enter a title for this pin:');
    if (!title) return;

    const description = prompt('Enter a brief description (optional):') || '';

    const newPin = {
      title,
      description,
      latitude: lat,
      longitude: lng,
    };

    // Save directly to Supabase Pins table
    const { data, error } = await supabase.from('Pins').insert([newPin]).select();

    if (error) {
      alert('Error saving pin: ' + error.message);
    } else if (data) {
      setPins((prevPins) => [...prevPins, ...data]);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        center={[10.7202, 122.5621]} // Default map view
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <MapClickHandler onMapClick={handleAddPin} />

        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
            <Popup>
              <strong>{pin.title}</strong>
              <br />
              {pin.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}