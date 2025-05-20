export class TaskManager {
    constructor() {
        this.tasks = [];
        this.observers = [];
        this.loadTasks();
    }

    // Task Operations
    addTask(task) {
        const newTask = {
            id: this.generateId(),
            ...task,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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