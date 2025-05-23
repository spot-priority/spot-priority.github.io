# SPOT Framework Prioritization Tool Specification

## Overview
The SPOT Framework Prioritization Tool is a web-based application designed to help users prioritize tasks using the SPOT (Survey, Prioritize, Optimize, Take Action) framework. The tool provides an intuitive interface for managing tasks through these four key steps.

## Core Features

### 1. Task Management
- Create, edit, and delete tasks
- Assign priorities (high, medium, low)
- Add descriptions and related tasks
- Track task status and progress

### 2. SPOT Framework Steps
- **Survey**: Quickly assess all tasks to identify critical issues.
- **Prioritize**: Focus on tasks with the highest urgency.
- **Optimize**: Choose tasks that offer the greatest return on effort.
- **Take Action**: Act immediately on the most important tasks.

### Survey Step
- The Survey step is the initial collection phase.
- Users can create tasks by entering a name directly in the UI, with no dialog or modal.
- The Survey step displays two groups: **Primary** (on top) and **Secondary** (below).
- Each group has its own input for adding tasks.
- Tasks can be dragged and dropped between Primary and Secondary, which updates their `survey` property.
- Tasks can be reordered within each group by drag-and-drop; their order in the list reflects their stack rank.
- Internally, each task has: `{ id, name, survey, priority, optimize, demo }`.

### Prioritize Step
- The Prioritize step displays all tasks from the Survey step that are marked as `survey: 'primary'`.
- Two groups are shown: **Higher** (top) and **Lower** (bottom).
- All tasks start in the Higher group.
- Users can drag and drop tasks between Higher and Lower, and reorder within each group (stack-rank).
- Only the `priority` property is changed in this step (`priority: 'higher'` or `'lower'`).
- The order in the group reflects the stack rank.
- The Previous button and progress bar allow navigation back to the Survey step, where tasks can be moved to Primary and become visible in Prioritize.
- New tasks added to a group are ranked at the bottom.
- (Optionally) a `rank` property can be added to tasks for explicit ordering.

### Optimize Step
- The Optimize step displays all tasks from the Prioritize step that are marked as `priority: 'higher'`.
- Two groups are shown: **More** (top) and **Less** (bottom), representing the impact of the task.
- All tasks start in the More group.
- Users can drag and drop tasks between More and Less, and reorder within each group (stack-rank).
- Only the `optimize` property is changed in this step (`optimize: 'more'` or `'less'`).
- The order in the group reflects the stack rank.
- The Previous button and progress bar allow navigation back to the Prioritize step, where tasks can be moved to Higher and become visible in Optimize.
- New tasks added to a group are ranked at the bottom.
- (Optionally) a `rank` property can be added to tasks for explicit ordering.

### Take Action Step
- The Take Action step displays tasks in four stacked groups: **Todo** (top), **Doing**, **Blocked**, and **Done** (bottom).
- Each task has a new `status` property: `"todo"`, `"doing"`, `"blocked"`, `"done"`.
- Tasks can be dragged between any of the four groups (Todo, Doing, Blocked, Done), updating their `status` accordingly.
- Dragging a task from Done to another group restores it to that status; dragging to Done marks it as done.
- Each task in Todo, Doing, or Blocked has a checkmark button to mark as Done (moves to Done group).
- Done tasks are hidden from all other steps, but shown in the Done group here, with Undo and Delete buttons.
- Undo returns the task to Todo; Delete removes it permanently.
- Blocked tasks have strikethrough text everywhere they appear and are not counted for progress/warnings.
- Only tasks with `status` not `"done"` are shown in other steps.
- Tasks shown in Take Action are the highest-tier available: show `primary`/`higher`/`more` first, then `primary`/`higher`/`less`, etc.
- If no tasks are available in the current highest group, show a yellow warning triangle with a tooltip/hint.
- Show warning indicators only when they prevent workflow: on Take Action if no high priority, on Optimize if no high priority, on Prioritize if no primary, on Survey if no primary.
- TODO: Add a section for handling done tasks in the future (e.g., history, analytics, restore, etc.).

### 3. Drag and Drop Interface
- Intuitive drag-and-drop functionality
- Mobile-friendly touch support
- Visual feedback during drag operations
- Smooth animations and transitions

### 4. Data Persistence
- Local storage for task data
- Import/export functionality
- Demo data for quick start

## Technical Requirements

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- ES6+ JavaScript support

### Performance
- Smooth animations (60fps)
- Responsive design
- Touch-friendly interface
- Offline capability

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## User Interface

### Layout
- Clean, modern design
- Responsive grid system
- Clear visual hierarchy
- Intuitive navigation

### Components
- Task cards
- Priority indicators
- Progress bars
- Modal dialogs
- Control panels

### Visual Feedback
- Hover states
- Active states
- Loading indicators
- Success/error messages

## Data Structure

### Task Object
```javascript
{
    id: string,
    name: string,
    survey: 'primary' | 'secondary',
    priority: 'higher' | 'lower',
    optimize: 'more' | 'less',
    demo: bool
}
```

### State Management
- Centralized task management
- Observer pattern for updates
- Local storage persistence
- Import/export functionality

## Implementation Details

### Core Classes
1. **SPOTApp**
   - Main application class
   - UI management
   - Event handling
   - State coordination

2. **TaskManager**
   - Task CRUD operations
   - Data persistence
   - State management
   - Import/export

3. **DragDropManager**
   - Drag and drop handling
   - Touch event support
   - Visual feedback
   - Position management

### File Structure
```
docs/tool/
├── priority-tool.html
├── priority-tool.css
├── priority-tool-app.js
├── priority-tool-tasks.js
├── priority-tool-drag.js
└── priority-tool-spec.md
```