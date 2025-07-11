// DOM Elements
const tabs = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');

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

// Initialize function for just the tab system
function initTabSystem() {
    try {
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
        const tabContents = document.querySelectorAll('.tab-content');
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
    } catch (error) {
        console.error('Error during tab system initialization:', error);
    }
}

// Export all necessary functions and variables
export {
    currentTab,
    formData,
    initialFormData,
    hasUnsavedChanges,
    isTransitioning,
    storage,
    serializeForm,
    deserializeForm,
    saveCurrentFormData,
    detectChanges,
    updateTabIndicator,
    handleTabSwitch,
    switchTab,
    copyToClipboard,
    shareRequest,
    generateSummary,
    initTabSystem
};