/**
 * QuizEngine.js
 * Controls Mode 2: Interactive Practice Challenge / Quiz.
 * Guides users through real-time incident triage challenges, evaluates their decisions,
 * provides immediate feedback with SRE rationales, and generates a final score debrief.
 */

import { SCENARIOS } from './Scenarios.js';

export class QuizEngine {
    constructor(triageEngine) {
        this.triageEngine = triageEngine;
        this.currentScenario = SCENARIOS[0];
        this.quizStep = 0; // 0: Survey, 1: Prioritize, 2: Optimize, 3: Action, 4: Debrief
        this.userAnswers = {
            survey: { primaryIds: [], secondaryIds: [] },
            prioritize: { highUrgencyIds: [] },
            optimize: { selectedOptionId: null },
            action: { selectedOptionId: null }
        };
        this.stepResults = [null, null, null, null];
        this.score = 0;
        this.startTime = null;
        this.endTime = null;
        this.listeners = [];

        this.loadScenario(this.currentScenario.id);
    }

    loadScenario(scenarioId) {
        const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
        this.currentScenario = scenario;
        this.quizStep = 0;
        this.userAnswers = {
            survey: { primaryIds: [], secondaryIds: [] },
            prioritize: { highUrgencyIds: [] },
            optimize: { selectedOptionId: null },
            action: { selectedOptionId: null }
        };
        this.stepResults = [null, null, null, null];
        this.score = 0;
        this.startTime = Date.now();
        this.endTime = null;

        // Reset triageEngine with clean unassigned tasks
        this.triageEngine.loadTasks(this.currentScenario.tasks.map(t => ({
            ...t,
            surveyGroup: 'unassigned',
            urgencyGroup: 'unassigned',
            impactGroup: 'unassigned',
            actionStatus: 'pending'
        })));
        this.triageEngine.setStep('survey');

        this.notify();
    }

    // Step 1: Submit Survey Classification
    submitSurvey(primaryIds, secondaryIds) {
        this.userAnswers.survey = { primaryIds: [...primaryIds], secondaryIds: [...secondaryIds] };
        const q = this.currentScenario.quiz.surveyQuestion;

        const isPrimaryCorrect = q.correctPrimaryIds.length === primaryIds.length &&
            q.correctPrimaryIds.every(id => primaryIds.includes(id));
        const isSecondaryCorrect = q.correctSecondaryIds.length === secondaryIds.length &&
            q.correctSecondaryIds.every(id => secondaryIds.includes(id));

        const isCorrect = isPrimaryCorrect && isSecondaryCorrect;

        // Apply classification to triage engine
        primaryIds.forEach(id => this.triageEngine.setSurveyGroup(id, 'primary'));
        secondaryIds.forEach(id => this.triageEngine.setSurveyGroup(id, 'secondary'));

        const result = {
            isCorrect,
            feedback: isCorrect ? q.feedbackCorrect : q.feedbackWrong,
            correctPrimaryIds: q.correctPrimaryIds,
            correctSecondaryIds: q.correctSecondaryIds
        };
        this.stepResults[0] = result;
        this.notify();
        return result;
    }

    // Step 2: Submit Prioritize Selection
    submitPrioritize(highUrgencyIds) {
        this.userAnswers.prioritize = { highUrgencyIds: [...highUrgencyIds] };
        const q = this.currentScenario.quiz.prioritizeQuestion;

        const isCorrect = q.correctHighUrgencyIds.length === highUrgencyIds.length &&
            q.correctHighUrgencyIds.every(id => highUrgencyIds.includes(id));

        highUrgencyIds.forEach(id => this.triageEngine.setUrgencyGroup(id, 'high_urgency'));

        const result = {
            isCorrect,
            feedback: isCorrect ? q.feedbackCorrect : q.feedbackWrong,
            correctHighUrgencyIds: q.correctHighUrgencyIds
        };
        this.stepResults[1] = result;
        this.notify();
        return result;
    }

    // Step 3: Submit Optimize Selection
    submitOptimize(selectedOptionId) {
        this.userAnswers.optimize = { selectedOptionId };
        const q = this.currentScenario.quiz.optimizeQuestion;
        const chosen = q.options.find(opt => opt.id === selectedOptionId);
        const isCorrect = chosen ? chosen.correct : false;

        if (isCorrect) {
            const correctTask = this.triageEngine.getHighUrgencyTasks()[0];
            if (correctTask) {
                this.triageEngine.setImpactGroup(correctTask.id, 'high_impact');
                this.triageEngine.setActionStatus(correctTask.id, 'action_now', chosen ? chosen.text : '');
            }
        }

        const result = {
            isCorrect,
            feedback: isCorrect ? q.feedbackCorrect : q.feedbackWrong,
            explanation: chosen ? chosen.explanation : '',
            chosenOption: chosen
        };
        this.stepResults[2] = result;
        this.notify();
        return result;
    }

    // Step 4: Submit Action Selection
    submitAction(selectedOptionId) {
        this.userAnswers.action = { selectedOptionId };
        const q = this.currentScenario.quiz.actionQuestion;
        const chosen = q.options.find(opt => opt.id === selectedOptionId);
        const isCorrect = chosen ? chosen.correct : false;

        const result = {
            isCorrect,
            feedback: isCorrect ? q.feedbackCorrect : q.feedbackWrong,
            explanation: chosen ? chosen.explanation : '',
            chosenOption: chosen
        };
        this.stepResults[3] = result;
        this.calculateFinalScore();
        this.notify();
        return result;
    }

    calculateFinalScore() {
        this.endTime = Date.now();
        const correctCount = this.stepResults.filter(r => r && r.isCorrect).length;
        this.score = Math.round((correctCount / 4) * 100);
    }

    nextQuizStep() {
        if (this.quizStep < 4) {
            this.quizStep++;
            const stepNames = ['survey', 'prioritize', 'optimize', 'action', 'action'];
            this.triageEngine.setStep(stepNames[this.quizStep]);
            this.notify();
        }
    }

    prevQuizStep() {
        if (this.quizStep > 0) {
            this.quizStep--;
            const stepNames = ['survey', 'prioritize', 'optimize', 'action', 'action'];
            this.triageEngine.setStep(stepNames[this.quizStep]);
            this.notify();
        }
    }

    restart() {
        this.loadScenario(this.currentScenario.id);
    }

    getState() {
        const timeTakenSec = this.endTime && this.startTime ? Math.round((this.endTime - this.startTime) / 1000) : 0;
        return {
            scenario: this.currentScenario,
            quizStep: this.quizStep, // 0: survey, 1: prioritize, 2: optimize, 3: action, 4: debrief
            userAnswers: this.userAnswers,
            stepResults: this.stepResults,
            score: this.score,
            timeTakenSec,
            keyTakeaway: this.currentScenario.quiz.keyTakeaway,
            isCompleted: this.quizStep === 4
        };
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(cb => {
            try {
                cb(state);
            } catch (err) {
                console.error('Error in QuizEngine listener:', err);
            }
        });
    }
}
