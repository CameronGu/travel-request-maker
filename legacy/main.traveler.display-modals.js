import { TravelerService } from './travelerService.js';
import { getTravelerDisplayName } from './main.traveler.core.js';
import { showAddTravelerModal, showEditTravelerModal } from './main.traveler.edit-modals.js';
import { refreshAllTravelerSelectors } from './main.traveler.modals.js';

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

export {
    showTravelerDisplayModal,
    showManageTravelersModal
};