/**
 * TriageEngine.js
 * Core state machine and task model for the SPOT Framework.
 * Pure ES6 module with zero external dependencies.
 */

export class TriageEngine {
    constructor(initialTasks = []) {
        this.tasks = [];
        this.currentStep = 'survey'; // 'survey' | 'prioritize' | 'optimize' | 'action'
        this.history = [];
        this.listeners = [];

        if (initialTasks && initialTasks.length > 0) {
            this.loadTasks(initialTasks);
        }
    }

    static get STEPS() {
        return ['survey', 'prioritize', 'optimize', 'action'];
    }

    static get STEP_CONFIG() {
        return {
            survey: {
                name: 'Survey',
                shortCode: 'S',
                tagline: 'Scan & Triage Scope',
                description: 'Quickly categorize all incoming alerts into Primary (critical user/system impact) and Secondary (deferrable).',
                categories: ['primary', 'secondary']
            },
            prioritize: {
                name: 'Prioritize',
                shortCode: 'P',
                tagline: 'Address Critical Urgency',
                description: 'Filter primary tasks by immediate urgency. Focus on stopping active bleeding and service downtime.',
                categories: ['high_urgency', 'lower_urgency']
            },
            optimize: {
                name: 'Optimize',
                shortCode: 'O',
                tagline: 'Maximize Return on Effort',
                description: 'Evaluate actionable tasks to find the highest-impact, fastest mitigation with available resources.',
                categories: ['high_impact', 'lower_impact']
            },
            action: {
                name: 'Take Action',
                shortCode: 'T',
                tagline: 'Execute Decisively',
                description: 'Lock in the single next immediate action. Defer or escalate secondary tasks to backlog.',
                categories: ['action_now', 'deferred', 'escalated']
            }
        };
    }

    generateId() {
        return 'task_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    }

    loadTasks(tasks) {
        this.tasks = tasks.map((t, index) => ({
            id: t.id || this.generateId(),
            title: t.title || t.name || 'Untitled Alert',
            description: t.description || '',
            severity: t.severity || 'sev-2', // 'sev-1', 'sev-2', 'sev-3', 'sev-4'
            system: t.system || 'General',
            metric: t.metric || '',
            surveyGroup: t.surveyGroup || 'unassigned', // 'primary' | 'secondary' | 'unassigned'
            urgencyGroup: t.urgencyGroup || 'unassigned', // 'high_urgency' | 'lower_urgency' | 'unassigned'
            impactGroup: t.impactGroup || 'unassigned', // 'high_impact' | 'lower_impact' | 'unassigned'
            actionStatus: t.actionStatus || 'pending', // 'action_now' | 'deferred' | 'escalated' | 'completed' | 'pending'
            actionMitigation: t.actionMitigation || '',
            notes: t.notes || '',
            rank: t.rank || index + 1
        }));
        this.notify();
    }

    addTask(taskData) {
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title || 'New Alert',
            description: taskData.description || '',
            severity: taskData.severity || 'sev-2',
            system: taskData.system || 'General',
            metric: taskData.metric || '',
            surveyGroup: taskData.surveyGroup || 'unassigned',
            urgencyGroup: taskData.urgencyGroup || 'unassigned',
            impactGroup: taskData.impactGroup || 'unassigned',
            actionStatus: taskData.actionStatus || 'pending',
            actionMitigation: taskData.actionMitigation || '',
            notes: taskData.notes || '',
            rank: this.tasks.length + 1
        };
        this.tasks.push(task);
        this.notify();
        return task;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;
        Object.assign(task, updates);
        this.notify();
        return task;
    }

