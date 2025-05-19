// legacy/main.hotel.js
// Purpose: Hotel-form behaviour & validation

// Constants for traveler requirements
const REQUIREMENTS_BY_TYPE = {
    hotel: [], // No required traveler fields for hotel, but structure is ready for future
    flight: ['dateOfBirth'], // Example for flight
    car: []
};

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

function setupHotelFormEventListeners() {
    // Attach change listeners to Target Location radios
    const radios = document.getElementsByName('locationBehavior');
    radios.forEach(radio => {
        radio.addEventListener('change', updateLocationBehaviorFields);
    });
    
    // Set initial state
    updateLocationBehaviorFields();

    // --- Date picker immediate open logic ---
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
}

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

function validateDates() {
    // This function would validate check-in and check-out dates
    // Placeholder implementation
    const checkInDate = document.getElementById('checkInDate')?.value;
    const checkOutDate = document.getElementById('checkOutDate')?.value;
    
    if (!checkInDate || !checkOutDate) return false;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    return checkOut > checkIn;
}

function validateHotelForm() {
    const hotelFormSuccess = document.getElementById('hotelFormSuccess');
    const travelerSelectorErrorId = 'hotelTravelerSelectorError';
    let travelerSelectorError = document.getElementById(travelerSelectorErrorId);
    const formData = {
        hotel: { selectedTravelers: [] }
    };
    
    let valid = true;
    clearAllErrors();
    
    if (hotelFormSuccess) {
        hotelFormSuccess.textContent = '';
        hotelFormSuccess.style.display = 'none';
    }
    
    // Dates
    if (!validateDates()) valid = false;
    
    // Location behavior required
    const locationBehaviorRadios = document.getElementsByName('locationBehavior');
    const selectedBehavior = Array.from(locationBehaviorRadios).find(r => r.checked)?.value;
    if (!selectedBehavior) valid = false;
    
    const propertyFields = document.getElementById('propertyFields');
    const generalFields = document.getElementById('generalFields');
    
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
    
    // Get traveler service
    const TravelerService = window.TravelerService || { getAll: () => [] };
    
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

function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function clearAllErrors() {
    const travelerSelectorError = document.getElementById('hotelTravelerSelectorError');
    if (travelerSelectorError) clearError(travelerSelectorError);
}

function initHotelForm() {
    try {
        setupHotelFormEventListeners();
        
        // Hotel form submission setup
        const hotelForm = document.querySelector('#hotelForm form');
        const hotelFormSuccess = document.getElementById('hotelFormSuccess');
        
        if (hotelForm) {
            hotelForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (validateHotelForm()) {
                    if (hotelFormSuccess) {
                        hotelFormSuccess.textContent = 'Hotel request submitted successfully!';
                        hotelFormSuccess.style.display = 'block';
                    }
                    hotelForm.reset();
                    const totalNightsDisplay = document.getElementById('totalNightsDisplay');
                    if (totalNightsDisplay) totalNightsDisplay.textContent = '';
                    
                    const extendedStayOptions = document.getElementById('extendedStayOptions');
                    if (extendedStayOptions) extendedStayOptions.style.display = 'none';
                } else {
                    if (hotelFormSuccess) {
                        hotelFormSuccess.textContent = '';
                        hotelFormSuccess.style.display = 'none';
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error initializing hotel form:', error);
    }
}

// Export for use in main module
export { 
    initHotelForm, 
    updateLocationBehaviorFields, 
    setupImmediateDatePicker,
    validateHotelForm,
    REQUIREMENTS_BY_TYPE
};