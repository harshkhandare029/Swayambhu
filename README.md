# 🛡️ FORMSENTRY // PRIVACY INVESTIGATION LAB
> **Tagline:** Collect less. Explain more.  
> **Mission:** An Evidence-Based DPDP Form Auditor and Futuristic 3D Privacy Investigation Lab.  
> Built for *Vibe Coding: Swayambhu 2K26* in strict alignment with India's **Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)**.

---

## 📌 Executive Summary
Websites often demand far more personal data than reasonably required for their declared functionality (e.g. asking for date of birth, mobile numbers, Aadhaar, or live telemetry for an email newsletter).

Under **Section 6(1)** of India's DPDP Act, 2023:
> *"Personal data shall be processed only for a lawful purpose for which the Data Principal has given consent... and shall be limited to such personal data as is necessary for the specified purpose."*

**FormSentry** investigates web forms directly inside the browser using deterministic rules, diagnoses each field across 3 forensic evidence questions, performs **Privacy Surgery** (before-and-after minimization), and generates multi-lingual **Section 5 Draft Consent Notices** with an automated quality checklist.

---

## 🔬 Core Feature Matrix

### 1. 🔍 Dual-Mode Safe Form Parser
- **Mode A: Raw HTML Form Code**: Uses browser-native `DOMParser` (with robust regex fallback) to extract metadata from `input`, `select`, `textarea`, `name`, `id`, `type`, `autocomplete`, `placeholder`, and connected `<label>` tags (via `for` attributes and parent nesting). Never executes scripts or renders untrusted markup.
- **Mode B: Enter Field Names**: Supports comma-separated and line-separated lists of field names with token normalization.

### 2. 🏷️ Token Normalization & Alias Recognition
- Handles camelCase, snake_case, Hungarian notation (`txt_`, `inp_`, `usr_`), abbreviations, and variations:
  - `mob_no`, `mobileNumber`, `user_phone`, `phone_no`, `cust_pin` ➔ **Contact**
  - `fname`, `full_name`, `txt_dob`, `usr_aadhaar_num` ➔ **Identity**
  - `bank_acc_no`, `ifsc`, `pan_card`, `annual_salary`, `cc_num` ➔ **Financial**
  - `blood_group`, `medical_history`, `health_condition` ➔ **Health**
  - `live_gps_loc`, `curr_loc`, `ip_address` ➔ **Location**
  - `student_name`, `student_dob`, `guardian_phone`, `minor_age` ➔ **Children's Data (DPDP Sec 9)**
  - `csrf_token`, `recaptcha`, `submit` ➔ **Non-Personal / Operational**
  - Unknown fields (`x7_data`) are marked `"Needs review"` / `"Unknown — review required"` and are **never** falsely assumed to be non-personal without evidence!

### 3. 🕵️ Feature A: Evidence-Based Privacy Detective
Every detected field provides an **Evidence Dossier** answering 3 core forensic questions:
1. **What was detected?** (Matched alias, HTML attributes, metadata, category, assessment)
2. **Why might it be unnecessary?** (Statutory DPDP Section 6(1) or Section 9 reasoning)
3. **What should the form owner do?** (Keep as required, Make optional, Remove, Review business justification, or Consider a less intrusive alternative)
- **Minimum Data Alternatives**: Provides contextual alternatives (e.g. replacing full DOB with an age-eligibility confirmation checkbox, or removing physical address for digital delivery).

### 4. ✂️ Feature B: Privacy Surgery (Interactive Minimization)
The primary product differentiator:
- Live before-and-after comparison between **Original Form** vs **Recommended Minimized Form**.
- Interactive categorization into three columns:
  - **1. KEEP**: Likely necessary fields.
  - **2. OPTIONAL / REVIEW**: Potentially necessary or uncertain fields.
  - **3. REMOVE**: Likely excessive fields for the stated purpose.
- **User Overrides**: Owners can toggle **Remove**, **Restore**, or **Make Optional** on any field. Overrides are tracked separately from engine recommendations.
- **Live 3D Synchronization**: Removed fields turn into wireframe ghost nodes in the 3D particle space; restored fields re-illuminate!
- **Exports**: Copy minimized field list or copy clean, ready-to-deploy minimized HTML form markup.

### 5. 📜 Feature C: Consent Studio (Multi-Lingual Section 5 Notice)
- Generates editable draft notices listing data categories, stated purpose, optional items, purpose limitation, retention, and explicit **Withdrawal of Consent** procedures (Section 6(4)).
- Multi-lingual templates:
  - **English**
  - **Hindi (हिन्दी)** (*डिजिटल वैयक्तिक डेटा संरक्षण अधिनियम, २०२३*)
  - **Marathi (मराठी)** (*डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३*)
- **Consent Notice Quality Checklist**:
  - Live inspection verifying purpose statement, categories, optional fields distinction, withdrawal instructions, placeholder detection (`[Organization Name]`, `[DPO Contact]`), and draft review disclaimers.

### 6. 🌐 Futuristic 3D Visual Experience (Three.js)
- **Hero 3D Scanner Grid**: Perspective dark graphite floor with electric-lime grid lines, moving scanning beam, floating data particles, and gentle mouse parallax.
- **Interactive Data-Particle Space**: Contained 3D constellation where fields are rendered as interactive nodes (Lime: Necessary, Amber: Review, Coral: Excessive, Grey: Non-Personal). Hovering displays tooltips; clicking any node opens the field's Evidence Dossier.
- **Zero External Model Dependencies**: Built with native Three.js geometry and materials.
- **WebGL Fallback**: Graceful CSS perspective grid fallback if WebGL or Three.js is unavailable.

