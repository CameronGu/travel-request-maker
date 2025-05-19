// legacy/main.traveler.ui.js
import { TravelerService } from './travelerService.js';
import { 
  REQUIREMENTS_BY_TYPE, 
  validatePhoneNumber, 
  formatPhoneForStorage, 
  getTravelerDisplayName, 
  loadCountryPhoneCodes, 
  getSortedCountryCodes, 
  createCountryCodeDropdown
} from './main.traveler.core.js';

// Per-form traveler combobox and chips
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

const travelerComboboxInstances = {};

function renderPerFormTravelerSelectors() {
  // Get storage formData
  const formData = JSON.parse(localStorage.getItem('formData') || '{}');
  const travelerSelectors = {
    hotel: document.getElementById('hotelTravelerSelector'),
    flight: document.getElementById('flightTravelerSelector'),
    car: document.getElementById('carTravelerSelector'),
  };

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
        // Assuming showAddTravelerModal is defined elsewhere and accessible
        if (typeof showAddTravelerModal === 'function') {
          showAddTravelerModal(() => refreshAllTravelerSelectors(), false, true, formType);
        } else {
          console.error('showAddTravelerModal function not available');
        }
      } else {
        if (!formData[formType]) formData[formType] = {};
        if (!Array.isArray(formData[formType].selectedTravelers)) formData[formType].selectedTravelers = [];
        if (!formData[formType].selectedTravelers.includes(selectedId)) {
          formData[formType].selectedTravelers.push(selectedId);
          localStorage.setItem('formData', JSON.stringify(formData));
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
  const formData = JSON.parse(localStorage.getItem('formData') || '{}');
  if (!formData[formType]) formData[formType] = {};
  if (!formData[formType].selectedTravelers || !Array.isArray(formData[formType].selectedTravelers)) {
    formData[formType].selectedTravelers = [];
  }
  // Remove duplicates from selectedTravelers
  formData[formType].selectedTravelers = Array.from(new Set(formData[formType].selectedTravelers));
  
  const travelerSelectors = {
    hotel: document.getElementById('hotelTravelerSelector'),
    flight: document.getElementById('flightTravelerSelector'),
    car: document.getElementById('carTravelerSelector'),
  };
  
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
    chipBody.addEventListener('click', () => {
      if (typeof showTravelerDisplayModal === 'function') {
        showTravelerDisplayModal(traveler.id);
      } else {
        console.error('showTravelerDisplayModal function not available');
      }
    });
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
      if (typeof showEditTravelerModal === 'function') {
        showEditTravelerModal(traveler.id, () => refreshAllTravelerSelectors(), false, true, formType);
      } else {
        console.error('showEditTravelerModal function not available');
      }
    });
    // Remove icon
    const chipRemove = document.createElement('button');
    chipRemove.className = 'chip-remove ml-1 text-red-600 hover:text-red-800 focus:outline-none';
    chipRemove.setAttribute('aria-label', 'Remove traveler');
    chipRemove.innerHTML = '×';
    chipRemove.tabIndex = 0;
    chipRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      formData[formType].selectedTravelers = formData[formType].selectedTravelers.filter(id => id !== traveler.id);
      localStorage.setItem('formData', JSON.stringify(formData));
      renderFormTravelerChips(formType);
    });
    chip.appendChild(chipBody);
    if (warningArea) chip.appendChild(warningArea);
    chip.appendChild(chipEdit);
    chip.appendChild(chipRemove);
    chip.addEventListener('click', () => {
      if (typeof showTravelerDisplayModal === 'function') {
        showTravelerDisplayModal(traveler.id);
      } else {
        console.error('showTravelerDisplayModal function not available');
      }
    });
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (typeof showTravelerDisplayModal === 'function') {
          showTravelerDisplayModal(traveler.id);
        } else {
          console.error('showTravelerDisplayModal function not available');
        }
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

export { 
  TravelerCombobox,
  renderPerFormTravelerSelectors, 
  renderFormTravelerChips, 
  refreshAllTravelerSelectors 
};