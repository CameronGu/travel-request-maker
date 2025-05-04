import { TravelerService } from './travelerService.js';
// DEV ONLY: Expose TravelerService for browser console testing. Remove before production.
window.TravelerService = TravelerService;



// DOM Elements
const travelerSelect = document.getElementById('travelerSelect');
const addTravelerBtn = document.getElementById('addTraveler');
const tabs = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const travelerCombobox = document.getElementById('travelerCombobox');

// State Management
let currentTraveler = null;
let currentTab = 'hotel';
let formData = {
    hotel: {},
    flight: {},
    car: {}
};
let initialFormData = {
    hotel: {},
    flight: {},
    car: {}
};
let hasUnsavedChanges = false;
let isTransitioning = false;

// Initialize localStorage
const storage = {
    getTravelers() {
        return JSON.parse(localStorage.getItem('travelers') || '[]');
    },
    saveTravelers(travelers) {
        localStorage.setItem('travelers', JSON.stringify(travelers));
    },
    getFormData() {
        return JSON.parse(localStorage.getItem('formData') || '{}');
    },
    saveFormData(data) {
        localStorage.setItem('formData', JSON.stringify(data));
    }
};

// Event Listeners
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        const newTab = e.target.dataset.tab;
        if (newTab !== currentTab && !isTransitioning) {
            handleTabSwitch(newTab);
        }
    });
});

addTravelerBtn.addEventListener('click', showAddTravelerModal);
travelerCombobox.addEventListener('change', handleTravelerChange);
copyBtn.addEventListener('click', copyToClipboard);
shareBtn.addEventListener('click', shareRequest);

// Form Data Management
function serializeForm(tabType) {
    const formId = `${tabType}Form`;
    const form = document.getElementById(formId);
    if (!form) {
        console.warn(`Form not found with ID: ${formId}`);
        return {};
    }
    
    const formData = {};
    const formElements = form.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
        if (element.type === 'checkbox' || element.type === 'radio') {
            formData[element.name] = element.checked;
        } else {
            formData[element.name] = element.value;
        }
    });
    
    return formData;
}

function deserializeForm(tabType, data) {
    if (!data) return;
    
    const formId = `${tabType}Form`;
    const form = document.getElementById(formId);
    if (!form) {
        console.warn(`Form not found with ID: ${formId}`);
        return;
    }
    
    const formElements = form.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
        if (element.name in data) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = data[element.name];
            } else {
                element.value = data[element.name];
            }
        }
    });
}

function saveCurrentFormData() {
    formData[currentTab] = serializeForm(currentTab);
    storage.saveFormData(formData);
    detectChanges();
}

function detectChanges() {
    // Check all tabs for changes, not just the current one
    let anyChanges = false;
    Object.keys(formData).forEach(tabType => {
        const formStr = JSON.stringify(formData[tabType]);
        const initialStr = JSON.stringify(initialFormData[tabType]);
        if (formStr !== initialStr) {
            anyChanges = true;
        }
    });
    
    if (anyChanges !== hasUnsavedChanges) {
        hasUnsavedChanges = anyChanges;
        updateTabIndicator();
    }
}

function updateTabIndicator() {
    tabs.forEach(tab => {
        const tabType = tab.dataset.tab;
        const formStr = JSON.stringify(formData[tabType]);
        const initialStr = JSON.stringify(initialFormData[tabType]);
        
        if (formStr !== initialStr) {
            tab.classList.add('unsaved');
        } else {
            tab.classList.remove('unsaved');
        }
    });
}

// Tab Switching
async function handleTabSwitch(newTab) {
    if (isTransitioning) return;
    
    // Save current form data before switching
    saveCurrentFormData();
    
    // Switch to the new tab
    switchTab(newTab);
}

