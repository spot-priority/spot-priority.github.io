// EventBinder.js
// Handles all event binding and unbinding for the SPOT Prioritization Tool

/**
 * EventBinder class
 * Handles all event binding for the SPOT Prioritization Tool.
 * Follows SOLID principles: single responsibility (only event binding),
 * and is decoupled from business logic and rendering.
 */
export class EventBinder {
    /**
     * @param {object} app - The main app controller (SPOTApp instance)
     * @param {object} ui - The UI renderer (UIRenderer instance)
     * @param {object} taskManager - The task manager (TaskManager instance)
     * @param {object} dragDrop - The drag-and-drop manager (DragDropManager instance)
     */
    constructor(app, ui, taskManager, dragDrop) {
        this.app = app;
        this.ui = ui;
        this.taskManager = taskManager;
        this.dragDrop = dragDrop;
    }

    /**
     * Bind all necessary event listeners for the app.
     * Should be called after every render that changes interactive elements.
     * This method is idempotent: duplicate listeners are avoided by design.
     */
    bindAll() {
        // --- Navigation Buttons ---
        // Remove previous listeners by replacing the element (simple, robust for classic JS)
        const steps = ['survey', 'prioritize', 'optimize', 'action'];
        const prevStepBtn = document.getElementById('prevStep');
        if (prevStepBtn) {
            const newPrev = prevStepBtn.cloneNode(true);
            prevStepBtn.parentNode.replaceChild(newPrev, prevStepBtn);
            const isFirst = this.app.currentStep === steps[0];
            if (isFirst) {
                newPrev.classList.add('disabled');
                newPrev.setAttribute('aria-disabled', 'true');
                newPrev.tabIndex = -1;
                newPrev.style.pointerEvents = 'none';
                newPrev.style.opacity = '0.5';
            } else {
                newPrev.classList.remove('disabled');
                newPrev.removeAttribute('aria-disabled');
                newPrev.tabIndex = 0;
                newPrev.style.pointerEvents = '';
                newPrev.style.opacity = '';
                newPrev.addEventListener('click', () => {
                    const currentIndex = steps.indexOf(this.app.currentStep);
                    if (currentIndex > 0) {
                        this.app.currentStep = steps[currentIndex - 1];
                        this.ui.renderCurrentStep(this.app.currentStep);
                    }
                });
            }
        }
        const nextStepBtn = document.getElementById('nextStep');
        if (nextStepBtn) {
            const newNext = nextStepBtn.cloneNode(true);
            nextStepBtn.parentNode.replaceChild(newNext, nextStepBtn);
            const isLast = this.app.currentStep === steps[steps.length - 1];
            if (isLast) {
                newNext.classList.add('disabled');
                newNext.setAttribute('aria-disabled', 'true');
                newNext.tabIndex = -1;
                newNext.style.pointerEvents = 'none';
                newNext.style.opacity = '0.5';
            } else {
                newNext.classList.remove('disabled');
                newNext.removeAttribute('aria-disabled');
                newNext.tabIndex = 0;
                newNext.style.pointerEvents = '';
                newNext.style.opacity = '';
                newNext.addEventListener('click', () => {
                    const currentIndex = steps.indexOf(this.app.currentStep);
                    if (currentIndex < steps.length - 1) {
                        this.app.currentStep = steps[currentIndex + 1];
                        this.ui.renderCurrentStep(this.app.currentStep);
                    }
                });
            }
        }
        // --- Step Navigation (Progress Bar) ---
        /**
         * Step selector buttons: allow direct navigation to a step.
         */
        document.querySelectorAll('.step-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                const step = newBtn.getAttribute('data-step');
                if (step) {
                    this.app.currentStep = step;
                    this.ui.renderCurrentStep(step);
                }
            });
        });
        // --- Control Buttons ---
        /**
         * Toggle full control view.
         */
        const toggleFullControl = document.getElementById('toggleFullControl');
        if (toggleFullControl) {
            toggleFullControl.addEventListener('click', () => {
                const fullControl = document.querySelector('.full-control-view');
                const isVisible = fullControl && fullControl.style.display === 'block';
                if (isVisible) {
                    this.ui.hideFullControlView(this.app.currentStep);
                } else {
                    this.ui.showFullControlView();
                }
            });
        }
        /**
         * Show import modal.
         */
        const importTasks = document.getElementById('importTasks');
        if (importTasks) {
            importTasks.addEventListener('click', () => {
                document.getElementById('importModal').style.display = 'block';
            });
        }
        /**
         * Export tasks as JSON file.
         */
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
        /**
         * Clear all tasks after confirmation.
         */
        const clearTasks = document.getElementById('clearTasks');
        if (clearTasks) {
            clearTasks.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all tasks?')) {
                    this.taskManager.clearAllTasks();
                    this.ui.renderCurrentStep(this.app.currentStep);
                }
            });
        }
        // --- Modal Close Buttons ---
        /**
         * Close modals when clicking the close button.
         */
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        // --- Add Task Forms ---
        /**
         * Handle submission of add-task forms for survey steps.
         */
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
        // --- Main Task Modal Form ---
        /**
         * Handle submission of the main task modal form.
         */
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
        // --- Import Form ---
        /**
         * Handle submission of the import form for importing tasks from JSON.
         * Reads the file, parses JSON, and updates the task list.
         */
        const importForm = document.getElementById('importForm');
        if (importForm) {
            importForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Get the file input element and the selected file
                const fileInput = document.getElementById('importFile');
                const file = fileInput.files[0];
                if (file) {
                    // Use FileReader to read the file as text
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            // Parse the file contents as JSON
                            const tasks = JSON.parse(e.target.result);
                            // Import tasks into the TaskManager
                            this.taskManager.importTasks(tasks);
                            // Re-render the current step to reflect imported tasks
                            this.ui.renderCurrentStep(this.app.currentStep);
                            // Hide the import modal and reset the file input
                            document.getElementById('importModal').style.display = 'none';
                            fileInput.value = '';
                        } catch (error) {
                            // Show an alert if the file is not valid JSON
                            alert('Error importing tasks: Invalid JSON file');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
        // --- Drag and Drop ---
        /**
         * Initialize drag-and-drop for all task lists after every render.
         */
        document.querySelectorAll('.task-list').forEach(list => {
            this.dragDrop.initializeDragAndDrop(list);
        });
        // --- TaskManager Observer ---
        /**
         * Subscribe to task changes for warning updates or reactivity.
         */
        this.taskManager.subscribe(() => {
            // Example: this.ui.renderStepWarnings();
        });
        // --- Action Step Task Buttons (Delete/Done) ---
        if (this.app.currentStep === 'action') {
            document.querySelectorAll('.task-list .task-item').forEach(item => {
                const taskId = item.dataset.taskId;
                const doneBtn = item.querySelector('.done-btn');
                const deleteBtn = item.querySelector('.delete-btn');
                if (doneBtn) {
                    doneBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.taskManager.moveTaskToStatusAndReorder(taskId, 'done', 0);
                        this.ui.renderCurrentStep(this.app.currentStep);
                    });
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.taskManager.deleteTask(taskId);
                        this.ui.renderCurrentStep(this.app.currentStep);
                    });
                }
            });
        }
    }
    // ...other event binding helpers
}
