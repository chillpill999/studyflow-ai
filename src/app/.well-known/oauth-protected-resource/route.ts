import { NextResponse } from 'next/server';

export async function GET() {
  const resourceMetadata = {
    resource: "https://www.thestudyflow.in/api",
    authorization_servers: [
      "https://www.thestudyflow.in"
    ],
    scopes_supported: ["study.read", "study.write", "profile"],
    bearer_methods_supported: ["header"]
  };

  return NextResponse.json(resourceMetadata, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
