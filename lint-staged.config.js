module.exports = {
  // lint and format Javascript, Typescript, CSS, JSON, and Markdown in frontend
  'frontend/**/*.{js,jsx,ts,tsx,css,json,md}': [
    'prettier --write',
    'npm --prefix frontend run lint'
  ],
  // format and lint python files in backend
  'backend/**/*.py': [
    'black',
    'ruff check --fix'
  ]
};
