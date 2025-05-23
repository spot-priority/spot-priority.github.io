export class TaskManager {
    constructor() {
        this.tasks = [];
        this.observers = [];
        this.loadTasks();
        this.migrateTasks();
    }

    // Task Operations
    addTask(task) {
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
    }

    updateTask(id, updates) {
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
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.notifyObservers();
            this.saveTasks();
            return true;
        }
        return false;
    }

    moveTask(id, newGroup) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.group = newGroup;
            task.updatedAt = new Date().toISOString();
            this.notifyObservers();
            this.saveTasks();
            return true;
        }
        return false;
    }

    moveTaskToSurveyAndReorder(taskId, newSurvey, newIndex) {
        // Find and remove the task from the array
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx === -1) return;
        const [task] = this.tasks.splice(idx, 1);
        // Update survey property
        task.survey = newSurvey;
        // Insert at new index in the correct group
        const groupTasks = this.tasks.filter(t => t.survey === newSurvey);
        let insertIdx = this.tasks.findIndex((t, i) => t.survey === newSurvey && groupTasks.indexOf(t) === newIndex);
        if (insertIdx === -1) insertIdx = this.tasks.length;
        this.tasks.splice(insertIdx, 0, task);
        this.notifyObservers();
        this.saveTasks();
    }

    moveTaskToPriorityAndReorder(taskId, newPriority, newIndex) {
        // Only operate on tasks with survey: 'primary'
        const idx = this.tasks.findIndex(t => t.id === taskId && t.survey === 'primary');
        if (idx === -1) return;
        const [task] = this.tasks.splice(idx, 1);
        // Update priority property
        task.priority = newPriority;
        // Insert at new index in the correct group
        const groupTasks = this.tasks.filter(t => t.survey === 'primary' && t.priority === newPriority);
        let insertIdx = this.tasks.findIndex((t, i) => t.survey === 'primary' && t.priority === newPriority && groupTasks.indexOf(t) === newIndex);
        if (insertIdx === -1) insertIdx = this.tasks.length;
        this.tasks.splice(insertIdx, 0, task);
        this.notifyObservers();
        this.saveTasks();
    }

    moveTaskToOptimizeAndReorder(taskId, newOptimize, newIndex) {
        // Only operate on tasks with priority: 'higher'
        const idx = this.tasks.findIndex(t => t.id === taskId && t.priority === 'higher');
        if (idx === -1) return;
        const [task] = this.tasks.splice(idx, 1);
        // Update optimize property
        task.optimize = newOptimize;
        // Insert at new index in the correct group
        const groupTasks = this.tasks.filter(t => t.priority === 'higher' && t.optimize === newOptimize);
        let insertIdx = this.tasks.findIndex((t, i) => t.priority === 'higher' && t.optimize === newOptimize && groupTasks.indexOf(t) === newIndex);
        if (insertIdx === -1) insertIdx = this.tasks.length;
        this.tasks.splice(insertIdx, 0, task);
        this.notifyObservers();
        this.saveTasks();
    }

    moveTaskToStatusAndReorder(taskId, newStatus, newIndex) {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx === -1) return;
        const [task] = this.tasks.splice(idx, 1);
        task.status = newStatus;
        // Insert at new index in the correct group
        const groupTasks = this.tasks.filter(t => t.status === newStatus);
        let insertIdx = this.tasks.findIndex((t, i) => t.status === newStatus && groupTasks.indexOf(t) === newIndex);
        if (insertIdx === -1) insertIdx = this.tasks.length;
        this.tasks.splice(insertIdx, 0, task);
        this.notifyObservers();
        this.saveTasks();
    }

    // Task Queries
    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    getTasksByGroup(group) {
        return this.tasks.filter(task => task.group === group);
    }

    getTasksByPriority(priority) {
        return this.tasks.filter(task => task.priority === priority);
    }

    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }

    getTasksBySurvey(survey) {
        return this.tasks.filter(task => task.survey === survey);
    }

    // Group Operations
    getGroups() {
        return ['survey', 'prioritize', 'optimize', 'action'];
    }

    getPriorities() {
        return ['high', 'medium', 'low'];
    }

    getStatuses() {
        return ['pending', 'in-progress', 'blocked', 'completed'];
    }

    // State Management
    subscribe(observer) {
        this.observers.push(observer);
        return () => {
            this.observers = this.observers.filter(obs => obs !== observer);
        };
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.tasks));
    }

    // Persistence
    saveTasks() {
        try {
            localStorage.setItem('spot-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('spot-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    // Migration: ensure all tasks have a status property
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

    // Demo Data
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

    removeDemoTasks() {
        this.tasks = this.tasks.filter(task => !task.isDemo);
        this.notifyObservers();
        this.saveTasks();
    }

    clearAllTasks() {
        this.tasks = [];
        this.notifyObservers();
        this.saveTasks();
    }

    // Import/Export
    importTasks(tasks) {
        this.tasks = tasks.map(task => ({
            ...task,
            id: this.generateId(),
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        this.notifyObservers();
        this.saveTasks();
    }

    exportTasks() {
        return JSON.stringify(this.tasks, null, 2);
    }

    // Utilities
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}