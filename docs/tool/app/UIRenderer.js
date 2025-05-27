// UIRenderer.js
// Handles all DOM rendering and updates for the SPOT Prioritization Tool

/**
 * Handles all DOM rendering and updates.
 * Should not contain business logic or event binding.
 */
export class UIRenderer {
    constructor(taskManager) {
        this.taskManager = taskManager;
    }
    /**
     * Render the initial view of the app (first step, progress bar, etc.).
     */
    renderInitialView() {
        this.renderCurrentStep('survey');
        // TODO: Render progress bar, navigation, and any static UI elements
    }
    /**
     * Render a task list for a given set of tasks and options.
     * @param {Array} tasks - Array of task objects
     * @param {Object} options - Rendering options (view mode, group, etc.)
     */
    renderTaskList(tasks, options) {
        // TODO: Implement rendering of a task list
    }

    /**
     * Render the Prioritize step: shows tasks with survey 'primary', split by priority.
     */
    renderPrioritizeStep() {
        // Only show tasks with survey: 'primary' and not done
        const tasks = this.taskManager.getAllTasks().filter(t => t.survey === 'primary' && t.status !== 'done');
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
    }

    /**
     * Create a DOM element for a prioritized task.
     * @param {Object} task
     * @param {number} idx
     * @returns {HTMLElement}
     */
    createPriorityTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    /**
     * Render the Optimize step: shows tasks with priority 'higher', split by optimize value.
     */
    renderOptimizeStep() {
        // Only show tasks with priority: 'higher' and not done
        const tasks = this.taskManager.getAllTasks().filter(t => t.priority === 'higher' && t.status !== 'done');
        // Split by optimize value
        const more = tasks.filter(t => t.optimize === 'more');
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
    }

    /**
     * Create a DOM element for an optimize task.
     * @param {Object} task
     * @param {number} idx
     * @returns {HTMLElement}
     */
    createOptimizeTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    /**
     * Render the Survey step: shows tasks grouped by survey type.
     */
    renderSurveyStep() {
        const primaryTasks = this.taskManager.getAllTasks().filter(t => t.survey === 'primary' && t.status !== 'done');
        const secondaryTasks = this.taskManager.getAllTasks().filter(t => t.survey === 'secondary' && t.status !== 'done');
        // Render primary
        const primaryList = document.querySelector('.task-list[data-survey="primary"]');
        primaryList.innerHTML = '';
        if (primaryTasks.length === 0) {
            primaryList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            primaryTasks.forEach((task, idx) => {
                const el = this.createSurveyTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                primaryList.appendChild(el);
            });
        }
        // Render secondary
        const secondaryList = document.querySelector('.task-list[data-survey="secondary"]');
        secondaryList.innerHTML = '';
        if (secondaryTasks.length === 0) {
            secondaryList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            secondaryTasks.forEach((task, idx) => {
                const el = this.createSurveyTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                secondaryList.appendChild(el);
            });
        }
    }

    /**
     * Create a DOM element for a survey task.
     * @param {Object} task
     * @param {number} idx
     * @returns {HTMLElement}
     */
    createSurveyTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    /**
     * Render the Action step: shows all tasks, grouped by status.
     */
    renderActionStep() {
        const tasks = this.taskManager.getAllTasks();
        // Example: group by status
        const statuses = ['pending', 'in-progress', 'blocked', 'completed'];
        statuses.forEach(status => {
            const list = document.querySelector(`.task-list[data-status="${status}"]`);
            if (!list) return;
            const group = tasks.filter(t => t.status === status);
            list.innerHTML = '';
            if (group.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
            } else {
                group.forEach((task, idx) => {
                    const el = this.createActionTaskElement(task, idx);
                    if (task.status === 'blocked') el.classList.add('blocked');
                    list.appendChild(el);
                });
            }
        });
    }

    /**
     * Create a DOM element for an action task.
     * @param {Object} task
     * @param {number} idx
     * @returns {HTMLElement}
     */
    createActionTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    /**
     * Render the current step based on the provided step name.
     * @param {string} step
     */
    renderCurrentStep(step) {
        if (step === 'survey') {
            this.renderSurveyStep();
        } else if (step === 'prioritize') {
            this.renderPrioritizeStep();
        } else if (step === 'optimize') {
            this.renderOptimizeStep();
        } else if (step === 'action') {
            this.renderActionStep();
        }
    }

    // ...other rendering methods for action, etc. to be migrated similarly...
}
