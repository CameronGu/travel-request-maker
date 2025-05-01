// DOM Elements
const travelerSelect = document.getElementById('travelerSelect');
const addTravelerBtn = document.getElementById('addTraveler');
const tabs = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');

// State Management
let currentTraveler = null;
let formData = {
    hotel: {},
    flight: {},
    car: {}
};

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
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

addTravelerBtn.addEventListener('click', showAddTravelerModal);
travelerSelect.addEventListener('change', handleTravelerChange);
copyBtn.addEventListener('click', copyToClipboard);
shareBtn.addEventListener('click', shareRequest);

// Tab Switching
function switchTab(tabName) {
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('tab-active');
        } else {
            tab.classList.remove('tab-active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === `${tabName}Form`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

// Traveler Management
function showAddTravelerModal() {
    // TODO: Implement add traveler modal
    console.log('Add traveler modal not yet implemented');
}

function handleTravelerChange(event) {
    currentTraveler = event.target.value;
    loadTravelerData();
}

function loadTravelerData() {
    if (!currentTraveler) return;
    
    const savedData = storage.getFormData()[currentTraveler];
    if (savedData) {
        formData = savedData;
        updateForms();
    }
}

function updateForms() {
    // TODO: Update form fields with saved data
    console.log('Form update not yet implemented');
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

// Initialize
function init() {
    const travelers = storage.getTravelers();
    travelers.forEach(traveler => {
        const option = document.createElement('option');
        option.value = traveler.id;
        option.textContent = traveler.name;
        travelerSelect.appendChild(option);
    });
}

init(); 