function switchTab(newTab) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Save current tab's form data
    saveCurrentFormData();

    // Update UI - only use tab-active class
    tabs.forEach(tab => {
        const tabType = tab.dataset.tab;
        if (tabType === newTab) {
            tab.classList.add('tab-active');
        } else {
            tab.classList.remove('tab-active');
        }
    });

    // Hide current content and show new content
    const currentFormId = `${currentTab}Form`;
    const newFormId = `${newTab}Form`;
    const currentContent = document.getElementById(currentFormId);
    const newContent = document.getElementById(newFormId);

    if (!currentContent || !newContent) {
        console.error('Tab content not found:', { currentFormId, newFormId });
        isTransitioning = false;
        return;
    }

    // First, ensure new content is ready but invisible
    newContent.style.display = 'block';
    newContent.classList.add('opacity-0');
    
    // Then animate current content out
    currentContent.classList.add('opacity-0');
    
    // After current content fades out, switch visibility
    setTimeout(() => {
        currentContent.style.display = 'none';
        currentContent.classList.add('hidden');
        
        // Trigger fade in of new content
        requestAnimationFrame(() => {
            newContent.classList.remove('opacity-0');
            newContent.classList.remove('hidden');
        });
    }, 300);

    // Update state
    currentTab = newTab;

    // Load the form data for the new tab
    deserializeForm(currentTab, formData[currentTab]);

    // Reset transition lock after animation
    setTimeout(() => {
        isTransitioning = false;
    }, 350);

    // Update indicators
    updateTabIndicator();
}

// Traveler Management
let countryPhoneCodes = null;
let countryPhoneCodesPromise = null;

function loadCountryPhoneCodes() {
    if (countryPhoneCodes) return Promise.resolve(countryPhoneCodes);
    if (countryPhoneCodesPromise) return countryPhoneCodesPromise;
    countryPhoneCodesPromise = fetch('./src/data/country-phone-codes.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load country codes');
            return res.json();
        })
        .then(data => {
            countryPhoneCodes = data;
            return data;
        })
        .catch(err => {
            countryPhoneCodesPromise = null;
            throw err;
        });
    return countryPhoneCodesPromise;
}

async function getSortedCountryCodes() {
    const codes = await loadCountryPhoneCodes();
    const top = [
        { name: 'United States', dial_code: '+1', emoji: '🇺🇸', code: 'US' },
        { name: 'Canada', dial_code: '+1', emoji: '🇨🇦', code: 'CA' },
        { name: 'Mexico', dial_code: '+52', emoji: '🇲🇽', code: 'MX' }
    ];
    const rest = codes.filter(c => !['US', 'CA', 'MX'].includes(c.code))
        .sort((a, b) => a.name.localeCompare(b.name));
    return [...top, ...rest];
}

