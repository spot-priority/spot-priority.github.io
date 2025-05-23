import { TaskManager } from './priority-tool-tasks.js';
import { DragDropManager } from './priority-tool-drag.js';

export class SPOTApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.taskManager.migrateTasks();
        this.dragDropManager = new DragDropManager(this.taskManager);
        this.currentStep = 'survey';
        window.spotApp = this; // for drag-drop callback
        this.initializeEventListeners();
        this.renderSurveyStep();
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('prevStep').addEventListener('click', () => {
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.currentStep);
            if (currentIndex > 0) {
                this.navigateToStep(steps[currentIndex - 1]);
            }
        });

        document.getElementById('nextStep').addEventListener('click', () => {
            const steps = ['survey', 'prioritize', 'optimize', 'action'];
            const currentIndex = steps.indexOf(this.currentStep);
            if (currentIndex < steps.length - 1) {
                this.navigateToStep(steps[currentIndex + 1]);
            }
        });

        // Control panel buttons
        document.getElementById('toggleFullControl').addEventListener('click', () => this.toggleFullControl());
        // Removed Add Task button event listener (button no longer exists)
        document.getElementById('importTasks').addEventListener('click', () => this.showImportModal());
        document.getElementById('exportTasks').addEventListener('click', () => this.exportTasks());
        document.getElementById('clearTasks').addEventListener('click', () => this.clearAllTasks());

        // Task list drag and drop
        document.querySelectorAll('.task-list').forEach(list => {
            this.dragDropManager.initializeDragAndDrop(list);
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            let title = document.getElementById('taskTitle').value;
            if (title.length > 64) title = title.slice(0, 64);
            const description = document.getElementById('taskDescription').value;
            const priority = document.getElementById('taskPriority').value;

            if (title) {
                this.taskManager.addTask({
                    title,
                    description,
                    priority,
                    group: this.currentStep,
                    relatedTasks: []
                });
                this.renderCurrentStep();
                document.getElementById('taskModal').style.display = 'none';
                document.getElementById('taskForm').reset();
            }
        });

        // Import form submission
        document.getElementById('importForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('importFile');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const tasks = JSON.parse(e.target.result);
                        this.taskManager.importTasks(tasks);
                        this.renderCurrentStep();
                        document.getElementById('importModal').style.display = 'none';
                        fileInput.value = '';
                    } catch (error) {
                        alert('Error importing tasks: Invalid JSON file');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Survey step: add task forms for primary and secondary
        document.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.add-task-input');
                let name = input.value.trim();
                if (name.length > 64) name = name.slice(0, 64);
                if (name) {
                    const survey = form.getAttribute('data-survey');
                    this.taskManager.addTask({
                        name,
                        survey,
                        // priority is not set in this step
                        optimize: 'more',
                        demo: false
                    });
                    input.value = '';
                    this.renderSurveyStep();
                }
            });
        });

        // Step selector (progress bar) navigation
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.getAttribute('data-step');
                if (step) {
                    // If in full control, exit it
                    const fc = document.querySelector('.full-control-view');
                    if (fc && fc.style.display !== 'none') {
                        fc.style.display = 'none';
                        document.querySelectorAll('.step-content').forEach(el => {
                            el.style.display = (el.id === step) ? 'block' : 'none';
                        });
                    }
                    this.navigateToStep(step);
                }
            });
        });

        // Patch: subscribe to task changes for warning updates
        this.taskManager.subscribe(() => this.rerenderAllStepWarnings());
    }

    navigateToStep(step) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });
        // Show selected step
        document.getElementById(step).style.display = 'block';
        this.currentStep = step;
        // Update active state of step buttons
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.step === step) {
                btn.classList.add('active');
            }
        });
        // Update progress meter
        const progressFill = document.querySelector('.progress-fill');
        const steps = ['survey', 'prioritize', 'optimize', 'action'];
        const currentIndex = steps.indexOf(step);
        const progress = (currentIndex / (steps.length - 1)) * 100;
        progressFill.style.width = `${progress}%`;
        // Update navigation buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        prevBtn.disabled = (step === steps[0]);
        nextBtn.disabled = (step === steps[steps.length - 1]);
        prevBtn.classList.toggle('disabled', prevBtn.disabled);
        nextBtn.classList.toggle('disabled', nextBtn.disabled);
        // Render for current step
        if (step === 'survey') {
            this.renderSurveyStep();
        } else if (step === 'prioritize') {
            this.renderPrioritizeStep();
        } else if (step === 'optimize') {
            this.renderOptimizeStep();
        } else if (step === 'action') {
            this.renderActionStep();
        } else {
            this.renderCurrentStep();
        }
    }

    // Utility: filter out done tasks for all steps except Take Action
    getVisibleTasksForStep(step) {
        const all = this.taskManager.getAllTasks();
        if (step === 'action') return all;
        return all.filter(t => t.status !== 'done');
    }

    // Utility: filter out blocked/done for warning logic
    getActiveTasksForGroup(filterFn) {
        return this.taskManager.getAllTasks().filter(t => filterFn(t) && t.status !== 'done' && t.status !== 'blocked');
    }

    renderPrioritizeStep() {
        // Only show tasks with survey: 'primary' and not done
        const tasks = this.getVisibleTasksForStep('prioritize').filter(t => t.survey === 'primary');
        // Set default priority to 'higher' if not set
        tasks.forEach(task => {
            if (!task.priority) {
                task.priority = 'higher';
            }
        });
        this.taskManager.saveTasks();
        // Split by priority
        const higher = tasks.filter(t => t.priority !== 'lower');
        const lower = tasks.filter(t => t.priority === 'lower');
        // Render higher
        const higherList = document.querySelector('.task-list[data-priority="higher"]');
        higherList.innerHTML = '';
        if (higher.length === 0) {
            higherList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            higher.forEach((task, idx) => {
                const el = this.createPriorityTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                higherList.appendChild(el);
            });
        }
        // Render lower
        const lowerList = document.querySelector('.task-list[data-priority="lower"]');
        lowerList.innerHTML = '';
        if (lower.length === 0) {
            lowerList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            lower.forEach((task, idx) => {
                const el = this.createPriorityTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                lowerList.appendChild(el);
            });
        }
        // Initialize drag and drop for prioritize step
        this.dragDropManager.initializePrioritizeDragAndDrop();
        // Show warning if no active primary tasks
        const showWarning = this.getActiveTasksForGroup(t => t.survey === 'primary').length === 0;
        this.setStepWarning('prioritize', showWarning);
    }

    createPriorityTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    renderOptimizeStep() {
        // Only show tasks with priority: 'higher' and not done
        const tasks = this.getVisibleTasksForStep('optimize').filter(t => t.priority === 'higher');
        // Set default optimize to 'more' if not set
        tasks.forEach(task => {
            if (!task.optimize) {
                task.optimize = 'more';
            }
        });
        this.taskManager.saveTasks();
        // Split by optimize
        const more = tasks.filter(t => t.optimize !== 'less');
        const less = tasks.filter(t => t.optimize === 'less');
        // Render more
        const moreList = document.querySelector('.task-list[data-optimize="more"]');
        moreList.innerHTML = '';
        if (more.length === 0) {
            moreList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            more.forEach((task, idx) => {
                const el = this.createOptimizeTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                moreList.appendChild(el);
            });
        }
        // Render less
        const lessList = document.querySelector('.task-list[data-optimize="less"]');
        lessList.innerHTML = '';
        if (less.length === 0) {
            lessList.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
        } else {
            less.forEach((task, idx) => {
                const el = this.createOptimizeTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                lessList.appendChild(el);
            });
        }
        // Initialize drag and drop for optimize step
        this.dragDropManager.initializeOptimizeDragAndDrop();
        // Show warning if no active high-priority tasks
        const showWarning = this.getActiveTasksForGroup(t => t.priority === 'higher').length === 0;
        this.setStepWarning('optimize', showWarning);
    }

    createOptimizeTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    renderCurrentStep() {
        const tasks = this.taskManager.getTasksByGroup(this.currentStep);
        const taskList = document.querySelector(`.task-list[data-group="${this.currentStep}"]`);
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks in this step yet.</div>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    renderSurveyStep() {
        // Render tasks for primary and secondary groups
        ['primary', 'secondary'].forEach(survey => {
            const list = document.querySelector(`.task-list[data-survey="${survey}"]`);
            if (!list) return;
            list.innerHTML = '';
            const tasks = this.getVisibleTasksForStep('survey').filter(t => t.survey === survey);
            if (tasks.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
                return;
            }
            tasks.forEach((task, idx) => {
                const el = this.createSurveyTaskElement(task, idx);
                if (task.status === 'blocked') el.classList.add('blocked');
                list.appendChild(el);
            });
        });
        // Initialize drag and drop for survey step
        this.dragDropManager.initializeSurveyDragAndDrop();
        // Show warning if no active primary tasks
        const showWarning = this.getActiveTasksForGroup(t => t.survey === 'primary').length === 0;
        this.setStepWarning('survey', showWarning);
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority}`;
        div.draggable = true;
        div.dataset.taskId = task.id;

        div.innerHTML = `
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task));
        div.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task));

        return div;
    }

    createSurveyTaskElement(task, idx) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        return div;
    }

    toggleFullControl() {
        // Toggle between full control and step-based view
        const fullControlView = document.querySelector('.full-control-view');
        const contentArea = document.querySelector('.content-area');
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        if (!fullControlView) return;
        const isFullControl = fullControlView.style.display !== 'none';
        if (isFullControl) {
            // Hide full control, show step content
            fullControlView.style.display = 'none';
            // Show the current step content
            document.querySelectorAll('.step-content').forEach(el => {
                el.style.display = (el.id === this.currentStep) ? 'block' : 'none';
            });
            // Show prev/next buttons
            if (prevBtn) prevBtn.style.display = '';
            if (nextBtn) nextBtn.style.display = '';
        } else {
            // Show full control, hide all step content
            fullControlView.style.display = 'block';
            document.querySelectorAll('.step-content').forEach(el => {
                el.style.display = 'none';
            });
            // Hide prev/next buttons
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            // Default to list mode (was column)
            this.setFullControlMode('list');
        }
    }

    setFullControlMode(mode) {
        // Wireframe: visually switch between column and list mode
        const fc = document.querySelector('.full-control-view');
        if (!fc) return;
        let col = fc.querySelector('.all-steps');
        let list = fc.querySelector('.all-tasks-list');
        if (!col) {
            col = document.createElement('div');
            col.className = 'all-steps';
            col.innerHTML = `<div class="step-section"><h3>Survey</h3><div class="task-list" data-group="survey"></div></div>
                <div class="step-section"><h3>Prioritize</h3><div class="task-list" data-group="prioritize"></div></div>
                <div class="step-section"><h3>Optimize</h3><div class="task-list" data-group="optimize"></div></div>
                <div class="step-section"><h3>Take Action</h3><div class="task-list" data-group="action"></div></div>`;
            fc.appendChild(col);
        }
        if (!list) {
            list = document.createElement('div');
            list.className = 'all-tasks-list';
            list.innerHTML = `<h3>All Tasks (List Mode)</h3><div class="task-list" data-group="all"></div>`;
            fc.appendChild(list);
        }
        col.style.display = (mode === 'column') ? 'block' : 'none';
        list.style.display = (mode === 'list') ? 'block' : 'none';
        // Add mode toggle buttons (wireframe)
        let modeBar = fc.querySelector('.full-control-mode-bar');
        if (!modeBar) {
            modeBar = document.createElement('div');
            modeBar.className = 'full-control-mode-bar';
            modeBar.style.display = 'flex';
            modeBar.style.justifyContent = 'center';
            modeBar.style.alignItems = 'center';
            modeBar.style.gap = '1em';
            modeBar.style.marginBottom = '1em';
            modeBar.innerHTML = `<button class="btn" id="fcColumnMode">Column View</button><button class="btn" id="fcListMode">List View</button>`;
            fc.insertBefore(modeBar, fc.firstChild);
        }
        // Wire up mode buttons
        modeBar.querySelector('#fcColumnMode').onclick = () => this.setFullControlMode('column');
        modeBar.querySelector('#fcListMode').onclick = () => this.setFullControlMode('list');

        // --- List View: Render all tasks with dropdowns for each property ---
        if (mode === 'list') {
            const taskList = list.querySelector('.task-list[data-group="all"]');
            taskList.innerHTML = '';
            // Add Task Form (inline, similar to survey step)
            const addForm = document.createElement('form');
            addForm.className = 'add-task-form add-task-form-list';
            addForm.style.marginBottom = '0.5em';
            addForm.innerHTML = `<input type="text" class="add-task-input" placeholder="Add a new task..." required maxlength="64" /> <button type="submit" class="btn">Add</button>`;
            addForm.onsubmit = (e) => {
                e.preventDefault();
                const input = addForm.querySelector('.add-task-input');
                let name = input.value.trim();
                if (name.length > 64) name = name.slice(0, 64);
                if (name) {
                    this.taskManager.addTask({ name, survey: 'primary', priority: 'higher', optimize: 'more', status: 'todo', demo: false });
                    input.value = '';
                    this.setFullControlMode('list');
                }
            };
            taskList.appendChild(addForm);
            // Header row
            const header = document.createElement('div');
            header.className = 'task-list-header';
            header.style.display = 'flex';
            header.style.gap = '1em';
            header.style.fontWeight = 'bold';
            header.style.position = 'sticky';
            header.style.top = '0';
            header.style.background = '#f5f5f5';
            header.style.zIndex = '2';
            header.innerHTML = '<span style="width: 2em;">#</span><span style="flex:2;">Name</span>' +
                '<span>Survey</span><span>Priority</span><span>Optimize</span><span>Status</span><span style="width:2em;"></span>';
            taskList.appendChild(header);
            const tasks = this.taskManager.getAllTasks();
            if (tasks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = 'No tasks yet.';
                taskList.appendChild(empty);
            } else {
                tasks.forEach((task, idx) => {
                    const row = document.createElement('div');
                    row.className = 'task-list-row';
                    row.style.display = 'flex';
                    row.style.gap = '1em';
                    row.style.alignItems = 'center';
                    row.classList.add(idx % 2 === 0 ? 'even-row' : 'odd-row');
                    row.onmouseover = () => row.classList.add('row-hover');
                    row.onmouseout = () => row.classList.remove('row-hover');
                    row.innerHTML = `<span style="width:2em;">${idx + 1}</span><span style="flex:2;">${task.name}</span>`;
                    // Survey dropdown
                    const surveySel = document.createElement('select');
                    surveySel.className = 'compact-dropdown';
                    ['primary', 'secondary'].forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val; opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
                        if (task.survey === val) opt.selected = true;
                        surveySel.appendChild(opt);
                    });
                    surveySel.onchange = () => {
                        this.taskManager.updateTask(task.id, { survey: surveySel.value });
                        this.setFullControlMode('list');
                    };
                    row.appendChild(surveySel);
                    // Priority dropdown
                    const prioritySel = document.createElement('select');
                    prioritySel.className = 'compact-dropdown';
                    ['higher', 'lower'].forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val; opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
                        if (task.priority === val) opt.selected = true;
                        prioritySel.appendChild(opt);
                    });
                    prioritySel.onchange = () => {
                        this.taskManager.updateTask(task.id, { priority: prioritySel.value });
                        this.setFullControlMode('list');
                    };
                    row.appendChild(prioritySel);
                    // Optimize dropdown
                    const optimizeSel = document.createElement('select');
                    optimizeSel.className = 'compact-dropdown';
                    ['more', 'less'].forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val; opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
                        if (task.optimize === val) opt.selected = true;
                        optimizeSel.appendChild(opt);
                    });
                    optimizeSel.onchange = () => {
                        this.taskManager.updateTask(task.id, { optimize: optimizeSel.value });
                        this.setFullControlMode('list');
                    };
                    row.appendChild(optimizeSel);
                    // Status dropdown
                    const statusSel = document.createElement('select');
                    statusSel.className = 'compact-dropdown';
                    ['todo', 'doing', 'blocked', 'done'].forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val; opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
                        if (task.status === val) opt.selected = true;
                        statusSel.appendChild(opt);
                    });
                    statusSel.onchange = () => {
                        this.taskManager.updateTask(task.id, { status: statusSel.value });
                        this.setFullControlMode('list');
                    };
                    row.appendChild(statusSel);
                    // Delete button
                    const delBtn = document.createElement('button');
                    delBtn.className = 'delete-btn';
                    delBtn.title = 'Delete task';
                    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    delBtn.onclick = () => {
                        if (confirm('Delete this task?')) {
                            this.taskManager.deleteTask(task.id);
                            this.setFullControlMode('list');
                        }
                    };
                    row.appendChild(delBtn);
                    taskList.appendChild(row);
                });
            }
        }

        // --- Column View: Render all steps as columns with groups ---
        if (mode === 'column') {
            // Clear and set up columns
            col.innerHTML = '';
            // Column definitions
            const columns = [
                {
                    title: 'Survey',
                    groups: [
                        { label: 'Primary', key: 'primary' },
                        { label: 'Secondary', key: 'secondary' }
                    ],
                    getTasks: (groupKey) => this.taskManager.getAllTasks().filter(t => t.survey === groupKey && t.status !== 'done'),
                    dndType: 'survey',
                },
                {
                    title: 'Prioritize',
                    groups: [
                        { label: 'Higher', key: 'higher' },
                        { label: 'Lower', key: 'lower' }
                    ],
                    getTasks: (groupKey) => this.taskManager.getAllTasks().filter(t => t.survey === 'primary' && t.priority === groupKey && t.status !== 'done'),
                    dndType: 'prioritize',
                },
                {
                    title: 'Optimize',
                    groups: [
                        { label: 'More', key: 'more' },
                        { label: 'Less', key: 'less' }
                    ],
                    getTasks: (groupKey) => this.taskManager.getAllTasks().filter(t => t.survey === 'primary' && t.priority === 'higher' && t.optimize === groupKey && t.status !== 'done'),
                    dndType: 'optimize',
                },
                {
                    title: 'Take Action',
                    groups: [
                        { label: 'Todo', key: 'todo' },
                        { label: 'Doing', key: 'doing' },
                        { label: 'Blocked', key: 'blocked' },
                        { label: 'Done', key: 'done' }
                    ],
                    getTasks: (groupKey) => this.taskManager.getAllTasks().filter(t => t.status === groupKey),
                    dndType: 'action',
                }
            ];
            // Columns container
            const columnsWrap = document.createElement('div');
            columnsWrap.className = 'fc-columns-wrap';
            columnsWrap.style.display = 'flex';
            columnsWrap.style.gap = '0.5em'; // Tighter gap
            columnsWrap.style.alignItems = 'flex-start';
            columnsWrap.style.width = '100%';
            columnsWrap.style.maxWidth = '1100px'; // Limit max width
            columnsWrap.style.margin = '0 auto'; // Center columns
            // Add columns (no arrows)
            columns.forEach((colDef, colIdx) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'fc-column';
                colDiv.style.flex = '1 1 0';
                colDiv.style.minWidth = '200px';
                colDiv.style.maxWidth = '260px';
                colDiv.style.background = colIdx < 3 ? '#f6f8fa' : '#f3f3f3';
                colDiv.style.borderRadius = '10px';
                colDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                colDiv.style.padding = '0.7em 0.3em 1.2em 0.3em';
                colDiv.style.marginBottom = '0.5em';
                colDiv.style.border = '1.5px solid #e0e0e0';
                colDiv.style.transition = 'box-shadow 0.2s';
                colDiv.onmouseover = () => colDiv.style.boxShadow = '0 4px 16px rgba(25,118,210,0.10)';
                colDiv.onmouseout = () => colDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                // Column title
                const colTitle = document.createElement('h4');
                colTitle.textContent = colDef.title;
                colTitle.style.textAlign = 'center';
                colTitle.style.marginBottom = '0.7em';
                colTitle.style.letterSpacing = '0.02em';
                colTitle.style.fontWeight = 'bold';
                colTitle.style.color = '#1976d2';
                colDiv.appendChild(colTitle);
                // Groups in column
                colDef.groups.forEach(group => {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'fc-group';
                    groupDiv.style.marginBottom = '1em';
                    groupDiv.style.background = '#fff';
                    groupDiv.style.borderRadius = '7px';
                    groupDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                    groupDiv.style.padding = '0.4em 0.4em 0.6em 0.4em';
                    groupDiv.style.border = '1px solid #e0e0e0';
                    // Group label
                    const groupLabel = document.createElement('div');
                    groupLabel.className = 'fc-group-label';
                    groupLabel.textContent = group.label;
                    groupLabel.style.fontWeight = 'bold';
                    groupLabel.style.marginBottom = '0.2em';
                    groupLabel.style.letterSpacing = '0.01em';
                    groupLabel.style.color = '#1976d2';
                    groupDiv.appendChild(groupLabel);
                    // Task list for group
                    const groupList = document.createElement('div');
                    groupList.className = 'task-list';
                    groupList.setAttribute('data-fc-col', colDef.title.toLowerCase());
                    groupList.setAttribute('data-fc-group', group.key);
                    groupList.style.minHeight = '2.2em';
                    // Render tasks for this group
                    const tasks = colDef.getTasks(group.key);
                    if (tasks.length === 0) {
                        const empty = document.createElement('div');
                        empty.className = 'empty-state';
                        empty.textContent = 'No tasks in this group yet.';
                        groupList.appendChild(empty);
                    } else {
                        tasks.forEach((task, idx) => {
                            let el;
                            if (colDef.dndType === 'action') {
                                // Use createActionTaskElement, but patch to work in column view
                                el = document.createElement('div');
                                el.className = 'task-item' + (task.status === 'blocked' ? ' blocked' : '');
                                el.draggable = true;
                                el.dataset.taskId = task.id;
                                el.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
                                if (group.key !== 'done') {
                                    const doneBtn = document.createElement('button');
                                    doneBtn.className = 'done-btn';
                                    doneBtn.title = 'Mark as done';
                                    doneBtn.innerHTML = '✔️';
                                    doneBtn.onclick = () => {
                                        this.taskManager.updateTask(task.id, { status: 'done' });
                                        this.setFullControlMode('column');
                                    };
                                    el.appendChild(doneBtn);
                                } else {
                                    const undoBtn = document.createElement('button');
                                    undoBtn.className = 'undo-btn';
                                    undoBtn.title = 'Undo done';
                                    undoBtn.innerHTML = '↩️';
                                    undoBtn.onclick = () => {
                                        this.taskManager.updateTask(task.id, { status: 'todo' });
                                        this.setFullControlMode('column');
                                    };
                                    el.appendChild(undoBtn);
                                    const delBtn = document.createElement('button');
                                    delBtn.className = 'delete-btn';
                                    delBtn.title = 'Delete task';
                                    delBtn.innerHTML = '🗑️';
                                    delBtn.onclick = () => {
                                        this.taskManager.deleteTask(task.id);
                                        this.setFullControlMode('column');
                                    };
                                    el.appendChild(delBtn);
                                }
                            } else {
                                el = document.createElement('div');
                                el.className = 'task-item';
                                el.draggable = true;
                                el.dataset.taskId = task.id;
                                el.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
                            }
                            if (task.status === 'blocked') el.classList.add('blocked');
                            groupList.appendChild(el);
                        });
                    }
                    groupDiv.appendChild(groupList);
                    colDiv.appendChild(groupDiv);
                });
                columnsWrap.appendChild(colDiv);
            });
            col.appendChild(columnsWrap);
            // Add a horizontal break after the first 3 columns
            const hr = document.createElement('div');
            hr.style.width = '100%';
            hr.style.height = '0';
            hr.style.borderTop = '2.5px solid #b0bec5';
            hr.style.margin = '1.2em 0 1.2em 0';
            hr.style.opacity = '0.5';
            columnsWrap.insertBefore(hr, columnsWrap.children[3]);
            // Initialize drag and drop for all columns (use correct selectors)
            setTimeout(() => {
                columns[0].groups.forEach(g => {
                    const el = col.querySelector(`.task-list[data-fc-col="survey"][data-fc-group="${g.key}"]`);
                    if (el) this.dragDropManager.initializeSurveyDragAndDrop(el);
                });
                columns[1].groups.forEach(g => {
                    const el = col.querySelector(`.task-list[data-fc-col="prioritize"][data-fc-group="${g.key}"]`);
                    if (el) this.dragDropManager.initializePrioritizeDragAndDrop(el);
                });
                columns[2].groups.forEach(g => {
                    const el = col.querySelector(`.task-list[data-fc-col="optimize"][data-fc-group="${g.key}"]`);
                    if (el) this.dragDropManager.initializeOptimizeDragAndDrop(el);
                });
                columns[3].groups.forEach(g => {
                    const el = col.querySelector(`.task-list[data-fc-col="take action"][data-fc-group="${g.key}"]`);
                    if (el) this.dragDropManager.initializeActionDragAndDrop(el);
                });
            }, 10); // Increased timeout to ensure DOM is ready
        }
    }

    showAddTaskModal() {
        document.getElementById('modalTitle').textContent = 'Add New Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskModal').style.display = 'block';
    }

    showImportModal() {
        document.getElementById('importForm').reset();
        document.getElementById('importModal').style.display = 'block';
        // Remove any previous event listeners to avoid stacking
        const importForm = document.getElementById('importForm');
        const newForm = importForm.cloneNode(true);
        importForm.parentNode.replaceChild(newForm, importForm);
        // Remove any previous validation indicator
        let validIndicator = document.getElementById('importValidIndicator');
        if (validIndicator) validIndicator.remove();
        let validTasks = null;
        // Listen for file input change to validate
        newForm.querySelector('#importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            // Remove previous indicator
            let prev = document.getElementById('importValidIndicator');
            if (prev) prev.remove();
            validTasks = null;
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    let tasks;
                    let valid = false;
                    try {
                        tasks = JSON.parse(e.target.result);
                        valid = Array.isArray(tasks) && tasks.every(t => t && typeof t === 'object' && t.id && t.name);
                    } catch (error) {
                        valid = false;
                    }
                    const indicator = document.createElement('span');
                    indicator.id = 'importValidIndicator';
                    indicator.style.marginLeft = '10px';
                    if (valid) {
                        indicator.innerHTML = '<span style="color: #43a047; font-size: 1.2em;">✔️ Valid file</span>';
                        validTasks = tasks;
                    } else {
                        indicator.innerHTML = '<span style="color: #e53935; font-size: 1.2em;">❌ Invalid file</span>';
                        validTasks = null;
                    }
                    e.target.parentNode.appendChild(indicator);
                };
                reader.readAsText(file);
            }
        });
        // On submit, only proceed if validTasks is set
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validTasks) {
                alert('Please select a valid JSON file before importing.');
                return;
            }
            showImportChoiceDialog({
                onReplace: () => {
                    this.taskManager.clearAllTasks();
                    validTasks.forEach(task => this.taskManager.addTask(task));
                    this.renderCurrentStep();
                    document.getElementById('importModal').style.display = 'none';
                    newForm.querySelector('#importFile').value = '';
                    let ind = document.getElementById('importValidIndicator');
                    if (ind) ind.remove();
                },
                onAdd: () => {
                    const existingIds = new Set(this.taskManager.getAllTasks().map(t => t.id));
                    validTasks.forEach(task => {
                        if (!existingIds.has(task.id)) {
                            this.taskManager.addTask(task);
                        }
                    });
                    this.renderCurrentStep();
                    document.getElementById('importModal').style.display = 'none';
                    newForm.querySelector('#importFile').value = '';
                    let ind = document.getElementById('importValidIndicator');
                    if (ind) ind.remove();
                }
            });
        });
    }

    editTask(task) {
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskModal').style.display = 'block';
    }

    deleteTask(task) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskManager.deleteTask(task.id);
            this.renderCurrentStep();
        }
    }

    // TODO: Improve duplicate detection in import (currently only checks by id, not full object)

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            this.taskManager.clearAllTasks();
            // If in Full Control List View, re-render it
            const fc = document.querySelector('.full-control-view');
            if (fc && fc.style.display !== 'none') {
                const list = fc.querySelector('.all-tasks-list');
                if (list && list.style.display !== 'none') {
                    this.setFullControlMode('list');
                    return;
                }
            }
            this.renderCurrentStep();
        }
    }

    exportTasks() {
        // Export all tasks as JSON, filename: SPOT.Prioritization.Triage.json
        const tasks = this.taskManager.getAllTasks();
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SPOT.Prioritization.Triage.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderActionStep() {
        // Get tasks for the highest available group (primary/high/more, then primary/high/less, etc.), not done
        const candidates = [
            t => t.survey === 'primary' && t.priority === 'higher' && t.optimize === 'more' && t.status !== 'done',
            t => t.survey === 'primary' && t.priority === 'higher' && t.optimize === 'less' && t.status !== 'done',
            t => t.survey === 'primary' && t.priority === 'lower' && t.optimize === 'more' && t.status !== 'done',
            t => t.survey === 'primary' && t.priority === 'lower' && t.optimize === 'less' && t.status !== 'done'
        ];
        let tasks = [];
        for (const filter of candidates) {
            tasks = this.taskManager.getAllTasks().filter(filter);
            if (tasks.length > 0) break;
        }
        // Always show blocked tasks for the current group
        const allBlocked = this.taskManager.getAllTasks().filter(t => tasks.some(base => base.survey === t.survey && base.priority === t.priority && base.optimize === t.optimize) && t.status === 'blocked');
        // Show warning if no active tasks in any group (excluding blocked)
        const showWarning = tasks.filter(t => t.status !== 'blocked').length === 0;
        // Split by status
        const todo = tasks.filter(t => t.status === 'todo');
        const doing = tasks.filter(t => t.status === 'doing');
        const blocked = allBlocked;
        // Done tasks (from all, not just current group)
        const done = this.taskManager.getAllTasks().filter(t => t.status === 'done');
        // Render each group
        const renderGroup = (status, arr) => {
            const list = document.querySelector(`.task-list[data-status="${status}"]`);
            list.innerHTML = '';
            if (arr.length === 0) {
                list.innerHTML = '<div class="empty-state">No tasks in this group yet.</div>';
            } else {
                arr.forEach((task, idx) => {
                    const el = this.createActionTaskElement(task, idx, status);
                    if (task.status === 'blocked') el.classList.add('blocked');
                    list.appendChild(el);
                });
            }
        };
        renderGroup('todo', todo);
        renderGroup('doing', doing);
        renderGroup('blocked', blocked);
        renderGroup('done', done);
        this.setStepWarning('action', showWarning);
        this.dragDropManager.initializeActionDragAndDrop();
    }

    createActionTaskElement(task, idx, status) {
        const div = document.createElement('div');
        div.className = 'task-item' + (task.status === 'blocked' ? ' blocked' : '');
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.innerHTML = `<span class="task-rank">${idx + 1}.</span> <span class="task-name">${task.name}</span>`;
        // Add checkmark for done, undo, delete
        if (status !== 'done') {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'done-btn';
            doneBtn.title = 'Mark as done';
            doneBtn.innerHTML = '✔️';
            doneBtn.onclick = () => {
                this.taskManager.updateTask(task.id, { status: 'done' });
                this.renderActionStep();
            };
            div.appendChild(doneBtn);
        } else {
            const undoBtn = document.createElement('button');
            undoBtn.className = 'undo-btn';
            undoBtn.title = 'Undo done';
            undoBtn.innerHTML = '↩️';
            undoBtn.onclick = () => {
                this.taskManager.updateTask(task.id, { status: 'todo' });
                this.renderActionStep();
            };
            div.appendChild(undoBtn);
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.title = 'Delete task';
            delBtn.innerHTML = '🗑️';
            delBtn.onclick = () => {
                this.taskManager.deleteTask(task.id);
                this.renderActionStep();
            };
            div.appendChild(delBtn);
        }
        return div;
    }

    setActionWarning(show) {
        // Show/hide warning indicator for action step (implement as needed)
        // ...
    }

    // --- Step Warning Indicator ---
    setStepWarning(step, show) {
        // Show/hide warning indicator for the given step
        let bar = document.querySelector('.step-selector');
        if (!bar) return;
        let warn = bar.querySelector('.step-warning[data-step="' + step + '"]');
        if (!warn && show) {
            warn = document.createElement('span');
            warn.className = 'step-warning';
            warn.setAttribute('data-step', step);
            warn.title = 'No actionable tasks in this step. Please review previous steps.';
            warn.innerHTML = '⚠️';
            let btn = bar.querySelector('.step-btn[data-step="' + step + '"]');
            if (btn) btn.appendChild(warn);
        } else if (warn && !show) {
            warn.remove();
        }
    }

    // Patch: force warning indicators to update after any task change
    rerenderAllStepWarnings() {
        this.renderSurveyStep();
        this.renderPrioritizeStep();
        this.renderOptimizeStep();
        this.renderActionStep();
    }
}

