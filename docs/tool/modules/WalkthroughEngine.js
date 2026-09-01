/**
 * WalkthroughEngine.js
 * Controls Mode 1: Guided Autoplay Walkthrough.
 * Provides playback controls, automated step progression, speed adjustments,
 * and live coach commentary.
 */

import { SCENARIOS } from './Scenarios.js';

export class WalkthroughEngine {
    constructor(triageEngine) {
        this.triageEngine = triageEngine;
        this.currentScenario = SCENARIOS[0];
        this.stepIndex = 0; // 0: Survey, 1: Prioritize, 2: Optimize, 3: Action
        this.isPlaying = false;
        this.speed = 1.0; // 1.0x, 1.5x, 2.0x
        this.baseIntervalMs = 4500;
        this.timer = null;
        this.listeners = [];

        this.loadScenario(this.currentScenario.id);
    }

    loadScenario(scenarioId) {
        this.pause();
        const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
        this.currentScenario = scenario;
        this.stepIndex = 0;
        this.resetToCurrentStep();
    }

    resetToCurrentStep() {
        if (!this.currentScenario) return;

        // Reset tasks in triage engine to initial scenario state
        this.triageEngine.loadTasks(this.currentScenario.tasks);
        this.triageEngine.setStep('survey');

        // Apply all steps up to stepIndex
        for (let i = 0; i <= this.stepIndex; i++) {
            const stepConfig = this.currentScenario.walkthrough[i];
            if (stepConfig) {
                this.triageEngine.setStep(stepConfig.step);
                if (stepConfig.actions) {
                    stepConfig.actions.forEach(act => {
                        if (act.surveyGroup !== undefined) this.triageEngine.setSurveyGroup(act.taskId, act.surveyGroup);
                        if (act.urgencyGroup !== undefined) this.triageEngine.setUrgencyGroup(act.taskId, act.urgencyGroup);
                        if (act.impactGroup !== undefined) this.triageEngine.setImpactGroup(act.taskId, act.impactGroup);
                        if (act.actionStatus !== undefined) this.triageEngine.setActionStatus(act.taskId, act.actionStatus, act.actionMitigation || '');
                    });
                }
            }
        }
        this.notify();
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.notify();

        // If already at end, restart
        if (this.stepIndex >= this.currentScenario.walkthrough.length - 1) {
            this.stepIndex = 0;
            this.resetToCurrentStep();
        }

        this.scheduleNext();
    }

    pause() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isPlaying = false;
        this.notify();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    scheduleNext() {
        if (!this.isPlaying) return;
        const delay = this.baseIntervalMs / this.speed;

        this.timer = setTimeout(() => {
            if (!this.isPlaying) return;
            if (this.stepIndex < this.currentScenario.walkthrough.length - 1) {
                this.nextStep();
                this.scheduleNext();
            } else {
                this.pause();
            }
        }, delay);
    }

    nextStep() {
        if (this.stepIndex < this.currentScenario.walkthrough.length - 1) {
            this.stepIndex++;
            this.resetToCurrentStep();
        } else {
            this.pause();
        }
    }

    prevStep() {
        if (this.stepIndex > 0) {
            this.stepIndex--;
            this.resetToCurrentStep();
        }
    }

    goToStep(index) {
        if (index >= 0 && index < this.currentScenario.walkthrough.length) {
            this.stepIndex = index;
            this.resetToCurrentStep();
        }
    }

    restart() {
        this.pause();
        this.stepIndex = 0;
        this.resetToCurrentStep();
    }

    setSpeed(newSpeed) {
        this.speed = parseFloat(newSpeed) || 1.0;
        if (this.isPlaying) {
            clearTimeout(this.timer);
            this.scheduleNext();
        }
        this.notify();
    }

    getCurrentStepInfo() {
        const stepConfig = this.currentScenario.walkthrough[this.stepIndex];
        return {
            scenario: this.currentScenario,
            stepIndex: this.stepIndex,
            totalSteps: this.currentScenario.walkthrough.length,
            stepKey: stepConfig ? stepConfig.step : 'survey',
            title: stepConfig ? stepConfig.title : '',
            narration: stepConfig ? stepConfig.narration : '',
            isPlaying: this.isPlaying,
            speed: this.speed,
            isFirst: this.stepIndex === 0,
            isLast: this.stepIndex === this.currentScenario.walkthrough.length - 1
        };
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notify() {
        const info = this.getCurrentStepInfo();
        this.listeners.forEach(cb => {
            try {
                cb(info);
            } catch (err) {
                console.error('Error in WalkthroughEngine listener:', err);
            }
        });
    }
}
