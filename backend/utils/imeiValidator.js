/**
 * IMEI validation utilities.
 * IMEIs are 15-digit numbers unique to every mobile device.
 * Validation uses the Luhn checksum algorithm (same as credit cards).
 */

/**
 * Validate IMEI format and Luhn checksum.
 * @param {string} imei
 * @returns {boolean} true if the IMEI is well-formed and passes Luhn check
 */
function validateIMEIFormat(imei) {
  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

module.exports = { validateIMEIFormat };