// Traveler interface (JSDoc for type safety)
/**
 * @typedef {Object} Traveler
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Traveler's full name
 * @property {number} age - Traveler's age
 * @property {string} passportNumber - Passport number
 * @property {string} nationality - Nationality
 * @property {string} email - Email address
 * @property {string} phone - Phone number
 * // Add more fields as needed from PRD
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
        if (typeof traveler.name !== 'string' || !traveler.name) return false;
        if (typeof traveler.age !== 'number' || traveler.age <= 0) return false;
        if (typeof traveler.passportNumber !== 'string' || !traveler.passportNumber) return false;
        if (typeof traveler.nationality !== 'string' || !traveler.nationality) return false;
        if (typeof traveler.email !== 'string' || !traveler.email) return false;
        if (typeof traveler.phone !== 'string' || !traveler.phone) return false;
        // Add more validation as needed
        return true;
    }
} 