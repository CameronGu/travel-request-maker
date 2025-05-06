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
const manageTravelersBtn = document.getElementById('manageTravelersBtn');

// Per-form traveler selectors
const travelerSelectors = {
    hotel: document.getElementById('hotelTravelerSelector'),
    flight: document.getElementById('flightTravelerSelector'),
    car: document.getElementById('carTravelerSelector'),
};

// State Management
let currentTab = 'hotel';
let formData = {
    hotel: { selectedTravelers: [] },
    flight: { selectedTravelers: [] },
    car: { selectedTravelers: [] }
};
let initialFormData = {
    hotel: { selectedTravelers: [] },
    flight: { selectedTravelers: [] },
    car: { selectedTravelers: [] }
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
            if (element.type === 'checkbox') {
                element.checked = data[element.name];
            } else if (element.type === 'radio') {
                element.checked = (element.value === data[element.name]);
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
    // Use the actual objects from the loaded country list for the top 3
    const topCodes = ['US', 'CA', 'MX'];
    const top = topCodes.map(code => codes.find(c => c.code === code)).filter(Boolean);
    const rest = codes.filter(c => !topCodes.includes(c.code))
        .sort((a, b) => a.name.localeCompare(b.name));
    return [...top, ...rest];
}

// Centralized traveler requirements by request type
const REQUIREMENTS_BY_TYPE = {
    hotel: [], // No required traveler fields for hotel, but structure is ready for future
    flight: ['dateOfBirth'], // Example for flight
    car: []
};

// --- Country Dropdown: Keyboard Navigation and Retain Selection ---
async function createCountryCodeDropdown(selectedCode = 'US') {
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
    let selected = countryList.find(c => c.code === selectedCode);
    if (!selected) {
        // Debug log to help diagnose country reset issues
        console.warn('[CountryDropdown] Could not find country for code:', selectedCode, 'Defaulting to US.');
        selected = countryList.find(c => c.code === 'US') || countryList[0];
    }
    let dropdownIndex = -1; // For keyboard navigation
    function renderDropdown() {
        dropdown.innerHTML = '';
        filtered.forEach((country, i) => {
            const li = document.createElement('div');
            li.className = 'flex flex-col px-2 py-1 cursor-pointer hover:bg-blue-100 text-sm w-full' + (i === dropdownIndex ? ' bg-blue-100' : '');
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
        dropdownIndex = -1;
    }
    function selectCountry(country) {
        selected = country;
        chip.innerHTML = `<span>${country.emoji}</span><span class="ml-1 font-medium">${country.code}</span><span class="ml-1">${country.dial_code}</span>`;
        chip.style.display = 'flex';
        input.value = '';
        input.placeholder = '';
        input.setAttribute('data-country', country.code);
        input.setAttribute('data-dial-code', country.dial_code);
        input.setAttribute('data-country-name', country.name);
        input.setAttribute('data-flag', country.emoji);
        input.dispatchEvent(new CustomEvent('countrychange', { detail: country }));
        closeDropdown();
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
        dropdownIndex = -1;
        openDropdown();
    });
    input.addEventListener('focus', () => {
        clearChipAndInput();
        filtered = countryList;
        dropdownIndex = -1;
        openDropdown();
    });
    input.addEventListener('click', () => {
        clearChipAndInput();
        filtered = countryList;
        dropdownIndex = -1;
        openDropdown();
    });
    // Keyboard navigation for country dropdown
    input.addEventListener('keydown', (e) => {
        if (dropdown.classList.contains('hidden')) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                openDropdown();
                e.preventDefault();
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (dropdownIndex < filtered.length - 1) dropdownIndex++;
            else dropdownIndex = 0;
            renderDropdown();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (dropdownIndex > 0) dropdownIndex--;
            else dropdownIndex = filtered.length - 1;
            renderDropdown();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (dropdownIndex >= 0 && dropdownIndex < filtered.length) {
                selectCountry(filtered[dropdownIndex]);
            } else if (filtered.length === 1) {
                selectCountry(filtered[0]);
            }
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
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
        if (!countryPhoneCodes.find(c => c.code === initialCode)) {
            console.warn('[AddTraveler] Initial country code not found in country list:', initialCode, countryPhoneCodes);
        }
        createCountryCodeDropdown(initialCode).then(countryDropdown => {
            dropdownContainer.appendChild(countryDropdown.wrapper);
            // Track the currently selected country
            let currentCountry = countryPhoneCodes.find(c => c.code === initialCode) || countryPhoneCodes[0];
            countryDropdown.input.addEventListener('countrychange', (e) => {
                currentCountry = e.detail;
            });
            // Phone mask logic
            const phoneInput = modal.querySelector('input[name="primaryPhone"]');
            function updatePhoneMask() {
                const country = currentCountry;
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
            // Save handler uses currentCountry
            modal.querySelector('#addTravelerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const form = e.target;
                const data = Object.fromEntries(new FormData(form).entries());
                // Defensive: If code is missing or not found, default to 'US'
                let country = currentCountry;
                if (!country || !country.code || !countryPhoneCodes.find(c => c.code === country.code)) {
                    console.warn('[AddTraveler] Selected country code invalid, defaulting to US:', country);
                    country = countryPhoneCodes.find(c => c.code === 'US') || countryPhoneCodes[0];
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
                    showTravelerFormError('Failed to add traveler: ' + (err.message || err));
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
    // Error display helper (hoisted so it's always defined before use)
    function showTravelerFormError(msg) {
        modal.querySelector('#travelerFormError').textContent = msg;
    }
    modal.tabIndex = 0;
    modal.focus();
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

        // Set default values for hotel form if not present
        if (!formData.hotel.locationBehavior) formData.hotel.locationBehavior = 'general';
        if (!formData.hotel.radius) formData.hotel.radius = '10';
        if (!initialFormData.hotel.locationBehavior) initialFormData.hotel.locationBehavior = 'general';
        if (!initialFormData.hotel.radius) initialFormData.hotel.radius = '10';
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

        // Render per-form traveler selectors after DOM is ready and forms are set up
        renderPerFormTravelerSelectors();

        // Set up Manage Travelers button event listener after DOM is ready
        if (manageTravelersBtn) {
            manageTravelersBtn.addEventListener('click', showManageTravelersModal);
        }

        // Hotel form field validation and error handling
        const hotelForm = document.querySelector('#hotelForm form');
        const travelerSelectorErrorId = 'hotelTravelerSelectorError';
        let travelerSelectorError = document.getElementById(travelerSelectorErrorId);
        if (!travelerSelectorError) {
            const selectorDiv = document.getElementById('hotelTravelerSelector');
            travelerSelectorError = document.createElement('div');
            travelerSelectorError.id = travelerSelectorErrorId;
            travelerSelectorError.className = 'text-red-600 text-sm mt-1';
            travelerSelectorError.setAttribute('aria-live', 'polite');
            travelerSelectorError.style.display = 'none';
            selectorDiv && selectorDiv.parentNode.insertBefore(travelerSelectorError, selectorDiv.nextSibling);
        }

        function showError(el, msg) {
            el.textContent = msg;
            el.style.display = 'block';
        }
        function clearError(el) {
            el.textContent = '';
            el.style.display = 'none';
        }
        function clearAllErrors() {
            [travelerSelectorError].forEach(clearError);
        }
        function clearSuccess() {
            hotelFormSuccess.textContent = '';
            hotelFormSuccess.style.display = 'none';
        }
        function validateHotelForm() {
            let valid = true;
            clearAllErrors();
            clearSuccess();
            // Dates
            if (!validateDates()) valid = false;
            // Location behavior required
            const selectedBehavior = Array.from(locationBehaviorRadios).find(r => r.checked)?.value;
            if (!selectedBehavior) valid = false;
            if (selectedBehavior === 'property') {
                if (!propertyFields.querySelector('#propertyName').value.trim()) valid = false;
                if (!propertyFields.querySelector('#propertyAddress').value.trim()) valid = false;
            } else if (selectedBehavior === 'general') {
                if (!generalFields.querySelector('#generalAddress').value.trim()) valid = false;
                // radius is always set
            }
            // Traveler selection presence check
            const selectedTravelers = formData.hotel && Array.isArray(formData.hotel.selectedTravelers) ? formData.hotel.selectedTravelers : [];
            if (!selectedTravelers.length) {
                showError(travelerSelectorError, 'Please select at least one traveler for this request.');
                valid = false;
            }
            // Traveler required fields validation (using REQUIREMENTS_BY_TYPE['hotel'])
            const travelers = selectedTravelers.map(id => TravelerService.getAll().find(t => t.id === id)).filter(Boolean);
            let anyMissing = false;
            travelers.forEach(traveler => {
                const requiredFields = REQUIREMENTS_BY_TYPE['hotel'] || [];
                const missingFields = requiredFields.filter(field => !traveler[field] || !traveler[field].toString().trim());
                if (missingFields.length > 0) {
                    anyMissing = true;
                }
            });
            if (anyMissing) {
                showError(travelerSelectorError, 'Some travelers are missing required information. See warnings on chips.');
                valid = false;
            }
            return valid;
        }
        if (hotelForm) {
            hotelForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (validateHotelForm()) {
                    hotelFormSuccess.textContent = 'Hotel request submitted successfully!';
                    hotelFormSuccess.style.display = 'block';
                    hotelForm.reset();
                    totalNightsDisplay.textContent = '';
                    extendedStayOptions.style.display = 'none';
                } else {
                    hotelFormSuccess.textContent = '';
                    hotelFormSuccess.style.display = 'none';
                }
            });
        }
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

// --- Traveler phone validation and formatting utilities ---
function validatePhoneNumber(phone, country) {
    if (!phone || !country) return false;
    const digits = phone.replace(/\D/g, '');
    if (country.code === 'US') {
        return digits.length === 10;
    } else {
        return digits.length >= 5;
    }
}
function formatPhoneForStorage(phone, country) {
    if (!phone || !country) return '';
    const digits = phone.replace(/\D/g, '');
    if (country.code === 'US') {
        return digits;
    } else {
        return phone.trim();
    }
}

class TravelerCombobox {
    constructor(container, onSelect) {
        // Add label for accessibility
        const label = document.createElement('label');
        label.className = 'form-label block mb-1';
        label.textContent = 'Select Traveler(s)';
        label.setAttribute('for', 'traveler-combobox-input');
        container.appendChild(label);
        this.container = container;
        this.onSelect = onSelect;
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'form-input w-full';
        this.input.placeholder = 'Select or add traveler...';
        this.input.id = 'traveler-combobox-input';
        // Dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded shadow max-h-60 mt-1 hidden';
        this.dropdown.setAttribute('role', 'listbox');
        // List container
        this.listContainer = document.createElement('ul');
        this.listContainer.className = 'overflow-auto max-h-60 relative';
        // Shadows
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
        this.input.addEventListener('focus', () => {
            this.input.value = '';
            this.filtered = this.travelerList;
            this.selectedIndex = -1;
            this.open();
            this.render();
        });
        this.input.addEventListener('click', () => {
            this.input.value = '';
            this.filtered = this.travelerList;
            this.selectedIndex = -1;
            this.open();
            this.render();
        });
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
        this.handleInput();
        this.selectedIndex = -1;
        this.open();
        this.render();
    }
    handleInput() {
        const q = this.input.value.trim().toLowerCase();
        let filtered = this.travelerList;
        if (q !== '') {
            filtered = filtered.filter(t =>
                (t.firstName && t.firstName.toLowerCase().includes(q)) ||
                (t.lastName && t.lastName.toLowerCase().includes(q)) ||
                (t.preferredName && t.preferredName.toLowerCase().includes(q)) ||
                (t.nationality && t.nationality.toLowerCase().includes(q)) ||
                (t.primaryEmail && t.primaryEmail.toLowerCase().includes(q))
            );
        }
        this.filtered = filtered;
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
        this.listContainer.innerHTML = '';
        this.filtered.forEach((traveler, i) => {
            const li = document.createElement('li');
            li.className = 'px-4 py-2 cursor-pointer flex items-center space-x-2 hover:bg-blue-100' + (i === this.selectedIndex ? ' bg-blue-100' : '');
            // The status dot is a visual indicator of traveler status. Green = 'active' (default), gray = 'inactive', yellow = 'other'. If no status is present, 'active' is assumed.
            const status = traveler.status || 'active';
            const statusColor = status === 'active' ? 'bg-green-400' : status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-400';
            const dot = document.createElement('span');
            dot.className = `inline-block w-2 h-2 rounded-full ${statusColor}`;
            li.appendChild(dot);
            // Name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = getTravelerDisplayName(traveler);
            li.appendChild(nameSpan);
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

// Per-form traveler combobox and chips
const travelerComboboxInstances = {};
function renderPerFormTravelerSelectors() {
    Object.keys(travelerSelectors).forEach(formType => {
        const container = travelerSelectors[formType];
        if (!container) return;
        // Preserve error container if it exists
        const errorId = `${formType}TravelerSelectorError`;
        const existingError = document.getElementById(errorId);
        container.innerHTML = '';
        // Combobox
        const comboboxDiv = document.createElement('div');
        comboboxDiv.className = 'relative w-64';
        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'flex flex-wrap gap-2 mt-2';
        container.appendChild(comboboxDiv);
        container.appendChild(chipsDiv);
        // Re-attach error container if it existed
        if (existingError) {
            container.appendChild(existingError);
        }
        // Combobox instance
        travelerComboboxInstances[formType] = new TravelerCombobox(comboboxDiv, (selectedId) => {
            if (selectedId === '__add_new__') {
                showAddTravelerModal(() => refreshAllTravelerSelectors(), false, true, formType);
            } else {
                if (!Array.isArray(formData[formType].selectedTravelers)) formData[formType].selectedTravelers = [];
                if (!formData[formType].selectedTravelers.includes(selectedId)) {
                    formData[formType].selectedTravelers.push(selectedId);
                    storage.saveFormData(formData);
                    renderFormTravelerChips(formType);
                }
            }
        });
        travelerComboboxInstances[formType].setTravelers(TravelerService.getAll());
        // Chips
        renderFormTravelerChips(formType);
    });
}
function renderFormTravelerChips(formType) {
    if (!formData[formType].selectedTravelers || !Array.isArray(formData[formType].selectedTravelers)) {
        formData[formType].selectedTravelers = [];
    }
    // Remove duplicates from selectedTravelers
    formData[formType].selectedTravelers = Array.from(new Set(formData[formType].selectedTravelers));
    const container = travelerSelectors[formType];
    if (!container) return;
    const chipsDiv = container.querySelector('.flex.flex-wrap');
    if (!chipsDiv) return;
    chipsDiv.innerHTML = '';
    const ids = formData[formType].selectedTravelers || [];
    const travelers = ids.map(id => TravelerService.getAll().find(t => t.id === id)).filter(Boolean);
    travelers.forEach(traveler => {
        // Validation: collect missing required fields for this traveler
        const requiredFields = REQUIREMENTS_BY_TYPE[formType] || [];
        const missingFields = requiredFields.filter(field => !traveler[field] || !traveler[field].toString().trim());
        // Chip element
        const chip = document.createElement('div');
        chip.className = 'inline-flex items-center space-x-2 bg-blue-100 border border-blue-300 rounded-full px-3 py-1 text-sm shadow-sm cursor-pointer';
        chip.style.maxWidth = '';
        chip.tabIndex = 0;
        chip.setAttribute('role', 'button');
        chip.setAttribute('aria-label', `Traveler: ${getTravelerDisplayName(traveler)}`);
        // Subtle invalid indicator
        if (missingFields.length > 0) {
            chip.classList.add('border-red-400');
            chip.classList.add('ring-1', 'ring-red-300');
        }
        // Chip body (display name)
        const chipBody = document.createElement('span');
        chipBody.className = 'chip-body flex-1 truncate';
        chipBody.textContent = getTravelerDisplayName(traveler);
        chipBody.addEventListener('click', () => showTravelerDisplayModal(traveler.id));
        // Inline warnings (up to 2)
        let warningArea = null;
        if (missingFields.length > 0) {
            warningArea = document.createElement('span');
            warningArea.className = 'ml-2 text-xs text-red-600 flex items-center cursor-pointer';
            const warningsToShow = missingFields.slice(0, 2);
            warningArea.innerHTML = warningsToShow.map(f => `<span class='mr-1'>Missing: ${f}</span>`).join('');
            if (missingFields.length > 2) {
                const moreBadge = document.createElement('span');
                moreBadge.className = 'ml-1 bg-red-100 text-red-700 rounded px-1 py-0.5 text-xs font-semibold cursor-pointer';
                moreBadge.textContent = `+${missingFields.length - 2} more`;
                warningArea.appendChild(moreBadge);
                // Expandable drawer/accordion for all issues
                let expanded = false;
                const drawer = document.createElement('div');
                drawer.className = 'absolute z-20 bg-white border border-red-200 rounded shadow p-2 mt-1 text-xs text-red-700 hidden';
                drawer.innerHTML = missingFields.map(f => `<div>Missing: ${f}</div>`).join('');
                chip.appendChild(drawer);
                warningArea.addEventListener('click', (e) => {
                    e.stopPropagation();
                    expanded = !expanded;
                    drawer.style.display = expanded ? 'block' : 'none';
                });
            }
            chip.appendChild(warningArea);
        }
        // Edit icon
        const chipEdit = document.createElement('button');
        chipEdit.className = 'chip-edit ml-1 text-blue-700 hover:text-blue-900 focus:outline-none';
        chipEdit.setAttribute('aria-label', 'Edit traveler');
        chipEdit.innerHTML = '✎';
        chipEdit.tabIndex = 0;
        chipEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditTravelerModal(traveler.id, () => refreshAllTravelerSelectors(), false, true, formType);
        });
        // Remove icon
        const chipRemove = document.createElement('button');
        chipRemove.className = 'chip-remove ml-1 text-red-600 hover:text-red-800 focus:outline-none';
        chipRemove.setAttribute('aria-label', 'Remove traveler');
        chipRemove.innerHTML = '×';
        chipRemove.tabIndex = 0;
        chipRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!Array.isArray(formData[formType].selectedTravelers)) formData[formType].selectedTravelers = [];
            formData[formType].selectedTravelers = formData[formType].selectedTravelers.filter(id => id !== traveler.id);
            storage.saveFormData(formData);
            renderFormTravelerChips(formType);
            refreshAllTravelerSelectors();
        });
        chip.appendChild(chipBody);
        if (warningArea) chip.appendChild(warningArea);
        chip.appendChild(chipEdit);
        chip.appendChild(chipRemove);
        chip.addEventListener('click', () => showTravelerDisplayModal(traveler.id));
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                showTravelerDisplayModal(traveler.id);
            }
        });
        chipsDiv.appendChild(chip);
    });
}
function refreshAllTravelerSelectors() {
    Object.keys(travelerComboboxInstances).forEach(formType => {
        if (travelerComboboxInstances[formType]) {
            travelerComboboxInstances[formType].setTravelers(TravelerService.getAll());
        }
        renderFormTravelerChips(formType);
    });
}

// Manage Travelers Modal
function showManageTravelersModal() {
    const container = document.getElementById('travelerModalContainer');
    container.innerHTML = '';
    const travelers = TravelerService.getAll();
    // If no travelers, open Add New Traveler form directly
    if (!travelers || travelers.length === 0) {
        showAddTravelerModal(() => showManageTravelersModal(), true);
        return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center';
    overlay.tabIndex = -1;
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative';
    modal.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Manage Travelers</h2>
      <div class="flex justify-between items-center mb-4">
        <button id="addNewTravelerBtn" class="btn-primary">+ Add New Traveler</button>
      </div>
      <div id="manageTravelersList" class="divide-y divide-gray-200 max-h-96 overflow-y-auto"></div>
      <div class="flex justify-end space-x-2 mt-6">
        <button id="closeManageTravelersModal" class="btn-primary">Close</button>
      </div>
    `;
    overlay.appendChild(modal);
    container.appendChild(overlay);
    // Add New Traveler button handler
    modal.querySelector('#addNewTravelerBtn').addEventListener('click', () => {
        showAddTravelerModal(() => showManageTravelersModal(), true);
    });
    // Render traveler list
    function renderList() {
        const listDiv = modal.querySelector('#manageTravelersList');
        listDiv.innerHTML = '';
        TravelerService.getAll().forEach(traveler => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between py-3';
            row.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-semibold">${getTravelerDisplayName(traveler)}</span>
                    <span class="text-xs text-gray-500">${traveler.primaryEmail || ''} | ${traveler.primaryPhone || ''}</span>
                    <span class="text-xs text-gray-400">${traveler.notes || ''}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="btn-secondary" data-action="view" data-id="${traveler.id}">View</button>
                    <button class="btn-secondary" data-action="edit" data-id="${traveler.id}">Edit</button>
                    <button class="btn-secondary text-red-600" data-action="delete" data-id="${traveler.id}">Delete</button>
                </div>
            `;
            listDiv.appendChild(row);
        });
    }
    renderList();
    // Action handlers
    modal.querySelector('#manageTravelersList').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'view') {
            // Pass fromManageTravelers = true so closing returns to Manage Travelers
            showTravelerDisplayModal(id, true);
        } else if (action === 'edit') {
            showEditTravelerModal(id, () => {
                renderList();
                refreshAllTravelerSelectors();
            }, true, false, null);
        } else if (action === 'delete') {
            if (window.confirm('Delete this traveler?')) {
                TravelerService.delete(id);
                renderList();
                refreshAllTravelerSelectors();
            }
        }
    });
    modal.querySelector('#closeManageTravelersModal').addEventListener('click', () => {
        container.innerHTML = '';
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            container.innerHTML = '';
        }
    });
    modal.tabIndex = 0;
    modal.focus();
}

