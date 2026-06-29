# Codebase Audit Report

## Summary

- **Frontend**: 0 ESLint errors, 0 warnings across `app/`, `components/`, `hooks/`, `lib/`, `store/`
- **Backend**: 0 ruff errors across `app/` and `tests/`
- **Tests**: All 41 Vitest tests pass, all 39 Pytest tests pass (pre-audit)
- **TypeScript**: 0 errors in source code (test files excluded from `tsconfig.json`)

---

## Issues Found & Fixed

### Frontend (8 files modified)

| File | Issue | Fix |
|------|-------|-----|
| `frontend/lib/supabase.ts:3-4` | Dead placeholder URLs prevented env-var warning from ever firing | Changed fallbacks to `''` so the `console.warn` actually works |
| `frontend/components/three/FlowFieldParticles.tsx:29` | Hardcoded `3000` instead of using `count` from performance profile | Replaced `3000` with `count` |
| `frontend/lib/three/animation.ts:67` | Dead code `camera.position.y * 0.0` (multiplication by zero) | Removed `+ camera.position.y * 0.0` |
| `frontend/store/useStore.ts:29` | `ChatMessage.citations` type missing `file_name` and `snippet` fields | Added optional `file_name` and `snippet` fields |
| `frontend/app/register/page.tsx:132` | Bug: email error display conditioned on `fullName` errors | Changed to `error={errors.email?.message}` |
| `frontend/components/three/ThreeIcon.tsx:112-115` | `setState` called synchronously inside `useEffect` (React 19 lint rule) | Replaced with lazy `useState` initializer, removed `useEffect` |
| `frontend/components/three/FlowFieldParticles.tsx:42` | Missing `count` dependency in `useEffect` | Added `count` to dependency array |
| `frontend/eslint.config.mjs` | ESLint config ignored `e2e/` and `playwright-report/` | Already configured from prior session |

### Backend (6 files modified + 3 test files auto-fixed)

| File | Issue | Fix |
|------|-------|-----|
| `backend/app/services/chunker.py:7-14` | Dead `split_into_sentences` method (never called) | Removed the method |
| `backend/app/routers/flashcards.py:149-155` | `intervals` dict defined inside `review_flashcard` on every call | Extracted to module-level `LEITNER_INTERVALS` constant |
| `backend/app/core/security.py:6` | Missing type annotation on `security_bearer` | Added `: HTTPBearer` |
| `backend/app/services/auth.py:8` | Incorrect type hint `supabase_client: Client = None` | Changed to `supabase_client: Client \| None = None` |
| `backend/app/main.py:141` | Trailing whitespace on blank line (W293) | Auto-fixed with `ruff --fix` |
| `backend/tests/test_ai_features.py:48,73,138` | 3 unused variable assignments (`mock_update`, `mock_insert`) | Removed dead assignments |
| `backend/tests/test_health.py:9` | Unused variable `mock_supabase` in `with patch(...) as mock_supabase` | Renamed to `_` |
| `backend/tests/*.py` | 14 unused import / sort errors | Auto-fixed with `ruff check --fix` |

---

## Issues Not Fixed (Future Recommendations)

### Frontend

| File | Issue | Notes |
|------|-------|-------|
| `app/login/page.tsx` | `GoogleIcon` SVG duplicated in `register/page.tsx` | Extract into shared component |
| `store/useStore.ts` | `turnstileSiteKey` referenced but not defined in store | Could be removed or added |
| Various | A few `any` type annotations | Could be tightened with proper types |

### Backend

| File | Issue | Notes |
|------|-------|-------|
| `app/services/ai_agents.py` | `get_embedding`/`get_embeddings_batch` use `@staticmethod`, others use `@classmethod` | Inconsistent but functionally correct |
| `app/routers/planner.py` | `TaskCreatePayload.ai_source_doc` uses `snake_case` for JSON field | Consistent within codebase but atypical for Pydantic/FastAPI JSON APIs |
| Various routers | `Exception` catch-all in every endpoint | Broad but intentional for FastAPI error translation |

### Config / Project

| File | Issue | Notes |
|------|-------|-------|
| Project root | `.env.example` missing | Document required env vars |
| `frontend/tsconfig.json` | `tests/` not included in `include` array | Prevents `tsc --noEmit` from checking test files |

---

## Verification Commands

```bash
# Frontend lint
cd frontend && npx eslint app/ components/ hooks/ lib/ store/ --max-warnings=0

# Frontend unit tests
cd frontend && npx vitest run

# Backend lint
cd backend && python -m ruff check app tests

# Backend unit tests (requires virtualenv with deps)
cd backend && python -m pytest tests -v
```

*Report generated 2026-06-28*
