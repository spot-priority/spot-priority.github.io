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
        // Navigation buttons
        document.getElementById('prevStep').addEventListener('click', () => {
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.app.currentStep);
            if (currentIndex > 0) {
                this.app.currentStep = steps[currentIndex - 1];
                this.ui.renderCurrentStep(this.app.currentStep);
            }
        });
        document.getElementById('nextStep').addEventListener('click', () => {
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
                    this.taskManager.addTask({
                        name,
                        survey,
                        optimize: 'more',
                        demo: false
                    });
                    input.value = '';
                    this.ui.renderSurveyStep();
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
                            this.taskManager.importTasks(tasks);
                            this.ui.renderCurrentStep(this.app.currentStep);
                            document.getElementById('importModal').style.display = 'none';
                            fileInput.value = '';
                        } catch (error) {
                            alert('Error importing tasks: Invalid JSON file');
                        }
                    };
                    reader.readAsText(file);
                }
            });
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
                    this.taskManager.addTask({
                        title,
                        description,
                        priority,
                        group: this.app.currentStep,
                        relatedTasks: []
                    });
                    this.ui.renderCurrentStep(this.app.currentStep);
                    document.getElementById('taskModal').style.display = 'none';
                    taskForm.reset();
                }
            });
        }
        // Export tasks button
        const exportBtn = document.getElementById('exportTasks');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.taskManager.exportTasks();
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
        }
        // Clear all tasks button
        const clearBtn = document.getElementById('clearTasks');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all tasks?')) {
                    this.taskManager.clearAllTasks();
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        }
        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        // Subscribe to task changes for warning updates
        this.taskManager.subscribe(() => {
            // If you have a warning rendering method, call it here
            // Example: this.ui.renderStepWarnings();
        });
        // Task list drag and drop
        document.querySelectorAll('.task-list').forEach(list => {
            this.dragDrop.initializeDragAndDrop(list);
        });
        // TODO: Add more event bindings for forms, import/export, etc.
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
