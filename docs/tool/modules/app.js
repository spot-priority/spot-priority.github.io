/**
 * app.js
 * Main application coordinator for SPOT Interactive Triage Studio.
 */

import { TriageEngine } from './TriageEngine.js';
import { WalkthroughEngine } from './WalkthroughEngine.js';
import { QuizEngine } from './QuizEngine.js';
import { SandboxEngine } from './SandboxEngine.js';
import { UIRenderer } from './UIRenderer.js';
import { SCENARIOS } from './Scenarios.js';

export class SPOTApp {
    constructor() {
        this.triageEngine = new TriageEngine();
        this.walkthroughEngine = new WalkthroughEngine(this.triageEngine);
        this.quizEngine = new QuizEngine(this.triageEngine);
        this.sandboxEngine = new SandboxEngine(this.triageEngine);

        // Read query parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.currentMode = urlParams.get('mode') || 'walkthrough'; // 'walkthrough' | 'quiz' | 'sandbox'
        this.selectedScenarioId = urlParams.get('scenario') || SCENARIOS[0].id;

        this.renderer = new UIRenderer(this);

        // Subscribe to engine state changes
        this.triageEngine.subscribe(() => this.renderer.render());
        this.walkthroughEngine.subscribe(() => this.renderer.render());
        this.quizEngine.subscribe(() => this.renderer.render());

        this.init();
    }

    init() {
        if (this.currentMode === 'walkthrough') {
            this.walkthroughEngine.loadScenario(this.selectedScenarioId);
        } else if (this.currentMode === 'quiz') {
            this.quizEngine.loadScenario(this.selectedScenarioId);
        } else if (this.currentMode === 'sandbox') {
            this.sandboxEngine.loadDefaultPreset();
        }
        this.renderer.render();
    }

    setMode(mode) {
        if (['walkthrough', 'quiz', 'sandbox'].includes(mode)) {
            this.currentMode = mode;
            this.updateUrl();

            if (mode === 'walkthrough') {
                this.walkthroughEngine.loadScenario(this.selectedScenarioId);
            } else if (mode === 'quiz') {
                this.quizEngine.loadScenario(this.selectedScenarioId);
            } else if (mode === 'sandbox') {
                this.sandboxEngine.loadDefaultPreset();
            }
            this.renderer.render();
        }
    }

    selectScenario(scenarioId) {
        this.selectedScenarioId = scenarioId;
        this.updateUrl();

        if (this.currentMode === 'walkthrough') {
            this.walkthroughEngine.loadScenario(scenarioId);
        } else if (this.currentMode === 'quiz') {
            this.quizEngine.loadScenario(scenarioId);
        }
        this.renderer.render();
    }

    updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('mode', this.currentMode);
        if (this.currentMode !== 'sandbox') {
            url.searchParams.set('scenario', this.selectedScenarioId);
        } else {
            url.searchParams.delete('scenario');
        }
        window.history.replaceState({}, '', url);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spotApp = new SPOTApp();
});
