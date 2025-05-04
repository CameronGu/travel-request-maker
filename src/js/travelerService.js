// Traveler interface (JSDoc for type safety)
/**
 * @typedef {Object} Traveler
 * @property {string} id - Unique identifier (UUID)
 * @property {string} firstName - First name (required)
 * @property {string} middleName - Middle name (optional)
 * @property {string} lastName - Last name (required)
 * @property {string} preferredName - Preferred name/nickname (optional)
 * @property {string} primaryPhone - Primary phone number (required)
 * @property {string} primaryPhoneCountry - Country code for primary phone (required)
 * @property {string} primaryEmail - Primary email address (required)
 * @property {string} secondaryEmail - Secondary email address (optional)
 * @property {string} dateOfBirth - Date of birth (optional, MM/DD/YYYY)
 * @property {string} gender - Gender (optional, 'Male', 'Female', 'X')
 * @property {string} passportIssuingCountry - Passport issuing country (optional)
 * @property {string} nationality - Nationality (optional)
 * @property {string} passportNumber - Passport number (optional)
 * @property {string} notes - Additional traveler notes (optional)
 */

/**
 * TravelerService handles CRUD operations and persistence for travelers in localStorage.
 */
export class TravelerService {
    static STORAGE_KEY = 'travelers';

    /**
     * Get all travelers from localStorage.
     * @returns {Traveler[]}
     */
    static getAll() {
        try {
            const data = localStorage.getItem(TravelerService.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load travelers:', e);
            return [];
        }
    }

    /**
     * Save all travelers to localStorage.
     * @param {Traveler[]} travelers
     */
    static saveAll(travelers) {
        try {
            localStorage.setItem(TravelerService.STORAGE_KEY, JSON.stringify(travelers));
        } catch (e) {
            console.error('Failed to save travelers:', e);
        }
    }

    /**
     * Add a new traveler.
     * @param {Traveler} traveler
     */
    static add(traveler) {
        if (!TravelerService.validate(traveler)) {
            throw new Error('Invalid traveler data');
        }
        const travelers = TravelerService.getAll();
        travelers.push(traveler);
        TravelerService.saveAll(travelers);
    }

    /**
     * Get a traveler by ID.
     * @param {string} id
     * @returns {Traveler|null}
     */
    static getById(id) {
        const travelers = TravelerService.getAll();
        return travelers.find(t => t.id === id) || null;
    }

    /**
     * Update a traveler by ID.
     * @param {string} id
     * @param {Partial<Traveler>} updates
     * @returns {boolean} success
     */
    static update(id, updates) {
        const travelers = TravelerService.getAll();
        const idx = travelers.findIndex(t => t.id === id);
        if (idx === -1) return false;
        travelers[idx] = { ...travelers[idx], ...updates };
        if (!TravelerService.validate(travelers[idx])) {
            console.error('Invalid traveler data after update');
            return false;
        }
        TravelerService.saveAll(travelers);
        return true;
    }

    /**
     * Delete a traveler by ID.
     * @param {string} id
     * @returns {boolean} success
     */
    static delete(id) {
        let travelers = TravelerService.getAll();
        const initialLength = travelers.length;
        travelers = travelers.filter(t => t.id !== id);
        TravelerService.saveAll(travelers);
        return travelers.length < initialLength;
    }

    /**
     * Remove all travelers from storage.
     */
    static clearAll() {
        try {
            localStorage.removeItem(TravelerService.STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear travelers:', e);
        }
    }

    /**
     * Validate a traveler object.
     * @param {Traveler} traveler
     * @returns {boolean}
     */
    static validate(traveler) {
        if (!traveler) return false;
        if (typeof traveler.id !== 'string' || !traveler.id) return false;
        if (typeof traveler.firstName !== 'string' || !traveler.firstName) return false;
        if (typeof traveler.lastName !== 'string' || !traveler.lastName) return false;
        if (typeof traveler.primaryPhone !== 'string' || !traveler.primaryPhone) return false;
        if (typeof traveler.primaryPhoneCountry !== 'string' || !traveler.primaryPhoneCountry) return false;
        if (typeof traveler.primaryEmail !== 'string' || !traveler.primaryEmail) return false;
        // Optional fields: middleName, preferredName, secondaryEmail, dateOfBirth, gender, passportIssuingCountry, nationality, passportNumber, notes
        // Validate optional fields if present
        if (traveler.secondaryEmail && typeof traveler.secondaryEmail !== 'string') return false;
        if (traveler.middleName && typeof traveler.middleName !== 'string') return false;
        if (traveler.preferredName && typeof traveler.preferredName !== 'string') return false;
        if (traveler.dateOfBirth && typeof traveler.dateOfBirth !== 'string') return false;
        if (traveler.gender && typeof traveler.gender !== 'string') return false;
        if (traveler.passportIssuingCountry && typeof traveler.passportIssuingCountry !== 'string') return false;
        if (traveler.nationality && typeof traveler.nationality !== 'string') return false;
        if (traveler.passportNumber && typeof traveler.passportNumber !== 'string') return false;
        if (traveler.notes && typeof traveler.notes !== 'string') return false;
        return true;
    }
} 