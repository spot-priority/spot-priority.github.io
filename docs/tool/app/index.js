/**
 * Entry point for the SPOT Prioritization Tool app.
 * Handles bootstrapping and global error handling.
 * Follows SOLID principles: single responsibility (only app startup),
 * and is decoupled from business logic and rendering.
 */

console.log('[index.js] Script start. This should appear if the file is parsed and executed.');


import { SPOTApp } from './SPOTApp.js';
console.log('[index.js] SPOTApp imported. If this does not appear, there was an issue importing SPOTApp.js or its dependencies.');

let appInitialized = false;

/**
 * Initializes the SPOTApp. Ensures only one initialization occurs.
 * Shows a visible error if initialization fails.
 */
function initializeApp() {
    if (appInitialized) return;
    appInitialized = true;
    console.log('[index.js] initializeApp function called. Attempting to initialize SPOTApp...');
    try {
        new SPOTApp();
        console.log('[index.js] SPOTApp instantiation successful.');
    } catch (e) {
        console.error('[index.js] Error during SPOTApp instantiation or init:', e);
        const errorDiv = document.getElementById('global-error');
        if (errorDiv) {
            errorDiv.textContent = 'A critical error occurred: ' + (e.message || e);
            errorDiv.style.display = 'block';
        }
    }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('[Global Error Handler] Uncaught error:', event.error || event.message);
    // Optionally, show a user-friendly message or reload suggestion
    // alert('A critical error occurred. Please reload the page.');
});

/**
 * Checks for critical DOM elements and warns if any are missing.
 * Helps catch issues with incomplete or broken markup.
 */
function checkCriticalElements() {
    const requiredIds = ['prevStep', 'nextStep', 'taskForm', 'taskModal'];
    let missing = [];
    requiredIds.forEach(id => {
        if (!document.getElementById(id)) missing.push(id);
    });
    if (missing.length > 0) {
        console.warn('[index.js] Critical DOM elements missing after load:', missing);
        // Optionally, show a warning to the user
        // alert('Some features may not work until you reload the page.');
    }
}

/**
 * Helper to re-initialize the app (for SPA reloads or dynamic DOM changes).
 * Calls unbindAll if available, then re-initializes.
 */
window.reinitializeSPOTApp = function() {
    console.info('[index.js] Re-initializing SPOTApp due to DOM update or reload.');
    if (window.spotApp && window.spotApp.events && typeof window.spotApp.events.unbindAll === 'function') {
        window.spotApp.events.unbindAll();
    }
    initializeApp();
};

// Bootstrap the app when DOM is ready
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    console.log('[index.js] Document is loading. Adding DOMContentLoaded listener.');
    window.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        checkCriticalElements();
    }, { once: true });
} else {
    // `DOMContentLoaded` has already fired or document is 'interactive' or 'complete'
    console.log(`[index.js] Document readyState is: ${document.readyState}. Initializing app directly.`);
    initializeApp();
    checkCriticalElements();
}