### 7. 📊 Data Minimization Score — Heuristic (0 to 100)
- Animated SVG radial gauge meter with letter grade (`A+` to `F`), status, and transparent penalty factor breakdown.

---

## 🚀 How to Run the Application

### Option 1: Direct File Launch (Zero Setup)
Double-click [`index.html`](file:///c:/Users/Student/Desktop/DPDP/index.html) in your file manager to open it in Google Chrome, Microsoft Edge, or Firefox.

### Option 2: Local HTTP Server (Already Running)
```bash
cd c:\Users\Student\Desktop\DPDP
python -m http.server 4173
```
Open **[http://localhost:4173](http://localhost:4173)** in any browser.

---

## 🧪 Master Test Suite (All 10 Batteries Pass 100%)

Run from terminal:
```bash
node test-auditor.js
```

### Verified Test Batteries:
1. **Battery 1: Messy Aliases** ➔ Verified `mob_no`, `mobileNumber`, `dob`, `aadhaar_no`, `addr`, `health_condition`.
2. **Battery 2: HTML Parser** ➔ Verified metadata extraction (`type`, `autocomplete`, placeholder, connected `<label for="...">`).
3. **Battery 3: Dynamic Purpose Switching** ➔ Verified `student_dob` is excessive for a newsletter, but switches dynamically to *Likely Necessary* for school admission.
4. **Battery 4: Privacy Detective** ➔ Verified 3-question evidence diagnosis on `aadhaar_no`.
5. **Battery 5: Privacy Surgery** ➔ Verified KEEP, OPTIONAL, and REMOVE grouping and count synchronization.
6. **Battery 6: Consent Studio** ➔ Verified EN, HI, MR templates and Notice Quality Checklist.
7. **Battery 7: Unknown Fields** ➔ Verified `x7_data` is marked *Needs review* and *Unknown — review required* (not falsely assumed non-personal).
8. **Battery 8: Empty & Malformed Input** ➔ Verified unclosed tags and empty strings handled safely without crashing.
9. **Battery 9: Privacy & Export** ➔ Verified downloadable text dossier generation.
10. **Battery 10: Mock Examples** ➔ Verified Examples A, B, and C against statutory rules.

*(Result: 38/38 assertions passed with 100% success rate)*

---

## ⏱️ 3-Minute Hackathon Demonstration Sequence for Judges

1. **Minute 1: The Investigation (0:00 - 1:00)**
   - Open `http://localhost:4173`.
   - Point out the 3D scanning grid and `100% Client-Side • Privacy First` badge.
   - Click **"Example A: Newsletter"** chip.
   - Click **"INITIATE AUDIT"**: watch the 3D scanning beam sweep and the 3D particle constellation light up with green, amber, and coral nodes.
   - Show the **Data Minimization Score: 20/100 (Grade F)** caused by unnecessary collection of DOB, phone, Aadhaar, address, and health records.

2. **Minute 2: Dynamic Purpose Switching & Privacy Surgery (1:00 - 2:00)**
   - Change the Purpose dropdown from **Newsletter signup** to **School admission**:
     - Point out how `student_dob` immediately switches to *Likely Necessary* under DPDP Section 9 rules!
   - Switch back to Newsletter and scroll to **Privacy Surgery**:
     - Show the **Original Form (8 fields)** vs **Recommended Minimized Form (3 fields)**.
     - Click **"Restore"** on `mob_no` (demonstrating user override with `(Override)` badge).
     - Click **"Copy Minimized HTML"** to show instant export of clean, privacy-compliant code.

3. **Minute 3: Privacy Detective Dossier & Consent Studio (2:00 - 3:00)**
   - Click the `aadhaar_no` row in the Findings table or click its coral node in the 3D constellation:
     - The **Privacy Detective Evidence Dossier** opens.
     - Walk through the 3 questions: What was detected? Why is it unnecessary? What should the owner do?
     - Point out the **Minimum Data Alternative**.
   - Scroll to **Consent Studio**:
     - Switch between **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
     - Show the live **Notice Quality Inspection Checklist** verifying consent withdrawal instructions (Section 6(4)).
   - Click **"RUN TEST SUITE"** in the top bar to run the live 10-battery test suite in front of the judges!

---

## 📂 Project Architecture

```
DPDP/
├── dpdp-auditor.js    # Core standalone analysis engine (UMD module, zero deps)
├── three.min.js       # Pinned local Three.js r128 (enables 100% offline execution)
├── three-scenes.js    # 3D Hero Perspective Grid + Interactive Field Particle Constellation
├── index.html         # FormSentry Privacy Investigation Lab web interface
├── styles.css         # Futuristic graphite/lime design system, glassmorphism, print CSS
├── app.js             # UI Controller, 3D bridge, Privacy Surgery, and Dossier manager
├── test-auditor.js    # Automated master test runner (10 batteries, 38 assertions)
└── README.md          # Complete documentation and judge presentation guide
```

---

## 🔒 Privacy & Security Guarantee
- FormSentry makes **zero external API calls**.
- No form content, HTML, or field identifiers are transmitted to any server.
- No remote AI models or external telemetry are used.
- All analysis runs deterministically and locally in the user's browser.
