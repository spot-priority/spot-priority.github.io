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
        // Bind static navigation buttons
        const prevStepBtn = document.getElementById('prevStep');
        const nextStepBtn = document.getElementById('nextStep');
        if (prevStepBtn) {
            prevStepBtn.addEventListener('click', () => {
                const steps = ['survey', 'prioritize', 'optimize', 'action'];
                const currentIndex = steps.indexOf(this.app.currentStep);
                if (currentIndex > 0) {
                    this.app.currentStep = steps[currentIndex - 1];
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        }
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', () => {
                const steps = ['survey', 'prioritize', 'optimize', 'action'];
                const currentIndex = steps.indexOf(this.app.currentStep);
                if (currentIndex < steps.length - 1) {
                    this.app.currentStep = steps[currentIndex + 1];
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        }
        // Step navigation
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.getAttribute('data-step');
                if (step) {
                    this.app.currentStep = step;
                    this.ui.renderCurrentStep(step);
                }
            });
        });
        // Bind static control buttons
        const toggleFullControl = document.getElementById('toggleFullControl');
        if (toggleFullControl) {
            toggleFullControl.addEventListener('click', () => {
                const fullControl = document.querySelector('.full-control-view');
                const contentArea = document.querySelector('.content-area');
                if (fullControl && contentArea) {
                    const isVisible = fullControl.style.display === 'block';
                    fullControl.style.display = isVisible ? 'none' : 'block';
                    contentArea.style.display = isVisible ? 'block' : 'none';
                }
            });
        }
        const importTasks = document.getElementById('importTasks');
        if (importTasks) {
            importTasks.addEventListener('click', () => {
                document.getElementById('importModal').style.display = 'block';
            });
        }
        const exportTasks = document.getElementById('exportTasks');
        if (exportTasks) {
            exportTasks.addEventListener('click', () => {
                const data = this.taskManager.exportTasks();
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
        const clearTasks = document.getElementById('clearTasks');
        if (clearTasks) {
            clearTasks.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all tasks?')) {
                    this.taskManager.clearAllTasks();
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        }
        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        // Add-task forms
        document.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.add-task-input');
                let name = input.value.trim();
                if (name.length > 64) name = name.slice(0, 64);
                if (name) {
                    const survey = form.getAttribute('data-survey');
                    this.taskManager.addTask({ name, survey, optimize: 'more', demo: false });
                    input.value = '';
                    this.ui.renderSurveyStep();
                }
            });
        });
        // Main task modal form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let title = document.getElementById('taskTitle').value;
                if (title.length > 64) title = title.slice(0, 64);
                const description = document.getElementById('taskDescription').value;
                const priority = document.getElementById('taskPriority').value;
                if (title) {
                    this.taskManager.addTask({ name: title, description, priority, group: this.app.currentStep, relatedTasks: [] });
                    this.ui.renderCurrentStep(this.app.currentStep);
                    document.getElementById('taskModal').style.display = 'none';
                    taskForm.reset();
                }
            });
        }
        // Import form
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
        // Drag and drop: always re-initialize after render
        document.querySelectorAll('.task-list').forEach(list => {
            this.dragDrop.initializeDragAndDrop(list);
        });
        // Subscribe to task changes for warning updates
        this.taskManager.subscribe(() => {
            // Example: this.ui.renderStepWarnings();
        });
    }
    // ...other event binding helpers
}
