import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

export const metadata = {
  title: 'Cypher Sightings Tracker',
  description: 'Cypher Intel & Map Sightings Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={pixelFont.className} style={{ margin: 0, padding: 0, backgroundColor: '#090f15', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}