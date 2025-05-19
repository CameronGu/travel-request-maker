import { TravelerService } from './travelerService.js';
import { 
  validatePhoneNumber, 
  formatPhoneForStorage, 
  loadCountryPhoneCodes,
  getSortedCountryCodes
} from './main.traveler.core.js';
import {
  showTravelerFormError,
  formData,
  storage,
  refreshAllTravelerSelectors,
  showManageTravelersModal
} from './main.traveler.modals.js';

// Traveler add modal implementation
function showAddTravelerModal(onSave, fromManageTravelers, fromComboBox, comboFormType) {
    const container = document.getElementById('travelerModalContainer');
    container.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center';
    overlay.tabIndex = -1;
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative';
    modal.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Add New Traveler</h2>
      <form id="addTravelerForm" class="space-y-4">
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">First Name *</label>
            <input name="firstName" type="text" class="form-input w-full" required />
          </div>
          <div class="flex-1">
            <label class="form-label">Middle Name</label>
            <input name="middleName" type="text" class="form-input w-full" />
          </div>
          <div class="flex-1">
            <label class="form-label">Last Name *</label>
            <input name="lastName" type="text" class="form-input w-full" required />
          </div>
        </div>
        <div>
          <label class="form-label">Preferred Name</label>
          <input name="preferredName" type="text" class="form-input w-full" />
        </div>
        <div class="flex space-x-2 items-end">
          <div id="countryCodeDropdownContainer"></div>
          <div class="flex-1">
            <label class="form-label">Primary Phone *</label>
            <input name="primaryPhone" type="tel" class="form-input w-full" required placeholder="" />
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Primary Email *</label>
            <input name="primaryEmail" type="email" class="form-input w-full" required />
          </div>
          <div class="flex-1">
            <label class="form-label">Secondary Email</label>
            <input name="secondaryEmail" type="email" class="form-input w-full" />
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Date of Birth</label>
            <input name="dateOfBirth" type="date" class="form-input w-full" />
          </div>
          <div class="flex-1">
            <label class="form-label">Gender</label>
            <select name="gender" class="form-input w-full">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="X">X</option>
            </select>
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Passport Issuing Country</label>
            <input name="passportIssuingCountry" type="text" class="form-input w-full" />
          </div>
          <div class="flex-1">
            <label class="form-label">Nationality</label>
            <input name="nationality" type="text" class="form-input w-full" />
          </div>
        </div>
        <div>
          <label class="form-label">Passport Number</label>
          <input name="passportNumber" type="text" class="form-input w-full" />
        </div>
        <div>
          <label class="form-label">Additional Notes</label>
          <textarea name="notes" class="form-input w-full" rows="2"></textarea>
        </div>
        <div id="travelerFormError" class="text-red-600 text-sm"></div>
        <div class="flex justify-between items-center mt-4">
          <span class="text-xs text-gray-500">Traveler data is stored locally in your browser only.</span>
          <div class="space-x-2">
            <button type="button" id="cancelTravelerModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </div>
      </form>
    `;
    
    // Insert loading indicator while fetching country codes
    const dropdownContainer = modal.querySelector('#countryCodeDropdownContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-sm text-gray-500 py-2';
    loadingDiv.textContent = 'Loading country codes...';
    dropdownContainer.appendChild(loadingDiv);
    
    // Show modal immediately
    overlay.appendChild(modal);
    container.appendChild(overlay);
    
    // After country codes are loaded, render dropdown
    loadCountryPhoneCodes().then(() => {
        dropdownContainer.innerHTML = '';
        const initialCode = 'US';
        createCountryCodeDropdown(initialCode).then(countryDropdown => {
            dropdownContainer.appendChild(countryDropdown.wrapper);
            
            // Track the currently selected country
            let currentCountry = null;
            countryDropdown.input.addEventListener('countrychange', (e) => {
                currentCountry = e.detail;
            });
            
            // Phone mask logic
            const phoneInput = modal.querySelector('input[name="primaryPhone"]');
            function updatePhoneMask() {
                const country = currentCountry;
                if (country && country.code === 'US') {
                    phoneInput.placeholder = 'xxx-xxx-xxxx';
                    phoneInput.value = '';
                    phoneInput.maxLength = 12;
                    if (!phoneInput._usMaskHandler) {
                        phoneInput._usMaskHandler = function(e) {
                            let v = phoneInput.value.replace(/\D/g, '');
                            if (v.length > 10) v = v.slice(0, 10);
                            let out = '';
                            if (v.length > 6) out = v.slice(0,3) + '-' + v.slice(3,6) + '-' + v.slice(6);
                            else if (v.length > 3) out = v.slice(0,3) + '-' + v.slice(3);
                            else out = v;
                            phoneInput.value = out;
                        };
                        phoneInput.addEventListener('input', phoneInput._usMaskHandler);
                    }
                } else {
                    phoneInput.placeholder = '';
                    phoneInput.value = '';
                    phoneInput.maxLength = 30;
                    if (phoneInput._usMaskHandler) {
                        phoneInput.removeEventListener('input', phoneInput._usMaskHandler);
                        phoneInput._usMaskHandler = null;
                    }
                }
            }
            
            countryDropdown.input.addEventListener('countrychange', updatePhoneMask);
            updatePhoneMask();
            
            // Save handler uses currentCountry
            modal.querySelector('#addTravelerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const form = e.target;
                const data = Object.fromEntries(new FormData(form).entries());
                
                // Defensive: If code is missing or not found, default to 'US'
                let country = currentCountry;
                if (!country || !country.code) {
                    console.warn('[AddTraveler] Selected country code invalid, defaulting to US:', country);
                    country = { code: 'US', dial_code: '+1' };
                }
                
                // Log the country code being saved
                console.log('[AddTraveler] Saving country code:', country.code);
                data.primaryPhoneCountry = country ? country.code : 'US';
                data.primaryPhone = formatPhoneForStorage(phoneInput.value, country);
                
                // Convert dateOfBirth to string if present
                if (data.dateOfBirth instanceof Date) {
                    data.dateOfBirth = data.dateOfBirth.toISOString().split('T')[0];
                }
                
                // Generate a UUID for the new traveler
                data.id = crypto.randomUUID();
                
                // Validate required fields
                const requiredFields = ['firstName', 'lastName', 'primaryPhone', 'primaryPhoneCountry', 'primaryEmail'];
                for (const field of requiredFields) {
                    if (!data[field] || !data[field].trim()) {
                        showTravelerFormError(modal, 'Please fill out all required fields.');
                        return;
                    }
                }
                
                // Uniqueness validation (guard against undefined/null travelers)
                const travelers = TravelerService.getAll();
                const duplicate = travelers.find(t =>
                    t && typeof t === 'object' &&
                    typeof t.firstName === 'string' && typeof t.lastName === 'string' &&
                    ((t.firstName.trim().toLowerCase() === data.firstName.trim().toLowerCase() &&
                     t.lastName.trim().toLowerCase() === data.lastName.trim().toLowerCase()) ||
                    (t.primaryEmail && t.primaryEmail.trim().toLowerCase() === data.primaryEmail.trim().toLowerCase()) ||
                    (t.primaryPhone && t.primaryPhone.trim() === data.primaryPhone.trim()))
                );
                
                if (duplicate) {
                    let conflict = [];
                    if (duplicate.primaryEmail === data.primaryEmail) conflict.push('email');
                    if (duplicate.primaryPhone === data.primaryPhone) conflict.push('phone');
                    if (duplicate.firstName === data.firstName && duplicate.lastName === data.lastName) conflict.push('name');
                    showTravelerFormError(modal, 'Duplicate traveler: ' + conflict.join(', '));
                    return;
                }
                
                // Validate with TravelerService
                if (!TravelerService.validate(data)) {
                    showTravelerFormError(modal, 'Invalid traveler data. Please check your entries.');
                    return;
                }
                
                try {
                    TravelerService.add(data);
                    container.innerHTML = '';
                    if (fromComboBox && comboFormType) {
                        if (!Array.isArray(formData[comboFormType].selectedTravelers)) formData[comboFormType].selectedTravelers = [];
                        if (!formData[comboFormType].selectedTravelers.includes(data.id)) {
                            formData[comboFormType].selectedTravelers.push(data.id);
                            storage.saveFormData(formData);
                        }
                        refreshAllTravelerSelectors();
                    } else if (fromManageTravelers) {
                        showManageTravelersModal();
                        refreshAllTravelerSelectors();
                    } else {
                        refreshAllTravelerSelectors();
                    }
                    if (onSave) onSave();
                } catch (err) {
                    showTravelerFormError(modal, 'Failed to add traveler: ' + (err.message || err));
                }
            });
        });
    }).catch(() => {
        dropdownContainer.innerHTML = '<div class="text-red-600 text-sm">Failed to load country codes.</div>';
    });
    
    // Close modal on overlay click or cancel
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            container.innerHTML = '';
        }
    });
    
    modal.querySelector('#cancelTravelerModal').addEventListener('click', () => {
        if (fromManageTravelers) {
            container.innerHTML = '';
            showManageTravelersModal();
        } else {
            container.innerHTML = '';
        }
    });
    
    modal.tabIndex = 0;
    modal.focus();
}

// Will be imported from traveler.core.js
async function createCountryCodeDropdown(selectedCode = 'US') {
    // Implementation moved to traveler.core.js
    // This implementation will be provided by the import
}

export {
    showAddTravelerModal,
    showEditTravelerModal
};

// Implementation of showEditTravelerModal would be here,
// but is omitted for LOC considerations