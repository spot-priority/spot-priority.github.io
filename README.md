# SPOT Framework & Interactive Triage Studio

[![Test Suite](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Static Site](https://img.shields.io/badge/GitHub_Pages-live-blue.svg)](https://spot-priority.github.io/)

Welcome to the **SPOT (Swift Prioritization of Tasks)** Framework repository! SPOT is a structured, rapid decision-making methodology inspired by medical emergency triage, engineered specifically for high-pressure production environments like **SRE, DevOps, and on-call engineering**.

Instead of calculating exhaustive scoring matrixes during an active outage, SPOT filters competing alerts step-by-step through an elimination funnel until the single next essential action is clear.

---

## 🎯 The 4 Stages of SPOT

1. **Survey (S)** — Rapidly scan the scope of all incoming alerts and categorize into **Primary** (critical customer/revenue blockers) vs. **Secondary** (deferrable background noise).
2. **Prioritize (P)** — Filter primary tasks to identify the **Highest Urgency** root bottleneck causing upstream failures.
3. **Optimize (O)** — Select the **High-Leverage Mitigation** offering the fastest return on effort (e.g., release rollbacks, pod autoscaling, or circuit breakers).
4. **Take Action (T)** — Execute the locked-in action decisively, verify recovery, and buffer secondary items to a triage backlog.

---

## 💻 Local Development & Viewing

To preview the documentation and interactive studio locally on your machine:

```bash
# 1. Start the local server (opens automatically in your browser):
npm start

# Or with Python:
python -m http.server 8000 --directory docs
```

The site will be available at: **`http://localhost:8000`**

For complete instructions and alternative setups (VS Code Live Server, npx), see the [Local Development Guide](DEVELOPMENT.md).

---

## 🧪 SPOT Interactive Triage Studio

Explore the framework in action via the interactive web studio:

* **Mode 1: Guided Autoplay Walkthrough** — Watch animated, step-by-step incident triages with real-time coach commentary explaining the engineering rationale behind every choice.
* **Mode 2: Triage Challenge (Quiz Mode)** — Test your incident response intuition against realistic cascading failures. Receive instant right/wrong feedback with SRE anti-pattern explanations and a final triage score debrief.
* **Mode 3: Live Incident Sandbox** — Input your own live production alerts, filter through SPOT stages, and export a clean Markdown Incident Action Plan ready for Slack or incident bridges.

### 🚨 Built-in Incident Scenarios
* **Scenario 1: Authentication Gateway Degraded (4 alerts)** — Basic Sev-1 OAuth failure vs. ETL lags and node disk warnings.
* **Scenario 2: Database Connection Pool Exhaustion & Cascading Lockup (6 alerts)** — Saturated Postgres pools cascading into payment timeouts and email queues.
* **Scenario 3: Peak Traffic Surge & Microservice Collapse (8 alerts)** — Black Friday 8x traffic surge causing Ingress 503s, inventory thread starvation, and logging backpressure.
* **Scenario 4: Security Credential Exposure & Rapid Containment (5 alerts)** — Exposed AWS IAM keys requiring instant revocation over routine CI alerts.

---

## 🧪 Running Automated Tests

The repository includes a standalone test suite with zero external build dependencies:

### CLI Test Suite (Node.js)
```bash
npm test
# or directly:
node --test tests/*.test.js
```

### In-Browser Visual Test Runner
Open `docs/tests/runner.html` in any modern web browser (or `http://localhost:8000/tests/runner.html` locally) to execute and view all state machine, scenario, and quiz validation tests live.

---

## 🌐 Live Web Documentation & Studio

* **Web Documentation:** [https://spot-priority.github.io/](https://spot-priority.github.io/)
* **Interactive Studio:** [https://spot-priority.github.io/tool/priority-tool.html](https://spot-priority.github.io/tool/priority-tool.html)
* **In-Browser Test Runner:** [https://spot-priority.github.io/tests/runner.html](https://spot-priority.github.io/tests/runner.html)

---

## 📄 License

This documentation and interactive studio are licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

* **Attribution**: You must credit the author (**Inbar Rose**) when using or sharing the work.
* **NonCommercial**: You may not use the documentation for commercial purposes.
* **ShareAlike**: If you modify or build upon this documentation, you must share your contributions under the same license.

---

## 📬 Contact & Author

* **Creator:** Inbar Rose
* **LinkedIn:** [Inbar Rose on LinkedIn](https://www.linkedin.com/in/inbarrose/)
* **Email:** [spot.prioritize@gmail.com](mailto:spot.prioritize@gmail.com)
