import { NextResponse } from 'next/server';

export async function GET() {
  const robotsText = `User-agent: *
Allow: /
Disallow: /private/

User-agent: GPTBot
Allow: /
Disallow: /private/
Disallow: /api/

User-agent: Claude-Web
Allow: /
Disallow: /private/
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /private/
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /private/
Disallow: /api/

Content-Signal: ai-train=no, search=yes, ai-input=yes

Sitemap: https://www.thestudyflow.in/sitemap.xml
Host: https://www.thestudyflow.in
`;

  return new NextResponse(robotsText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
