# Requirements Document

## Introduction

This document defines the requirements for a full-stack Mobile Shop Management & Theft Prevention System for a business operating 3 branches in Hyderabad: Kukatpally, KPHB, and Beeramguda. The system is built on the MERN stack (MongoDB, Express.js, React.js, Node.js) using standard JavaScript and Tailwind CSS.

The owner cannot physically monitor all branches simultaneously. Employees may sell products without recording them, skip billing, or manipulate cash records. This system enforces accountability at every step — making unrecorded sales, bill manipulation, and stock discrepancies impossible to hide.

The system covers six core modules: Authentication, Inventory Management, Billing (with WhatsApp Integration), Employee Monitoring & Theft Prevention, Repair Management, and Analytics.

---

## Glossary

- **System**: The Mobile Shop Management & Theft Prevention System as a whole
- **Admin**: The business owner with full access to all branches and all system functions
- **Salesperson**: A branch employee with access scoped to their assigned branch only
- **Branch**: One of the three physical shop locations — Kukatpally, KPHB, or Beeramguda
- **Bill**: A formal sales record generated before any product leaves inventory
- **BillItem**: A line item within a Bill representing one product unit sold
- **IMEI**: International Mobile Equipment Identity — a unique 15-digit identifier for each mobile phone unit
- **Repair_Ticket**: A service record created when a customer brings a device for repair
- **Stock_Transfer**: A request to move inventory units from one Branch to another
- **Activity_Log**: A timestamped record of every user action performed in the System
- **Suspicious_Activity**: A flagged event that indicates potential theft or manipulation
- **Cash_Reconciliation**: The process of verifying that end-of-day physical cash matches the sum of all cash-mode bills
- **Alert**: A real-time notification sent to the Admin when a threshold or rule is violated
- **JWT**: JSON Web Token used for stateless authentication
- **GST**: Goods and Services Tax applied to product sales
- **WhatsApp API**: An integration service used to send digital invoices directly to the customer's phone
- **Session**: A single authenticated login period for a User
- **Inventory_Log**: A record of every stock change (sale, transfer, adjustment)
- **IMEI_Validator**: The backend utility that enforces uniqueness and format of IMEI numbers
- **Alert_Engine**: The backend utility that evaluates rules and emits Alerts for Suspicious_Activity
- **Cash_Reconciliation_Engine**: The backend utility that computes end-of-day cash totals and flags mismatches

---

## Requirements

### Requirement 1: User Authentication and Session Management
1. THE System SHALL authenticate users via email and password, issuing a signed JWT upon success.
2. THE System SHALL scope all Salesperson API responses to their assigned Branch only.
3. THE System SHALL grant Admin access to data from all three Branches simultaneously.
4. THE System SHALL hash all passwords using bcrypt.

### Requirement 2: Branch and Product Inventory Management
1. THE System SHALL store products with: name, category, price, stock quantity, branch assignment, and low-stock threshold.
2. THE System SHALL enforce that product stock quantity is a non-negative integer at all times.
3. THE System SHALL trigger a "low-stock" Alert via SSE when a product hits its threshold.
4. THE System SHALL perform soft deletes for products to retain historical billing integrity.

### Requirement 3: IMEI Number Tracking for Mobile Phones
1. THE System SHALL require a unique, 15-digit IMEI number for every mobile phone unit added to inventory.
2. THE System SHALL verify that the billed IMEI belongs to a unit currently in stock at the billing Branch before decrementing stock.
3. THE System SHALL provide an IMEI lookup endpoint that returns the full sale history for a given IMEI.

### Requirement 4: Billing System & WhatsApp Integration
1. THE System SHALL require customer name, customer phone number (10 digits), items, and payment mode to create a Bill.
2. THE System SHALL atomically decrement stock at the billing Branch when a Bill is saved.
3. THE System SHALL calculate GST and generate a PDF invoice for every saved Bill.
4. **THE System SHALL automatically send a WhatsApp message containing the Bill summary and a link to the PDF invoice to the customer's phone number upon successful bill creation.**
5. THE System SHALL lock the Bill from further edits by the Salesperson immediately upon creation.
6. THE System SHALL reject any attempt by a Salesperson to edit a locked Bill.

### Requirement 5: Bill Cancellation and Edit Approval Workflow
1. THE System SHALL require Admin approval to cancel a Bill and reverse stock decrements.
2. THE System SHALL alert the Admin via SSE if a Salesperson submits a cancellation request within 10 minutes of creating the Bill.
3. THE System SHALL alert the Admin via SSE if a Salesperson cancels more than 2 Bills in a single day.

### Requirement 6: Employee Activity Logging
1. THE System SHALL record an append-only Activity_Log entry for every data mutation (POST, PUT, PATCH, DELETE).
2. THE System SHALL capture the acting user ID, action type, affected resource, Branch, and UTC timestamp for every log.

### Requirement 7: Suspicious Activity Detection and Alerts (SSE)
1. THE System SHALL monitor stock integrity continuously and create Alerts if expected stock does not match actual stock.
2. THE System SHALL deliver Alerts to the Admin's dashboard in real-time using Server-Sent Events (SSE).
3. THE System SHALL require the Admin to explicitly acknowledge Alerts to clear them from the active dashboard view.

### Requirement 8: Cash Reconciliation
1. THE System SHALL compute expected end-of-day cash based strictly on "active" status Cash bills.
2. THE System SHALL flag any discrepancy between the expected cash and the employee's submitted physical count as an Alert.

### Requirement 9: Stock Transfer Between Branches
1. THE System SHALL allow stock transfers between Kukatpally, KPHB, and Beeramguda, requiring Admin approval.
2. THE System SHALL reserve the stock at the source Branch while the transfer is pending to prevent double-selling.

### Requirement 10: Repair Ticket Management
1. THE System SHALL enforce the status transition sequence: Received → Diagnosing → Repairing → Ready → Delivered.
2. THE System SHALL require a formal Bill to be generated for the repair before the status can be marked as "Delivered".

### Requirement 11: Admin Analytics Dashboard
1. THE System SHALL display today's revenue, branch comparisons, top products, and employee performance using Recharts.
2. THE System SHALL strictly prevent Salespersons from accessing the analytics endpoints.

### Requirement 12: UI Responsiveness and Design System
1. THE System SHALL be fully responsive from mobile (320px) to desktop viewports.
2. THE System SHALL display monetary values in Indian Rupees (₹) formatted correctly.