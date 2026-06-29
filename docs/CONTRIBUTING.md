# The Study Flow Contribution Guidelines

We welcome contributions! Please follow these standards to ensure project quality and security.

---

## 🎨 Coding Standards

- **Frontend**:
  - Follow TypeScript standards.
  - Implement accessible layouts (semantic markup and explicit aria attributes).
  - Test component logic using Vitest and Testing Library.
- **Backend**:
  - Format python scripts using Black and Ruff.
  - Write test assertions using Pytest.

---

## 🏷️ Conventional Commits

We follow standard Conventional Commit messages:
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation improvements.
- `style`: Formatting changes.
- `refactor`: Restructuring code without changing functionality.
- `test`: Adding or adjusting test suites.
- `chore`: Maintenance chores.

---

## 🧪 Testing Guidelines

Before submitting pull requests:
1. Ensure all backend pytest checks pass:
   ```bash
   cd backend && pytest
   ```
2. Verify all frontend unit tests are successful:
   ```bash
   cd frontend && npm run test
   ```
3. Run the local verification compilation:
   ```bash
   python scripts/deploy_verify.py
   ```
