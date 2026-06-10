# Contributing to StudyFlow AI

First off, welcome! Thank you for considering contributing to StudyFlow AI. It's people like you that make the open-source community such a fantastic place to learn, inspire, and create.

Whether you're fixing a bug, suggesting a feature, or improving documentation, we appreciate your help in building the ultimate academic workspace!

---

## 🤝 Code of Conduct
We expect all contributors to be respectful and kind. Be collaborative, assume good intentions, and help us maintain a welcoming, inclusive environment for everyone.

---

## 🐛 How to Report Bugs
If you find a bug in the source code, you can help us by submitting an issue. 
1. Check the [Issues tab](../../issues) to see if it has already been reported.
2. If not, open a new issue and select the **Bug Report** template.
3. Fill out the template with as much detail as possible (steps to reproduce, expected behavior, screenshots, etc.).

---

## 🚀 How to Suggest Features
Got an idea to make StudyFlow AI better? We want to hear it!
1. Check the [Issues tab](../../issues) to see if someone else has already suggested it.
2. Open a new issue and select the **Feature Request** template.
3. Describe the problem your feature solves and your proposed solution.

---

## 🛠️ Development Setup
To set up the project locally for development, please follow the **Getting Started** guide in our [README.md](README.md#getting-started).

You will need:
- Node.js 20+
- Python 3.12+
- A Google Gemini API key

---

## 🔄 Pull Request Process
1. **Fork** the repo on GitHub.
2. **Clone** the project to your own machine.
3. **Create a branch** from `main`. Use a descriptive name based on what you're working on:
   - `feat/add-dark-mode`
   - `fix/login-crash`
   - `docs/update-readme`
   - `chore/upgrade-deps`
4. **Commit** your changes to your branch. We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add PDF export feature`
   - `fix: resolve issue with flashcard rendering`
   - `docs: update setup instructions`
5. **Push** your work back up to your fork.
6. Submit a **Pull Request** to the `main` branch of our repository. Make sure to fill out the PR template!

---

## 🎨 Style Guides

### Frontend (Next.js & TypeScript)
- Use **ESLint** and **Prettier** to format your code before committing.
- Group Tailwind CSS classes logically (layout, sizing, typography, colors, effects).
- Prefer functional components and React Hooks.
- Ensure strict TypeScript typing (avoid `any`).

### Backend (FastAPI & Python)
- Follow **PEP 8** style guidelines.
- **Type hints** are required for all function arguments and return types.
- Keep route handlers thin; move business logic into the `services/` directory.

---

## 🌱 Good First Issues
If you're new to the project or to open source in general, check out issues labeled `good first issue` or `help wanted`. These are perfect places to start contributing!
