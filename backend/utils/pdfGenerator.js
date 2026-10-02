const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PDF_DIR = path.join(__dirname, '..', 'uploads', 'pdfs');

/**
 * Generate a GST invoice PDF for a bill
 * @param {object} bill - Mongoose document or plain object
 * @returns {Promise<string>} file path relative to uploads/
 */
async function generateBillPDF(bill) {
  // Ensure PDF directory exists
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  const fileName = `${bill.billNumber}.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  const html = buildInvoiceHTML(bill);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
  } finally {
    await browser.close();
  }

  return `/uploads/pdfs/${fileName}`;
}

function buildInvoiceHTML(bill) {
  const items = bill.items || [];
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.imei || '-'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:center">18%</td>
        <td style="text-align:right">₹${item.gst.toFixed(2)}</td>
        <td style="text-align:right">₹${item.totalPrice.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
  .header h1 { color: #2563eb; margin: 0; font-size: 22px; }
  .header p { margin: 2px 0; color: #666; }
  .bill-meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .bill-meta div { flex: 1; }
  .bill-meta h3 { margin: 0 0 8px 0; color: #2563eb; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .bill-meta p { margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #2563eb; color: white; padding: 8px; text-align: left; font-size: 11px; }
  td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) { background: #f8f9fa; }
  .totals { float: right; width: 280px; }
  .totals table { margin: 0; }
  .totals td { border: none; padding: 4px 8px; }
  .totals .grand-total td { font-weight: bold; font-size: 14px; color: #2563eb; border-top: 2px solid #2563eb; }
  .footer { clear: both; text-align: center; margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; color: #888; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
  .badge-cash { background: #d1fae5; color: #065f46; }
  .badge-upi { background: #dbeafe; color: #1e40af; }
  .badge-card { background: #ede9fe; color: #5b21b6; }
</style>
</head>
<body>
<div class="header">
  <h1>📱 Mobile Shop Manager</h1>
  <p>GST Tax Invoice</p>
  <p>${bill.branch} Branch</p>
</div>

<div class="bill-meta">
  <div>
    <h3>Bill Details</h3>
    <p><strong>Bill No:</strong> ${bill.billNumber}</p>
    <p><strong>Date:</strong> ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <p><strong>Payment:</strong> <span class="badge badge-${(bill.paymentMode || '').toLowerCase()}">${bill.paymentMode}</span></p>
  </div>
  <div>
    <h3>Customer Details</h3>
    <p><strong>Name:</strong> ${bill.customer?.name}</p>
    <p><strong>Phone:</strong> ${bill.customer?.phone}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>IMEI</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:center">GST</th>
      <th style="text-align:right">GST Amt</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Subtotal (excl. GST):</td><td style="text-align:right">₹${(bill.subtotal || 0).toFixed(2)}</td></tr>
    <tr><td>CGST (9%):</td><td style="text-align:right">₹${((bill.totalGST || 0) / 2).toFixed(2)}</td></tr>
    <tr><td>SGST (9%):</td><td style="text-align:right">₹${((bill.totalGST || 0) / 2).toFixed(2)}</td></tr>
    <tr class="grand-total"><td>Grand Total:</td><td style="text-align:right">₹${(bill.grandTotal || 0).toFixed(2)}</td></tr>
  </table>
</div>

<div class="footer">
  <p>Thank you for your purchase! | This is a computer-generated invoice</p>
  <p>For support, contact your nearest branch</p>
</div>
</body>
</html>`;
}

module.exports = { generateBillPDF };