async function createCountryCodeDropdown(selectedCode = '+1') {
    // Wrapper for label + input in a column, matching phone input style
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col w-32';
    // Label
    const label = document.createElement('label');
    label.className = 'form-label mb-1';
    label.textContent = 'Country Code *';
    wrapper.appendChild(label);
    // Input row (relative for dropdown)
    const inputRow = document.createElement('div');
    inputRow.className = 'relative';
    // Input for search/filter
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input w-full pl-2 pr-2 py-1 text-sm';
    input.placeholder = 'Search country...';
    input.autocomplete = 'off';
    input.tabIndex = 0;
    inputRow.appendChild(input);
    // Chip for selected country (hidden by default)
    const chip = document.createElement('span');
    chip.className = 'absolute left-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5 text-xs shadow-sm pointer-events-none';
    chip.style.display = 'none';
    inputRow.appendChild(chip);
    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute left-0 right-0 bg-white border border-gray-300 rounded shadow max-h-60 mt-1 z-50 hidden overflow-y-auto';
    dropdown.setAttribute('role', 'listbox');
    dropdown.style.maxHeight = '15rem';
    dropdown.style.top = '100%';
    dropdown.style.minWidth = '100%';
    let countryList = await getSortedCountryCodes();
    let filtered = countryList;
    let selected = countryList.find(c => c.dial_code === selectedCode) || countryList[0];
    function renderDropdown() {
        dropdown.innerHTML = '';
        filtered.forEach((country, i) => {
            const li = document.createElement('div');
            li.className = 'flex flex-col px-2 py-1 cursor-pointer hover:bg-blue-100 text-sm w-full';
            li.innerHTML = `
              <div class=\"flex items-center space-x-2\">
                <span>${country.emoji}</span>
                <span class=\"font-medium\">${country.dial_code}</span>
              </div>
              <div class=\"text-xs text-gray-500 truncate\">${country.name}</div>
            `;
            li.tabIndex = 0;
            li.setAttribute('role', 'option');
            li.style.overflow = 'hidden';
            li.style.whiteSpace = 'normal';
            li.style.textOverflow = 'ellipsis';
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectCountry(country);
                closeDropdown();
            });
            dropdown.appendChild(li);
        });
    }
    function openDropdown() {
        dropdown.classList.remove('hidden');
        renderDropdown();
    }
    function closeDropdown() {
        dropdown.classList.add('hidden');
    }
    function selectCountry(country) {
        selected = country;
        // Show chip with flag, code letters, and dial code
        chip.innerHTML = `<span>${country.emoji}</span><span class="ml-1 font-medium">${country.code}</span><span class="ml-1">${country.dial_code}</span>`;
        chip.style.display = 'flex';
        input.value = '';
        input.placeholder = '';
        input.setAttribute('data-country', country.code);
        input.setAttribute('data-dial-code', country.dial_code);
        input.setAttribute('data-country-name', country.name);
        input.setAttribute('data-flag', country.emoji);
        input.dispatchEvent(new CustomEvent('countrychange', { detail: country }));
    }
    // Make input searchable and always show dropdown on focus/click
    function clearChipAndInput() {
        chip.style.display = 'none';
        chip.innerHTML = '';
        input.value = '';
        input.placeholder = 'Search country...';
    }
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        filtered = countryList.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.dial_code.replace('+', '').includes(q.replace('+', '')) ||
            c.code.toLowerCase().includes(q)
        );
        openDropdown();
    });
    input.addEventListener('focus', () => {
        clearChipAndInput();
        filtered = countryList;
        openDropdown();
    });
    input.addEventListener('click', () => {
        clearChipAndInput();
        filtered = countryList;
        openDropdown();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter') openDropdown();
        if (e.key === 'Escape') closeDropdown();
    });
    document.addEventListener('mousedown', (e) => {
        if (!wrapper.contains(e.target)) closeDropdown();
    });
    // Initial selection
    selectCountry(selected);
    // Compose
    inputRow.appendChild(dropdown);
    wrapper.appendChild(inputRow);
    return { wrapper, input, getSelected: () => selected, setSelected: selectCountry };
}

function showAddTravelerModal() {
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
        createCountryCodeDropdown('+1').then(countryDropdown => {
            dropdownContainer.appendChild(countryDropdown.wrapper);
            // Phone mask logic
            const phoneInput = modal.querySelector('input[name="primaryPhone"]');
            function updatePhoneMask() {
                const country = countryDropdown.getSelected();
                if (country.code === 'US') {
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
        container.innerHTML = '';
    });
    // Error display helper (hoisted so it's always defined before use)
    function showTravelerFormError(msg) {
        modal.querySelector('#travelerFormError').textContent = msg;
    }
    // Handle form submission (unchanged)
    modal.querySelector('#addTravelerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        // Use selected country code
        const countryDropdownEl = dropdownContainer.querySelector('.relative');
        let country = null;
        if (countryDropdownEl && countryDropdownEl.input) {
            country = countryDropdownEl.getSelected();
        } else if (countryPhoneCodes && countryPhoneCodes.length) {
            country = countryPhoneCodes[0];
        }
        // Validate phone number
        const phoneInputVal = modal.querySelector('input[name="primaryPhone"]').value;
        if (!validatePhoneNumber(phoneInputVal, country)) {
            showTravelerFormError('Invalid phone number for selected country.');
            return;
        }
        data.primaryPhoneCountry = country ? country.dial_code : '';
        data.primaryPhone = formatPhoneForStorage(phoneInputVal, country);
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
                showTravelerFormError('Please fill out all required fields.');
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
            showTravelerFormError('Duplicate traveler: ' + conflict.join(', '));
            return;
        }
        // Validate with TravelerService
        if (!TravelerService.validate(data)) {
            showTravelerFormError('Invalid traveler data. Please check your entries.');
            return;
        }
        try {
            TravelerService.add(data);
            container.innerHTML = '';
            refreshTravelerCombobox();
        } catch (err) {
            showTravelerFormError('Failed to add traveler: ' + (err.message || err));
        }
    });
    // Restrict non-US phone input to numeric only as user types
    modal.addEventListener('input', function(e) {
        if (e.target && e.target.name === 'primaryPhone') {
            const countryDropdownEl = dropdownContainer.querySelector('.relative');
            let country = null;
            if (countryDropdownEl && countryDropdownEl.input) {
                country = countryDropdownEl.getSelected();
            } else if (countryPhoneCodes && countryPhoneCodes.length) {
                country = countryPhoneCodes[0];
            }
            if (country && country.code !== 'US') {
                // Only allow digits
                const digits = e.target.value.replace(/\D/g, '');
                if (e.target.value !== digits) {
                    e.target.value = digits;
                }
            }
        }
    });
    modal.tabIndex = 0;
    modal.focus();
}

