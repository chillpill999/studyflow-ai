import { NextResponse } from 'next/server';

export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: "https://www.thestudyflow.in/api",
        "service-desc": [
          {
            href: "https://www.thestudyflow.in/api/openapi.json",
            type: "application/openapi+json"
          }
        ],
        "service-doc": [
          {
            href: "https://www.thestudyflow.in/docs/api",
            type: "text/html"
          }
        ],
        "status": [
          {
            href: "https://www.thestudyflow.in/api/health",
            type: "application/health+json"
          }
        ]
      }
    ]
  };

  return NextResponse.json(catalog, {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
