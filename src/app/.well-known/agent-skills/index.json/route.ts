import { NextResponse } from 'next/server';

export async function GET() {
  const agentSkills = {
    $schema: "https://raw.githubusercontent.com/cloudflare/agent-skills-discovery-rfc/main/schema.json",
    skills: [
      {
        name: "studyflow-rag",
        type: "api",
        description: "Retrieval-Augmented Generation capabilities to query notes and lecture slides.",
        url: "https://www.thestudyflow.in/.well-known/agent-skills/studyflow-rag/SKILL.md",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      {
        name: "studyflow-flashcards",
        type: "webmcp",
        description: "Exposes the flashcard generator interface to the browser.",
        url: "https://www.thestudyflow.in/.well-known/agent-skills/webmcp/SKILL.md",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    ]
  };

  return NextResponse.json(agentSkills, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
