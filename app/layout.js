import './global.css';

export const metadata = {
  title: 'Cypher Tracker',
  description: 'Tactical 8-Bit Cyber Location Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cypher Tracker',
  },
  icons: {
    icon: [
      { url: '/cypher-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/cypher-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/cypher-icon-512.png', sizes: '512x512', type: 'image/png' },
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
      <body>
        {children}
      </body>
    </html>
  );
}