function handleTravelerChange(event) {
    if (hasUnsavedChanges) {
        const confirmed = window.confirm('You have unsaved changes. Do you want to discard them and switch travelers?');
        if (!confirmed) {
            event.preventDefault();
            travelerCombobox.value = currentTraveler; // Revert selection
            return;
        }
    }
    
    // Save current form data before switching travelers
    saveCurrentFormData();
    
    currentTraveler = event.target.value;
    loadTravelerData();
    refreshTravelerCombobox();
}

function loadTravelerData() {
    if (!currentTraveler) return;
    
    const savedData = storage.getFormData()[currentTraveler];
    if (savedData) {
        formData = savedData;
        initialFormData = JSON.parse(JSON.stringify(savedData));
        updateForms();
    } else {
        formData = { hotel: {}, flight: {}, car: {} };
        initialFormData = { hotel: {}, flight: {}, car: {} };
    }
    hasUnsavedChanges = false;
    updateTabIndicator();
}

function updateForms() {
    deserializeForm(currentTab, formData[currentTab]);
}

// Clipboard and Sharing
function copyToClipboard() {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary)
        .then(() => {
            // TODO: Show success message
            console.log('Copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
        });
}

function shareRequest() {
    const data = btoa(JSON.stringify(formData));
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    
    // TODO: Show share dialog
    console.log('Share URL:', url);
}

function generateSummary() {
    // TODO: Implement summary generation
    return 'Summary not yet implemented';
}

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
        const travelers = TravelerService.getAll();

        // Load stored form data if it exists
        const storedData = storage.getFormData();
        if (Object.keys(storedData).length > 0) {
            formData = storedData;
            initialFormData = JSON.parse(JSON.stringify(storedData));
        } else {
            // Set initial form data from current forms
            Object.keys(formData).forEach(type => {
                formData[type] = serializeForm(type);
                initialFormData[type] = { ...formData[type] };
            });
        }

        // Set up initial tab states and classes
        const forms = ['hotel', 'flight', 'car'];
        forms.forEach(formType => {
            const form = document.getElementById(`${formType}Form`);
            const tab = document.querySelector(`[data-tab="${formType}"]`);
            
            if (form) {
                if (formType === currentTab) {
                    form.style.display = 'block';
                    form.classList.remove('opacity-0');
                    form.classList.remove('hidden');
                    if (tab) {
                        tab.classList.add('tab-active');
                    }
                } else {
                    form.style.display = 'none';
                    form.classList.add('opacity-0');
                    form.classList.add('hidden');
                    if (tab) {
                        tab.classList.remove('tab-active');
                    }
                }
            }
        });

        // Load the current tab's form data
        deserializeForm(currentTab, formData[currentTab]);

        // Set up form change detection
        tabContents.forEach(content => {
            const formElements = content.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                element.addEventListener('change', () => {
                    saveCurrentFormData();
                });
                element.addEventListener('input', () => {
                    saveCurrentFormData();
                });
            });
        });

        // Always show debug button for now since we're in development
        addDebugButton();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);

