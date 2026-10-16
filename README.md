<<<<<<< HEAD
# 🛡️ DPDP Form Auditor — Vibe Coding: Swayambhu 2K26

> **A 100% Client-Side Privacy Compliance Engine & Consent Notice Generator**  
> Engineered in strict compliance with India's **Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)**.

---

## 📌 Problem Statement & Context
Most Indian websites collect significantly more personal data than required for their declared functionality (e.g. demanding date of birth, mobile number, or Aadhaar for an email newsletter). 

Under **Section 6(1)** of India's DPDP Act, 2023:
> *"Personal data shall be processed only for a lawful purpose for which the Data Principal has given consent... and shall be limited to such personal data as is necessary for the specified purpose."*

Furthermore, **Section 5** mandates that data fiduciaries provide a clear, understandable notice in English or any 8th Schedule language (e.g., Hindi, Marathi) detailing the data collected, purpose, and how to withdraw consent. **Section 9** adds special protections prohibiting unwarranted processing of children's personal data.

---

## ✨ Features Built

### 1. 🔍 Dual-Mode Form Parser
- **Raw HTML Form Parsing**: Uses native browser `DOMParser` (with robust regex fallback) to extract `<input>`, `<select>`, and `<textarea>` elements.
- **Deep Attribute Inspection**: Examines `name`, `id`, `type`, `autocomplete`, `placeholder`, `aria-label`, and associated `<label>` text.
- **Field Name Normalizer**: Automatically tokenizes camelCase, snake_case, Hungarian notation (`fname`, `mob_no`, `user_phone`, `txt_dob`, `cust_pin`, `usr_aadhaar_num`).
- **Plain Text / List Mode**: Allows auditors to paste comma-separated or newline-separated lists of field names.

### 2. 🏷️ Classification & Categorization Engine
Maps each field to **Personal Data (Yes/No)** and groups it into 6 statutory categories:
1. **Identity**: Name, username, gender, date of birth, Aadhaar, PAN, voter ID, passport.
2. **Contact**: Email, phone / mobile number, WhatsApp, residential address, PIN code.
3. **Financial**: Bank account number, IFSC code, credit/debit card, CVV, UPI ID, salary, income.
4. **Health & Biometric**: Medical history, blood group, disability status, prescriptions, iris/fingerprint.
5. **Location**: Real-time GPS telemetry, latitude/longitude, live location tracking, IP address.
6. **Children's Data (DPDP Sec 9)**: Minor age (<18), student name, school details, guardian consent.
7. **Non-Personal / Operational**: CSRF tokens, captcha, submit buttons, search filters, order quantity.

### 3. ⚖️ Purpose-Driven Excess Collection Rule Engine
Accepts a one-line purpose (e.g., *"newsletter signup"*, *"ecommerce checkout"*, *"job application"*) and matches against legitimate data processing requirements:
- **Newsletter Signup**: Legitimately needs `email` (and optionally `name`). Flags `mobile`, `dob`, `pin_code`, `aadhaar`, `location` as **EXCESS COLLECTION**.
- **E-Commerce Checkout**: Legitimately needs `name`, `phone`, `delivery address`, `payment card`. Flags `religion`, `blood_group`, `salary`, `child_age` as **EXCESS COLLECTION**.
- **Job Application**: Legitimately needs `name`, `contact`, `resume`, `education`. Flags `live_gps`, `bank_account`, `marital_status` as **EXCESS COLLECTION**.
- **Children's EdTech**: Enforces **DPDP Section 9** requirements for verifiable parental consent; blocks tracking and child phone collection.

### 4. 📊 DPDP Compliance Scorecard (0 to 100)
- Visual animated SVG radial gauge meter.
- Letter grade assignment (`A+`, `A`, `B`, `C`, `F`) and compliance status.
- Explanatory feedback identifying specific privacy liabilities.

### 5. 📜 Section 5 Multi-Lingual Draft Consent Notice Generator
Generates ready-to-use consent notices formatted according to DPDP Section 5 requirements in 3 languages:
- **English** (Standard statutory draft notice)
- **Hindi (हिंदी)** (Authentic legal terminology: *डिजिटल वैयक्तिक डेटा संरक्षण अधिनियम, २०२३*)
- **Marathi (मराठी)** (Constitutional 8th Schedule legal terminology: *डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३*)
- Single-click **Copy to Clipboard** with toast confirmation.
- Clearly labeled: *Draft Notice — Not Formal Legal Advice*.

### 6. 🖨️ Reporting & Exporting
- **Export TXT**: Instant client-side download of a formatted audit report (`.txt`).
- **Export PDF / Print**: Formatted `@media print` executive summary sheet for audits.

---

## 🚀 Quick Start & How to Run

### Method 1: Direct File Launch (No server required!)
Simply double-click `index.html` in your file explorer to open it in Google Chrome, Microsoft Edge, or Firefox.

### Method 2: Local HTTP Server
Run with Python:
```bash
cd c:\Users\Student\Desktop\DPDP
python -m http.server 4173
```
Then visit: `http://localhost:4173`

---

## 🧪 Automated Test Suite (Judge Verification)

We built an extensive test suite verifying:
1. Normalization of messy field names (`mob_no`, `user_phone`, `txt_dob`, `cust_pin`, `usr_aadhaar_num`).
2. Purpose-driven excess detection for newsletters and e-commerce.
3. DPDP Section 9 children's data restrictions.
4. Score calculation and grading.
5. Multi-lingual notice generation.

### Run in Terminal:
```bash
node test-auditor.js
```
*(Result: 28/28 tests pass with 100% success)*

### Run In-Browser:
Click the **"Run Tests"** button in the top navigation bar of `index.html` to see the live test suite execute in real-time with green checkmarks.

---

## 📂 Project Architecture

```
DPDP/
├── dpdp-auditor.js    # Core standalone rule engine & classifier (UMD module, zero deps)
├── index.html         # Modern web application UI with judge presets & summary tables
├── styles.css         # Cyber-legal dark theme, glassmorphism, responsive & print CSS
├── app.js             # UI Controller, preset handlers, exports, and test runner
├── test-auditor.js    # Comprehensive Node.js / CLI test runner (28 assertions)
└── README.md          # Project documentation and judging guide
```

---

## ⚖️ Hackathon Compliance Checklist
- [x] Paste raw HTML form code or field list.
- [x] One-line stated purpose input.
- [x] Classifies Personal Data (Yes/No) into Identity, Contact, Financial, Health, Location, Children.
- [x] Flags excess collection with human-readable legal reasons.
- [x] Section 5 draft consent notice with withdrawal mechanism & disclaimer.
- [x] Summary table with field, category, needed/excess status, and reason.
- [x] 100% client-side, zero network dependencies, 100% privacy preserving.
- [x] **Stretch Goal 1**: Compliance score (0-100) with explanation and visual gauge.
- [x] **Stretch Goal 2**: Multi-lingual notices in English, Hindi, and Marathi.
- [x] **Stretch Goal 3**: Download report as TXT or print-ready PDF.
- [x] Handles messy real-world forms (`mob_no`, `user_phone`, `dob`, `fname`, `cust_pin`, `aadhaar`).
=======
# Vibecode_
>>>>>>> 6d622ddf02c4ec46b0a4a904dd18cff193a19afb
