export class DragDropManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.draggedItem = null;
        this.touchTimeout = null;
    }

    initializeDragAndDrop(container) {
        // Desktop drag and drop
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
    }

    initializeSurveyDragAndDrop(container) {
        if (container) {
            container.addEventListener('dragstart', this.handleSurveyDragStart.bind(this));
            container.addEventListener('dragover', this.handleSurveyDragOver.bind(this));
            container.addEventListener('drop', this.handleSurveyDrop.bind(this));
        } else {
            document.querySelectorAll('.task-list[data-survey], .task-list[data-fc-col="survey"]').forEach(list => {
                list.addEventListener('dragstart', this.handleSurveyDragStart.bind(this));
                list.addEventListener('dragover', this.handleSurveyDragOver.bind(this));
                list.addEventListener('drop', this.handleSurveyDrop.bind(this));
            });
        }
    }

    initializePrioritizeDragAndDrop(container) {
        if (container) {
            container.addEventListener('dragstart', this.handlePrioritizeDragStart.bind(this));
            container.addEventListener('dragover', this.handlePrioritizeDragOver.bind(this));
            container.addEventListener('drop', this.handlePrioritizeDrop.bind(this));
        } else {
            document.querySelectorAll('.task-list[data-priority], .task-list[data-fc-col="prioritize"]').forEach(list => {
                list.addEventListener('dragstart', this.handlePrioritizeDragStart.bind(this));
                list.addEventListener('dragover', this.handlePrioritizeDragOver.bind(this));
                list.addEventListener('drop', this.handlePrioritizeDrop.bind(this));
            });
        }
    }

    initializeOptimizeDragAndDrop(container) {
        if (container) {
            container.addEventListener('dragstart', this.handleOptimizeDragStart.bind(this));
            container.addEventListener('dragover', this.handleOptimizeDragOver.bind(this));
            container.addEventListener('drop', this.handleOptimizeDrop.bind(this));
        } else {
            document.querySelectorAll('.task-list[data-optimize], .task-list[data-fc-col="optimize"]').forEach(list => {
                list.addEventListener('dragstart', this.handleOptimizeDragStart.bind(this));
                list.addEventListener('dragover', this.handleOptimizeDragOver.bind(this));
                list.addEventListener('drop', this.handleOptimizeDrop.bind(this));
            });
        }
    }

    initializeActionDragAndDrop(container) {
        if (container) {
            container.addEventListener('dragstart', this.handleActionDragStart.bind(this));
            container.addEventListener('dragover', this.handleActionDragOver.bind(this));
            container.addEventListener('drop', this.handleActionDrop.bind(this));
        } else {
            document.querySelectorAll('.task-list[data-status], .task-list[data-fc-col="take action"]').forEach(list => {
                list.addEventListener('dragstart', this.handleActionDragStart.bind(this));
                list.addEventListener('dragover', this.handleActionDragOver.bind(this));
                list.addEventListener('drop', this.handleActionDrop.bind(this));
            });
        }
    }

    // Desktop Drag and Drop Handlers
    handleDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;

        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }

    handleDragEnd(e) {
        if (!e.target.classList.contains('task-item')) return;

        e.target.classList.remove('dragging');
        this.draggedItem = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const taskList = e.target.closest('.task-list');
        if (!taskList) return;

        taskList.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newGroup = taskList.dataset.group;

        if (taskId && newGroup) {
            this.taskManager.moveTask(taskId, newGroup);
        }
    }

    handleSurveyDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;
        this.draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }

    handleSurveyDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleSurveyDrop(e) {
        e.preventDefault();
        // Support both step and full control views
        let targetList = e.target.closest('.task-list[data-survey], .task-list[data-fc-col="survey"]');
        if (!targetList || !this.draggedItem) return;
        let newSurvey = targetList.getAttribute('data-survey') || targetList.getAttribute('data-fc-group');
        const taskId = this.draggedItem.dataset.taskId;
        // Find the drop index
        let dropIndex = Array.from(targetList.children).indexOf(e.target.closest('.task-item'));
        if (dropIndex === -1) dropIndex = targetList.children.length;
        this.taskManager.moveTaskToSurveyAndReorder(taskId, newSurvey, dropIndex);
        this.draggedItem = null;
        if (window.spotApp && window.spotApp.setFullControlMode) {
            window.spotApp.setFullControlMode('column');
        } else if (window.spotApp) {
            window.spotApp.renderSurveyStep();
        }
    }

    handlePrioritizeDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;
        this.draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }

    handlePrioritizeDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handlePrioritizeDrop(e) {
        e.preventDefault();
        let targetList = e.target.closest('.task-list[data-priority], .task-list[data-fc-col="prioritize"]');
        if (!targetList || !this.draggedItem) return;
        let newPriority = targetList.getAttribute('data-priority') || targetList.getAttribute('data-fc-group');
        const taskId = this.draggedItem.dataset.taskId;
        let dropIndex = Array.from(targetList.children).indexOf(e.target.closest('.task-item'));
        if (dropIndex === -1) dropIndex = targetList.children.length;
        this.taskManager.moveTaskToPriorityAndReorder(taskId, newPriority, dropIndex);
        this.draggedItem = null;
        if (window.spotApp && window.spotApp.setFullControlMode) {
            window.spotApp.setFullControlMode('column');
        } else if (window.spotApp) {
            window.spotApp.renderPrioritizeStep();
        }
    }

    handleOptimizeDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;
        this.draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }

    handleOptimizeDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleOptimizeDrop(e) {
        e.preventDefault();
        let targetList = e.target.closest('.task-list[data-optimize], .task-list[data-fc-col="optimize"]');
        if (!targetList || !this.draggedItem) return;
        let newOptimize = targetList.getAttribute('data-optimize') || targetList.getAttribute('data-fc-group');
        const taskId = this.draggedItem.dataset.taskId;
        let dropIndex = Array.from(targetList.children).indexOf(e.target.closest('.task-item'));
        if (dropIndex === -1) dropIndex = targetList.children.length;
        this.taskManager.moveTaskToOptimizeAndReorder(taskId, newOptimize, dropIndex);
        this.draggedItem = null;
        if (window.spotApp && window.spotApp.setFullControlMode) {
            window.spotApp.setFullControlMode('column');
        } else if (window.spotApp) {
            window.spotApp.renderOptimizeStep();
        }
    }

    handleActionDragStart(e) {
        if (!e.target.classList.contains('task-item')) return;
        this.draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }

    handleActionDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleActionDrop(e) {
        e.preventDefault();
        let targetList = e.target.closest('.task-list[data-status], .task-list[data-fc-col="take action"]');
        if (!targetList || !this.draggedItem) return;
        let newStatus = targetList.getAttribute('data-status') || targetList.getAttribute('data-fc-group');
        const taskId = this.draggedItem.dataset.taskId;
        let dropIndex = Array.from(targetList.children).indexOf(e.target.closest('.task-item'));
        if (dropIndex === -1) dropIndex = targetList.children.length;
        this.taskManager.moveTaskToStatusAndReorder(taskId, newStatus, dropIndex);
        this.draggedItem = null;
        if (window.spotApp && window.spotApp.setFullControlMode) {
            window.spotApp.setFullControlMode('column');
        } else if (window.spotApp) {
            window.spotApp.renderActionStep();
        }
    }

    // Mobile Touch Handlers
    handleTouchStart(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        e.preventDefault();
        this.draggedItem = taskItem;
        taskItem.classList.add('touch-dragging');

        // Store initial touch position
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;

        // Add a small delay before allowing drag
        this.touchTimeout = setTimeout(() => {
            taskItem.style.position = 'absolute';
            taskItem.style.zIndex = '1000';
            this.updateTouchPosition(touch);
        }, 100);
    }

    handleTouchMove(e) {
        if (!this.draggedItem) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.updateTouchPosition(touch);

        // Find the task list under the touch point
        const taskList = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.task-list');
        if (taskList) {
            document.querySelectorAll('.task-list').forEach(list => {
                list.classList.remove('drag-over');
            });
            taskList.classList.add('drag-over');
        }
    }

    handleTouchEnd(e) {
        if (!this.draggedItem) return;

        clearTimeout(this.touchTimeout);
        this.draggedItem.classList.remove('touch-dragging');
        this.draggedItem.style.position = '';
        this.draggedItem.style.zIndex = '';
        this.draggedItem.style.transform = '';

        // Find the task list under the final touch position
        const taskList = document.elementFromPoint(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY
        )?.closest('.task-list');

        if (taskList) {
            taskList.classList.remove('drag-over');
            const taskId = this.draggedItem.dataset.taskId;
            const newGroup = taskList.dataset.group;

            if (taskId && newGroup) {
                this.taskManager.moveTask(taskId, newGroup);
            }
        }

        this.draggedItem = null;
    }

    updateTouchPosition(touch) {
        if (!this.draggedItem) return;

        const rect = this.draggedItem.getBoundingClientRect();
        const x = touch.clientX - rect.width / 2;
        const y = touch.clientY - rect.height / 2;

        this.draggedItem.style.transform = `translate(${x}px, ${y}px)`;
    }
}