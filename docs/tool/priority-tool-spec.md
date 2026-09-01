# SPOT Interactive Triage Studio Specification

## Overview
The SPOT Interactive Triage Studio is a web application designed to demonstrate, practice, and execute task prioritization using the **SPOT (Survey, Prioritize, Optimize, Take Action)** framework. The studio provides three dedicated modes: Guided Walkthrough, Triage Challenge (Quiz), and Live Incident Sandbox.

## Core Features & Modes

### 1. Mode 1: Guided Walkthrough (Autoplay)
- Automated step-by-step playback through Survey, Prioritize, Optimize, and Take Action.
- Full playback controls: Play/Pause, Step Forward/Back, Restart, and Speed multipliers (1.0x, 1.5x, 2.0x).
- Live SRE Coach Narration Drawer detailing the engineering rationale behind every triage decision.
- Interactive multi-alert scenarios with up to 8 simultaneous alerts.

### 2. Mode 2: Triage Challenge (Quiz Mode)
- Interactive incident simulation where the user makes triage choices at each stage.
- Instant right vs. wrong feedback explaining SRE anti-patterns (e.g. alert distractions, attempting deep debugging during outages).
- Final Incident Triage Debrief Card with accuracy percentage, time taken, key takeaways, and stage review.

### 3. Mode 3: Live Incident Sandbox
- Allows on-call engineers to input real-time production alerts.
- Interactive triage filtering across Survey, Prioritize, Optimize, and Take Action.
- "Copy Action Plan": Generates a clean Markdown-formatted incident summary ready to paste into Slack or incident bridges.

## Technical Architecture

### Core Modules (`docs/tool/modules/`)
1. **`TriageEngine.js`**: Pure ES6 state machine managing task models, SPOT stage transitions, filtering (Primary vs Secondary, High vs Low Urgency, High vs Low Impact), and Markdown report generation.
2. **`Scenarios.js`**: Library of incident presets (4-alert basic Sev-1, 6-alert cascading DB deadlock, 8-alert Black Friday traffic surge, 5-alert security containment).
3. **`WalkthroughEngine.js`**: Autoplay controller with step progression timers, speed toggles, and live narration.
4. **`QuizEngine.js`**: Interactive quiz evaluator validating user choices against scenario answer keys.
5. **`SandboxEngine.js`**: Custom alert entry, sample loading, and clipboard export.
6. **`UIRenderer.js`**: UI rendering, animations, status badges, and DOM event handling.
7. **`app.js`**: Application coordinator and URL routing.

### Automated Testing (`tests/` & `docs/tests/`)
- CLI test suite running natively via Node (`npm test`).
- In-browser visual test runner at `docs/tests/runner.html`.
