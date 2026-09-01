# CLAUDE.md

This file provides guidance to Claude Code and AI assistants when working in this repository.

## Common Commands

- **Run Automated Tests**:
  ```bash
  npm test
  # or
  node --test tests/*.test.js
  ```
- **In-Browser Tests**: Open `docs/tests/runner.html` in a web browser.
- **Run Local Static Server**:
  ```bash
  npx http-server docs -p 8000
  ```

## Architecture & Structure

- `docs/index.html` – Single-page shell with responsive header and client router.
- `docs/styles.css` – Design tokens and modern documentation stylesheet.
- `docs/scripts.js` – Client-side router, Table of Contents generator, and scroll-spy.
- `docs/pages/`
  - `home.html` – High-conversion landing page with SPOT pillars, comparison, and CTAs.
  - `spot_documentation.html` – Comprehensive documentation, sticky TOC, comparison matrix, and cheat sheet.
- `docs/tool/` – Modern SPOT Interactive Triage Studio.
  - `priority-tool.html` – Studio shell with Mode switcher tabs.
  - `priority-tool.css` – Sleek dark/light-compatible tech studio stylesheet.
  - `modules/`
    - `TriageEngine.js` – Core SPOT state machine (Survey -> Prioritize -> Optimize -> Action).
    - `Scenarios.js` – Incident presets (4-alert, 6-alert cascading, 8-alert traffic surge, security containment).
    - `WalkthroughEngine.js` – Mode 1 Guided Autoplay engine with playback controls & coach narration.
    - `QuizEngine.js` – Mode 2 Interactive Practice Challenge engine with right/wrong feedback & scorecard.
    - `SandboxEngine.js` – Mode 3 Live Incident Sandbox with action plan clipboard export.
    - `UIRenderer.js` – UI rendering and DOM event dispatching.
    - `app.js` – Application coordinator and URL router.
- `tests/` – Native Node.js test suite for state machine, scenarios, and quiz validation.

## Principles

- **Zero Heavy Build Dependencies**: Site is 100% static HTML/CSS/JS compatible with GitHub Pages out of the box.
- **Atomic Commits**: Maintain modular, testable changes.