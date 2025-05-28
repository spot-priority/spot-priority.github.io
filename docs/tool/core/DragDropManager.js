// DragDropManager.js
// Handles all drag-and-drop logic for the SPOT Prioritization Tool

/**
 * Handles all drag-and-drop logic.
 * UI-agnostic where possible (uses callbacks for UI updates).
 */
export class DragDropManager {
    /**
     * @param {TaskManager} taskManager
     * @param {UIRenderer} [ui] Optional UI renderer for callbacks
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
        // TODO: Implement drop logic, update taskManager as needed
        console.debug('[DragDropManager] Drop event', e.currentTarget);
    }

    // =====================
    // Touch Event Handlers (for mobile)
    // =====================

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
        // Find the drop zone under the touch
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
        // Move the item in the DOM if dropped in a valid zone
        if (dropTarget && dropTarget !== this.originalParent) {
            dropTarget.appendChild(this.draggedItem);
            // TODO: update taskManager with new group/status if needed
        } else if (this.originalParent && this.draggedItem) {
            this.originalParent.insertBefore(this.draggedItem, this.originalNextSibling);
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
