import test from 'node:test';
import assert from 'node:assert/strict';
import { TriageEngine } from '../docs/tool/modules/TriageEngine.js';

test('TriageEngine - initializes with empty or custom tasks', () => {
    const engine = new TriageEngine();
    assert.equal(engine.getAllTasks().length, 0);
    assert.equal(engine.currentStep, 'survey');

    const sampleTasks = [
        { title: 'Alert 1', severity: 'sev-1' },
        { title: 'Alert 2', severity: 'sev-3' }
    ];
    const engineWithTasks = new TriageEngine(sampleTasks);
    assert.equal(engineWithTasks.getAllTasks().length, 2);
    assert.equal(engineWithTasks.getAllTasks()[0].title, 'Alert 1');
});

test('TriageEngine - CRUD operations on tasks', () => {
    const engine = new TriageEngine();
    const task = engine.addTask({
        title: 'Auth 500 error',
        description: 'Users cannot login',
        severity: 'sev-1',
        system: 'Auth Service'
    });

    assert.ok(task.id);
    assert.equal(task.title, 'Auth 500 error');
    assert.equal(engine.getAllTasks().length, 1);

    const updated = engine.updateTask(task.id, { description: 'Updated description' });
    assert.equal(updated.description, 'Updated description');
    assert.equal(engine.getTask(task.id).description, 'Updated description');

    const deleted = engine.deleteTask(task.id);
    assert.equal(deleted, true);
    assert.equal(engine.getAllTasks().length, 0);
});

test('TriageEngine - step navigation through SPOT', () => {
    const engine = new TriageEngine();
    assert.equal(engine.currentStep, 'survey');

    assert.equal(engine.nextStep(), true);
    assert.equal(engine.currentStep, 'prioritize');

    assert.equal(engine.nextStep(), true);
    assert.equal(engine.currentStep, 'optimize');

    assert.equal(engine.nextStep(), true);
    assert.equal(engine.currentStep, 'action');

    // Cannot advance beyond action
    assert.equal(engine.nextStep(), false);
    assert.equal(engine.currentStep, 'action');

    assert.equal(engine.prevStep(), true);
    assert.equal(engine.currentStep, 'optimize');

    assert.equal(engine.setStep('survey'), true);
    assert.equal(engine.currentStep, 'survey');
});

test('TriageEngine - survey, prioritize, optimize filtering logic', () => {
    const engine = new TriageEngine([
        { id: 't1', title: 'Critical Auth Down', severity: 'sev-1' },
        { id: 't2', title: 'Payment 504 Timeout', severity: 'sev-1' },
        { id: 't3', title: 'Nightly Backup Delay', severity: 'sev-3' }
    ]);

    // Step 1: Survey
    engine.setSurveyGroup('t1', 'primary');
    engine.setSurveyGroup('t2', 'primary');
    engine.setSurveyGroup('t3', 'secondary');

    assert.equal(engine.getPrimaryTasks().length, 2);
    assert.equal(engine.getSecondaryTasks().length, 1);
    assert.equal(engine.getTask('t3').actionStatus, 'deferred');

    // Step 2: Prioritize
    engine.setUrgencyGroup('t1', 'high_urgency');
    engine.setUrgencyGroup('t2', 'lower_urgency');

    assert.equal(engine.getHighUrgencyTasks().length, 1);
    assert.equal(engine.getHighUrgencyTasks()[0].id, 't1');

    // Step 3: Optimize
    engine.setImpactGroup('t1', 'high_impact');
    assert.equal(engine.getHighImpactTasks().length, 1);
    assert.equal(engine.getTask('t1').actionStatus, 'action_now');

    // Step 4: Action plan generation
    const md = engine.generateActionPlan();
    assert.ok(md.includes('SPOT Incident Action Plan'));
    assert.ok(md.includes('Critical Auth Down'));
    assert.ok(md.includes('Nightly Backup Delay'));
});

test('TriageEngine - observer notification triggers on updates', () => {
    const engine = new TriageEngine();
    let notifyCount = 0;
    let lastStep = '';

    const unsubscribe = engine.subscribe((state) => {
        notifyCount++;
        lastStep = state.currentStep;
    });

    engine.addTask({ title: 'Alert 1' });
    engine.setStep('prioritize');

    assert.equal(notifyCount, 2);
    assert.equal(lastStep, 'prioritize');

    unsubscribe();
    engine.setStep('optimize');
    // Notification count should not change after unsubscribe
    assert.equal(notifyCount, 2);
});
