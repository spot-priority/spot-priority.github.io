// TaskManager.js
// Handles all task CRUD, filtering, and persistence for the SPOT Prioritization Tool

/**
 * Handles all task CRUD, filtering, and persistence.
 * Exposes a clean API for task operations.
 */
export class TaskManager {
    /**
     * Initializes the TaskManager, loads tasks from storage, and migrates as needed.
     */
    constructor() {
        try {
            /** @type {Array<Object>} */
            this.tasks = [];
            /** @type {Array<Function>} */
            this.observers = [];
            this.loadTasks();
            this.migrateTasks();
        } catch (e) {
            console.error('[TaskManager] Error in constructor:', e);
        }
    }

    // =====================
    // Task Operations
    // =====================

    /**
     * Add a new task.
     * @param {Object} task - Task object
     * @returns {Object} The newly added task
     */
    addTask(task) {
        try {
            const newTask = {
                id: this.generateId(),
                name: task.name,
                survey: task.survey,
                priority: task.priority,
                optimize: task.optimize || 'more',
                demo: !!task.demo,
                status: task.status || 'todo'
            };
            this.tasks.push(newTask);
            this.notifyObservers();
            this.saveTasks();
            return newTask;
        } catch (e) {
            console.error('[TaskManager] Error in addTask:', e);
        }
    }

    /**
     * Update an existing task by ID.
     * @param {string} id - Task ID
     * @param {Object} updates - Properties to update
     * @returns {Object|null} The updated task or null if not found
     */
    updateTask(id, updates) {
        try {
            const index = this.tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                this.tasks[index] = {
                    ...this.tasks[index],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                this.notifyObservers();
                this.saveTasks();
                return this.tasks[index];
            }
            return null;
        } catch (e) {
            console.error('[TaskManager] Error in updateTask:', e);
        }
    }