// Helper for traveler display name
function getTravelerDisplayName(traveler) {
    if (!traveler) return '';
    if (traveler.preferredName && traveler.preferredName.trim()) {
        return `${traveler.preferredName} (${traveler.firstName} ${traveler.lastName})`;
    }
    return `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim();
}

class TravelerCombobox {
    constructor(container, onSelect) {
        this.container = container;
        this.onSelect = onSelect;
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'form-input w-full';
        this.input.placeholder = 'Select or search traveler...';
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded shadow max-h-60 mt-1 hidden';
        this.dropdown.setAttribute('role', 'listbox');
        // Create a scrollable list container inside the dropdown
        this.listContainer = document.createElement('ul');
        this.listContainer.className = 'overflow-auto max-h-60 relative';
        // Shadows as fixed overlays inside dropdown
        this.topShadow = document.createElement('div');
        this.topShadow.className = 'pointer-events-none absolute left-0 right-0 h-4 top-0 z-20 bg-gradient-to-b from-gray-100 to-transparent opacity-0 transition-opacity';
        this.bottomShadow = document.createElement('div');
        this.bottomShadow.className = 'pointer-events-none absolute left-0 right-0 h-4 bottom-0 z-20 bg-gradient-to-t from-gray-100 to-transparent opacity-0 transition-opacity';
        this.container.classList.add('relative');
        this.container.appendChild(this.input);
        this.container.appendChild(this.dropdown);
        this.dropdown.appendChild(this.listContainer);
        this.dropdown.appendChild(this.topShadow);
        this.dropdown.appendChild(this.bottomShadow);
        this.travelerList = [];
        this.filtered = [];
        this.selectedIndex = -1;
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKey(e));
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) this.close();
        });
        this.listContainer.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        this.render();
    }
    setTravelers(travelers) {
        this.travelerList = travelers;
        this.filtered = travelers.slice();
        this.selectedIndex = -1;
        this.render();
    }
    handleFocus() {
        if (this.input.value.trim() === '') {
            this.filtered = this.travelerList.slice();
        } else {
            this.handleInput();
        }
        this.selectedIndex = -1;
        this.open();
        this.render();
    }
    handleInput() {
        const q = this.input.value.trim().toLowerCase();
        if (q === '') {
            this.filtered = this.travelerList.slice();
        } else {
            this.filtered = this.travelerList.filter(t =>
                (t.firstName && t.firstName.toLowerCase().includes(q)) ||
                (t.lastName && t.lastName.toLowerCase().includes(q)) ||
                (t.preferredName && t.preferredName.toLowerCase().includes(q)) ||
                (t.nationality && t.nationality.toLowerCase().includes(q)) ||
                (t.primaryEmail && t.primaryEmail.toLowerCase().includes(q))
            );
        }
        this.selectedIndex = -1;
        this.open();
        this.render();
    }
    open() {
        this.dropdown.classList.remove('hidden');
    }
    close() {
        this.dropdown.classList.add('hidden');
        this.selectedIndex = -1;
    }
    handleKey(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.selectedIndex < this.filtered.length) this.selectedIndex++;
            this.render();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.selectedIndex > 0) this.selectedIndex--;
            this.render();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex === this.filtered.length) {
                this.onSelect('__add_new__');
                this.input.value = '';
                this.close();
            } else if (this.selectedIndex >= 0 && this.selectedIndex < this.filtered.length) {
                this.onSelect(this.filtered[this.selectedIndex].id);
                this.input.value = getTravelerDisplayName(this.filtered[this.selectedIndex]);
                this.close();
            }
        } else if (e.key === 'Escape') {
            this.close();
        }
    }
    render() {
        // Remove all traveler options before re-rendering
        this.listContainer.innerHTML = '';
        this.filtered.forEach((traveler, i) => {
            const li = document.createElement('li');
            li.className = 'px-4 py-2 cursor-pointer hover:bg-blue-100' + (i === this.selectedIndex ? ' bg-blue-100' : '');
            li.textContent = getTravelerDisplayName(traveler);
            li.setAttribute('role', 'option');
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onSelect(traveler.id);
                this.input.value = getTravelerDisplayName(traveler);
                this.close();
            });
            this.listContainer.appendChild(li);
        });
        // Add New Traveler option
        const addLi = document.createElement('li');
        addLi.className = 'px-4 py-2 cursor-pointer text-blue-600 hover:bg-blue-50 border-t border-gray-200' + (this.selectedIndex === this.filtered.length ? ' bg-blue-100' : '');
        addLi.textContent = '➕ Add New Traveler';
        addLi.setAttribute('role', 'option');
        addLi.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.onSelect('__add_new__');
            this.input.value = '';
            this.close();
        });
        this.listContainer.appendChild(addLi);
        // Scroll highlighted option into view
        if (this.selectedIndex >= 0 && this.selectedIndex <= this.filtered.length) {
            const optionEls = this.listContainer.querySelectorAll('li');
            if (optionEls[this.selectedIndex]) {
                optionEls[this.selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
        // Show/hide scroll shadows only if dropdown is open
        if (!this.dropdown.classList.contains('hidden')) {
            const scrollTop = this.listContainer.scrollTop;
            const scrollHeight = this.listContainer.scrollHeight;
            const clientHeight = this.listContainer.clientHeight;
            this.topShadow.style.opacity = scrollTop > 0 ? '1' : '0';
            this.bottomShadow.style.opacity = (scrollTop + clientHeight < scrollHeight) ? '1' : '0';
        } else {
            this.topShadow.style.opacity = '0';
            this.bottomShadow.style.opacity = '0';
        }
    }
    setValue(travelerId) {
        const t = this.travelerList.find(t => t.id === travelerId);
        if (t) this.input.value = getTravelerDisplayName(t);
        else this.input.value = '';
    }
}

// Initialize custom combobox
const travelerComboboxDiv = document.getElementById('travelerCombobox');
let travelerComboboxInstance = null;
if (travelerComboboxDiv) {
    travelerComboboxInstance = new TravelerCombobox(travelerComboboxDiv, (selectedId) => {
        if (selectedId === '__add_new__') {
            showAddTravelerModal();
        } else {
            currentTraveler = selectedId;
            // Optionally trigger form reload or update
            loadTravelerData();
        }
    });
    // Load travelers initially
    travelerComboboxInstance.setTravelers(TravelerService.getAll());
}

// When travelers are added/edited, update combobox
function refreshTravelerCombobox() {
    if (travelerComboboxInstance) {
        travelerComboboxInstance.setTravelers(TravelerService.getAll());
        travelerComboboxInstance.setValue(currentTraveler);
    }
}

// E.164 phone validation helper
function validatePhoneNumber(phone, country) {
    if (country.code === 'US') {
        // US: must be in xxx-xxx-xxxx format, 12 chars
        return /^\d{3}-\d{3}-\d{4}$/.test(phone);
    } else {
        // E.164: only digits, 6-15 digits
        const digits = phone.replace(/\D/g, '');
        return /^\d{6,15}$/.test(digits);
    }
}

// Format phone for storage (E.164)
function formatPhoneForStorage(phone, country) {
    if (country.code === 'US') {
        // US: store as +1XXXXXXXXXX
        const digits = phone.replace(/\D/g, '');
        return '+1' + digits;
    } else {
        // Non-US: store as +<country code><digits>
        const digits = phone.replace(/\D/g, '');
        const code = country.dial_code.replace('+', '');
        return '+' + code + digits;
    }
}

// Simple test function for phone validation and traveler addition
function testTravelerPhoneValidation() {
    const us = { code: 'US', dial_code: '+1' };
    const fr = { code: 'FR', dial_code: '+33' };
    const validUS = '555-123-4567';
    const invalidUS = '5551234567';
    const validFR = '612345678';
    const invalidFR = '12';
    console.log('US valid:', validatePhoneNumber(validUS, us)); // true
    console.log('US invalid:', validatePhoneNumber(invalidUS, us)); // false
    console.log('FR valid:', validatePhoneNumber(validFR, fr)); // true
    console.log('FR invalid:', validatePhoneNumber(invalidFR, fr)); // false
    // Add a test traveler
    const traveler = {
        id: crypto.randomUUID(),
        firstName: 'Test',
        lastName: 'User',
        primaryPhone: formatPhoneForStorage(validFR, fr),
        primaryPhoneCountry: '+33',
        primaryEmail: 'test@example.com',
    };
    TravelerService.add(traveler);
    const all = TravelerService.getAll();
    console.log('Traveler added:', all.find(t => t.id === traveler.id));
}
window.testTravelerPhoneValidation = testTravelerPhoneValidation; 