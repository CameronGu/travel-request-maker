import {
  parsePhoneNumberFromString,
  CountryCode,
  PhoneNumber,
  ParseError,
  validatePhoneNumberLength,
} from 'libphonenumber-js/max';

export type PhoneValidationError =
  | 'NOT_A_NUMBER'
  | 'INVALID_COUNTRY'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_LENGTH'
  | 'NOT_VALID'
  | 'UNKNOWN';

export type PhoneValidationResult =
  | {
      success: true;
      e164: string;
      phoneObject: PhoneNumber;
    }
  | {
      success: false;
      error: PhoneValidationError;
    };

/**
 * Normalizes and validates a phone number.
 *
 * @param phone - The phone number to process.
 * @param countryCode - The ISO 3166-1 alpha-2 country code.
 * @returns An object indicating success or failure with details.
 */
export const normalizeAndValidatePhone = (
  phone: string,
  countryCode: CountryCode,
): PhoneValidationResult => {
  try {
    const lengthError = validatePhoneNumberLength(phone, countryCode);
    if (lengthError) {
        return { success: false, error: lengthError };
    }

    const phoneObject = parsePhoneNumberFromString(phone, countryCode);

    if (phoneObject && phoneObject.isValid()) {
      return {
        success: true,
        e164: phoneObject.format('E.164'),
        phoneObject,
      };
    } else {
        return { success: false, error: 'NOT_VALID' };
    }
  } catch (error) {
    if (error instanceof ParseError) {
      return { success: false, error: error.message as PhoneValidationError };
    }
    console.error('Unknown error validating phone number:', error);
    return { success: false, error: 'UNKNOWN' };
  }
};

/**
 * Generates a SHA-256 hash for a traveler based on their phone and email.
 *
 * @param e164Phone - The E.164 formatted phone number.
 * @param email - The traveler's email address.
 * @returns A promise that resolves to the SHA-256 hash as a hex string.
 */
export const generateTravelerHash = async (
  e164Phone: string,
  email: string,
): Promise<string> => {
  const lowerCaseEmail = email.toLowerCase();
  const data = `${e164Phone}${lowerCaseEmail}`;
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}; 