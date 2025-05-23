import { TaskManager } from './priority-tool-tasks.js';
import { DragDropManager } from './priority-tool-drag.js';

export class SPOTApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.taskManager.migrateTasks();
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

        // Step selector (progress bar) navigation
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.getAttribute('data-step');
                if (step) {
                    this.navigateToStep(step);
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
        document.getElementById(step).style.display = 'block';
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
        prevBtn.disabled = (step === steps[0]);
        nextBtn.disabled = (step === steps[steps.length - 1]);
        prevBtn.classList.toggle('disabled', prevBtn.disabled);
        nextBtn.classList.toggle('disabled', nextBtn.disabled);
        // Render for current step
        if (step === 'survey') {
            this.renderSurveyStep();
        } else if (step === 'prioritize') {
            this.renderPrioritizeStep();
        } else if (step === 'optimize') {
            this.renderOptimizeStep();
        } else if (step === 'action') {
            this.renderActionStep();
        } else {
            this.renderCurrentStep();
        }
    }

    // Utility: filter out done tasks for all steps except Take Action
    getVisibleTasksForStep(step) {
        const all = this.taskManager.getAllTasks();
        if (step === 'action') return all;
        return all.filter(t => t.status !== 'done');
    }

    // Utility: filter out blocked/done for warning logic
    getActiveTasksForGroup(filterFn) {
        return this.taskManager.getAllTasks().filter(t => filterFn(t) && t.status !== 'done' && t.status !== 'blocked');
    }

    renderPrioritizeStep() {
        // Only show tasks with survey: 'primary' and not done
        const tasks = this.getVisibleTasksForStep('prioritize').filter(t => t.survey === 'primary');
        // Set default priority to 'higher' if not set
        tasks.forEach(task => {
            if (!task.priority) {
                task.priority = 'higher';
            }
        });
        this.taskManager.saveTasks();
        // Split by priority
        const higher = tasks.filter(t => t.priority !== 'lower');
        const lower = tasks.filter(t => t.priority === 'lower');
        // Render higher
        const higherList = document.querySelector('.task-list[data-priority="higher"]');
        higherList.innerHTML = '';
        if (higher.length === 0) {
            higherList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            higher.forEach((task, idx) => {
                const el = this.createPriorityTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                higherList.appendChild(el);
            });
        }
        // Render lower
        const lowerList = document.querySelector('.task-list[data-priority="lower"]');
        lowerList.innerHTML = '';
        if (lower.length === 0) {
            lowerList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            lower.forEach((task, idx) => {
                const el = this.createPriorityTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                lowerList.appendChild(el);
            });
        }
        // Initialize drag and drop for prioritize step
        this.dragDropManager.initializePrioritizeDragAndDrop();
        // Show warning if no active primary tasks
        const showWarning = this.getActiveTasksForGroup(t => t.survey === 'primary').length === 0;
        this.setStepWarning('prioritize', showWarning);
    }

    createPriorityTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    renderOptimizeStep() {
        // Only show tasks with priority: 'higher' and not done
        const tasks = this.getVisibleTasksForStep('optimize').filter(t => t.priority === 'higher');
        // Set default optimize to 'more' if not set
        tasks.forEach(task => {
            if (!task.optimize) {
                task.optimize = 'more';
            }
        });
        this.taskManager.saveTasks();
        // Split by optimize
        const more = tasks.filter(t => t.optimize !== 'less');
        const less = tasks.filter(t => t.optimize === 'less');
        // Render more
        const moreList = document.querySelector('.task-list[data-optimize="more"]');
        moreList.innerHTML = '';
        if (more.length === 0) {
            moreList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            more.forEach((task, idx) => {
                const el = this.createOptimizeTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                moreList.appendChild(el);
            });
        }
        // Render less
        const lessList = document.querySelector('.task-list[data-optimize="less"]');
        lessList.innerHTML = '';
        if (less.length === 0) {
            lessList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            less.forEach((task, idx) => {
                const el = this.createOptimizeTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                lessList.appendChild(el);
            });
        }
        // Initialize drag and drop for optimize step
        this.dragDropManager.initializeOptimizeDragAndDrop();
        // Show warning if no active high-priority tasks
        const showWarning = this.getActiveTasksForGroup(t => t.priority === 'higher').length === 0;
        this.setStepWarning('optimize', showWarning);
    }

    createOptimizeTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
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
            const tasks = this.getVisibleTasksForStep('survey').filter(t => t.survey === survey);
            if (tasks.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
                return;
            }
            tasks.forEach((task, idx) => {
                const el = this.createSurveyTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                list.appendChild(el);
            });
        });
        // Initialize drag and drop for survey step
        this.dragDropManager.initializeSurveyDragAndDrop();
        // Show warning if no active primary tasks
        const showWarning = this.getActiveTasksForGroup(t => t.survey === 'primary').length === 0;
        this.setStepWarning('survey', showWarning);
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

    renderActionStep() {
        // Get tasks for the highest available group (primary/high/more, then primary/high/less, etc.), not done/blocked
        const candidates = [
            t => t.survey === 'primary' && t.priority === 'higher' && t.optimize === 'more' && t.status !== 'done' && t.status !== 'blocked',
            t => t.survey === 'primary' && t.priority === 'higher' && t.optimize === 'less' && t.status !== 'done' && t.status !== 'blocked',
            t => t.survey === 'primary' && t.priority === 'lower' && t.optimize === 'more' && t.status !== 'done' && t.status !== 'blocked',
            t => t.survey === 'primary' && t.priority === 'lower' && t.optimize === 'less' && t.status !== 'done' && t.status !== 'blocked'
        ];
        let tasks = [];
        for (const filter of candidates) {
            tasks = this.taskManager.getAllTasks().filter(filter);
            if (tasks.length > 0) break;
        }
        // Show warning if no active tasks in any group
        const showWarning = tasks.length === 0;
        // Split by status
        const todo = tasks.filter(t => t.status === 'todo');
        const doing = tasks.filter(t => t.status === 'doing');
        const blocked = tasks.filter(t => t.status === 'blocked');
        // Done tasks (from all, not just current group)
        const done = this.taskManager.getAllTasks().filter(t => t.status === 'done');
        // Render each group
        const renderGroup = (status, arr) => {
            const list = document.querySelector(`.task-list[data-status="${status}"]`);
            list.innerHTML = '';
            if (arr.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
            } else {
                arr.forEach((task, idx) => {
                    const el = this.createActionTaskElement(task, idx, status);
                    if (task.status === 'blocked') el.classList.add('blocked');
                    list.appendChild(el);
                });
            }
        };
        renderGroup('todo', todo);
        renderGroup('doing', doing);
        renderGroup('blocked', blocked);
        renderGroup('done', done);
        this.setStepWarning('action', showWarning);
        this.dragDropManager.initializeActionDragAndDrop();
    }

    createActionTaskElement(task, idx, status) {
        const div = document.createElement('div');
        div.className = 'task-item' + (task.status === 'blocked' ? ' blocked' : '');
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        // Add checkmark for done, undo, delete
        if (status !== 'done') {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'done-btn';
            doneBtn.title = 'Mark as done';
            doneBtn.innerHTML = '✔️';
            doneBtn.onclick = () => {
                this.taskManager.updateTask(task.id, { status: 'done' });
                this.renderActionStep();
            };
            div.appendChild(doneBtn);
        } else {
            const undoBtn = document.createElement('button');
            undoBtn.className = 'undo-btn';
            undoBtn.title = 'Undo done';
            undoBtn.innerHTML = '↩️';
            undoBtn.onclick = () => {
                this.taskManager.updateTask(task.id, { status: 'todo' });
                this.renderActionStep();
            };
            div.appendChild(undoBtn);
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.title = 'Delete task';
            delBtn.innerHTML = '🗑️';
            delBtn.onclick = () => {
                this.taskManager.deleteTask(task.id);
                this.renderActionStep();
            };
            div.appendChild(delBtn);
        }
        return div;
    }

    setActionWarning(show) {
        // Show/hide warning indicator for action step (implement as needed)
        // ...
    }

    // --- Step Warning Indicator ---
    setStepWarning(step, show) {
        // Show/hide warning indicator for the given step
        let bar = document.querySelector('.step-selector');
        if (!bar) return;
        let warn = bar.querySelector('.step-warning[data-step="' + step + '"]');
        if (!warn && show) {
            warn = document.createElement('span');
            warn.className = 'step-warning';
            warn.setAttribute('data-step', step);
            warn.title = 'No actionable tasks in this step. Please review previous steps.';
            warn.innerHTML = '⚠️';
            let btn = bar.querySelector('.step-btn[data-step="' + step + '"]');
            if (btn) btn.appendChild(warn);
        } else if (warn && !show) {
            warn.remove();
        }
    }
}