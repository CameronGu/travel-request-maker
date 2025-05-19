// legacy/main.traveler.core.js

// Centralized traveler requirements by request type
export const REQUIREMENTS_BY_TYPE = {
    hotel: [], // No required traveler fields for hotel, but structure is ready for future
    flight: ['dateOfBirth'], // Example for flight
    car: []
};

// --- Phone validation and formatting utilities ---
export function validatePhoneNumber(phone, country) {
    if (!phone || !country) return false;
    const digits = phone.replace(/\D/g, '');
    if (country.code === 'US') {
        return digits.length === 10;
    } else {
        return digits.length >= 5;
    }
}

export function formatPhoneForStorage(phone, country) {
    if (!phone || !country) return '';
    const digits = phone.replace(/\D/g, '');
    if (country.code === 'US') {
        return digits;
    } else {
        return phone.trim();
    }
}

// Helper for traveler display name
export function getTravelerDisplayName(traveler) {
    if (!traveler) return '';
    if (traveler.preferredName && traveler.preferredName.trim()) {
        return `${traveler.preferredName} (${traveler.firstName} ${traveler.lastName})`;
    }
    return `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim();
}

// Country phone codes management
let countryPhoneCodes = null;
let countryPhoneCodesPromise = null;

export function loadCountryPhoneCodes() {
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

export async function getSortedCountryCodes() {
    const codes = await loadCountryPhoneCodes();
    // Use the actual objects from the loaded country list for the top 3
    const topCodes = ['US', 'CA', 'MX'];
    const top = topCodes.map(code => codes.find(c => c.code === code)).filter(Boolean);
    const rest = codes.filter(c => !topCodes.includes(c.code))
        .sort((a, b) => a.name.localeCompare(b.name));
    return [...top, ...rest];
}

// Country Dropdown Factory
export async function createCountryCodeDropdown(selectedCode = 'US') {
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