import { NextResponse } from 'next/server';

export async function GET() {
  const serverCard = {
    $schema: "https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/server-card.schema.json",
    serverInfo: {
      name: "StudyFlow MCP Server",
      version: "1.0.0",
      description: "Model Context Protocol server for interacting with StudyFlow AI notes, flashcards, and plans."
    },
    transport: {
      type: "sse",
      endpoint: "https://www.thestudyflow.in/api/mcp/sse"
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false
    }
  };

  return NextResponse.json(serverCard, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
