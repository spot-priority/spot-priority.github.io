// UIRenderer.js
// Handles all DOM rendering and updates for the SPOT Prioritization Tool

/**
 * UIRenderer class
 * Handles all DOM rendering and updates for the SPOT Prioritization Tool.
 * Follows SOLID principles: single responsibility (only rendering),
 * and is decoupled from business logic and event binding.
 */
export class UIRenderer {
    /**
     * @param {object} taskManager - The task manager (TaskManager instance)
     */
    constructor(taskManager) {
        this.taskManager = taskManager;
    }
    /**
     * Render the initial view of the app (first step, progress bar, etc.).
     * Only runs after DOM is ready.
     */
    renderInitialView() {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderInitialView());
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering initial view');
            this.renderCurrentStep('survey');
        } catch (e) {
            console.error('[UIRenderer] Error in renderInitialView:', e);
        }
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
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderPrioritizeStep());
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering prioritize step');
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
        } catch (e) {
            console.error('[UIRenderer] Error in renderPrioritizeStep:', e);
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
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderOptimizeStep());
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering optimize step');
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
        } catch (e) {
            console.error('[UIRenderer] Error in renderOptimizeStep:', e);
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
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderSurveyStep());
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering survey step');
            const primaryList = document.querySelector('.task-list[data-survey="primary"]');
            const secondaryList = document.querySelector('.task-list[data-survey="secondary"]');
            if (!primaryList || !secondaryList) {
                console.warn('[UIRenderer] Survey task lists not found');
                return;
            }
            const primaryTasks = this.taskManager.getAllTasks().filter(t => t.survey === 'primary' && t.status !== 'done');
            const secondaryTasks = this.taskManager.getAllTasks().filter(t => t.survey === 'secondary' && t.status !== 'done');
            // Render primary
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
        } catch (e) {
            console.error('[UIRenderer] Error in renderSurveyStep:', e);
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
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderActionStep());
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering action step');
            const tasks = this.taskManager.getAllTasks();
            // Example: group by status
            const statuses = ['todo', 'doing', 'blocked', 'done'];
            statuses.forEach(status => {
                const list = document.querySelector(`.task-list[data-status="${status}"]`);
                if (!list) {
                    console.warn(`[UIRenderer] Action task list for status ${status} not found`);
                    return;
                }
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
        } catch (e) {
            console.error('[UIRenderer] Error in renderActionStep:', e);
        }
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
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.renderCurrentStep(step));
            return;
        }
        try {
            console.debug('[UIRenderer] Rendering current step:', step);
            if (step === 'survey') {
                this.renderSurveyStep();
            } else if (step === 'prioritize') {
                this.renderPrioritizeStep();
            } else if (step === 'optimize') {
                this.renderOptimizeStep();
            } else if (step === 'action') {
                this.renderActionStep();
            }
            // --- Ensure all event listeners are rebound after render ---
            if (window.spotApp && window.spotApp.events && typeof window.spotApp.events.bindAll === 'function') {
                window.spotApp.events.bindAll();
            }
        } catch (e) {
            console.error('[UIRenderer] Error in renderCurrentStep:', e);
        }
    }

    // ...other rendering methods for action, etc. to be migrated similarly...
}
