/**
 * SandboxEngine.js
 * Controls Mode 3: Live Incident Sandbox.
 * Enables on-call engineers to add real-time alerts/tasks, step through SPOT,
 * and export formatted incident action plans.
 */

export class SandboxEngine {
    constructor(triageEngine) {
        this.triageEngine = triageEngine;
        this.listeners = [];
    }

    loadDefaultPreset() {
        this.triageEngine.loadTasks([
            {
                title: 'Core API Elevated 5xx Error Rate',
                description: 'Service mesh reporting 18% HTTP 500 errors on /v1/checkout endpoint.',
                severity: 'sev-1',
                system: 'API Gateway',
                metric: 'Error Rate: 18.2%'
            },
            {
                title: 'Worker Queue Consumer Lag Exceeding SLO',
                description: 'Asynchronous event processing queue lag reached 12,000 messages.',
                severity: 'sev-2',
                system: 'Kafka / Worker',
                metric: 'Lag: 12,400 messages'
            },
            {
                title: 'Primary DB CPU Utilization at 92%',
                description: 'Read replica CPU spiked due to unindexed query from analytics team.',
                severity: 'sev-2',
                system: 'PostgreSQL Read Replica',
                metric: 'CPU: 92.4%'
            },
            {
                title: 'Staging Environment CI Pipeline Build Timeout',
                description: 'PR verification tests running slow due to Docker cache miss.',
                severity: 'sev-4',
                system: 'CI Runner',
                metric: 'Duration: >25m'
            }
        ]);
        this.triageEngine.setStep('survey');
    }

    addNewAlert(title, description, severity, system, metric) {
        return this.triageEngine.addTask({
            title,
            description,
            severity,
            system,
            metric,
            surveyGroup: 'unassigned',
            urgencyGroup: 'unassigned',
            impactGroup: 'unassigned',
            actionStatus: 'pending'
        });
    }

    clearAll() {
        this.triageEngine.loadTasks([]);
        this.triageEngine.setStep('survey');
    }

    async copyActionPlanToClipboard() {
        const md = this.triageEngine.generateActionPlan();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(md);
            return true;
        }
        return false;
    }
}
