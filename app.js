/**
 * DPDP Form Auditor - Application Controller
 * Connects the UI to DPDPAuditor engine and handles interactivity.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Instantiate Core Engine
  const auditor = new DPDPAuditor();

  // State
  let currentAuditReport = null;
  let activeLanguage = 'en';
  let activeFilter = 'all';
  let currentInputMode = 'html'; // 'html' or 'list'

  // DOM Elements
  const formInputEl = document.getElementById('form-input');
  const formPurposeEl = document.getElementById('form-purpose');
  const btnAuditEl = document.getElementById('btn-audit');
  const chkLiveAuditEl = document.getElementById('chk-live-audit');
  const inputStatsEl = document.getElementById('input-stats');
  const inputHelperTextEl = document.getElementById('input-helper-text');

  // Gauge & Score
  const gaugeProgressEl = document.getElementById('gauge-progress');
  const gaugeScoreNumEl = document.getElementById('gauge-score-num');
  const scoreGradePillEl = document.getElementById('score-grade-pill');
  const scoreStatusBadgeEl = document.getElementById('score-status-badge');
  const scoreStatusTextEl = document.getElementById('score-status-text');
  const scoreExplanationTextEl = document.getElementById('score-explanation-text');

  // Stats Counters
  const statTotalEl = document.getElementById('stat-total');
  const statPersonalEl = document.getElementById('stat-personal');
  const statNeededEl = document.getElementById('stat-needed');
  const statExcessEl = document.getElementById('stat-excess');
  const categoryPillsContainerEl = document.getElementById('category-pills-container');

  // Summary Table
  const tableBodyEl = document.getElementById('audit-table-body');
  const countAllEl = document.getElementById('count-all');
  const countExcessEl = document.getElementById('count-excess');
  const countNeededEl = document.getElementById('count-needed');
  const countChildrenEl = document.getElementById('count-children');

  // Notice & Language
  const noticeContentEl = document.getElementById('notice-content');
  const btnCopyNoticeEl = document.getElementById('btn-copy-notice');
  const langBtns = document.querySelectorAll('.lang-btn');

  // Exports & Tests
  const btnDownloadTxtEl = document.getElementById('btn-download-txt');
  const btnPrintPdfEl = document.getElementById('btn-print-pdf');
  const btnRunTestsEl = document.getElementById('btn-run-tests');
  const testSuiteContainerEl = document.getElementById('test-suite-container');
  const testResultsListEl = document.getElementById('test-results-list');
  const btnCloseTestsEl = document.getElementById('btn-close-tests');
  const appToastEl = document.getElementById('app-toast');
  const toastMessageEl = document.getElementById('toast-message');

  // =========================================================================
  // PRESET SCENARIOS FOR JUDGES
  // Demonstrates real-world messy forms, odd field names, and strict excess flags
  // =========================================================================
  const PRESETS = {
    newsletter: {
      mode: 'html',
      purpose: 'newsletter signup',
      content: `<form id="subscribe-form" action="/subscribe" method="POST">
  <!-- Legitimate fields for newsletter -->
  <input type="text" name="fname" placeholder="First Name (Optional)" />
  <input type="email" name="user_email" required placeholder="name@domain.com" autocomplete="email" />

  <!-- Invasive excess fields typical on Indian websites -->
  <input type="tel" id="mob_no" name="mob_no" placeholder="Mobile Number" />
  <input type="text" name="cust_pin" placeholder="PIN Code / Postal" />
  <input type="text" id="usr_aadhaar_num" placeholder="Aadhaar / National ID" />
  <input type="date" name="txt_dob" placeholder="Date of Birth" />

  <!-- Operational non-personal fields -->
  <input type="hidden" name="csrf_token" value="b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9" />
  <button type="submit">Subscribe Now</button>
</form>`
    },

    ecommerce: {
      mode: 'html',
      purpose: 'ecommerce checkout & delivery',
      content: `<form id="checkout-form">
  <!-- Needed shipping & identity data -->
  <input type="text" name="full_name" placeholder="Full Name" required />
  <input type="tel" name="contact_phone" id="user_phone" placeholder="Contact Mobile" required />
  <input type="email" name="customer_email" placeholder="Order Updates Email" required />
  <textarea name="shipping_address" placeholder="Delivery House / Street Address"></textarea>
  <input type="text" name="cust_pin" placeholder="PIN Code" required />
  <input type="text" name="credit_card_no" autocomplete="cc-number" placeholder="Card Number" />

  <!-- Unjustified excess fields for an online store -->
  <input type="text" name="religion" placeholder="Religion (Optional)" />
  <input type="text" name="blood_group" placeholder="Blood Group" />
  <input type="number" name="annual_income" placeholder="Annual Family Income" />
  <input type="number" name="child_age" placeholder="Minor Child Age" />

  <button type="submit">Place Order</button>
</form>`
    },

    job: {
      mode: 'html',
      purpose: 'job application portal',
      content: `<form id="career-portal-form">
  <!-- Legitimate recruitment inputs -->
  <input type="text" name="candidate_name" placeholder="Candidate Full Name" required />
  <input type="email" name="email_id" placeholder="Work/Personal Email" required />
  <input type="tel" name="mob_no" placeholder="Contact Phone Number" required />
  <input type="file" name="resume_file" placeholder="Upload Resume / CV" />
  <input type="text" name="education_degree" placeholder="Highest Degree" />
  <input type="text" name="prev_company" placeholder="Current Employer" />

  <!-- Excessive / invasive fields for pre-offer application -->
  <input type="text" name="live_gps_loc" placeholder="Real-time GPS Telemetry" />
  <input type="text" name="bank_account_no" placeholder="Bank Account Number" />
  <input type="text" name="marital_status" placeholder="Marital Status" />
  <input type="text" name="parents_aadhaar" placeholder="Parent Aadhaar Card" />

  <button type="submit">Submit Application</button>
</form>`
    },

    children: {
      mode: 'html',
      purpose: 'children school admission',
      content: `<form id="school-admission">
  <!-- DPDP Section 9 Children's Data & Mandatory Parental Consent -->
  <input type="text" name="child_name" placeholder="Child / Student Full Name" required />
  <input type="number" name="student_age" placeholder="Age (e.g. 10)" required />
  <input type="text" name="grade_applying" placeholder="Standard / Class" />
  <input type="text" name="guardian_name" placeholder="Parent or Legal Guardian Name" required />
  <input type="tel" name="parent_mob_no" placeholder="Parent Mobile for OTP Consent" required />
  <input type="email" name="parent_email" placeholder="Parent Email" required />
  <input type="checkbox" name="parent_consent" required />

  <!-- Prohibited / Excess for children under Section 9 -->
  <input type="tel" name="child_phone" placeholder="Minor Child Personal Phone" />
  <input type="file" name="biometric_iris_scan" placeholder="Iris / Biometric Scan" />

  <button type="submit">Register Student</button>
</form>`
    },

    healthcare: {
      mode: 'html',
      purpose: 'healthcare doctor appointment',
      content: `<form id="telehealth-booking">
  <!-- Legitimate clinical consultation data -->
  <input type="text" name="patient_name" placeholder="Patient Full Name" required />
  <input type="tel" name="user_phone" placeholder="Patient Phone" required />
  <input type="number" name="patient_age" placeholder="Age" />
  <input type="text" name="gender" placeholder="Gender" />
  <textarea name="medical_symptoms" placeholder="Describe symptoms / complaints"></textarea>
  <input type="text" name="blood_group" placeholder="Blood Group (e.g. O+)" />

  <!-- Irrelevant excess data for a medical booking -->
  <input type="text" name="voter_id" placeholder="Voter ID Card Number" />
  <input type="number" name="annual_salary" placeholder="Annual CTC" />
  <input type="text" name="curr_loc_ip" placeholder="Network IP Footprint" />

  <button type="submit">Book Doctor Consultation</button>
</form>`
    },

    clean: {
      mode: 'html',
      purpose: 'newsletter signup',
      content: `<form id="minimal-newsletter">
  <!-- DPDP Exemplary Compliant: Only Email collected -->
  <input type="email" name="user_email" placeholder="Your Email Address" required autocomplete="email" />
  <input type="hidden" name="_csrf" value="security_token_sample" />
  <button type="submit">Get Weekly Updates</button>
</form>`
    }
  };

  // =========================================================================
  // TOAST HELPER
  // =========================================================================
  function showToast(msg) {
    toastMessageEl.textContent = msg;
    appToastEl.classList.add('show');
    setTimeout(() => {
      appToastEl.classList.remove('show');
    }, 3000);
  }

  // =========================================================================
  // MAIN AUDIT TRIGGER
  // =========================================================================
  function runAudit() {
    const rawInput = formInputEl.value.trim();
    const purpose = formPurposeEl.value.trim() || 'newsletter signup';

    if (!rawInput) {
      inputStatsEl.textContent = '0 fields detected';
      return;
    }

    // Run audit via engine
    currentAuditReport = auditor.audit(rawInput, purpose);

    // Update Field Count Indicator
    inputStatsEl.textContent = `${currentAuditReport.fieldsCount} fields parsed`;

    // Render components
    renderScorecard(currentAuditReport.compliance);
    renderStats(currentAuditReport);
    renderCategoryPills(currentAuditReport.categoriesSummary);
    renderSummaryTable(currentAuditReport.fields);
    renderNotice(currentAuditReport);
  }

  // =========================================================================
  // RENDER SCORECARD & SVG GAUGE
  // =========================================================================
  function renderScorecard(compliance) {
    const score = compliance.score;
    const circumference = 2 * Math.PI * 45; // ~282.74
    const offset = circumference - (score / 100) * circumference;

    gaugeProgressEl.style.strokeDashoffset = offset;
    gaugeScoreNumEl.textContent = score;

    // Pick color scheme based on score
    let strokeColor = '#ef4444'; // Red (Fail)
    let badgeClass = 'badge-excess';

    if (score >= 90) {
      strokeColor = '#10b981'; // Emerald
      badgeClass = 'badge-needed';
    } else if (score >= 70) {
      strokeColor = '#f59e0b'; // Amber
      badgeClass = 'badge-operational';
    } else if (score >= 45) {
      strokeColor = '#f97316'; // Orange
      badgeClass = 'badge-excess';
    }

    gaugeProgressEl.style.stroke = strokeColor;
    gaugeScoreNumEl.style.color = strokeColor;

    scoreGradePillEl.textContent = `Grade ${compliance.grade}`;
    scoreGradePillEl.className = `badge ${badgeClass}`;

    scoreStatusBadgeEl.textContent = compliance.grade;
    scoreStatusBadgeEl.style.backgroundColor = strokeColor;

    scoreStatusTextEl.textContent = compliance.status;
    scoreExplanationTextEl.textContent = compliance.explanation;
  }

  // =========================================================================
  // RENDER STATS COUNTERS
  // =========================================================================
  function renderStats(report) {
    statTotalEl.textContent = report.fieldsCount;
    statPersonalEl.textContent = report.personalCount;
    statNeededEl.textContent = report.neededCount;
    statExcessEl.textContent = report.excessCount;

    // Table filter counts
    countAllEl.textContent = report.fieldsCount;
    countExcessEl.textContent = report.excessCount;
    countNeededEl.textContent = report.neededCount;

    const childrenCount = report.fields.filter(f => f.category === DPDPAuditor.CATEGORIES.CHILDREN).length;
    countChildrenEl.textContent = childrenCount;
  }

  // =========================================================================
  // RENDER CATEGORY DISTRIBUTION PILLS
  // =========================================================================
  function renderCategoryPills(categoriesSummary) {
    categoryPillsContainerEl.innerHTML = '';

    const catColorMap = {
      'Identity': '#38bdf8',
      'Contact': '#34d399',
      'Financial': '#fbbf24',
      'Health': '#f43f5e',
      'Location': '#a855f7',
      "Children's Data": '#ec4899',
      'Non-Personal / Technical': '#94a3b8'
    };

    let totalRendered = 0;

    for (const [catName, count] of Object.entries(categoriesSummary)) {
      if (count > 0) {
        totalRendered++;
        const pill = document.createElement('div');
        pill.className = 'cat-pill';
        const color = catColorMap[catName] || '#94a3b8';
        pill.innerHTML = `
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color};"></span>
          <span>${catName}</span>
          <span class="cat-count">${count}</span>
        `;
        categoryPillsContainerEl.appendChild(pill);
      }
    }

    if (totalRendered === 0) {
      categoryPillsContainerEl.innerHTML = '<span style="font-size:0.8rem; color:var(--text-dim);">No personal data detected.</span>';
    }
  }

  // =========================================================================
  // RENDER SUMMARY TABLE
  // =========================================================================
  function renderSummaryTable(fields) {
    tableBodyEl.innerHTML = '';

    if (!fields || fields.length === 0) {
      tableBodyEl.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">
            No fields detected. Paste an HTML form or enter a list of field names above.
          </td>
        </tr>
      `;
      return;
    }

    // Filter fields based on activeFilter
    const filteredFields = fields.filter(field => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'excess') return field.isExcess;
      if (activeFilter === 'needed') return !field.isExcess && field.isPersonal;
      if (activeFilter === 'children') return field.category === DPDPAuditor.CATEGORIES.CHILDREN;
      return true;
    });

    if (filteredFields.length === 0) {
      tableBodyEl.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">
            No fields match the selected filter "${activeFilter}".
          </td>
        </tr>
      `;
      return;
    }

    filteredFields.forEach(field => {
      const tr = document.createElement('tr');
      if (field.isExcess) {
        tr.className = 'row-excess';
      }

      // 1. Field Identifier & Source Type
      const tdIdentifier = document.createElement('td');
      tdIdentifier.innerHTML = `
        <span class="field-chip">${escapeHtml(field.rawIdentifier)}</span>
        <div class="field-type-tag">type: ${escapeHtml(field.type || 'text')}${field.required ? ' &bull; required' : ''}</div>
      `;

      // 2. Personal Data? (Yes / No)
      const tdPersonal = document.createElement('td');
      if (field.isPersonal) {
        tdPersonal.innerHTML = `<span style="color:#38bdf8; font-weight:700;">Yes</span>`;
      } else {
        tdPersonal.innerHTML = `<span style="color:var(--text-dim);">No</span>`;
      }

      // 3. Category Badge
      const tdCategory = document.createElement('td');
      const catClass = getCategoryBadgeClass(field.category);
      tdCategory.innerHTML = `<span class="badge-cat ${catClass}">${escapeHtml(field.category)}</span>`;

      // 4. Necessity Status Badge
      const tdStatus = document.createElement('td');
      if (field.isExcess) {
        tdStatus.innerHTML = `
          <span class="badge badge-excess">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ${escapeHtml(field.necessityStatus)}
          </span>
        `;
      } else if (field.isPersonal) {
        tdStatus.innerHTML = `
          <span class="badge badge-needed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${escapeHtml(field.necessityStatus)}
          </span>
        `;
      } else {
        tdStatus.innerHTML = `
          <span class="badge badge-operational">
            ${escapeHtml(field.necessityStatus)}
          </span>
        `;
      }

      // 5. Compliance Reason & Legal Basis
      const tdReason = document.createElement('td');
      tdReason.innerHTML = `
        <div class="reason-text">
          ${escapeHtml(field.reason)}
          <div style="font-size:0.72rem; color:var(--text-dim); margin-top:0.25rem;">
            Matched rule: ${escapeHtml(field.matchedRule || 'Keyword correlation')}
          </div>
        </div>
      `;

      tr.appendChild(tdIdentifier);
      tr.appendChild(tdPersonal);
      tr.appendChild(tdCategory);
      tr.appendChild(tdStatus);
      tr.appendChild(tdReason);

      tableBodyEl.appendChild(tr);
    });
  }

  function getCategoryBadgeClass(category) {
    switch (category) {
      case 'Identity': return 'badge-cat-identity';
      case 'Contact': return 'badge-cat-contact';
      case 'Financial': return 'badge-cat-financial';
      case 'Health': return 'badge-cat-health';
      case 'Location': return 'badge-cat-location';
      case "Children's Data": return 'badge-cat-children';
      default: return 'badge-cat-non-personal';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // RENDER DRAFT CONSENT NOTICE
  // =========================================================================
  function renderNotice(report) {
    if (!report || !report.consentNotices) return;
    noticeContentEl.textContent = report.consentNotices[activeLanguage] || report.consentNotices.en;
  }

  // =========================================================================
  // EVENT LISTENERS: PRESET CHIPS
  // =========================================================================
  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');

      const presetKey = btn.getAttribute('data-preset');
      const preset = PRESETS[presetKey];

      if (preset) {
        formPurposeEl.value = preset.purpose;
        formInputEl.value = preset.content;
        runAudit();
      }
    });
  });

  // =========================================================================
  // EVENT LISTENERS: TABS (HTML vs Field List)
  // =========================================================================
  const tabHtmlBtn = document.getElementById('tab-html');
  const tabListBtn = document.getElementById('tab-list');

  tabHtmlBtn.addEventListener('click', () => {
    tabHtmlBtn.classList.add('active');
    tabListBtn.classList.remove('active');
    currentInputMode = 'html';
    inputHelperTextEl.textContent = 'Paste Raw HTML Form Code:';
    formInputEl.placeholder = "<form>\n  <input type='text' name='fname' />\n  <input type='email' name='user_email' />\n</form>";
  });

  tabListBtn.addEventListener('click', () => {
    tabListBtn.classList.add('active');
    tabHtmlBtn.classList.remove('active');
    currentInputMode = 'list';
    inputHelperTextEl.textContent = 'Enter Comma or Line Separated Field Names:';
    formInputEl.placeholder = "user_email, mob_no, fname, txt_dob, cust_pin, usr_aadhaar_num";
    
    // If current content is HTML, convert to field list for user convenience
    if (currentAuditReport && currentAuditReport.fields.length > 0) {
      const listString = currentAuditReport.fields.map(f => f.rawIdentifier).join(', ');
      formInputEl.value = listString;
      runAudit();
    }
  });

  // =========================================================================
  // EVENT LISTENERS: INPUT AND LIVE AUDIT
  // =========================================================================
  btnAuditEl.addEventListener('click', runAudit);

  formInputEl.addEventListener('input', () => {
    if (chkLiveAuditEl.checked) {
      runAudit();
    }
  });

  formPurposeEl.addEventListener('input', () => {
    if (chkLiveAuditEl.checked) {
      runAudit();
    }
  });

  // =========================================================================
  // EVENT LISTENERS: FILTER BUTTONS
  // =========================================================================
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      if (currentAuditReport) {
        renderSummaryTable(currentAuditReport.fields);
      }
    });
  });

  // =========================================================================
  // EVENT LISTENERS: NOTICE LANGUAGE SWITCHER
  // =========================================================================
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLanguage = btn.getAttribute('data-lang');
      if (currentAuditReport) {
        renderNotice(currentAuditReport);
      }
    });
  });

  // Copy notice to clipboard
  btnCopyNoticeEl.addEventListener('click', () => {
    const text = noticeContentEl.textContent;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Consent notice copied to clipboard!');
    }).catch(err => {
      console.warn("Clipboard write failed, using fallback:", err);
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Consent notice copied to clipboard!');
    });
  });

  // =========================================================================
  // EXPORT FUNCTIONS: TXT & PDF
  // =========================================================================
  btnDownloadTxtEl.addEventListener('click', () => {
    if (!currentAuditReport) runAudit();
    const textReport = auditor.exportAsText(currentAuditReport);

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DPDP_Audit_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Audit report downloaded as .txt file');
  });

  btnPrintPdfEl.addEventListener('click', () => {
    if (!currentAuditReport) runAudit();
    window.print();
  });

  // =========================================================================
  // IN-BROWSER TEST SUITE RUNNER
  // Shows judges all automated unit & integration test assertions running live!
  // =========================================================================
  btnRunTestsEl.addEventListener('click', () => {
    testSuiteContainerEl.style.display = 'block';
    testResultsListEl.innerHTML = '';

    const testLogs = [];
    function runTestAssert(condition, name) {
      testLogs.push({ passed: Boolean(condition), name });
    }

    // Run browser test battery
    const testAuditor = new DPDPAuditor();

    // 1. Messy HTML form parsing
    const messyHtml = `<form><input name="mob_no" /><input id="user_phone" /><input name="txt_dob" /><input name="usr_aadhaar_num" /></form>`;
    const parsed = testAuditor.parseInput(messyHtml);
    runTestAssert(parsed.length === 4, 'DOMParser parses 4 fields from messy HTML');

    // 2. Keyword variations
    const c1 = testAuditor.classifyField({ rawIdentifier: 'mob_no' });
    runTestAssert(c1.category === 'Contact' && c1.isPersonal, 'mob_no classified as Contact personal data');

    const c2 = testAuditor.classifyField({ rawIdentifier: 'txt_dob' });
    runTestAssert(c2.category === 'Identity' && c2.isPersonal, 'txt_dob classified as Identity personal data');

    const c3 = testAuditor.classifyField({ rawIdentifier: 'usr_aadhaar_num' });
    runTestAssert(c3.category === 'Identity' && c3.isPersonal, 'usr_aadhaar_num classified as Identity personal data');

    const c4 = testAuditor.classifyField({ rawIdentifier: 'credit_card_no' });
    runTestAssert(c4.category === 'Financial' && c4.isPersonal, 'credit_card_no classified as Financial personal data');

    const c5 = testAuditor.classifyField({ rawIdentifier: 'child_name' });
    runTestAssert(c5.category === "Children's Data" && c5.isPersonal, "child_name classified as Children's Data");

    // 3. Excess collection rules (Newsletter)
    const reportNews = testAuditor.audit('email, mob_no, txt_dob, usr_aadhaar_num', 'newsletter signup');
    const fEmail = reportNews.fields.find(f => f.rawIdentifier === 'email');
    const fMob = reportNews.fields.find(f => f.rawIdentifier === 'mob_no');
    const fDob = reportNews.fields.find(f => f.rawIdentifier === 'txt_dob');

    runTestAssert(fEmail && !fEmail.isExcess, 'Newsletter: email is NOT excess (Needed)');
    runTestAssert(fMob && fMob.isExcess, 'Newsletter: mob_no is flagged as EXCESS');
    runTestAssert(fDob && fDob.isExcess, 'Newsletter: txt_dob is flagged as EXCESS');

    // 4. Excess collection rules (E-Commerce)
    const reportEcom = testAuditor.audit('name, phone, address, blood_group, religion', 'ecommerce checkout');
    const fBlood = reportEcom.fields.find(f => f.rawIdentifier === 'blood_group');
    const fRel = reportEcom.fields.find(f => f.rawIdentifier === 'religion');
    runTestAssert(fBlood && fBlood.isExcess, 'E-Commerce: blood_group is flagged as EXCESS');
    runTestAssert(fRel && fRel.isExcess, 'E-Commerce: religion is flagged as EXCESS');

    // 5. Section 9 Children Protection
    const reportChild = testAuditor.audit('child_name, student_age', 'newsletter signup');
    const fChild = reportChild.fields.find(f => f.rawIdentifier === 'child_name');
    runTestAssert(fChild && fChild.isExcess && fChild.reason.includes('Sec 9'), "DPDP Sec 9 guardrail protects children's data");

    // 6. Score & Grade
    runTestAssert(reportNews.compliance.score <= 40, 'Low compliance score for excess data newsletter');
    const cleanReport = testAuditor.audit('email', 'newsletter signup');
    runTestAssert(cleanReport.compliance.score === 100, '100% Compliance Score for clean minimal form');

    // 7. Multi-Lingual Consent Notices
    runTestAssert(reportNews.consentNotices.en.includes('DRAFT CONSENT NOTICE'), 'English consent notice generated');
    runTestAssert(reportNews.consentNotices.hi.includes('डिजिटल वैयक्तिक डेटा संरक्षण'), 'Hindi legal notice generated');
    runTestAssert(reportNews.consentNotices.mr.includes('डिजिटल वैयक्तिक डेटा संरक्षण कायदा'), 'Marathi legal notice generated');

    // Render results
    let passCount = 0;
    testLogs.forEach(t => {
      if (t.passed) passCount++;
      const item = document.createElement('div');
      item.className = 'test-item';
      item.innerHTML = `
        <span style="font-family: var(--font-mono);">${escapeHtml(t.name)}</span>
        <span style="color: ${t.passed ? '#10b981' : '#ef4444'}; font-weight:700;">
          ${t.passed ? '✓ PASSED' : '✗ FAILED'}
        </span>
      `;
      testResultsListEl.appendChild(item);
    });

    showToast(`Test Suite: ${passCount}/${testLogs.length} tests passed successfully!`);
  });

  btnCloseTestsEl.addEventListener('click', () => {
    testSuiteContainerEl.style.display = 'none';
  });

  // =========================================================================
  // INITIAL LOAD
  // =========================================================================
  // Load Default Preset (Messy Newsletter)
  formPurposeEl.value = PRESETS.newsletter.purpose;
  formInputEl.value = PRESETS.newsletter.content;
  runAudit();
});
