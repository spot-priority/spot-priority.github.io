# Local Development Guide

This guide explains how to view, test, and develop the **SPOT Framework** documentation site and the **Interactive Triage Studio** locally.

---

## ⚡ Quick Start (One-Command)

If you have Node.js installed:

```bash
# Start local HTTP server and automatically open the site in your default browser:
npm start
```

Or:

```bash
npm run dev
```

The site will be live at: **`http://localhost:8000`**

---

## 🛠️ Alternative Ways to Run Locally

Because the project is 100% static HTML, CSS, and ES6 JavaScript, you can use any static file server:

### Option 1: Python 3
```bash
python -m http.server 8000 --directory docs
```
Then navigate to `http://localhost:8000` in your browser.

### Option 2: npx (without installing dependencies)
```bash
npx http-server docs -p 8000 -c-1
```

### Option 3: VS Code / IDE Live Server
1. Open the repository folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `docs/index.html` and select **"Open with Live Server"**.

> [!NOTE]
> Because the documentation and studio use modern ES6 JavaScript modules (`import`/`export`) and client-side `fetch()`, opening `docs/index.html` directly as a `file:///` URL in some browsers may be blocked by CORS security policies. Always use a local HTTP server as shown above.

---

## 📍 Local URLs & Features

Once your local server is running at `http://localhost:8000`:

| Page / Tool | Local URL | Description |
| :--- | :--- | :--- |
| **Home Landing Page** | `http://localhost:8000/` | Main portal with SPOT 4-step pillars & CTAs |
| **SPOT Documentation** | `http://localhost:8000/?page=spot_documentation` | Comprehensive guide, sticky TOC, & comparison matrix |
| **Interactive Studio (Mode 1: Guided Autoplay)** | `http://localhost:8000/tool/priority-tool.html?mode=walkthrough` | Automated incident triage playback with coach narration |
| **Interactive Studio (Mode 2: Practice Challenge)** | `http://localhost:8000/tool/priority-tool.html?mode=quiz` | Multi-alert incident quiz with instant right/wrong feedback |
| **Interactive Studio (Mode 3: Live Sandbox)** | `http://localhost:8000/tool/priority-tool.html?mode=sandbox` | Custom alert input & markdown action plan export |
| **In-Browser Test Runner** | `http://localhost:8000/tests/runner.html` | Visual live test suite runner |

---

## 🧪 Running Automated Tests Locally

### CLI Test Suite (Node.js)
```bash
npm test
# or
node --test tests/*.test.js
```

### In-Browser Test Suite
Open `http://localhost:8000/tests/runner.html` to run all state machine, scenario validation, and quiz scoring tests interactively in the browser.

---

## 📁 Repository Structure

```shell
.
├── docs/                        # Static GitHub Pages root
│   ├── images/                  # Icons and static media
│   ├── pages/                   # SPA page templates
│   │   ├── home.html            # Landing page
│   │   └── spot_documentation.html # Main documentation & comparison
│   ├── pdf/                     # Printable documentation PDF
│   ├── tests/                   # In-browser test runner
│   │   └── runner.html
│   ├── tool/                    # SPOT Interactive Triage Studio
│   │   ├── modules/             # Pure ES6 modular architecture
│   │   │   ├── TriageEngine.js  # SPOT state machine
│   │   │   ├── Scenarios.js     # 4 incident presets (up to 8 alerts)
│   │   │   ├── WalkthroughEngine.js # Mode 1 Autoplay controller
│   │   │   ├── QuizEngine.js    # Mode 2 Interactive challenge
│   │   │   ├── SandboxEngine.js # Mode 3 Live custom sandbox
│   │   │   ├── UIRenderer.js    # DOM rendering & event bindings
│   │   │   └── app.js           # Studio coordinator
│   │   ├── priority-tool.html   # Studio application shell
│   │   └── priority-tool.css    # Modern tech studio styles
│   ├── index.html               # Main website entry point
│   ├── styles.css               # Design system & documentation styles
│   └── scripts.js               # Client router & dynamic TOC
├── tests/                       # Node.js automated unit tests
│   ├── scenarios.test.js
│   └── triage-engine.test.js
├── DEVELOPMENT.md               # Local development instructions
├── package.json                 # Node test & start scripts
└── README.md                    # Project overview & documentation
```
