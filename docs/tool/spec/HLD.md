# High-Level Design (HLD) for SPOT Prioritization Tool

## Overview

This document describes the high-level design and architecture for the refactored SPOT Prioritization Tool, following SOLID principles and modular structure.

## Main Modules

### 1. SPOTApp (app/SPOTApp.js)

- Orchestrates the application.
- Manages high-level state (current step, mode, etc.).
- Instantiates and wires together TaskManager, UIRenderer, DragDropManager, and EventBinder.

### 2. TaskManager (core/TaskManager.js)

- Handles all task CRUD, filtering, sorting, and persistence.
- Exposes a clean API for task operations.

### 3. DragDropManager (core/DragDropManager.js)

- Handles all drag-and-drop logic.
- UI-agnostic where possible (uses callbacks for UI updates).

### 4. UIRenderer (app/UIRenderer.js)

- Handles all DOM rendering and updates.
- No business logic or event binding.

### 5. EventBinder (app/EventBinder.js)

- Handles all event binding and unbinding.
- No business logic or rendering logic.

## Interactions

- SPOTApp initializes all modules and passes references as needed.
- UIRenderer calls TaskManager for data, and DragDropManager for drag-and-drop hooks.
- EventBinder binds UI events and delegates to SPOTApp, TaskManager, or UIRenderer as appropriate.

## Extensibility

- New features (e.g., new views, new task properties) can be added by extending UIRenderer and EventBinder, without modifying core logic.

## See also

- requirements.md (detailed requirements)
- priority-tool-spec.md (original spec)
