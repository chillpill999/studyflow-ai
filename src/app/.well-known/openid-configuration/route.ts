import { NextResponse } from 'next/server';

export async function GET() {
  const oidcConfig = {
    issuer: "https://www.thestudyflow.in",
    authorization_endpoint: "https://www.thestudyflow.in/api/auth/authorize",
    token_endpoint: "https://www.thestudyflow.in/api/auth/token",
    jwks_uri: "https://www.thestudyflow.in/api/auth/jwks",
    response_types_supported: ["code", "token", "id_token"],
    grant_types_supported: ["authorization_code", "client_credentials"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email", "study.read", "study.write"],
    agent_auth: {
      register_uri: "https://www.thestudyflow.in/.well-known/agent-registration",
      supported_identity_types: ["jwt", "tls_client_auth"],
      supported_credential_types: ["client_secret_post", "private_key_jwt"]
    }
  };

  return NextResponse.json(oidcConfig, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
