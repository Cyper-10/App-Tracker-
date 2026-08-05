import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET() {
  try {
    // Fetch live advisories from CISA (Cybersecurity & Infrastructure Security Agency)
    const feed = await parser.parseURL('https://www.cisa.gov/cybersecurity-advisories/all.xml');
    
    // Format top 5 headlines into a single tactical broadcast string
    const headlines = feed.items
      .slice(0, 5)
      .map((item) => `[LIVE INTEL] ${item.title.toUpperCase()}`)
      .join(' ■ ');

    return NextResponse.json({ newsText: headlines });
  } catch (error) {
    console.error('RSS Fetch Error:', error);
    return NextResponse.json(
      { newsText: 'CYPHER INTEL FEED: ACTIVE NEURAL THEFT SIMULATIONS IN ISTANBUL ■ LOCAL NETWORK STATUS: OPTIMAL' },
      { status: 500 }
    );
  }
}