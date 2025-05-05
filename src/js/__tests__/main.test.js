const {
  serializeForm,
  deserializeForm,
  validatePhoneNumber,
  formatPhoneForStorage,
  generateSummary
} = require('../mainUtils.js');

describe('main.js', () => {
  // TODO: Add tests for exported functions
  test('should have tests for main.js', () => {
    expect(true).toBe(true);
  });
});

describe('main.js exports', () => {
  describe('serializeForm', () => {
    it('returns form data for text inputs', () => {
      document.body.innerHTML = `
        <form id="hotelForm">
          <input name="foo" value="bar" />
          <input name="baz" value="qux" />
        </form>
      `;
      const data = serializeForm('hotel');
      expect(data).toEqual({ foo: 'bar', baz: 'qux' });
    });
    it('handles checkboxes and radios', () => {
      document.body.innerHTML = `
        <form id="hotelForm">
          <input type="checkbox" name="cb" checked />
          <input type="radio" name="r" checked />
        </form>
      `;
      const data = serializeForm('hotel');
      expect(data).toEqual({ cb: true, r: true });
    });
    it('returns empty object if form not found', () => {
      document.body.innerHTML = '';
      expect(serializeForm('notfound')).toEqual({});
    });
  });

  describe('deserializeForm', () => {
    it('sets form values from data', () => {
      document.body.innerHTML = `
        <form id="hotelForm">
          <input name="foo" />
          <input name="bar" />
        </form>
      `;
      deserializeForm('hotel', { foo: 'abc', bar: 'xyz' });
      expect(document.querySelector('input[name="foo"]').value).toBe('abc');
      expect(document.querySelector('input[name="bar"]').value).toBe('xyz');
    });
    it('sets checkbox/radio checked state', () => {
      document.body.innerHTML = `
        <form id="hotelForm">
          <input type="checkbox" name="cb" />
          <input type="radio" name="r" />
        </form>
      `;
      deserializeForm('hotel', { cb: true, r: false });
      expect(document.querySelector('input[name="cb"]').checked).toBe(true);
      expect(document.querySelector('input[name="r"]').checked).toBe(false);
    });
    it('does nothing if form not found', () => {
      document.body.innerHTML = '';
      expect(() => deserializeForm('notfound', { foo: 'bar' })).not.toThrow();
    });
  });

  describe('validatePhoneNumber', () => {
    it('validates US phone numbers (10 digits)', () => {
      expect(validatePhoneNumber('(555) 123-4567', { code: 'US' })).toBe(true);
      expect(validatePhoneNumber('555-123-456', { code: 'US' })).toBe(false);
    });
    it('validates non-US phone numbers (>=5 digits)', () => {
      expect(validatePhoneNumber('12345', { code: 'CA' })).toBe(true);
      expect(validatePhoneNumber('1234', { code: 'CA' })).toBe(false);
    });
    it('returns false for missing input', () => {
      expect(validatePhoneNumber('', { code: 'US' })).toBe(false);
      expect(validatePhoneNumber('555-123-4567', null)).toBe(false);
    });
  });

  describe('formatPhoneForStorage', () => {
    it('formats US phone numbers as digits', () => {
      expect(formatPhoneForStorage('(555) 123-4567', { code: 'US' })).toBe('5551234567');
    });
    it('returns trimmed phone for non-US', () => {
      expect(formatPhoneForStorage(' 12345 ', { code: 'CA' })).toBe('12345');
    });
    it('returns empty string for missing input', () => {
      expect(formatPhoneForStorage('', { code: 'US' })).toBe('');
      expect(formatPhoneForStorage('555-123-4567', null)).toBe('');
    });
  });

  describe('generateSummary', () => {
    it('returns a string', () => {
      expect(typeof generateSummary()).toBe('string');
    });
  });
}); 