// Helper: show a modal dialog for import choice
function showImportChoiceDialog({ onReplace, onAdd }) {
    let dialog = document.getElementById('importChoiceDialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'importChoiceDialog';
        dialog.style.position = 'fixed';
        dialog.style.left = '0';
        dialog.style.top = '0';
        dialog.style.width = '100vw';
        dialog.style.height = '100vh';
        dialog.style.background = 'rgba(0,0,0,0.4)';
        dialog.style.display = 'flex';
        dialog.style.alignItems = 'center';
        dialog.style.justifyContent = 'center';
        dialog.style.zIndex = '9999';
        dialog.innerHTML = `
            <div style="background:#fff;padding:2em 2em 1.5em 2em;border-radius:8px;box-shadow:0 2px 16px #0002;max-width:350px;text-align:center;">
                <h3>Import Tasks</h3>
                <p>How would you like to import tasks?</p>
                <div style="margin:1.5em 0 1em 0;display:flex;gap:1em;justify-content:center;">
                    <button id="importReplaceBtn" class="btn" style="background:#e53935;color:#fff;">Replace</button>
                    <button id="importAddBtn" class="btn" style="background:#43a047;color:#fff;">Add</button>
                </div>
                <div style="font-size:0.95em;color:#888;">Replace: Remove all current tasks and import new ones.<br>Add: Keep current tasks and add new ones (skip duplicates).</div>
            </div>
        `;
        document.body.appendChild(dialog);
    }
    dialog.style.display = 'flex';
    dialog.querySelector('#importReplaceBtn').onclick = () => {
        dialog.style.display = 'none';
        onReplace();
    };
    dialog.querySelector('#importAddBtn').onclick = () => {
        dialog.style.display = 'none';
        onAdd();
    };
}

document.getElementById('taskTitle').setAttribute('maxlength', '64');