    /**
     * Delete a task by ID.
     * @param {string} id - Task ID
     * @returns {boolean} True if deleted, false if not found
     */
    deleteTask(id) {
        try {
            const index = this.tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                this.tasks.splice(index, 1);
                this.notifyObservers();
                this.saveTasks();
                return true;
            }
            return false;
        } catch (e) {
            console.error('[TaskManager] Error in deleteTask:', e);
        }
    }

    // =====================
    // Task Move/Reorder Operations
    // =====================

    /**
     * Move a task to a new group.
     * @param {string} id - Task ID
     * @param {string} newGroup - New group name
     * @returns {boolean} True if moved, false if not found
     */
    moveTask(id, newGroup) {
        try {
            const task = this.tasks.find(task => task.id === id);
            if (task) {
                task.group = newGroup;
                task.updatedAt = new Date().toISOString();
                this.notifyObservers();
                this.saveTasks();
                return true;
            }
            return false;
        } catch (e) {
            console.error('[TaskManager] Error in moveTask:', e);
        }
    }

    /**
     * Move a task to a new survey and reorder within that group.
     * @param {string} taskId
     * @param {string} newSurvey
     * @param {number} newIndex
     */
    moveTaskToSurveyAndReorder(taskId, newSurvey, newIndex) {
        try {
            const idx = this.tasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            const [task] = this.tasks.splice(idx, 1);
            task.survey = newSurvey;
            const groupTasks = this.tasks.filter(t => t.survey === newSurvey);
            let insertIdx = this.tasks.findIndex((t, i) => t.survey === newSurvey && groupTasks.indexOf(t) === newIndex);
            if (insertIdx === -1) insertIdx = this.tasks.length;
            this.tasks.splice(insertIdx, 0, task);
            this.notifyObservers();
            this.saveTasks();
        } catch (e) {
            console.error('[TaskManager] Error in moveTaskToSurveyAndReorder:', e);
        }
    }

    /**
     * Move a task to a new priority and reorder within that group (primary survey only).
     * @param {string} taskId
     * @param {string} newPriority
     * @param {number} newIndex
     */
    moveTaskToPriorityAndReorder(taskId, newPriority, newIndex) {
        try {
            const idx = this.tasks.findIndex(t => t.id === taskId && t.survey === 'primary');
            if (idx === -1) return;
            const [task] = this.tasks.splice(idx, 1);
            task.priority = newPriority;
            const groupTasks = this.tasks.filter(t => t.survey === 'primary' && t.priority === newPriority);
            let insertIdx = this.tasks.findIndex((t, i) => t.survey === 'primary' && t.priority === newPriority && groupTasks.indexOf(t) === newIndex);
            if (insertIdx === -1) insertIdx = this.tasks.length;
            this.tasks.splice(insertIdx, 0, task);
            this.notifyObservers();
            this.saveTasks();
        } catch (e) {
            console.error('[TaskManager] Error in moveTaskToPriorityAndReorder:', e);
        }
    }

    /**
     * Move a task to a new optimize value and reorder within that group (higher priority only).
     * @param {string} taskId
     * @param {string} newOptimize
     * @param {number} newIndex
     */
    moveTaskToOptimizeAndReorder(taskId, newOptimize, newIndex) {
        try {
            const idx = this.tasks.findIndex(t => t.id === taskId && t.priority === 'higher');
            if (idx === -1) return;
            const [task] = this.tasks.splice(idx, 1);
            task.optimize = newOptimize;
            const groupTasks = this.tasks.filter(t => t.priority === 'higher' && t.optimize === newOptimize);
            let insertIdx = this.tasks.findIndex((t, i) => t.priority === 'higher' && t.optimize === newOptimize && groupTasks.indexOf(t) === newIndex);
            if (insertIdx === -1) insertIdx = this.tasks.length;
            this.tasks.splice(insertIdx, 0, task);
            this.notifyObservers();
            this.saveTasks();
        } catch (e) {
            console.error('[TaskManager] Error in moveTaskToOptimizeAndReorder:', e);
        }
    }

    /**
     * Move a task to a new status and reorder within that group.
     * @param {string} taskId
     * @param {string} newStatus
     * @param {number} newIndex
     */
    moveTaskToStatusAndReorder(taskId, newStatus, newIndex) {
        try {
            const idx = this.tasks.findIndex(t => t.id === taskId);
            if (idx === -1) return;
            const [task] = this.tasks.splice(idx, 1);
            task.status = newStatus;
            const groupTasks = this.tasks.filter(t => t.status === newStatus);
            let insertIdx = this.tasks.findIndex((t, i) => t.status === newStatus && groupTasks.indexOf(t) === newIndex);
            if (insertIdx === -1) insertIdx = this.tasks.length;
            this.tasks.splice(insertIdx, 0, task);
            this.notifyObservers();
            this.saveTasks();
        } catch (e) {
            console.error('[TaskManager] Error in moveTaskToStatusAndReorder:', e);
        }
    }

    // =====================
    // Task Queries
    // =====================

    /**
     * Get a task by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    /**
     * Get all tasks.
     * @returns {Array<Object>}
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * Get tasks by group.
     * @param {string} group
     * @returns {Array<Object>}
     */
    getTasksByGroup(group) {
        return this.tasks.filter(task => task.group === group);
    }

    /**
     * Get tasks by priority.
     * @param {string} priority
     * @returns {Array<Object>}
     */
    getTasksByPriority(priority) {
        return this.tasks.filter(task => task.priority === priority);
    }

    /**
     * Get tasks by status.
     * @param {string} status
     * @returns {Array<Object>}
     */
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }

    /**
     * Get tasks by survey.
     * @param {string} survey
     * @returns {Array<Object>}
     */
    getTasksBySurvey(survey) {
        return this.tasks.filter(task => task.survey === survey);
    }

    // =====================
    // Group/Meta Operations
    // =====================

    /**
     * Get all groups.
     * @returns {Array<string>}
     */
    getGroups() {
        return ['survey', 'prioritize', 'optimize', 'action'];
    }

    /**
     * Get all priorities.
     * @returns {Array<string>}
     */
    getPriorities() {
        return ['high', 'medium', 'low'];
    }

    /**
     * Get all statuses.
     * @returns {Array<string>}
     */
    getStatuses() {
        return ['pending', 'in-progress', 'blocked', 'completed'];
    }

    // =====================
    // Observer Pattern
    // =====================

    /**
     * Subscribe to task changes.
     * @param {Function} observer
     * @returns {Function} Unsubscribe function
     */
    subscribe(observer) {
        this.observers.push(observer);
        return () => {
            this.observers = this.observers.filter(obs => obs !== observer);
        };
    }

    /**
     * Notify all observers of task changes.
     */
    notifyObservers() {
        this.observers.forEach(observer => observer(this.tasks));
    }

    // =====================
    // Persistence
    // =====================

    /**
     * Save tasks to localStorage.
     */
    saveTasks() {
        try {
            localStorage.setItem('spot-tasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('[TaskManager] Error in saveTasks:', e);
        }
    }

    /**
     * Load tasks from localStorage.
     */
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('spot-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (e) {
            console.error('[TaskManager] Error in loadTasks:', e);
            this.tasks = [];
        }
    }

    // =====================
    // Migration
    // =====================

    /**
     * Ensure all tasks have a status property (migration).
     */
    migrateTasks() {
        let changed = false;
        this.tasks.forEach(task => {
            if (!task.status) {
                task.status = 'todo';
                changed = true;
            }
        });
        if (changed) this.saveTasks();
    }

    // =====================
    // Demo Data
    // =====================

    /**
     * Add demo tasks for demonstration purposes.
     */
    addDemoTasks() {
        const demoTasks = [
            {
                title: 'Review project requirements',
                description: 'Go through all project documentation and requirements',
                priority: 'high',
                group: 'survey',
                relatedTasks: []
            },
            {
                title: 'Create project timeline',
                description: 'Develop a detailed project schedule with milestones',
                priority: 'medium',
                group: 'prioritize',
                relatedTasks: []
            },
            {
                title: 'Set up development environment',
                description: 'Configure all necessary tools and dependencies',
                priority: 'high',
                group: 'optimize',
                relatedTasks: []
            },
            {
                title: 'Start coding core features',
                description: 'Begin implementing the main functionality',
                priority: 'high',
                group: 'action',
                relatedTasks: []
            }
        ];
        demoTasks.forEach(task => this.addTask(task));
    }

    /**
     * Remove all demo tasks.
     */
    removeDemoTasks() {
        this.tasks = this.tasks.filter(task => !task.isDemo);
        this.notifyObservers();
        this.saveTasks();
    }

    /**
     * Clear all tasks.
     */
    clearAllTasks() {
        this.tasks = [];
        this.notifyObservers();
        this.saveTasks();
    }

    // =====================
    // Import/Export
    // =====================

    /**
     * Import tasks (overwrites all current tasks).
     * @param {Array<Object>} tasks
     */
    importTasks(tasks) {
        try {
            this.tasks = tasks.map(task => ({
                ...task,
                id: this.generateId(),
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            this.notifyObservers();
            this.saveTasks();
        } catch (e) {
            console.error('[TaskManager] Error in importTasks:', e);
        }
    }

    /**
     * Export all tasks as a JSON string.
     * @returns {string}
     */
    exportTasks() {
        return JSON.stringify(this.tasks, null, 2);
    }

    // =====================
    // Utilities
    // =====================

    /**
     * Generate a unique ID for a task.
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
