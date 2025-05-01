// DOM Elements
const travelerSelect = document.getElementById('travelerSelect');
const addTravelerBtn = document.getElementById('addTraveler');
const tabs = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');

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
travelerSelect.addEventListener('change', handleTravelerChange);
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
function showAddTravelerModal() {
    // TODO: Implement add traveler modal
    console.log('Add traveler modal not yet implemented');
}

function handleTravelerChange(event) {
    if (hasUnsavedChanges) {
        const confirmed = window.confirm('You have unsaved changes. Do you want to discard them and switch travelers?');
        if (!confirmed) {
            event.preventDefault();
            travelerSelect.value = currentTraveler; // Revert selection
            return;
        }
    }
    
    // Save current form data before switching travelers
    saveCurrentFormData();
    
    currentTraveler = event.target.value;
    loadTravelerData();
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
        const travelers = storage.getTravelers();
        travelers.forEach(traveler => {
            const option = document.createElement('option');
            option.value = traveler.id;
            option.textContent = traveler.name;
            travelerSelect.appendChild(option);
        });

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