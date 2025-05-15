// Pure utility functions extracted from main.js for unit testing

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

function generateSummary() {
    // TODO: Implement summary generation
    return 'Summary not yet implemented';
}

module.exports = {
  serializeForm,
  deserializeForm,
  validatePhoneNumber,
  formatPhoneForStorage,
  generateSummary
}; 