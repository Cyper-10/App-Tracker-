'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component with SSR disabled
const MapComponent = dynamic(() => import('./Map'), { ssr: false });

export default function Home() {
  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <MapComponent />
    </main>
  );
}