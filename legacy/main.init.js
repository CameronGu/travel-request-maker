// legacy/main.init.js
import { setupFormsAndTabs } from '../modules/tabNavigation.js';
import { setupTravelerManagement } from '../modules/travelerManagement.js';
import { setupHotelForm } from '../modules/hotelForm.js';
import { setupDataPersistence } from '../modules/storage.js';
import { TravelerService } from '../services/travelerService.js';

// Debug Functions
function debugShowFormData() {
    console.group('Current Form Data State');
    console.log('Current Tab:', currentTab);
    console.log('Form Data:', formData);
    console.log('Initial Form Data:', initialFormData);
    console.log('Stored Data:', storage.getFormData());
    console.log('Has Unsaved Changes:', hasUnsavedChanges);
    console.groupEnd();
}

// Add debug button
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug: Show Form Data';
    debugBtn.className = 'btn-secondary text-sm';
    debugBtn.style.position = 'fixed';
    debugBtn.style.bottom = '1rem';
    debugBtn.style.right = '1rem';
    debugBtn.addEventListener('click', debugShowFormData);
    document.body.appendChild(debugBtn);
}

// Initialize
function init() {
    try {
        // DEV ONLY: Expose TravelerService for browser console testing
        window.TravelerService = TravelerService;
        
        // Initialize core modules
        setupDataPersistence();
        setupFormsAndTabs();
        setupTravelerManagement();
        setupHotelForm();

        // Always show debug button for now since we're in development
        addDebugButton();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);

export default init;