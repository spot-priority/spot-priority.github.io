import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../docs/tool/modules/Scenarios.js';
import { TriageEngine } from '../docs/tool/modules/TriageEngine.js';
import { WalkthroughEngine } from '../docs/tool/modules/WalkthroughEngine.js';
import { QuizEngine } from '../docs/tool/modules/QuizEngine.js';

test('SCENARIOS - validates all scenario definitions have required structure', () => {
    assert.ok(SCENARIOS.length >= 4, 'Must have at least 4 scenario presets');

    SCENARIOS.forEach(scenario => {
        assert.ok(scenario.id, 'Scenario must have an id');
        assert.ok(scenario.name, 'Scenario must have a name');
        assert.ok(scenario.tasks && scenario.tasks.length >= 4, `${scenario.id} must have at least 4 tasks`);
        assert.ok(scenario.walkthrough && scenario.walkthrough.length === 4, `${scenario.id} walkthrough must cover all 4 SPOT steps`);
        assert.ok(scenario.quiz, `${scenario.id} must have quiz configurations`);
        assert.ok(scenario.quiz.surveyQuestion, `${scenario.id} must have surveyQuestion`);
        assert.ok(scenario.quiz.prioritizeQuestion, `${scenario.id} must have prioritizeQuestion`);
        assert.ok(scenario.quiz.optimizeQuestion, `${scenario.id} must have optimizeQuestion`);
        assert.ok(scenario.quiz.actionQuestion, `${scenario.id} must have actionQuestion`);
    });
});

test('WalkthroughEngine - executes all steps across scenarios without errors', () => {
    const triage = new TriageEngine();
    const walkthrough = new WalkthroughEngine(triage);

    SCENARIOS.forEach(scenario => {
        walkthrough.loadScenario(scenario.id);
        assert.equal(walkthrough.currentScenario.id, scenario.id);
        assert.equal(walkthrough.stepIndex, 0);

        // Step through all 4 steps
        for (let i = 0; i < 3; i++) {
            walkthrough.nextStep();
        }
        assert.equal(walkthrough.stepIndex, 3);
        const info = walkthrough.getCurrentStepInfo();
        assert.equal(info.stepKey, 'action');
        assert.ok(info.narration.length > 0);

        // Step backwards
        walkthrough.prevStep();
        assert.equal(walkthrough.stepIndex, 2);
    });
});

test('QuizEngine - evaluates correct vs incorrect answers properly', () => {
    const triage = new TriageEngine();
    const quiz = new QuizEngine(triage);

    // Test Scenario 1 (Auth Outage)
    quiz.loadScenario('scenario-1-auth-outage');

    // 1. Correct Survey
    const resSurvey = quiz.submitSurvey(['s1-t1'], ['s1-t2', 's1-t3', 's1-t4']);
    assert.equal(resSurvey.isCorrect, true);

    // 2. Correct Prioritize
    const resPrio = quiz.submitPrioritize(['s1-t1']);
    assert.equal(resPrio.isCorrect, true);

    // 3. Correct Optimize
    const resOpt = quiz.submitOptimize('opt-1');
    assert.equal(resOpt.isCorrect, true);

    // 4. Correct Action
    const resAct = quiz.submitAction('act-1');
    assert.equal(resAct.isCorrect, true);

    assert.equal(quiz.score, 100);
    assert.equal(quiz.stepResults.every(r => r.isCorrect), true);

    // Test wrong answers
    quiz.loadScenario('scenario-1-auth-outage');
    const wrongSurvey = quiz.submitSurvey(['s1-t4'], ['s1-t1', 's1-t2', 's1-t3']);
    assert.equal(wrongSurvey.isCorrect, false);
    assert.ok(wrongSurvey.feedback.includes('Remember SPOT'));
});

test('Complex Cascading Failure Scenarios - 6-alert and 8-alert validation', () => {
    const s2 = SCENARIOS.find(s => s.id === 'scenario-2-cascading-db-deadlock');
    assert.equal(s2.tasks.length, 6, 'Scenario 2 must have 6 alerts for cascading DB deadlock');

    const s3 = SCENARIOS.find(s => s.id === 'scenario-3-black-friday-collapse');
    assert.equal(s3.tasks.length, 8, 'Scenario 3 must have 8 alerts for high volume Black Friday collapse');
});
