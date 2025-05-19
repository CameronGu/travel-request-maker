import { TravelerService } from './travelerService.js';
import { 
  validatePhoneNumber, 
  formatPhoneForStorage, 
  getTravelerDisplayName,
  loadCountryPhoneCodes,
  getSortedCountryCodes
} from './main.traveler.core.js';
import { 
  showAddTravelerModal, 
  showEditTravelerModal 
} from './main.traveler.edit-modals.js';
import {
  showTravelerDisplayModal,
  showManageTravelersModal
} from './main.traveler.display-modals.js';

// References to storage and other dependencies that need to be shared across modules
const formData = window.formData || {};
const storage = window.storage || {
    saveFormData() {},
};
const refreshAllTravelerSelectors = window.refreshAllTravelerSelectors || function() {};

// Error display helper shared across all modal implementations
function showTravelerFormError(modalElement, msg) {
  const errorElement = modalElement.querySelector('[id$="TravelerFormError"]');
  if (errorElement) {
    errorElement.textContent = msg;
  }
}

// Export all modal functions for public use
export {
    showAddTravelerModal,
    showEditTravelerModal,
    showTravelerDisplayModal,
    showManageTravelersModal,
    showTravelerFormError,
    formData,
    storage,
    refreshAllTravelerSelectors
};