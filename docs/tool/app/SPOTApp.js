// SPOTApp.js
// Main application controller for the SPOT Prioritization Tool
// Refactored for SOLID principles and modularity

import { TaskManager } from '../core/TaskManager.js';
import { DragDropManager } from '../core/DragDropManager.js';
import { UIRenderer } from './UIRenderer.js';
import { EventBinder } from './EventBinder.js';

/**
 * SPOTApp class
 * Main application controller for the SPOT Prioritization Tool.
 * Orchestrates modules, manages high-level state, and bootstraps the app.
 * Follows SOLID principles: single responsibility (app orchestration),
 * and is decoupled from business logic, rendering, and event binding.
 */
export class SPOTApp {
    /**
     * Constructs the SPOTApp and initializes all modules.
     * Handles errors gracefully and exposes the app globally for debugging.
     */
    constructor() {
        try {
            console.log('[SPOTApp] Constructor entered.');
            this.taskManager = new TaskManager();
            this.taskManager.migrateTasks();
            this.ui = new UIRenderer(this.taskManager);
            this.dragDrop = new DragDropManager(this.taskManager, this.ui);
            this.events = new EventBinder(this, this.ui, this.taskManager, this.dragDrop);
            this.currentStep = 'survey';
            window.spotApp = this; // for drag-drop callback and debugging
            this.init();
            console.log('[SPOTApp] Constructor finished.');
        } catch (e) {
            console.error('[SPOTApp] Error in constructor:', e);
        }
    }
    /**
     * Initializes the application: renders the initial view and binds all events.
     * Handles errors gracefully.
     */
    init() {
        try {
            console.info('[SPOTApp] Initializing application...');
            this.ui.renderInitialView();
            console.info('[SPOTApp] UI initial view rendered.');
            this.events.bindAll();
            console.info('[SPOTApp] All events bound.');
        } catch (e) {
            console.error('[SPOTApp] Error in init:', e);
        }
    }
}
