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

    updateTask(taskId, updatedFields) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            Object.assign(task, updatedFields);
            this.notifyObservers();
            this.saveTasks();
        }
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
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('tasks');
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
                name: 'Demo Task 1',
                status: 'not started',
                survey: 'primary',
                prioritize: 'high',
                optimize: 'more',
                rank: 1,
                demo_task: true
            },
            {
                name: 'Demo Task 2',
                status: 'not started',
                survey: 'primary',
                prioritize: 'low',
                optimize: 'less',
                rank: 2,
                demo_task: true
            },
            {
                name: 'Demo Task 3',
                status: 'not started',
                survey: 'secondary',
                prioritize: 'high',
                optimize: 'more',
                rank: 3,
                demo_task: true
            },
            {
                name: 'Demo Task 4',
                status: 'not started',
                survey: 'secondary',
                prioritize: 'low',
                optimize: 'less',
                rank: 4,
                demo_task: true
            },
            {
                name: 'Demo Task 5',
                status: 'not started',
                survey: 'primary',
                prioritize: 'high',
                optimize: 'more',
                rank: 5,
                demo_task: true
            },
            {
                name: 'Demo Task 6',
                status: 'not started',
                survey: 'primary',
                prioritize: 'low',
                optimize: 'less',
                rank: 6,
                demo_task: true
            },
            {
                name: 'Demo Task 7',
                status: 'not started',
                survey: 'secondary',
                prioritize: 'high',
                optimize: 'more',
                rank: 7,
                demo_task: true
            },
            {
                name: 'Demo Task 8',
                status: 'not started',
                survey: 'secondary',
                prioritize: 'low',
                optimize: 'less',
                rank: 8,
                demo_task: true
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