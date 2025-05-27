// SPOTApp.js
// Main application controller for the SPOT Prioritization Tool
// Refactored for SOLID principles and modularity

import { TaskManager } from '../core/TaskManager.js';
import { DragDropManager } from '../core/DragDropManager.js';
import { UIRenderer } from './UIRenderer.js';
import { EventBinder } from './EventBinder.js';

/**
 * Main application controller for SPOT Prioritization Tool.
 * Orchestrates modules, manages high-level state, and bootstraps the app.
 */
export class SPOTApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.taskManager.migrateTasks();
        this.ui = new UIRenderer(this.taskManager);
        this.dragDrop = new DragDropManager(this.taskManager, this.ui);
        this.events = new EventBinder(this, this.ui, this.taskManager, this.dragDrop);
        this.currentStep = 'survey';
        window.spotApp = this; // for drag-drop callback
        this.init();
    }
    init() {
        this.ui.renderInitialView();
        this.events.bindAll();
    }
}