// Traveler Display Component
function showTravelerDisplayModal(travelerId, fromManageTravelers) {
    const traveler = TravelerService.getAll().find(t => t.id === travelerId);
    if (!traveler) return;
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
      <h2 class="text-2xl font-bold mb-4">Traveler Details</h2>
      <div class="space-y-4">
        <div>
          <span class="font-semibold">Name:</span> ${getTravelerDisplayName(traveler)}
        </div>
        <div>
          <span class="font-semibold">Preferred Name:</span> ${traveler.preferredName || '-'}
        </div>
        <div>
          <span class="font-semibold">Primary Phone:</span> ${traveler.primaryPhone || '-'} (${traveler.primaryPhoneCountry || '-'})
        </div>
        <div>
          <span class="font-semibold">Primary Email:</span> ${traveler.primaryEmail || '-'}
        </div>
        <div>
          <span class="font-semibold">Secondary Email:</span> ${traveler.secondaryEmail || '-'}
        </div>
        <div>
          <span class="font-semibold">Date of Birth:</span> ${traveler.dateOfBirth || '-'}
        </div>
        <div>
          <span class="font-semibold">Gender:</span> ${traveler.gender || '-'}
        </div>
        <div>
          <span class="font-semibold">Passport Issuing Country:</span> ${traveler.passportIssuingCountry || '-'}
        </div>
        <div>
          <span class="font-semibold">Nationality:</span> ${traveler.nationality || '-'}
        </div>
        <div>
          <span class="font-semibold">Passport Number:</span> ${traveler.passportNumber || '-'}
        </div>
        <div>
          <span class="font-semibold">Notes:</span> ${traveler.notes || '-'}
        </div>
        <div>
          <span class="font-semibold">Trip History:</span> <span class="italic text-gray-500">(Not implemented)</span>
        </div>
      </div>
      <div class="flex justify-end space-x-2 mt-6">
        <button id="printTravelerBtn" class="btn-secondary">Print</button>
        <button id="exportTravelerBtn" class="btn-secondary">Export JSON</button>
        <button id="closeTravelerDisplayModal" class="btn-primary">Close</button>
      </div>
    `;
    overlay.appendChild(modal);
    container.appendChild(overlay);
    // Print functionality
    modal.querySelector('#printTravelerBtn').addEventListener('click', () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write('<html><head><title>Traveler Details</title>');
        printWindow.document.write('<link href="./dist/output.css" rel="stylesheet">');
        printWindow.document.write('</head><body class="p-8">');
        printWindow.document.write(`<h2 class='text-2xl font-bold mb-4'>Traveler Details</h2>`);
        printWindow.document.write(modal.querySelector('.space-y-4').outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    });
    // Export JSON functionality
    modal.querySelector('#exportTravelerBtn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(traveler, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `traveler-${traveler.id}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        document.body.removeChild(dlAnchor);
    });
    // Close modal
    modal.querySelector('#closeTravelerDisplayModal').addEventListener('click', () => {
        if (fromManageTravelers) {
            container.innerHTML = '';
            showManageTravelersModal();
        } else {
            container.innerHTML = '';
        }
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (fromManageTravelers) {
                container.innerHTML = '';
                showManageTravelersModal();
            } else {
                container.innerHTML = '';
            }
        }
    });
    modal.tabIndex = 0;
    modal.focus();
}

