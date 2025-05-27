// index.js
// Entry point for the SPOT Prioritization Tool app
// Bootstraps the main app controller

import { SPOTApp } from './SPOTApp.js';

// Bootstrap the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new SPOTApp();
});
