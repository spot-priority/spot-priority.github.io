// index.js
// Entry point for the SPOT Prioritization Tool app
// Bootstraps the main app controller

console.log('[index.js] Script start. This should appear if the file is parsed and executed.');


import { SPOTApp } from './SPOTApp.js';
console.log('[index.js] SPOTApp imported. If this does not appear, there was an issue importing SPOTApp.js or its dependencies.');

function initializeApp() {
    console.log('[index.js] initializeApp function called. Attempting to initialize SPOTApp...');
    try {
        new SPOTApp();
        console.log('[index.js] SPOTApp instantiation successful.');
    } catch (e) {
        console.error('[index.js] Error during SPOTApp instantiation or init:', e);
    }
}

// Bootstrap the app when DOM is ready
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    console.log('[index.js] Document is loading. Adding DOMContentLoaded listener.');
    window.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // `DOMContentLoaded` has already fired or document is 'interactive' or 'complete'
    console.log(`[index.js] Document readyState is: ${document.readyState}. Initializing app directly.`);
    initializeApp();
}

