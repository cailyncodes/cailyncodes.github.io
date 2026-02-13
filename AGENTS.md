# AGENTS.md - Coding Guidelines for cailyncodes.github.io

## Project Overview

Personal static website for Cailyn Hansen. A vanilla JavaScript SPA with markdown-based content, custom layout system, and static prerendering.

**Stack:** Vanilla JS (ES2023+), CSS3, HTML5, Parcel bundler, Python (Flask for dev server)

---

## Build / Dev / Test Commands

```bash
# Development (starts Python dev server on port 8000)
npm start
./main.py                    # Python Flask dev server

# Production build
npm run build               # Parcel build + prerender with Puppeteer
npm run clean               # rm -rf dist
npm run build:serve         # clean + build + serve

# Spell checking	npm run spell-check         # cspell lint
npm run spell-check:fix     # cspell with suggestions

# Tests
node tests/prerender-paths.test.mjs    # Run prerender tests (requires dist built and server running)
```

**Note:** No test runner is configured. Tests are standalone Node.js scripts using Puppeteer.

---

## Code Style Guidelines

### JavaScript

- **Language:** Vanilla ES2023+ (no transpilation targets needed, modern browser focused)
- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Optional but consistent within file
- **Naming:**
  - `camelCase` for variables, functions
  - `PascalCase` for classes (if any)
  - `kebab-case` for file names
- **Functions:** Prefer arrow functions for callbacks, named functions for module-level
- **Error handling:** Always log errors with `console.error()`; use try/catch for async

### CSS

- **Methodology:** Custom properties (CSS variables) for theming
- **Naming:** `kebab-case` for classes, `--kebab-case` for CSS variables
- **Structure:** Mobile-first with breakpoints at `calc(400px * 0.8 + 2rem)` and `600px`
- **Theming:** Use `data-theme` attribute for dark/light mode
- **Fonts:** 'Courier New' for monospace, Verdana/Arial for sans-serif

### HTML

- **Custom elements:** Use `<x:component>` pattern for content injection points
- **Attributes:** Double quotes, lowercase
- **Accessibility:** Include `aria-label`, semantic elements (`<main>`, `<article>`, `<aside>`)

### Markdown (Content)

- **Front matter:** YAML-like format between `---` markers
  ```yaml
  ---
  layout: default
  title: Page Title
  ---
  ```
- **Imports:** Use `@import(filename)` syntax; dots become path separators
- **Location:** Content files in `/content/`, layouts in `/layout/`

---

## Project Structure

```
/assets/
  /css/main.css          # Main stylesheet with CSS variables
  /js/main.js            # Core SPA logic, markdown processing
/content/                # Markdown content files
  *.md                   # Pages with front matter
  /projects/*.md         # Project pages
  /writings/*.md         # Writing/blog posts
/layout/                 # HTML layout templates
  *.html                 # Layout files referenced by front matter
/scripts/
  prerender.mjs          # Puppeteer-based static generation
/tests/
  *.test.mjs             # Test scripts (run with node directly)
index.html               # Entry point
home.md                  # Root page config
main.py                  # Flask dev server
```

---

## Content System

The site uses a custom content system:

1. **Routes:** Paths map to `/content/{path}.md` (e.g., `/about` → `/content/about.md`)
2. **Front matter:** Defines `layout` and `title`
3. **Layouts:** HTML files in `/layout/` with `<x:component>` placeholders
4. **Imports:** Use `@import(filename)` in markdown to include other files
5. **Prerendering:** Puppeteer crawls links and generates static HTML at build time

---

## Key Dependencies

- **Parcel:** Module bundler and dev server
- **Puppeteer:** Prerendering and testing
- **cspell:** Spell checking
- **Flask:** Python dev server (main.py)

---

## Spell Checking

Project uses cspell with custom dictionary in `.cspell.json`:

- Add new proper nouns/technical terms to `words` array
- Ignore patterns configured for URLs, hex codes
- Runs on `.md`, `.html`, `.js`, `.css` files

---

## Error Handling Patterns

- **Async:** Wrap fetch calls in try/catch, log with context
- **Missing content:** Redirect to `/not-found` gracefully
- **Console:** Use `console.warn()` for recoverable issues, `console.error()` for failures
- **User feedback:** Fail silently for non-critical features (theme, analytics)

---

## Git Workflow

- No CI configured
- Build output in `dist/` is gitignored (generated at deploy time)
- Main branch deploys to GitHub Pages

---

## Important Notes

- **No TypeScript** - pure JavaScript with JSDoc comments for documentation
- **No framework** - vanilla JS SPA architecture
- **No linter/formatter configured** - follow existing patterns manually
- **Browser support:** Modern browsers (ES2023+ features used)
- **Theme:** CSS custom properties with `data-theme` attribute toggle