// Show edit traveler modal (reuse add modal, but prefill and update)
function showEditTravelerModal(travelerId, onSave, fromManageTravelers = false, fromComboBox = false, comboFormType = null) {
    const traveler = TravelerService.getAll().find(t => t.id === travelerId);
    if (!traveler) return;
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
      <h2 class="text-2xl font-bold mb-4">Edit Traveler</h2>
      <form id="editTravelerForm" class="space-y-4">
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">First Name *</label>
            <input name="firstName" type="text" class="form-input w-full" required value="${traveler.firstName || ''}" />
          </div>
          <div class="flex-1">
            <label class="form-label">Middle Name</label>
            <input name="middleName" type="text" class="form-input w-full" value="${traveler.middleName || ''}" />
          </div>
          <div class="flex-1">
            <label class="form-label">Last Name *</label>
            <input name="lastName" type="text" class="form-input w-full" required value="${traveler.lastName || ''}" />
          </div>
        </div>
        <div>
          <label class="form-label">Preferred Name</label>
          <input name="preferredName" type="text" class="form-input w-full" value="${traveler.preferredName || ''}" />
        </div>
        <div class="flex space-x-2 items-end">
          <div id="editCountryCodeDropdownContainer"></div>
          <div class="flex-1">
            <label class="form-label">Primary Phone *</label>
            <input name="primaryPhone" type="tel" class="form-input w-full" required placeholder="" value="" />
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Primary Email *</label>
            <input name="primaryEmail" type="email" class="form-input w-full" required value="${traveler.primaryEmail || ''}" />
          </div>
          <div class="flex-1">
            <label class="form-label">Secondary Email</label>
            <input name="secondaryEmail" type="email" class="form-input w-full" value="${traveler.secondaryEmail || ''}" />
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Date of Birth</label>
            <input name="dateOfBirth" type="date" class="form-input w-full" value="${traveler.dateOfBirth || ''}" />
          </div>
          <div class="flex-1">
            <label class="form-label">Gender</label>
            <select name="gender" class="form-input w-full">
              <option value="">Select</option>
              <option value="Male"${traveler.gender === 'Male' ? ' selected' : ''}>Male</option>
              <option value="Female"${traveler.gender === 'Female' ? ' selected' : ''}>Female</option>
              <option value="X"${traveler.gender === 'X' ? ' selected' : ''}>X</option>
            </select>
          </div>
        </div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label class="form-label">Passport Issuing Country</label>
            <input name="passportIssuingCountry" type="text" class="form-input w-full" value="${traveler.passportIssuingCountry || ''}" />
          </div>
          <div class="flex-1">
            <label class="form-label">Nationality</label>
            <input name="nationality" type="text" class="form-input w-full" value="${traveler.nationality || ''}" />
          </div>
        </div>
        <div>
          <label class="form-label">Passport Number</label>
          <input name="passportNumber" type="text" class="form-input w-full" value="${traveler.passportNumber || ''}" />
        </div>
        <div>
          <label class="form-label">Additional Notes</label>
          <textarea name="notes" class="form-input w-full" rows="2">${traveler.notes || ''}</textarea>
        </div>
        <div id="editTravelerFormError" class="text-red-600 text-sm"></div>
        <div class="flex justify-between items-center mt-4">
          <span class="text-xs text-gray-500">Traveler data is stored locally in your browser only.</span>
          <div class="space-x-2">
            <button type="button" id="cancelEditTravelerModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </div>
      </form>
    `;
    // Insert loading indicator while fetching country codes
    const dropdownContainer = modal.querySelector('#editCountryCodeDropdownContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-sm text-gray-500 py-2';
    loadingDiv.textContent = 'Loading country codes...';
    dropdownContainer.appendChild(loadingDiv);
    // Show modal immediately
    overlay.appendChild(modal);
    container.appendChild(overlay);
    // Track the current selected country code
    let currentCountryCode = traveler.primaryPhoneCountry || 'US';
    let countryList = [];
    // Always use getSortedCountryCodes for dropdown
    getSortedCountryCodes().then((codes) => {
        countryList = codes;
        dropdownContainer.innerHTML = '';
        if (!countryList.find(c => c.code === currentCountryCode)) {
            console.warn('[EditTraveler] Traveler country code not found in country list:', currentCountryCode, countryList);
        }
        let selectedCountry = countryList.find(c => c.code === currentCountryCode);
        if (!selectedCountry) {
            console.warn('[EditTraveler] Fallback to US for country code:', currentCountryCode);
            selectedCountry = countryList.find(c => c.code === 'US');
        }
        createCountryCodeDropdown(selectedCountry.code).then(countryDropdown => {
            dropdownContainer.appendChild(countryDropdown.wrapper);
            // Track the currently selected country
            let currentCountry = countryList.find(c => c.code === selectedCountry.code) || countryList[0];
            countryDropdown.input.addEventListener('countrychange', (e) => {
                currentCountry = e.detail;
            });
            // Explicitly set the selected country after dropdown creation
            if (traveler.primaryPhoneCountry && countryList.find(c => c.code === traveler.primaryPhoneCountry)) {
                countryDropdown.setSelected(countryList.find(c => c.code === traveler.primaryPhoneCountry));
                currentCountry = countryList.find(c => c.code === traveler.primaryPhoneCountry);
                console.log('[EditTraveler] Explicitly set dropdown to:', traveler.primaryPhoneCountry);
            }
            // Phone mask logic
            const phoneInput = modal.querySelector('input[name="primaryPhone"]');
            function getDigits(str) {
                return (str || '').replace(/\D/g, '');
            }
            function setPhoneInputValueForCountry(country, phoneRaw) {
                let digits = getDigits(phoneRaw);
                if (country.code === 'US') {
                    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
                    if (digits.length === 10) {
                        phoneInput.value = digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
                    } else {
                        phoneInput.value = '';
                    }
                } else {
                    phoneInput.value = digits;
                }
            }
            setPhoneInputValueForCountry(currentCountry, traveler.primaryPhone);
            countryDropdown.input.addEventListener('countrychange', (e) => {
                const digits = getDigits(phoneInput.value);
                setPhoneInputValueForCountry(currentCountry, digits);
                currentCountry = e.detail;
            });
            function updatePhoneMask() {
                const country = currentCountry;
                if (country.code === 'US') {
                    phoneInput.placeholder = 'xxx-xxx-xxxx';
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
            modal.querySelector('#editTravelerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const form = e.target;
                const data = Object.fromEntries(new FormData(form).entries());
                let codeToSave = currentCountry && currentCountry.code ? currentCountry.code : 'US';
                if (!countryList.find(c => c.code === codeToSave)) {
                    console.warn('[EditTraveler] Saving fallback US for country code:', codeToSave);
                    codeToSave = 'US';
                }
                // Log the country code being saved
                console.log('[EditTraveler] Saving country code:', codeToSave);
                data.primaryPhoneCountry = codeToSave;
                // Use the loaded countryList to find the country object
                const country = countryList.find(c => c.code === codeToSave) || { code: 'US', dial_code: '+1' };
                // Validate phone number
                const phoneInputVal = modal.querySelector('input[name="primaryPhone"]').value;
                if (!validatePhoneNumber(phoneInputVal, country)) {
                    showTravelerFormError('Invalid phone number for selected country.');
                    return;
                }
                data.primaryPhone = formatPhoneForStorage(phoneInputVal, country);
                // Convert dateOfBirth to string if present
                if (data.dateOfBirth instanceof Date) {
                    data.dateOfBirth = data.dateOfBirth.toISOString().split('T')[0];
                }
                // Required fields
                const requiredFields = ['firstName', 'lastName', 'primaryPhone', 'primaryPhoneCountry', 'primaryEmail'];
                for (const field of requiredFields) {
                    if (!data[field] || !data[field].trim()) {
                        showTravelerFormError('Please fill out all required fields.');
                        return;
                    }
                }
                // Duplicate check (exclude current traveler)
                const all = TravelerService.getAll();
                const duplicate = all.find(t =>
                    t.id !== travelerId &&
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
                const updatedTraveler = { ...traveler, ...data };
                if (!TravelerService.validate(updatedTraveler)) {
                    showTravelerFormError('Invalid traveler data. Please check your entries.');
                    return;
                }
                // Save
                const idx = all.findIndex(t => t.id === travelerId);
                if (idx === -1) {
                    showTravelerFormError('Traveler not found.');
                    return;
                }
                all[idx] = updatedTraveler;
                TravelerService.saveAll(all);
                container.innerHTML = '';
                refreshAllTravelerSelectors();
                if (onSave) onSave();
                // After save, return to correct context
                if (fromManageTravelers) {
                    showManageTravelersModal();
                }
                // If fromComboBox, just close and refreshAllTravelerSelectors (already done)
            });
        });
    }).catch(() => {
        dropdownContainer.innerHTML = '<div class="text-red-600 text-sm">Failed to load country codes.</div>';
    });
    // Close modal on overlay click or cancel
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (fromManageTravelers) {
                container.innerHTML = '';
                showManageTravelersModal();
            } else {
                container.innerHTML = '';
                if (fromComboBox && comboFormType) refreshAllTravelerSelectors();
            }
        }
    });
    modal.querySelector('#cancelEditTravelerModal').addEventListener('click', () => {
        if (fromManageTravelers) {
            container.innerHTML = '';
            showManageTravelersModal();
        } else {
            container.innerHTML = '';
            if (fromComboBox && comboFormType) refreshAllTravelerSelectors();
        }
    });
    // Error display helper
    function showTravelerFormError(msg) {
        modal.querySelector('#editTravelerFormError').textContent = msg;
    }
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

// --- Hotel Location Behavior/Target Location dynamic fields logic ---
function updateLocationBehaviorFields() {
    const radios = document.getElementsByName('locationBehavior');
    const selected = Array.from(radios).find(r => r.checked)?.value;
    const propertyFields = document.getElementById('propertyFields');
    const generalFields = document.getElementById('generalFields');
    if (selected === 'property') {
        if (propertyFields) propertyFields.style.display = '';
        if (generalFields) generalFields.style.display = 'none';
    } else {
        if (propertyFields) propertyFields.style.display = 'none';
        if (generalFields) generalFields.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Attach change listeners to Target Location radios
    const radios = document.getElementsByName('locationBehavior');
    radios.forEach(radio => {
        radio.addEventListener('change', updateLocationBehaviorFields);
    });
    // Set initial state
    updateLocationBehaviorFields();

    // --- Date picker immediate open logic ---
    function setupImmediateDatePicker(id) {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('focus', function(e) {
            if (typeof input.showPicker === 'function') {
                input.showPicker();
            } else {
                // Fallback: focus again to trigger native picker
                input.blur();
                setTimeout(() => input.focus(), 0);
            }
        });
        // Also open on click
        input.addEventListener('click', function(e) {
            if (typeof input.showPicker === 'function') {
                input.showPicker();
            } else {
                input.blur();
                setTimeout(() => input.focus(), 0);
            }
        });
    }
    setupImmediateDatePicker('checkInDate');
    setupImmediateDatePicker('checkOutDate');

    // --- Slider live label update logic ---
    const radiusSlider = document.getElementById('radiusSlider');
    const radiusValue = document.getElementById('radiusValue');
    function updateRadiusLabel() {
        if (radiusSlider && radiusValue) {
            radiusValue.textContent = `${radiusSlider.value} miles`;
        }
    }
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', updateRadiusLabel);
        updateRadiusLabel();
    }
    // Also update label when switching to general location
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (radio.value === 'general' && radio.checked) {
                setTimeout(updateRadiusLabel, 0);
            }
        });
    });
}); 