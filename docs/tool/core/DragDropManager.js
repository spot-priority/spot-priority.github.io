// DragDropManager.js
// Handles all drag-and-drop logic for the SPOT Prioritization Tool

/**
 * DragDropManager class
 * Handles all drag-and-drop logic for the SPOT Prioritization Tool.
 * Follows SOLID principles: single responsibility (drag-and-drop),
 * and is decoupled from business logic and rendering.
 */
export class DragDropManager {
    /**
     * @param {object} taskManager - The task manager (TaskManager instance)
     * @param {object} [ui] - Optional UI renderer for callbacks
     */
    constructor(taskManager, ui) {
        this.taskManager = taskManager;
        this.ui = ui;
        this.draggedItem = null;
        this.touchTimeout = null;
    }

    /**
     * Initialize drag-and-drop for a given container and type.
     * @param {HTMLElement} container
     * @param {string} [type] - e.g., 'survey', 'prioritize', etc.
     */
    initializeDragAndDrop(container, type) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.initializeDragAndDrop(container, type));
            return;
        }
        try {
            if (!container) {
                console.warn('[DragDropManager] No container provided for drag-and-drop');
                return;
            }
            container.addEventListener('dragstart', this.handleDragStart.bind(this));
            container.addEventListener('dragend', this.handleDragEnd.bind(this));
            container.addEventListener('dragover', this.handleDragOver.bind(this));
            container.addEventListener('dragleave', this.handleDragLeave.bind(this));
            container.addEventListener('drop', this.handleDrop.bind(this));
            // Mobile touch events
            container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            container.addEventListener('touchend', this.handleTouchEnd.bind(this));
            container.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
            console.debug('[DragDropManager] Drag-and-drop initialized for', container, 'type:', type);
        } catch (e) {
            console.error('[DragDropManager] Error in initializeDragAndDrop:', e);
        }
    }

    // ...additional initialization methods for survey, prioritize, optimize, etc. (see legacy for details)

    // =====================
    // Drag Event Handlers
    // =====================

    handleDragStart(e) {
        this.draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
        console.debug('[DragDropManager] Drag started', e.target);
    }

    handleDragEnd(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
            console.debug('[DragDropManager] Drag ended');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
        console.debug('[DragDropManager] Drag over', e.currentTarget);
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
        console.debug('[DragDropManager] Drag leave', e.currentTarget);
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        // --- IMPLEMENTATION: Move task in TaskManager and re-render UI ---
        try {
            const dropList = e.currentTarget;
            const draggedItem = this.draggedItem || document.querySelector('.task-item.dragging');
            if (!draggedItem || !dropList) return;
            const taskId = draggedItem.dataset.taskId;
            // Determine context by data attributes
            if (dropList.hasAttribute('data-survey')) {
                // Survey step: move between primary/secondary
                const newSurvey = dropList.getAttribute('data-survey');
                const newIndex = Array.from(dropList.children).indexOf(draggedItem);
                this.taskManager.moveTaskToSurveyAndReorder(taskId, newSurvey, newIndex);
                if (this.ui && this.ui.renderSurveyStep) this.ui.renderSurveyStep();
            } else if (dropList.hasAttribute('data-priority')) {
                // Prioritize step: move between higher/lower
                const newPriority = dropList.getAttribute('data-priority');
                const newIndex = Array.from(dropList.children).indexOf(draggedItem);
                this.taskManager.moveTaskToPriorityAndReorder(taskId, newPriority, newIndex);
                if (this.ui && this.ui.renderPrioritizeStep) this.ui.renderPrioritizeStep();
            } else if (dropList.hasAttribute('data-optimize')) {
                // Optimize step: move between more/less
                const newOptimize = dropList.getAttribute('data-optimize');
                const newIndex = Array.from(dropList.children).indexOf(draggedItem);
                this.taskManager.moveTaskToOptimizeAndReorder(taskId, newOptimize, newIndex);
                if (this.ui && this.ui.renderOptimizeStep) this.ui.renderOptimizeStep();
            } else if (dropList.hasAttribute('data-status')) {
                // Action step: move between statuses
                const newStatus = dropList.getAttribute('data-status');
                const newIndex = Array.from(dropList.children).indexOf(draggedItem);
                this.taskManager.moveTaskToStatusAndReorder(taskId, newStatus, newIndex);
                if (this.ui && this.ui.renderActionStep) this.ui.renderActionStep();
            }
        } catch (err) {
            console.error('[DragDropManager] Error in handleDrop:', err);
        }
    }

    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        this.touchDragging = true;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
        this.draggedItem = e.target.closest('.task-item');
        if (!this.draggedItem) return;
        this.draggedItem.classList.add('touch-dragging');
        this.draggedItem.style.zIndex = 1000;
        this.draggedItem.style.position = 'relative';
        this.draggedItem.style.pointerEvents = 'none';
        this.originalParent = this.draggedItem.parentNode;
        this.originalNextSibling = this.draggedItem.nextSibling;
        e.preventDefault();
    }
    handleTouchMove(e) {
        if (!this.touchDragging || !this.draggedItem) return;
        const touch = e.touches[0];
        // Move the dragged item visually
        this.draggedItem.style.transform = `translate(${touch.clientX - this.touchStartX}px, ${touch.clientY - this.touchStartY}px)`;
        // Highlight drop zones
        document.querySelectorAll('.task-list').forEach(list => {
            const rect = list.getBoundingClientRect();
            if (
                touch.clientX > rect.left &&
                touch.clientX < rect.right &&
                touch.clientY > rect.top &&
                touch.clientY < rect.bottom
            ) {
                list.classList.add('drag-over');
            } else {
                list.classList.remove('drag-over');
            }
        });
        e.preventDefault();
    }
    handleTouchEnd(e) {
        if (!this.touchDragging || !this.draggedItem) return;
        let dropTarget = null;
        const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
        if (touch) {
            document.querySelectorAll('.task-list').forEach(list => {
                const rect = list.getBoundingClientRect();
                if (
                    touch.clientX > rect.left &&
                    touch.clientX < rect.right &&
                    touch.clientY > rect.top &&
                    touch.clientY < rect.bottom
                ) {
                    dropTarget = list;
                }
                list.classList.remove('drag-over');
            });
        }
        // --- IMPLEMENTATION: Move task in TaskManager and re-render UI ---
        try {
            if (dropTarget && dropTarget !== this.originalParent) {
                const draggedItem = this.draggedItem;
                const taskId = draggedItem.dataset.taskId;
                if (dropTarget.hasAttribute('data-survey')) {
                    const newSurvey = dropTarget.getAttribute('data-survey');
                    const newIndex = Array.from(dropTarget.children).indexOf(draggedItem);
                    this.taskManager.moveTaskToSurveyAndReorder(taskId, newSurvey, newIndex);
                    if (this.ui && this.ui.renderSurveyStep) this.ui.renderSurveyStep();
                } else if (dropTarget.hasAttribute('data-priority')) {
                    const newPriority = dropTarget.getAttribute('data-priority');
                    const newIndex = Array.from(dropTarget.children).indexOf(draggedItem);
                    this.taskManager.moveTaskToPriorityAndReorder(taskId, newPriority, newIndex);
                    if (this.ui && this.ui.renderPrioritizeStep) this.ui.renderPrioritizeStep();
                } else if (dropTarget.hasAttribute('data-optimize')) {
                    const newOptimize = dropTarget.getAttribute('data-optimize');
                    const newIndex = Array.from(dropTarget.children).indexOf(draggedItem);
                    this.taskManager.moveTaskToOptimizeAndReorder(taskId, newOptimize, newIndex);
                    if (this.ui && this.ui.renderOptimizeStep) this.ui.renderOptimizeStep();
                } else if (dropTarget.hasAttribute('data-status')) {
                    const newStatus = dropTarget.getAttribute('data-status');
                    const newIndex = Array.from(dropTarget.children).indexOf(draggedItem);
                    this.taskManager.moveTaskToStatusAndReorder(taskId, newStatus, newIndex);
                    if (this.ui && this.ui.renderActionStep) this.ui.renderActionStep();
                }
            } else if (this.originalParent && this.draggedItem) {
                this.originalParent.insertBefore(this.draggedItem, this.originalNextSibling);
            }
        } catch (err) {
            console.error('[DragDropManager] Error in handleTouchEnd:', err);
        }
        // Reset styles
        this.draggedItem.classList.remove('touch-dragging');
        this.draggedItem.style.transform = '';
        this.draggedItem.style.zIndex = '';
        this.draggedItem.style.position = '';
        this.draggedItem.style.pointerEvents = '';
        this.touchDragging = false;
        this.draggedItem = null;
        this.originalParent = null;
        this.originalNextSibling = null;
        e.preventDefault();
    }

    // ...additional methods for survey/prioritize/optimize drag-and-drop, as in legacy
}
