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