/**
 * WhatsApp notification service.
 * Sends a post-sale message to the customer with their bill summary.
 *
 * Integration is opt-in: set WHATSAPP_API_URL and WHATSAPP_API_TOKEN in .env.
 * If either is missing or WHATSAPP_API_URL is still the placeholder value,
 * the function returns false silently without throwing.
 *
 * A WhatsApp failure must NEVER invalidate a successful sale — always call
 * this function in a fire-and-forget pattern (see billController.createBill).
 */

const axios = require('axios');

/**
 * Send bill summary to the customer via WhatsApp.
 * @param {string} customerPhone  - 10-digit customer phone number
 * @param {string} customerName   - Customer display name
 * @param {string} billNumber     - Generated bill number (e.g. BILL-20261001-12345)
 * @param {number} grandTotal     - Final amount charged
 * @param {string|null} pdfUrl    - Optional absolute URL to the PDF invoice
 * @returns {Promise<boolean>}    - true if message was sent, false otherwise
 */
async function sendBillWhatsApp(customerPhone, customerName, billNumber, grandTotal, pdfUrl) {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;

    // Skip gracefully if not configured
    const isConfigured =
      apiUrl && token && apiUrl !== 'https://api.whatsapp.com' && token !== 'your_token_here';

    if (!isConfigured) {
      return false;
    }

    const message =
      `Hello ${customerName}! 🎉\n\n` +
      `Your purchase is confirmed.\n\n` +
      `📄 Bill No: ${billNumber}\n` +
      `💰 Total: ₹${grandTotal.toFixed(2)}\n` +
      (pdfUrl ? `\n📎 Download invoice: ${pdfUrl}` : '') +
      `\n\nThank you for shopping with us! 🙏`;

    await axios.post(
      apiUrl,
      { phone: customerPhone, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Mask phone number in logs — show only last 4 digits
    const maskedPhone = `***${customerPhone.slice(-4)}`;
    console.log(`[WhatsApp] Message sent to ${maskedPhone}`);
    return true;
  } catch (err) {
    const maskedPhone = `***${String(customerPhone).slice(-4)}`;
    console.error(`[WhatsApp] Failed to send to ${maskedPhone}: ${err.message}`);
    return false;
  }
}

module.exports = { sendBillWhatsApp };
