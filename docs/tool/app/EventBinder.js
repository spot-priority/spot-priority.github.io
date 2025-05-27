// EventBinder.js
// Handles all event binding and unbinding for the SPOT Prioritization Tool

/**
 * Handles all event binding and unbinding.
 * Should not contain business logic or rendering logic.
 */
export class EventBinder {
    constructor(app, ui, taskManager, dragDrop) {
        this.app = app;
        this.ui = ui;
        this.taskManager = taskManager;
        this.dragDrop = dragDrop;
    }
    /**
     * Bind all necessary event listeners for the app.
     * Should be called once on app startup.
     */
    bindAll() {
        console.debug('[EventBinder] Binding all event listeners...');
        // Navigation buttons
        const prevStepBtn = document.getElementById('prevStep');
        const nextStepBtn = document.getElementById('nextStep');
        if (!prevStepBtn || !nextStepBtn) {
            console.error('[EventBinder] Navigation buttons not found in DOM');
        }
        prevStepBtn?.addEventListener('click', () => {
            console.debug('[EventBinder] prevStep clicked');
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.app.currentStep);
            if (currentIndex > 0) {
                this.app.currentStep = steps[currentIndex - 1];
                this.ui.renderCurrentStep(this.app.currentStep);
            }
        });
        nextStepBtn?.addEventListener('click', () => {
            console.debug('[EventBinder] nextStep clicked');
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.app.currentStep);
            if (currentIndex < steps.length - 1) {
                this.app.currentStep = steps[currentIndex + 1];
                this.ui.renderCurrentStep(this.app.currentStep);
            }
        });
        // Step selector (progress bar) navigation
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.getAttribute('data-step');
                console.debug('[EventBinder] step-btn clicked', step);
                if (step) {
                    this.app.currentStep = step;
                    this.ui.renderCurrentStep(step);
                }
            });
        });
        // Survey step: add task forms for primary and secondary
        document.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.add-task-input');
                let name = input.value.trim();
                if (name.length > 64) name = name.slice(0, 64);
                if (name) {
                    const survey = form.getAttribute('data-survey');
                    console.debug('[EventBinder] add-task-form submit', { name, survey });
                    this.taskManager.addTask({
                        name,
                        survey,
                        optimize: 'more',
                        demo: false
                    });
                    input.value = '';
                    this.ui.renderSurveyStep();
                } else {
                    console.warn('[EventBinder] Task name is empty');
                }
            });
        });
        // Import form submission
        const importForm = document.getElementById('importForm');
        if (importForm) {
            importForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fileInput = document.getElementById('importFile');
                const file = fileInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const tasks = JSON.parse(e.target.result);
                            console.debug('[EventBinder] Importing tasks', tasks);
                            this.taskManager.importTasks(tasks);
                            this.ui.renderCurrentStep(this.app.currentStep);
                            document.getElementById('importModal').style.display = 'none';
                            fileInput.value = '';
                        } catch (error) {
                            alert('Error importing tasks: Invalid JSON file');
                            console.error('[EventBinder] Error importing tasks', error);
                        }
                    };
                    reader.readAsText(file);
                } else {
                    console.warn('[EventBinder] No file selected for import');
                }
            });
        } else {
            console.warn('[EventBinder] Import form not found');
        }
        // Task form submission (main modal)
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let title = document.getElementById('taskTitle').value;
                if (title.length > 64) title = title.slice(0, 64);
                const description = document.getElementById('taskDescription').value;
                const priority = document.getElementById('taskPriority').value;
                if (title) {
                    console.debug('[EventBinder] taskForm submit', { title, description, priority });
                    this.taskManager.addTask({
                        name: title,
                        description,
                        priority,
                        group: this.app.currentStep,
                        relatedTasks: []
                    });
                    this.ui.renderCurrentStep(this.app.currentStep);
                    document.getElementById('taskModal').style.display = 'none';
                    taskForm.reset();
                } else {
                    console.warn('[EventBinder] Task title is empty');
                }
            });
        } else {
            console.warn('[EventBinder] Task form not found');
        }
        // Export tasks button
        const exportBtn = document.getElementById('exportTasks');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.taskManager.exportTasks();
                console.debug('[EventBinder] Exporting tasks', data);
                // Download as file
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'spot-tasks.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        } else {
            console.warn('[EventBinder] Export button not found');
        }
        // Clear all tasks button
        const clearBtn = document.getElementById('clearTasks');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all tasks?')) {
                    console.debug('[EventBinder] Clearing all tasks');
                    this.taskManager.clearAllTasks();
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        } else {
            console.warn('[EventBinder] Clear button not found');
        }
        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    console.debug('[EventBinder] Modal closed');
                }
            });
        });
        // Task list drag and drop
        document.querySelectorAll('.task-list').forEach(list => {
            if (list) {
                this.dragDrop.initializeDragAndDrop(list);
                console.debug('[EventBinder] Initialized drag-and-drop for', list);
            } else {
                console.warn('[EventBinder] Task list not found for drag-and-drop');
            }
        });
        // Subscribe to task changes for warning updates
        this.taskManager.subscribe(() => {
            // If you have a warning rendering method, call it here
            // Example: this.ui.renderStepWarnings();
            console.debug('[EventBinder] TaskManager observer triggered');
        });
    }
    /**
     * Unbind all event listeners (for cleanup or re-binding).
     * NOTE: Implement as needed for dynamic re-binding or SPA navigation.
     */
    unbindAll() {
        // TODO: Implement event unbinding logic if needed
    }
    // ...other event binding helpers
}
