import { TaskManager } from './priority-tool-tasks.js';
import { DragDropManager } from './priority-tool-drag.js';

export class SPOTApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.dragDropManager = new DragDropManager(this.taskManager);
        this.currentStep = 'survey';
        window.spotApp = this; // for drag-drop callback
        this.initializeEventListeners();
        this.renderSurveyStep();
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('prevStep').addEventListener('click', () => {
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.currentStep);
            if (currentIndex > 0) {
                this.navigateToStep(steps[currentIndex - 1]);
            }
        });

        document.getElementById('nextStep').addEventListener('click', () => {
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.currentStep);
            if (currentIndex < steps.length - 1) {
                this.navigateToStep(steps[currentIndex + 1]);
            }
        });

        // Control panel buttons
        document.getElementById('toggleFullControl').addEventListener('click', () => this.toggleFullControl());
        document.getElementById('addTask').addEventListener('click', () => this.showAddTaskModal());
        document.getElementById('importTasks').addEventListener('click', () => this.showImportModal());
        document.getElementById('exportTasks').addEventListener('click', () => this.exportTasks());
        document.getElementById('clearTasks').addEventListener('click', () => this.clearAllTasks());

        // Task list drag and drop
        document.querySelectorAll('.task-list').forEach(list => {
            this.dragDropManager.initializeDragAndDrop(list);
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const priority = document.getElementById('taskPriority').value;

            if (title) {
                this.taskManager.addTask({
                    title,
                    description,
                    priority,
                    group: this.currentStep,
                    relatedTasks: []
                });
                this.renderCurrentStep();
                document.getElementById('taskModal').style.display = 'none';
                document.getElementById('taskForm').reset();
            }
        });

        // Import form submission
        document.getElementById('importForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('importFile');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const tasks = JSON.parse(e.target.result);
                        this.taskManager.importTasks(tasks);
                        this.renderCurrentStep();
                        document.getElementById('importModal').style.display = 'none';
                        fileInput.value = '';
                    } catch (error) {
                        alert('Error importing tasks: Invalid JSON file');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Survey step: add task forms for primary and secondary
        document.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.add-task-input');
                const name = input.value.trim();
                if (name) {
                    const survey = form.getAttribute('data-survey');
                    this.taskManager.addTask({
                        name,
                        survey,
                        // priority is not set in this step
                        optimize: 'more',
                        demo: false
                    });
                    input.value = '';
                    this.renderSurveyStep();
                }
            });
        });
    }

    navigateToStep(step) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });

        // Show selected step
        document.getElementById(`${step}-step`).style.display = 'block';

        // Update current step
        this.currentStep = step;

        // Update active state of step buttons
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.step === step) {
                btn.classList.add('active');
            }
        });

        // Update progress meter
        const progressFill = document.querySelector('.progress-fill');
        const steps = ['survey', 'prioritize', 'optimize', 'action'];
        const currentIndex = steps.indexOf(step);
        const progress = (currentIndex / (steps.length - 1)) * 100;
        progressFill.style.width = `${progress}%`;

        // Update navigation buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        prevBtn.disabled = step === 'survey';
        nextBtn.disabled = step === 'action';

        // Render tasks for current step
        if (step === 'survey') {
            this.renderSurveyStep();
        } else {
            this.renderCurrentStep();
        }
    }

    renderCurrentStep() {
        const tasks = this.taskManager.getTasksByGroup(this.currentStep);
        const taskList = document.querySelector(`.task-list[data-group="${this.currentStep}"]`);
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks in this step yet.</div>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    renderSurveyStep() {
        // Render tasks for primary and secondary groups
        ['primary', 'secondary'].forEach(survey => {
            const list = document.querySelector(`.task-list[data-survey="${survey}"]`);
            if (!list) return;
            list.innerHTML = '';
            const tasks = this.taskManager.getTasksBySurvey(survey);
            if (tasks.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
                return;
            }
            tasks.forEach((task, idx) => {
                const el = this.createSurveyTaskElement(task, idx);
                list.appendChild(el);
            });
        });
        // Initialize drag and drop for survey step
        this.dragDropManager.initializeSurveyDragAndDrop();
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority}`;
        div.draggable = true;
        div.dataset.taskId = task.id;

        div.innerHTML = `
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task));
        div.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task));

        return div;
    }

    createSurveyTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    toggleFullControl() {
        const fullControl = document.querySelector('.full-control');
        const isVisible = fullControl.style.display !== 'none';
        fullControl.style.display = isVisible ? 'none' : 'block';
    }

    showAddTaskModal() {
        document.getElementById('modalTitle').textContent = 'Add New Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskModal').style.display = 'block';
    }

    showImportModal() {
        document.getElementById('importForm').reset();
        document.getElementById('importModal').style.display = 'block';
    }

    editTask(task) {
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskModal').style.display = 'block';
    }

    deleteTask(task) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskManager.deleteTask(task.id);
            this.renderCurrentStep();
        }
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            this.taskManager.clearAllTasks();
            this.renderCurrentStep();
        }
    }

    exportTasks() {
        const tasks = this.taskManager.getAllTasks();
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spot-tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}