    deleteTask(taskId) {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            this.tasks.splice(idx, 1);
            this.notify();
            return true;
        }
        return false;
    }

    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    setStep(step) {
        if (TriageEngine.STEPS.includes(step)) {
            this.currentStep = step;
            this.notify();
            return true;
        }
        return false;
    }

    nextStep() {
        const idx = TriageEngine.STEPS.indexOf(this.currentStep);
        if (idx < TriageEngine.STEPS.length - 1) {
            this.currentStep = TriageEngine.STEPS[idx + 1];
            this.notify();
            return true;
        }
        return false;
    }

    prevStep() {
        const idx = TriageEngine.STEPS.indexOf(this.currentStep);
        if (idx > 0) {
            this.currentStep = TriageEngine.STEPS[idx - 1];
            this.notify();
            return true;
        }
        return false;
    }

    // SPOT Group Assigners
    setSurveyGroup(taskId, group) { // 'primary' | 'secondary' | 'unassigned'
        const task = this.getTask(taskId);
        if (task) {
            task.surveyGroup = group;
            // If moved to secondary, clear deeper groups
            if (group === 'secondary') {
                task.urgencyGroup = 'lower_urgency';
                task.impactGroup = 'lower_impact';
                task.actionStatus = 'deferred';
            } else if (group === 'primary' && task.urgencyGroup === 'lower_urgency') {
                task.urgencyGroup = 'unassigned';
                task.impactGroup = 'unassigned';
                task.actionStatus = 'pending';
            }
            this.notify();
            return true;
        }
        return false;
    }

    setUrgencyGroup(taskId, group) { // 'high_urgency' | 'lower_urgency' | 'unassigned'
        const task = this.getTask(taskId);
        if (task) {
            task.urgencyGroup = group;
            if (group === 'lower_urgency') {
                task.impactGroup = 'lower_impact';
                task.actionStatus = 'deferred';
            }
            this.notify();
            return true;
        }
        return false;
    }

    setImpactGroup(taskId, group) { // 'high_impact' | 'lower_impact' | 'unassigned'
        const task = this.getTask(taskId);
        if (task) {
            task.impactGroup = group;
            if (group === 'high_impact') {
                task.actionStatus = 'action_now';
            } else if (group === 'lower_impact') {
                task.actionStatus = 'deferred';
            }
            this.notify();
            return true;
        }
        return false;
    }

    setActionStatus(taskId, status, mitigation = '') {
        const task = this.getTask(taskId);
        if (task) {
            task.actionStatus = status;
            if (mitigation) {
                task.actionMitigation = mitigation;
            }
            this.notify();
            return true;
        }
        return false;
    }

    // Queries based on current SPOT step
    getPrimaryTasks() {
        return this.tasks.filter(t => t.surveyGroup === 'primary');
    }

    getSecondaryTasks() {
        return this.tasks.filter(t => t.surveyGroup === 'secondary');
    }

    getHighUrgencyTasks() {
        return this.tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency');
    }

    getHighImpactTasks() {
        return this.tasks.filter(t => t.surveyGroup === 'primary' && t.urgencyGroup === 'high_urgency' && t.impactGroup === 'high_impact');
    }

    getActionTasks() {
        return this.tasks.filter(t => t.actionStatus === 'action_now');
    }

    getDeferredTasks() {
        return this.tasks.filter(t => t.actionStatus === 'deferred' || t.surveyGroup === 'secondary');
    }

    // Action plan generator (Markdown formatted)
    generateActionPlan() {
        const actionTasks = this.getActionTasks();
        const highUrgency = this.getHighUrgencyTasks();
        const secondary = this.getSecondaryTasks();
        const dateStr = new Date().toISOString();

        let md = `# SPOT Incident Action Plan\n`;
        md += `*Generated: ${dateStr}*\n\n`;

        md += `## 🚨 1. IMMEDIATE ACTIONS (Take Action)\n`;
        if (actionTasks.length > 0) {
            actionTasks.forEach((t, i) => {
                md += `**[Step ${i+1}] ${t.title}** (${t.severity.toUpperCase()} - ${t.system})\n`;
                if (t.actionMitigation) {
                    md += `> **Mitigation Action:** ${t.actionMitigation}\n`;
                }
                md += `- Scope: ${t.description}\n`;
                if (t.metric) md += `- Metric: \`${t.metric}\`\n`;
                md += `\n`;
            });
        } else {
            md += `*No immediate action locked in yet. Complete the SPOT triage funnel.*\n\n`;
        }

        md += `## ⏳ 2. DEFERRED / SECONDARY TASKS (Triage Backlog)\n`;
        if (secondary.length > 0) {
            secondary.forEach(t => {
                md += `- [ ] **${t.title}** (${t.severity.toUpperCase()}) - ${t.description}\n`;
            });
        } else {
            md += `*No secondary tasks identified.*\n`;
        }

        md += `\n---\n*Created with SPOT Framework (Survey -> Prioritize -> Optimize -> Take Action)*\n`;
        return md;
    }

    // Observer subscription
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notify() {
        this.listeners.forEach(cb => {
            try {
                cb({
                    tasks: [...this.tasks],
                    currentStep: this.currentStep,
                    stepConfig: TriageEngine.STEP_CONFIG[this.currentStep],
                    primaryCount: this.getPrimaryTasks().length,
                    secondaryCount: this.getSecondaryTasks().length,
                    actionCount: this.getActionTasks().length
                });
            } catch (err) {
                console.error('Error in TriageEngine subscriber:', err);
            }
        });
    }

    exportJSON() {
        return JSON.stringify({
            version: '2.0',
            exportedAt: new Date().toISOString(),
            currentStep: this.currentStep,
            tasks: this.tasks
        }, null, 2);
    }

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data.tasks)) {
                this.loadTasks(data.tasks);
                if (data.currentStep && TriageEngine.STEPS.includes(data.currentStep)) {
                    this.currentStep = data.currentStep;
                }
                this.notify();
                return true;
            }
        } catch (e) {
            console.error('Invalid JSON import', e);
        }
        return false;
    }
}
