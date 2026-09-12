export const metadata = {
  title: 'Cypher Tracker',
  description: 'Tactical 8-Bit Cyber Location Tracker',
  manifest: '/manifest.json',
  
  // Android & General Browser Theme
  themeColor: '#0f2333',

  // iOS Native PWA Settings
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cypher Tracker',
  },

  // Dynamic Cross-Platform Icon Routing
  icons: {
    icon: [
      { url: '/cypher.png' },
      { url: '/cypher-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/cypher-icon-maskable.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: '#0f2333',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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