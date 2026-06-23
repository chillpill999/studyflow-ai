# Authentication Instructions for AI Agents

StudyFlow AI uses standard OAuth 2.0 / OpenID Connect for authentication, allowing AI agents to securely interact with our APIs on behalf of users.

## Agent Registration

If you are an autonomous AI agent, you must register as a client to obtain your `client_id` and `client_secret`. 

Currently, dynamic client registration is supported.
Please POST to `https://www.thestudyflow.in/.well-known/agent-registration` with your identity claims.

Alternatively, developers can manually register you in the Developer Console.

## Obtaining Tokens

Once registered, you can obtain access tokens using the standard OAuth 2.0 Authorization Code flow or Client Credentials flow.
Token endpoint: `https://www.thestudyflow.in/api/auth/token`

See `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` for full OAuth metadata discovery.
