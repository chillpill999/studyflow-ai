# The Study Flow — E2E Test Suite

## Overview

**126 tests** across **8 test files** × **3 browsers** (Chromium, Firefox, WebKit).

Covers all core user workflows: Authentication (login, register, logout, forgot-password), PDF upload, Chat, Flashcards, Planner, Notes, Analytics, and Mind Map.

## Test Structure

```
e2e/
├── mocks/
│   └── index.ts            # Centralized mock data & route setup functions
├── pom/
│   ├── AuthPage.ts         # Login, register, forgot-password, logout
│   ├── DashboardPage.ts    # Dashboard overview & document upload
│   ├── ChatPage.ts         # Chat sidebar, message sending
│   ├── FlashcardsPage.ts   # Review deck, flip, rate, manage
│   ├── PlannerPage.ts      # Kanban board, task CRUD, schedule generation
│   ├── NotesPage.ts        # Note viewer, editor, generation
│   ├── AnalyticsPage.ts    # Metrics, log session, coach
│   └── MindmapPage.ts      # Graph generation, export
├── auth.spec.ts            # 6 tests — Login, Register, Forgot-password, Logout
├── upload.spec.ts          # 5 tests — PDF upload, document list, Chat RAG nav
├── chat.spec.ts            # 4 tests — Sidebar, message display, new chat
├── flashcards.spec.ts      # 5 tests — Review deck, flip, manage, export/import
├── planner.spec.ts         # 5 tests — Kanban, task CRUD, schedule inputs
├── note.spec.ts            # 7 tests — Notes list, viewer, edit/save, modes
├── analytics.spec.ts       # 5 tests — Metrics display, log session, coach
└── mindmap.spec.ts         # 5 tests — Generate, node display, export buttons
```

## Key Design Decisions

| Requirement | Implementation |
|---|---|
| **Independent tests** | Each `test.describe` sets up its own mocks in `beforeEach` — no shared state |
| **Reusable fixtures** | `setupCommonMocks`, `setupAuthMocks`, etc. in `mocks/index.ts` are composable per test suite |
| **Page Object Model** | 8 POM classes encapsulate page selectors and actions; tests use only POM methods |
| **Stable selectors** | Uses `getByRole`, `getByPlaceholder`, `getByText` (Playwright best practices) instead of fragile CSS/XPath |
| **Retry-safe** | Global `retries: 2`, increased timeouts (45s test, 10s expect), `waitForSelector` before interactions |

## Running Tests

```bash
# Prerequisites: build the Next.js app first
npm run build

# Run all tests (Chromium only — local)
npx playwright test --project=chromium

# Run a specific test file
npx playwright test e2e/auth.spec.ts

# Run with UI mode (for debugging)
npx playwright test --ui

# Run all browsers (CI mode)
npx playwright test

# View HTML report after run
npx playwright show-report
```

## Mock Strategy

All API calls are intercepted via `page.route()` with realistic mock data defined in `mocks/index.ts`:
- **Auth**: Supabase `/auth/v1/*` endpoints return mock sessions/users
- **Documents**: CRUD operations return mock document metadata
- **Chats**: Full chat list, messages, and SSE stream responses
- **Flashcards**: Cards list, generation, review (Leitner box update)
- **Planner**: Tasks list, creation, status transitions
- **Notes**: Notes list, generation, edit/delete
- **Analytics**: Aggregate stats and coach recommendations
- **Mind Map**: Generated nodes/edges for concept graph

WebGL is disabled globally via `addInitScript` to prevent canvas context crashes in headless runners.
