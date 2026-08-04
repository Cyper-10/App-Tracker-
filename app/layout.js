export const metadata = {
  title: 'Cypher Sightings Tracker',
  description: 'Tactical 8-Bit Cyber Location Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CypherTracker',
  },
};

export const viewport = {
  themeColor: '#0f2333',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a141d' }}>
        {children}
      </body>
    </html>
  );
}