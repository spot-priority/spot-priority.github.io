/**
 * UIRenderer.js
 * Comprehensive UI rendering and event handling for the SPOT Interactive Triage Studio.
 */

import { SCENARIOS } from './Scenarios.js';

export class UIRenderer {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('appRoot');
    }

    render() {
        if (!this.container) return;
        const mode = this.app.currentMode; // 'walkthrough' | 'quiz' | 'sandbox'

        this.container.innerHTML = `
            <!-- Studio Control Bar / Mode Selector -->
            <div class="studio-top-bar">
                <div class="mode-selector">
                    <button class="mode-tab ${mode === 'walkthrough' ? 'active' : ''}" data-mode="walkthrough">
                        <i class="fas fa-play-circle"></i>
                        <span>Mode 1: Guided Walkthrough</span>
                        <span class="mode-tag">Autoplay</span>
                    </button>
                    <button class="mode-tab ${mode === 'quiz' ? 'active' : ''}" data-mode="quiz">
                        <i class="fas fa-bullseye"></i>
                        <span>Mode 2: Triage Challenge</span>
                        <span class="mode-tag">Interactive Quiz</span>
                    </button>
                    <button class="mode-tab ${mode === 'sandbox' ? 'active' : ''}" data-mode="sandbox">
                        <i class="fas fa-sliders-h"></i>
                        <span>Mode 3: Live Sandbox</span>
                        <span class="mode-tag">Custom Incident</span>
                    </button>
                </div>

                <!-- Scenario Dropdown (for Walkthrough & Quiz) -->
                ${mode !== 'sandbox' ? `
                    <div class="scenario-selector-container">
                        <label for="scenarioSelect"><i class="fas fa-shield-alt"></i> Incident Scenario:</label>
                        <select id="scenarioSelect" class="scenario-dropdown">
                            ${SCENARIOS.map(s => `
                                <option value="${s.id}" ${this.app.selectedScenarioId === s.id ? 'selected' : ''}>
                                    ${s.name} [${s.badge}]
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>

            <!-- Incident Context Banner -->
            ${this.renderIncidentHeader()}

            <!-- Main SPOT Step Progress Pipeline -->
            ${this.renderStepPipeline()}

            <!-- Mode-Specific Main Workspace -->
            <div class="studio-workspace">
                ${mode === 'walkthrough' ? this.renderWalkthroughWorkspace() : ''}
                ${mode === 'quiz' ? this.renderQuizWorkspace() : ''}
                ${mode === 'sandbox' ? this.renderSandboxWorkspace() : ''}
            </div>

            <!-- Toast Notification Container -->
            <div id="toastContainer" class="toast-container"></div>
        `;

        this.bindEvents();
    }

    renderIncidentHeader() {
        if (this.app.currentMode === 'sandbox') {
            return `
                <div class="incident-context-card sandbox-context">
                    <div class="context-header">
                        <div>
                            <span class="incident-badge badge-live">Live Incident Mode</span>
                            <h2 class="context-title">Live Triage Sandbox</h2>
                            <p class="context-desc">Triage real incoming alerts or simulated spikes. Assign tasks through the SPOT funnel and export a clean action plan.</p>
                        </div>
                        <div class="context-actions">
                            <button id="addAlertBtn" class="btn btn-primary"><i class="fas fa-plus"></i> Add New Alert</button>
                            <button id="loadPresetBtn" class="btn btn-secondary"><i class="fas fa-sync"></i> Load Sample Alerts</button>
                            <button id="exportPlanBtn" class="btn btn-accent"><i class="fas fa-copy"></i> Copy Action Plan</button>
                            <button id="clearAllBtn" class="btn btn-danger-subtle"><i class="fas fa-trash"></i> Clear</button>
                        </div>
                    </div>
                </div>
            `;
        }

        const scenario = SCENARIOS.find(s => s.id === this.app.selectedScenarioId) || SCENARIOS[0];
        return `
            <div class="incident-context-card">
                <div class="context-header">
                    <div>
                        <div class="context-badges">
                            <span class="incident-badge badge-${scenario.difficulty.toLowerCase()}">${scenario.difficulty}</span>
                            <span class="incident-badge badge-category">${scenario.category}</span>
                            <span class="incident-badge badge-alerts">${scenario.tasks.length} Active Alerts</span>
                        </div>
                        <h2 class="context-title">${scenario.name}</h2>
                        <p class="context-desc">${scenario.incidentContext}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderStepPipeline() {
        const stepOrder = ['survey', 'prioritize', 'optimize', 'action'];
        const currentStep = this.app.triageEngine.currentStep;
        const currentStepIdx = stepOrder.indexOf(currentStep);

        const stepsMeta = [
            { key: 'survey', code: 'S', title: 'Survey', subtitle: 'Scope & Primary Triage' },
            { key: 'prioritize', code: 'P', title: 'Prioritize', subtitle: 'Urgency Filtering' },
            { key: 'optimize', code: 'O', title: 'Optimize', subtitle: 'High-Impact Mitigation' },
            { key: 'action', code: 'T', title: 'Take Action', subtitle: 'Decisive Execution' }
        ];

        return `
            <div class="step-pipeline-card">
                <div class="pipeline-progress-bar">
                    <div class="pipeline-progress-fill" style="width: ${(currentStepIdx / 3) * 100}%"></div>
                </div>
                <div class="pipeline-steps">
                    ${stepsMeta.map((s, idx) => {
                        const isActive = s.key === currentStep;
                        const isCompleted = idx < currentStepIdx;
                        return `
                            <button class="pipeline-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-step="${s.key}">
                                <div class="step-node-bubble">
                                    ${isCompleted ? '<i class="fas fa-check"></i>' : s.code}
                                </div>
                                <div class="step-node-text">
                                    <span class="step-node-title">${s.title}</span>
                                    <span class="step-node-sub">${s.subtitle}</span>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /* =========================================================================
       MODE 1: WALKTHROUGH WORKSPACE
       ========================================================================= */
    renderWalkthroughWorkspace() {
        const info = this.app.walkthroughEngine.getCurrentStepInfo();
        const currentStep = this.app.triageEngine.currentStep;
        const tasks = this.app.triageEngine.getAllTasks();

        return `
            <!-- Playback Controller -->
            <div class="playback-bar">
                <div class="playback-controls">
                    <button id="wtPrevBtn" class="ctrl-btn" ${info.isFirst ? 'disabled' : ''} title="Previous Step">
                        <i class="fas fa-step-backward"></i> Prev
                    </button>
                    <button id="wtPlayBtn" class="ctrl-btn ctrl-btn-main" title="${info.isPlaying ? 'Pause' : 'Play Walkthrough'}">
                        <i class="fas ${info.isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                        <span>${info.isPlaying ? 'Pause' : 'Auto-Play'}</span>
                    </button>
                    <button id="wtNextBtn" class="ctrl-btn" ${info.isLast ? 'disabled' : ''} title="Next Step">
                        Next <i class="fas fa-step-forward"></i>
                    </button>
                    <button id="wtRestartBtn" class="ctrl-btn" title="Restart Walkthrough">
                        <i class="fas fa-redo"></i> Restart
                    </button>
                </div>

                <div class="playback-speed">
                    <span class="speed-label"><i class="fas fa-tachometer-alt"></i> Speed:</span>
                    <button class="speed-btn ${info.speed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x</button>
                    <button class="speed-btn ${info.speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
                    <button class="speed-btn ${info.speed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x</button>
                </div>
            </div>

            <!-- Coach Narration Drawer -->
            <div class="coach-narration-card">
                <div class="coach-avatar">
                    <i class="fas fa-user-astronaut"></i>
                </div>
                <div class="coach-content">
                    <div class="coach-step-tag">SPOT Stage: <strong>${info.title}</strong></div>
                    <p class="coach-text">${info.narration}</p>
                </div>
            </div>

            <!-- Visual Triage Funnel Cards Grid -->
            <div class="funnel-container">
                ${this.renderFunnelColumns(currentStep, tasks, false)}
            </div>
        `;
    }

    /* =========================================================================
       MODE 2: QUIZ / PRACTICE CHALLENGE WORKSPACE
       ========================================================================= */
    renderQuizWorkspace() {
        const quizState = this.app.quizEngine.getState();
        const currentStep = this.app.triageEngine.currentStep;
        const tasks = this.app.triageEngine.getAllTasks();

        if (quizState.isCompleted) {
            return this.renderQuizDebrief(quizState);
        }

        return `
            <div class="quiz-interaction-area">
                <div class="quiz-challenge-header">
                    <div class="quiz-step-indicator">
                        Challenge Step ${quizState.quizStep + 1} of 4:
                        <strong>${['Survey (Primary vs Secondary)', 'Prioritize (Urgency)', 'Optimize (Mitigation)', 'Take Action (Protocol)'][quizState.quizStep]}</strong>
                    </div>
                </div>

                <!-- Current Question Prompt -->
                ${this.renderQuizQuestionPrompt(quizState)}

                <!-- Interactive Funnel Cards Grid -->
                <div class="funnel-container">
                    ${this.renderFunnelColumns(currentStep, tasks, true)}
                </div>
            </div>
        `;
    }

    renderQuizQuestionPrompt(quizState) {
        const step = quizState.quizStep;
        const scenario = quizState.scenario;
        const q = scenario.quiz;
        const result = quizState.stepResults[step];

        let questionHtml = '';

        if (step === 0) { // Survey
            questionHtml = `
                <div class="quiz-prompt-card">
                    <div class="prompt-icon"><i class="fas fa-question-circle"></i></div>
                    <div class="prompt-body">
                        <h3>${q.surveyQuestion.prompt}</h3>
                        <p class="prompt-help">Click on the buttons on each card to classify alerts into <strong>Primary</strong> (immediate critical customer impact) or <strong>Secondary</strong> (deferrable), then click <strong>Submit Survey Triage</strong>.</p>
                        <div class="quiz-actions-bar">
                            <button id="submitSurveyBtn" class="btn btn-primary" ${result ? 'disabled' : ''}>
                                <i class="fas fa-check-circle"></i> Submit Survey Triage
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 1) { // Prioritize
            questionHtml = `
                <div class="quiz-prompt-card">
                    <div class="prompt-icon"><i class="fas fa-fire-alt"></i></div>
                    <div class="prompt-body">
                        <h3>${q.prioritizeQuestion.prompt}</h3>
                        <p class="prompt-help">Select the primary alert that represents the highest immediate urgency / root bottleneck.</p>
                        <div class="quiz-actions-bar">
                            <button id="submitPrioBtn" class="btn btn-primary" ${result ? 'disabled' : ''}>
                                <i class="fas fa-check-circle"></i> Submit Urgency Priority
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 2) { // Optimize
            questionHtml = `
                <div class="quiz-prompt-card">
                    <div class="prompt-icon"><i class="fas fa-bolt"></i></div>
                    <div class="prompt-body">
                        <h3>${q.optimizeQuestion.prompt}</h3>
                        <div class="quiz-options-list">
                            ${q.optimizeQuestion.options.map(opt => `
                                <label class="quiz-option-label">
                                    <input type="radio" name="optChoice" value="${opt.id}" ${quizState.userAnswers.optimize.selectedOptionId === opt.id ? 'checked' : ''} ${result ? 'disabled' : ''}>
                                    <span class="quiz-option-text">${opt.text}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="quiz-actions-bar">
                            <button id="submitOptBtn" class="btn btn-primary" ${result ? 'disabled' : ''}>
                                <i class="fas fa-check-circle"></i> Submit Mitigation Choice
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 3) { // Action
            questionHtml = `
                <div class="quiz-prompt-card">
                    <div class="prompt-icon"><i class="fas fa-rocket"></i></div>
                    <div class="prompt-body">
                        <h3>${q.actionQuestion.prompt}</h3>
                        <div class="quiz-options-list">
                            ${q.actionQuestion.options.map(opt => `
                                <label class="quiz-option-label">
                                    <input type="radio" name="actChoice" value="${opt.id}" ${quizState.userAnswers.action.selectedOptionId === opt.id ? 'checked' : ''} ${result ? 'disabled' : ''}>
                                    <span class="quiz-option-text">${opt.text}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="quiz-actions-bar">
                            <button id="submitActBtn" class="btn btn-primary" ${result ? 'disabled' : ''}>
                                <i class="fas fa-check-circle"></i> Submit Action Protocol
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Feedback Banner if already submitted
        let feedbackHtml = '';
        if (result) {
            feedbackHtml = `
                <div class="quiz-feedback-banner ${result.isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
                    <div class="feedback-icon">
                        <i class="fas ${result.isCorrect ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                    </div>
                    <div class="feedback-text">
                        <h4>${result.isCorrect ? 'Decision Approved!' : 'Triage Anti-Pattern Detected'}</h4>
                        <p>${result.feedback}</p>
                        ${result.explanation ? `<p class="feedback-sub-expl"><strong>SRE Rationale:</strong> ${result.explanation}</p>` : ''}
                    </div>
                    <div class="feedback-next">
                        <button id="quizNextStepBtn" class="btn btn-accent">
                            Next Stage <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        return questionHtml + feedbackHtml;
    }

    renderQuizDebrief(quizState) {
        const score = quizState.score;
        let scoreBadgeClass = 'badge-score-good';
        if (score < 60) scoreBadgeClass = 'badge-score-low';
        else if (score < 90) scoreBadgeClass = 'badge-score-med';

        return `
            <div class="quiz-debrief-card">
                <div class="debrief-header">
                    <div class="score-circle ${scoreBadgeClass}">
                        <span class="score-num">${score}%</span>
                        <span class="score-label">Triage Accuracy</span>
                    </div>
                    <div class="debrief-titles">
                        <h2>Incident Triage Debrief</h2>
                        <p class="debrief-scenario">${quizState.scenario.name}</p>
                        <p class="debrief-time"><i class="fas fa-clock"></i> Time to Decision: <strong>${quizState.timeTakenSec}s</strong></p>
                    </div>
                </div>

                <div class="debrief-body">
                    <h3><i class="fas fa-graduation-cap"></i> Key Takeaway</h3>
                    <div class="takeaway-box">
                        <p>${quizState.keyTakeaway}</p>
                    </div>

                    <h3><i class="fas fa-list-check"></i> Stage-by-Stage Review</h3>
                    <div class="debrief-steps-grid">
                        ${['Survey (S)', 'Prioritize (P)', 'Optimize (O)', 'Take Action (T)'].map((name, i) => {
                            const res = quizState.stepResults[i];
                            const isCorrect = res && res.isCorrect;
                            return `
                                <div class="debrief-step-item ${isCorrect ? 'pass' : 'fail'}">
                                    <div class="step-badge">${isCorrect ? '✓ PASSED' : '✗ REVIEW'}</div>
                                    <h4>${name}</h4>
                                    <p>${res ? res.feedback : 'Not completed'}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="debrief-actions">
                        <button id="retryQuizBtn" class="btn btn-primary"><i class="fas fa-redo"></i> Retry This Scenario</button>
                        <button id="nextScenarioQuizBtn" class="btn btn-secondary"><i class="fas fa-arrow-right"></i> Try Another Scenario</button>
                    </div>
                </div>
            </div>
        `;
    }

    /* =========================================================================
       MODE 3: SANDBOX WORKSPACE
       ========================================================================= */
    renderSandboxWorkspace() {
        const currentStep = this.app.triageEngine.currentStep;
        const tasks = this.app.triageEngine.getAllTasks();

        return `
            <div class="sandbox-workspace">
                <div class="sandbox-controls-bar">
                    <div class="step-nav-buttons">
                        <button id="sandboxPrevStep" class="btn btn-sm btn-secondary" ${currentStep === 'survey' ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i> Previous Step
                        </button>
                        <span class="sandbox-step-name">Current Stage: <strong>${this.app.triageEngine.currentStep.toUpperCase()}</strong></span>
                        <button id="sandboxNextStep" class="btn btn-sm btn-primary" ${currentStep === 'action' ? 'disabled' : ''}>
                            Next Step <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div class="funnel-container">
                    ${this.renderFunnelColumns(currentStep, tasks, true)}
                </div>
            </div>

            <!-- Add Task Modal -->
            <div id="addAlertModal" class="modal-backdrop" style="display: none;">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus-circle"></i> Add New Incident Alert</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <form id="addAlertForm">
                        <div class="form-row">
                            <label>Alert Title *</label>
                            <input type="text" id="newAlertTitle" placeholder="e.g., Redis Cluster OOM Error" required>
                        </div>
                        <div class="form-row">
                            <label>Description & Scope</label>
                            <textarea id="newAlertDesc" placeholder="e.g., Worker-2 cache evictions causing 504 timeouts on search"></textarea>
                        </div>
                        <div class="form-row form-inline">
                            <div>
                                <label>Severity</label>
                                <select id="newAlertSeverity">
                                    <option value="sev-1">SEV-1 (Critical / Outage)</option>
                                    <option value="sev-2" selected>SEV-2 (High / Degraded)</option>
                                    <option value="sev-3">SEV-3 (Medium / Minor)</option>
                                    <option value="sev-4">SEV-4 (Low / Noise)</option>
                                </select>
                            </div>
                            <div>
                                <label>System / Component</label>
                                <input type="text" id="newAlertSystem" placeholder="e.g., Payments API">
                            </div>
                        </div>
                        <div class="form-row">
                            <label>Key Metric / Health Data</label>
                            <input type="text" id="newAlertMetric" placeholder="e.g., Error Rate: 34.2%">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add to Triage</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    /* =========================================================================
       FUNNEL COLUMNS & CARDS RENDERER
       ========================================================================= */
    renderFunnelColumns(step, tasks, isInteractive = false) {
        if (step === 'survey') {
            const primaryTasks = tasks.filter(t => t.surveyGroup === 'primary');
            const secondaryTasks = tasks.filter(t => t.surveyGroup === 'secondary');
            const unassignedTasks = tasks.filter(t => t.surveyGroup === 'unassigned');

            return `
                <div class="funnel-columns-grid cols-3">
                    <div class="funnel-column unassigned-col">
                        <div class="col-header">
                            <h4><i class="fas fa-inbox"></i> Incoming Alerts (${unassignedTasks.length})</h4>
                            <span class="col-badge">Unassigned</span>
                        </div>
                        <div class="col-task-list" data-group="unassigned">
                            ${unassignedTasks.length === 0 ? '<div class="empty-col">All alerts triaged!</div>' : unassignedTasks.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column primary-col">
                        <div class="col-header">
                            <h4><i class="fas fa-exclamation-circle"></i> Primary Triage (${primaryTasks.length})</h4>
                            <span class="col-badge badge-primary">Critical / Urgent</span>
                        </div>
                        <div class="col-task-list" data-group="primary">
                            ${primaryTasks.length === 0 ? '<div class="empty-col">No alerts tagged Primary</div>' : primaryTasks.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column secondary-col">
                        <div class="col-header">
                            <h4><i class="fas fa-archive"></i> Secondary Backlog (${secondaryTasks.length})</h4>
                            <span class="col-badge badge-secondary">Deferrable / Minor</span>
                        </div>
                        <div class="col-task-list" data-group="secondary">
                            ${secondaryTasks.length === 0 ? '<div class="empty-col">No alerts tagged Secondary</div>' : secondaryTasks.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        if (step === 'prioritize') {
            const highUrgency = tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency');
            const lowerUrgency = tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup !== 'high_urgency');
            const deferred = tasks.filter(t => t.surveyGroup === 'secondary');

            return `
                <div class="funnel-columns-grid cols-3">
                    <div class="funnel-column high-urgency-col">
                        <div class="col-header">
                            <h4><i class="fas fa-fire"></i> Top Urgency (${highUrgency.length})</h4>
                            <span class="col-badge badge-sev1">Immediate Blocker</span>
                        </div>
                        <div class="col-task-list" data-group="high_urgency">
                            ${highUrgency.length === 0 ? '<div class="empty-col">Assign highest urgency item</div>' : highUrgency.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column lower-urgency-col">
                        <div class="col-header">
                            <h4><i class="fas fa-hourglass-half"></i> Lower Urgency Primary (${lowerUrgency.length})</h4>
                            <span class="col-badge badge-sev2">Can Wait Minutes</span>
                        </div>
                        <div class="col-task-list" data-group="lower_urgency">
                            ${lowerUrgency.length === 0 ? '<div class="empty-col">No lower urgency primary items</div>' : lowerUrgency.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column secondary-col muted">
                        <div class="col-header">
                            <h4><i class="fas fa-pause-circle"></i> Deferred Secondaries (${deferred.length})</h4>
                            <span class="col-badge">Backlog</span>
                        </div>
                        <div class="col-task-list">
                            ${deferred.map(t => this.renderTaskCard(t, step, false)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        if (step === 'optimize') {
            const highImpact = tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency' && t.impactGroup === 'high_impact');
            const candidates = tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency' && t.impactGroup !== 'high_impact');
            const rest = tasks.filter(t => t.surveyGroup === 'secondary' || t.urgencyGroup === 'lower_urgency');

            return `
                <div class="funnel-columns-grid cols-3">
                    <div class="funnel-column optimize-col">
                        <div class="col-header">
                            <h4><i class="fas fa-check-double"></i> High-Leverage Mitigation (${highImpact.length})</h4>
                            <span class="col-badge badge-primary">Fastest High Return</span>
                        </div>
                        <div class="col-task-list" data-group="high_impact">
                            ${highImpact.length === 0 ? '<div class="empty-col">Select optimal mitigation</div>' : highImpact.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column candidates-col">
                        <div class="col-header">
                            <h4><i class="fas fa-tasks"></i> High Urgency Candidate (${candidates.length})</h4>
                            <span class="col-badge">Under Evaluation</span>
                        </div>
                        <div class="col-task-list">
                            ${candidates.map(t => this.renderTaskCard(t, step, isInteractive)).join('')}
                        </div>
                    </div>

                    <div class="funnel-column secondary-col muted">
                        <div class="col-header">
                            <h4><i class="fas fa-archive"></i> Deferred Pipeline (${rest.length})</h4>
                            <span class="col-badge">Deferred</span>
                        </div>
                        <div class="col-task-list">
                            ${rest.map(t => this.renderTaskCard(t, step, false)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        if (step === 'action') {
            const actionTasks = tasks.filter(t => t.actionStatus === 'action_now' || (t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency'));
            const deferredTasks = tasks.filter(t => t.surveyGroup === 'secondary' || t.actionStatus === 'deferred');

            return `
                <div class="action-execution-layout">
                    <div class="action-locked-card">
                        <div class="action-card-header">
                            <span class="pulse-indicator"></span>
                            <h3><i class="fas fa-play"></i> NEXT IMMEDIATE ACTION (Executing Now)</h3>
                        </div>
                        <div class="action-tasks-container">
                            ${actionTasks.map(t => `
                                <div class="action-execution-item">
                                    <div class="action-title-row">
                                        <span class="badge-sev1">${t.severity.toUpperCase()}</span>
                                        <h4>${t.title}</h4>
                                    </div>
                                    <p class="action-desc">${t.description}</p>
                                    ${t.actionMitigation ? `
                                        <div class="action-mitigation-box">
                                            <strong><i class="fas fa-terminal"></i> Mitigation Command:</strong>
                                            <span>${t.actionMitigation}</span>
                                        </div>
                                    ` : ''}
                                    ${t.metric ? `<div class="action-metric-pill"><i class="fas fa-chart-line"></i> ${t.metric}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="deferred-backlog-card">
                        <div class="backlog-header">
                            <h4><i class="fas fa-list-ul"></i> Deferred / Secondary Triage Backlog (${deferredTasks.length})</h4>
                            <p class="backlog-sub">These tasks are safely buffered to review after primary recovery.</p>
                        </div>
                        <div class="backlog-list">
                            ${deferredTasks.map(t => `
                                <div class="backlog-item">
                                    <span class="badge-sev3">${t.severity.toUpperCase()}</span>
                                    <span class="backlog-item-title">${t.title}</span>
                                    <span class="backlog-item-sys">${t.system}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        return '';
    }

    renderTaskCard(task, step, isInteractive) {
        const severityClass = `badge-${task.severity || 'sev-2'}`;

        return `
            <div class="task-card ${task.surveyGroup} ${task.urgencyGroup} ${task.impactGroup}" data-task-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-severity ${severityClass}">${(task.severity || 'SEV-2').toUpperCase()}</span>
                    <span class="task-system">${task.system || 'General'}</span>
                </div>
                <h4 class="task-title">${task.title}</h4>
                <p class="task-desc">${task.description}</p>
                ${task.metric ? `<div class="task-metric"><i class="fas fa-chart-pie"></i> ${task.metric}</div>` : ''}

                ${isInteractive ? `
                    <div class="task-interactive-actions">
                        ${step === 'survey' ? `
                            <button class="btn-chip btn-chip-primary ${task.surveyGroup === 'primary' ? 'selected' : ''}" data-action="set-primary" data-id="${task.id}">
                                <i class="fas fa-check"></i> Primary
                            </button>
                            <button class="btn-chip btn-chip-secondary ${task.surveyGroup === 'secondary' ? 'selected' : ''}" data-action="set-secondary" data-id="${task.id}">
                                <i class="fas fa-pause"></i> Secondary
                            </button>
                        ` : ''}
                        ${step === 'prioritize' && task.surveyGroup === 'primary' ? `
                            <button class="btn-chip btn-chip-urgent ${task.urgencyGroup === 'high_urgency' ? 'selected' : ''}" data-action="set-urgent" data-id="${task.id}">
                                <i class="fas fa-fire"></i> Top Urgency
                            </button>
                            <button class="btn-chip btn-chip-lower ${task.urgencyGroup === 'lower_urgency' ? 'selected' : ''}" data-action="set-lower" data-id="${task.id}">
                                <i class="fas fa-clock"></i> Lower Urgency
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /* =========================================================================
       EVENT BINDINGS
       ========================================================================= */
    bindEvents() {
        // Mode Tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = tab.getAttribute('data-mode');
                if (mode) this.app.setMode(mode);
            });
        });

        // Scenario Selector Dropdown
        const scenarioSelect = document.getElementById('scenarioSelect');
        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', (e) => {
                this.app.selectScenario(e.target.value);
            });
        }

        // Pipeline Step Nodes
        document.querySelectorAll('.pipeline-step-node').forEach(node => {
            node.addEventListener('click', () => {
                const step = node.getAttribute('data-step');
                if (step) this.app.triageEngine.setStep(step);
            });
        });

        // Walkthrough Playback Controls
        const wtPlayBtn = document.getElementById('wtPlayBtn');
        if (wtPlayBtn) wtPlayBtn.addEventListener('click', () => this.app.walkthroughEngine.togglePlay());

        const wtNextBtn = document.getElementById('wtNextBtn');
        if (wtNextBtn) wtNextBtn.addEventListener('click', () => this.app.walkthroughEngine.nextStep());

        const wtPrevBtn = document.getElementById('wtPrevBtn');
        if (wtPrevBtn) wtPrevBtn.addEventListener('click', () => this.app.walkthroughEngine.prevStep());

        const wtRestartBtn = document.getElementById('wtRestartBtn');
        if (wtRestartBtn) wtRestartBtn.addEventListener('click', () => this.app.walkthroughEngine.restart());

        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = btn.getAttribute('data-speed');
                if (spd) this.app.walkthroughEngine.setSpeed(parseFloat(spd));
            });
        });

        // Quiz Question Submissions
        const submitSurveyBtn = document.getElementById('submitSurveyBtn');
        if (submitSurveyBtn) {
            submitSurveyBtn.addEventListener('click', () => {
                const primaryIds = this.app.triageEngine.getPrimaryTasks().map(t => t.id);
                const secondaryIds = this.app.triageEngine.getSecondaryTasks().map(t => t.id);
                this.app.quizEngine.submitSurvey(primaryIds, secondaryIds);
            });
        }

        const submitPrioBtn = document.getElementById('submitPrioBtn');
        if (submitPrioBtn) {
            submitPrioBtn.addEventListener('click', () => {
                const urgentIds = this.app.triageEngine.getHighUrgencyTasks().map(t => t.id);
                this.app.quizEngine.submitPrioritize(urgentIds);
            });
        }

        const submitOptBtn = document.getElementById('submitOptBtn');
        if (submitOptBtn) {
            submitOptBtn.addEventListener('click', () => {
                const selected = document.querySelector('input[name="optChoice"]:checked');
                if (selected) {
                    this.app.quizEngine.submitOptimize(selected.value);
                } else {
                    alert('Please select an optimization mitigation option first!');
                }
            });
        }

        const submitActBtn = document.getElementById('submitActBtn');
        if (submitActBtn) {
            submitActBtn.addEventListener('click', () => {
                const selected = document.querySelector('input[name="actChoice"]:checked');
                if (selected) {
                    this.app.quizEngine.submitAction(selected.value);
                } else {
                    alert('Please select an action protocol option first!');
                }
            });
        }

        const quizNextStepBtn = document.getElementById('quizNextStepBtn');
        if (quizNextStepBtn) {
            quizNextStepBtn.addEventListener('click', () => {
                this.app.quizEngine.nextQuizStep();
            });
        }

        const retryQuizBtn = document.getElementById('retryQuizBtn');
        if (retryQuizBtn) retryQuizBtn.addEventListener('click', () => this.app.quizEngine.restart());

        const nextScenarioQuizBtn = document.getElementById('nextScenarioQuizBtn');
        if (nextScenarioQuizBtn) {
            nextScenarioQuizBtn.addEventListener('click', () => {
                const curIdx = SCENARIOS.findIndex(s => s.id === this.app.selectedScenarioId);
                const nextIdx = (curIdx + 1) % SCENARIOS.length;
                this.app.selectScenario(SCENARIOS[nextIdx].id);
            });
        }

        // Interactive Card Action Chips
        document.querySelectorAll('.btn-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = chip.getAttribute('data-action');
                const id = chip.getAttribute('data-id');

                if (action === 'set-primary') this.app.triageEngine.setSurveyGroup(id, 'primary');
                else if (action === 'set-secondary') this.app.triageEngine.setSurveyGroup(id, 'secondary');
                else if (action === 'set-urgent') this.app.triageEngine.setUrgencyGroup(id, 'high_urgency');
                else if (action === 'set-lower') this.app.triageEngine.setUrgencyGroup(id, 'lower_urgency');
            });
        });

        // Sandbox Controls
        const addAlertBtn = document.getElementById('addAlertBtn');
        const modal = document.getElementById('addAlertModal');
        if (addAlertBtn && modal) {
            addAlertBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
        }

        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const m = document.getElementById('addAlertModal');
                if (m) m.style.display = 'none';
            });
        });

        const addAlertForm = document.getElementById('addAlertForm');
        if (addAlertForm) {
            addAlertForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('newAlertTitle').value;
                const desc = document.getElementById('newAlertDesc').value;
                const sev = document.getElementById('newAlertSeverity').value;
                const sys = document.getElementById('newAlertSystem').value;
                const metric = document.getElementById('newAlertMetric').value;

                this.app.sandboxEngine.addNewAlert(title, desc, sev, sys, metric);
                modal.style.display = 'none';
                addAlertForm.reset();
                this.showToast(`Alert "${title}" added to triage`, 'success');
            });
        }

        const loadPresetBtn = document.getElementById('loadPresetBtn');
        if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', () => {
                this.app.sandboxEngine.loadDefaultPreset();
                this.showToast('Sample incident alerts loaded into Sandbox', 'info');
            });
        }

        const exportPlanBtn = document.getElementById('exportPlanBtn');
        if (exportPlanBtn) {
            exportPlanBtn.addEventListener('click', async () => {
                const ok = await this.app.sandboxEngine.copyActionPlanToClipboard();
                if (ok) {
                    this.showToast('SPOT Action Plan copied to clipboard (Markdown format)!', 'success');
                } else {
                    alert(this.app.triageEngine.generateActionPlan());
                }
            });
        }

        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Clear all alerts from sandbox?')) {
                    this.app.sandboxEngine.clearAll();
                    this.showToast('Sandbox reset', 'info');
                }
            });
        }

        const sandboxPrevStep = document.getElementById('sandboxPrevStep');
        if (sandboxPrevStep) sandboxPrevStep.addEventListener('click', () => this.app.triageEngine.prevStep());

        const sandboxNextStep = document.getElementById('sandboxNextStep');
        if (sandboxNextStep) sandboxNextStep.addEventListener('click', () => this.app.triageEngine.nextStep());
    }
}
