/**
 * FormSentry - Privacy Investigation Lab Application Controller
 * Connects DPDPAuditor core engine with Three.js 3D visualization,
 * Privacy Surgery before/after workspace, Evidence Dossier, and Consent Studio.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Instantiate Core Engine
  const auditor = new DPDPAuditor();

  // App State
  let currentReport = null;
  let activeLanguage = 'en';
  let activeTableFilter = 'all';
  let currentInputMode = 'html'; // 'html' or 'list'
  let currentMockKey = 'newsletter';

  // Privacy Surgery User Overrides State (Separated from Engine Recommendations)
  // Overrides map: { [fieldIdentifier]: 'keep' | 'optional' | 'remove' }
  const userSurgeryOverrides = {};

  // DOM Elements - Input Workspace
  const formInputEl = document.getElementById('form-input');
  const formPurposeSelectEl = document.getElementById('form-purpose-select');
  const customPurposeBoxEl = document.getElementById('custom-purpose-box');
  const formCustomPurposeEl = document.getElementById('form-custom-purpose');
  const inputStatsIndicatorEl = document.getElementById('input-stats-indicator');
  const inputModeLabelEl = document.getElementById('input-mode-label');
  const chkLiveAuditEl = document.getElementById('chk-live-audit');
  const btnAuditMainEl = document.getElementById('btn-audit-main');
  const btnHeroAuditEl = document.getElementById('btn-hero-audit');
  const btnClearAllEl = document.getElementById('btn-clear-all');
  const btnResetAnalysisEl = document.getElementById('btn-reset-analysis');
  const tabHtmlBtn = document.getElementById('tab-html');
  const tabListBtn = document.getElementById('tab-list');

  // DOM Elements - Minimization Score & Stats
  const gaugeProgressEl = document.getElementById('gauge-progress');
  const gaugeScoreNumEl = document.getElementById('gauge-score-num');
  const scoreGradePillEl = document.getElementById('score-grade-pill');
  const scoreStatusBadgeEl = document.getElementById('score-status-badge');
  const scoreStatusTextEl = document.getElementById('score-status-text');
  const scoreExplanationTextEl = document.getElementById('score-explanation-text');

  const statTotalEl = document.getElementById('stat-total');
  const statPersonalEl = document.getElementById('stat-personal');
  const statExcessiveEl = document.getElementById('stat-excessive');
  const statProposedEl = document.getElementById('stat-proposed');

  // DOM Elements - Privacy Surgery (Part 12)
  const surgeryKeepListEl = document.getElementById('surgery-keep-list');
  const surgeryOptionalListEl = document.getElementById('surgery-optional-list');
  const surgeryRemoveListEl = document.getElementById('surgery-remove-list');
  const surgeryKeepCountEl = document.getElementById('surgery-keep-count');
  const surgeryOptionalCountEl = document.getElementById('surgery-optional-count');
  const surgeryRemoveCountEl = document.getElementById('surgery-remove-count');
  const btnCopyMinimizedListEl = document.getElementById('btn-copy-minimized-list');
  const btnCopyMinimizedHtmlEl = document.getElementById('btn-copy-minimized-html');
  const btnResetSurgeryEl = document.getElementById('btn-reset-surgery');

  // DOM Elements - Evidence Table (Part 15)
  const findingsTableBodyEl = document.getElementById('findings-table-body');
  const tableSearchInputEl = document.getElementById('table-search-input');
  const fcountAllEl = document.getElementById('fcount-all');
  const fcountPersonalEl = document.getElementById('fcount-personal');
  const fcountExcessEl = document.getElementById('fcount-excess');
  const fcountReviewEl = document.getElementById('fcount-review');

  // DOM Elements - Consent Studio (Part 14)
  const noticeEditorEl = document.getElementById('notice-editor');
  const btnCopyNoticeEl = document.getElementById('btn-copy-notice');
  const noticeQualityListEl = document.getElementById('notice-quality-list');
  const langBtns = document.querySelectorAll('.lang-btn');

  // DOM Elements - Evidence Dossier Modal (Part 10)
  const dossierModalEl = document.getElementById('dossier-modal');
  const btnCloseDossierEl = document.getElementById('btn-close-dossier');
  const dossierFieldTitleEl = document.getElementById('dossier-field-title');
  const dossierMetaSubtitleEl = document.getElementById('dossier-meta-subtitle');
  const dossierEvidenceLevelEl = document.getElementById('dossier-evidence-level');
  const dossierQ1DetectedEl = document.getElementById('dossier-q1-detected');
  const dossierQ2WhyEl = document.getElementById('dossier-q2-why');
  const dossierQ3ActionEl = document.getElementById('dossier-q3-action');
  const dossierAltBoxEl = document.getElementById('dossier-alt-box');
  const dossierAltBodyEl = document.getElementById('dossier-alt-body');

  // DOM Elements - Test Suite & Exports
  const btnHeroTestsEl = document.getElementById('btn-hero-tests');
  const testSuitePanelEl = document.getElementById('test-suite-panel');
  const testSuiteResultsListEl = document.getElementById('test-suite-results-list');
  const btnCloseTestsEl = document.getElementById('btn-close-tests');
  const btnExportTxtEl = document.getElementById('btn-export-txt');
  const btnExportPdfEl = document.getElementById('btn-export-pdf');
  const appToastEl = document.getElementById('app-toast');
  const toastMessageEl = document.getElementById('toast-message');

  // =========================================================================
  // INITIALIZE 3D VISUAL SCENES (Three.js with graceful fallback)
  // =========================================================================
  let heroScannerScene = null;
  let fieldParticleSpace = null;

  try {
    if (typeof FormSentry3D !== 'undefined') {
      heroScannerScene = new FormSentry3D.HeroScannerScene('hero-grid-canvas');
      fieldParticleSpace = new FormSentry3D.FieldParticleSpace('particle-space-canvas', (field) => {
        openEvidenceDossier(field);
      });
    }
  } catch (err) {
    console.warn("Three.js initialization notice (running fallback mode):", err);
  }

  // =========================================================================
  // TOAST NOTIFICATION HELPER
  // =========================================================================
  function showToast(msg) {
    toastMessageEl.textContent = msg;
    appToastEl.classList.add('show');
    setTimeout(() => {
      appToastEl.classList.remove('show');
    }, 3000);
  }

  // =========================================================================
  // PURPOSE RESOLUTION HELPER
  // =========================================================================
  function getDeclaredPurpose() {
    const selectedVal = formPurposeSelectEl.value;
    if (selectedVal === 'custom') {
      return formCustomPurposeEl.value.trim() || 'Custom Business Purpose';
    }
    return selectedVal;
  }

  // =========================================================================
  // MAIN AUDIT PIPELINE
  // =========================================================================
  function runAudit() {
    const rawInput = formInputEl.value.trim();
    const purpose = getDeclaredPurpose();

    if (!rawInput) {
      inputStatsIndicatorEl.textContent = '0 fields detected';
      renderEmptyState();
      return;
    }

    // Trigger 3D scanner beam acceleration
    if (heroScannerScene) {
      heroScannerScene.startScan(800);
    }

    // Execute Deterministic Local Audit Engine
    currentReport = auditor.audit(rawInput, purpose);

    // Update field count
    inputStatsIndicatorEl.textContent = `${currentReport.counts.total} fields parsed`;

    // Render Components
    renderScorecard(currentReport.score);
    renderStats(currentReport.counts);
    renderPrivacySurgery(currentReport);
    renderFindingsTable(currentReport.fields);
    renderConsentNotice(currentReport);
    renderQuickDecisionsList(currentReport.fields);

    // Update 3D Data-Particle Constellation
    update3DParticles();
  }

  function renderQuickDecisionsList(fields) {
    const listEl = document.getElementById('quick-decisions-list');
    const countEl = document.getElementById('quick-decisions-count');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!fields || fields.length === 0) {
      listEl.innerHTML = '<div style="color:var(--text-dim); font-size:0.75rem; padding:0.5rem;">No fields analyzed.</div>';
      if (countEl) countEl.textContent = '0 fields';
      return;
    }

    if (countEl) countEl.textContent = `${fields.length} fields`;

    fields.forEach(f => {
      const row = document.createElement('div');
      row.className = 'quick-decision-row';

      let badgeHtml = '';
      if (f.necessityStatus === 'Likely excessive') {
        badgeHtml = `<span class="badge badge-excess" style="font-size:0.68rem; padding:0.12rem 0.45rem;">🔴 EXCESSIVE</span>`;
      } else if (f.necessityStatus === 'Likely necessary') {
        if (f.category === 'Non-Personal / Operational') {
          badgeHtml = `<span class="badge badge-operational" style="font-size:0.68rem; padding:0.12rem 0.45rem;">⚪ OPERATIONAL</span>`;
        } else {
          badgeHtml = `<span class="badge badge-needed" style="font-size:0.68rem; padding:0.12rem 0.45rem;">✓ NECESSARY</span>`;
        }
      } else if (f.necessityStatus === 'Unknown — review required') {
        badgeHtml = `<span class="badge badge-warn" style="font-size:0.68rem; padding:0.12rem 0.45rem;">⚠ REVIEW</span>`;
      } else {
        badgeHtml = `<span class="badge badge-operational" style="font-size:0.68rem; padding:0.12rem 0.45rem;">OPTIONAL</span>`;
      }

      row.innerHTML = `
        <span class="quick-row-name">${escapeHtml(f.rawIdentifier)}</span>
        <div>${badgeHtml}</div>
      `;

      row.addEventListener('click', () => {
        openEvidenceDossier(f);
      });

      listEl.appendChild(row);
    });
  }

  function renderEmptyState() {
    statTotalEl.textContent = '0';
    statPersonalEl.textContent = '0';
    statExcessiveEl.textContent = '0';
    statProposedEl.textContent = '0';
    renderQuickDecisionsList([]);
    findingsTableBodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">No form input detected. Enter field names or paste HTML above.</td></tr>`;
    surgeryKeepListEl.innerHTML = `<div style="color:var(--text-dim); font-size:0.76rem;">No fields.</div>`;
    surgeryOptionalListEl.innerHTML = `<div style="color:var(--text-dim); font-size:0.76rem;">No fields.</div>`;
    surgeryRemoveListEl.innerHTML = `<div style="color:var(--text-dim); font-size:0.76rem;">No fields.</div>`;
    surgeryRemoveListEl.innerHTML = `<div style="color:var(--text-dim); font-size:0.76rem;">No fields.</div>`;
    if (fieldParticleSpace) {
      fieldParticleSpace.updateFields([], new Set());
    }
  }

  // =========================================================================
  // RENDER MINIMIZATION SCORECARD & SVG GAUGE (Part 16)
  // =========================================================================
  function renderScorecard(scoreObj) {
    const score = scoreObj.score;
    const circumference = 2 * Math.PI * 45; // ~282.74
    const offset = circumference - (score / 100) * circumference;

    gaugeProgressEl.style.strokeDashoffset = offset;
    gaugeScoreNumEl.textContent = score;

    let color = '#f43f5e'; // Coral (Fail)
    if (score >= 90) color = '#10e871'; // Lime
    else if (score >= 70) color = '#f59e0b'; // Amber
    else if (score >= 45) color = '#fb923c'; // Orange

    gaugeProgressEl.style.stroke = color;
    gaugeScoreNumEl.style.color = color;

    scoreGradePillEl.textContent = `Grade ${scoreObj.grade}`;
    scoreGradePillEl.style.backgroundColor = color;

    scoreStatusBadgeEl.textContent = scoreObj.grade;
    scoreStatusBadgeEl.style.backgroundColor = color;

    scoreStatusTextEl.textContent = scoreObj.status;
    scoreExplanationTextEl.textContent = scoreObj.explanation;
  }

  function renderStats(counts) {
    statTotalEl.textContent = counts.total;
    statPersonalEl.textContent = counts.personal;
    statExcessiveEl.textContent = counts.excessive;
    statProposedEl.textContent = counts.proposedRemaining;

    // Filter counts
    fcountAllEl.textContent = counts.total;
    fcountPersonalEl.textContent = counts.personal;
    fcountExcessEl.textContent = counts.excessive;
    fcountReviewEl.textContent = counts.optional;
  }

  // =========================================================================
  // RENDER PRIVACY SURGERY WORKSPACE (Part 12)
  // Handles KEEP, OPTIONAL, REMOVE groups and user overrides
  // =========================================================================
  function renderPrivacySurgery(report) {
    surgeryKeepListEl.innerHTML = '';
    surgeryOptionalListEl.innerHTML = '';
    surgeryRemoveListEl.innerHTML = '';

    const effectiveGroups = {
      keep: [],
      optional: [],
      remove: []
    };

    report.fields.forEach(field => {
      // Check if user has overridden this field
      let effectiveGroup = userSurgeryOverrides[field.rawIdentifier];

      if (!effectiveGroup) {
        // Fall back to engine recommendations
        if (field.necessityStatus === 'Likely necessary') {
          effectiveGroup = 'keep';
        } else if (field.necessityStatus === 'Likely excessive') {
          effectiveGroup = 'remove';
        } else {
          effectiveGroup = 'optional';
        }
      }

      effectiveGroups[effectiveGroup].push(field);
    });

    // Update Counts
    surgeryKeepCountEl.textContent = effectiveGroups.keep.length;
    surgeryOptionalCountEl.textContent = effectiveGroups.optional.length;
    surgeryRemoveCountEl.textContent = effectiveGroups.remove.length;

    // Populate Columns
    effectiveGroups.keep.forEach(field => {
      surgeryKeepListEl.appendChild(createSurgeryCard(field, 'keep'));
    });
    effectiveGroups.optional.forEach(field => {
      surgeryOptionalListEl.appendChild(createSurgeryCard(field, 'optional'));
    });
    effectiveGroups.remove.forEach(field => {
      surgeryRemoveListEl.appendChild(createSurgeryCard(field, 'remove'));
    });
  }

  function createSurgeryCard(field, currentGroup) {
    const card = document.createElement('div');
    card.className = 'surgery-card';

    const isOverridden = !!userSurgeryOverrides[field.rawIdentifier];
    const overrideBadge = isOverridden
      ? `<span style="font-size:0.65rem; color:#f59e0b; font-family:var(--font-mono);">(Override)</span>`
      : '';

    let actionButtons = '';
    if (currentGroup === 'remove') {
      actionButtons = `
        <button class="surgery-btn btn-restore" title="Restore field to minimized form">Restore</button>
        <button class="surgery-btn btn-inspect" title="Inspect Evidence Dossier">Inspect</button>
      `;
    } else if (currentGroup === 'keep') {
      actionButtons = `
        <button class="surgery-btn btn-opt" title="Make field optional">Optional</button>
        <button class="surgery-btn btn-remove" title="Remove field from form">Remove</button>
        <button class="surgery-btn btn-inspect" title="Inspect Evidence Dossier">Inspect</button>
      `;
    } else {
      actionButtons = `
        <button class="surgery-btn btn-keep" title="Keep as required field">Keep</button>
        <button class="surgery-btn btn-remove" title="Remove field from form">Remove</button>
        <button class="surgery-btn btn-inspect" title="Inspect Evidence Dossier">Inspect</button>
      `;
    }

    card.innerHTML = `
      <div class="surgery-card-top">
        <span class="surgery-field-name">${escapeHtml(field.rawIdentifier)} ${overrideBadge}</span>
        <div class="surgery-actions">
          ${actionButtons}
        </div>
      </div>
      <div class="surgery-reason">${escapeHtml(field.whyUnnecessary || field.whatDetected)}</div>
    `;

    // Event Listeners for Surgery Buttons
    const btnRestore = card.querySelector('.btn-restore');
    if (btnRestore) {
      btnRestore.addEventListener('click', (e) => {
        e.stopPropagation();
        userSurgeryOverrides[field.rawIdentifier] = 'keep';
        renderPrivacySurgery(currentReport);
        update3DParticles();
        showToast(`Restored "${field.rawIdentifier}" to proposed form.`);
      });
    }

    const btnRemove = card.querySelector('.btn-remove');
    if (btnRemove) {
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        userSurgeryOverrides[field.rawIdentifier] = 'remove';
        renderPrivacySurgery(currentReport);
        update3DParticles();
        showToast(`Marked "${field.rawIdentifier}" for removal.`);
      });
    }

    const btnOpt = card.querySelector('.btn-opt');
    if (btnOpt) {
      btnOpt.addEventListener('click', (e) => {
        e.stopPropagation();
        userSurgeryOverrides[field.rawIdentifier] = 'optional';
        renderPrivacySurgery(currentReport);
        update3DParticles();
        showToast(`Marked "${field.rawIdentifier}" as optional.`);
      });
    }

    const btnKeep = card.querySelector('.btn-keep');
    if (btnKeep) {
      btnKeep.addEventListener('click', (e) => {
        e.stopPropagation();
        userSurgeryOverrides[field.rawIdentifier] = 'keep';
        renderPrivacySurgery(currentReport);
        update3DParticles();
        showToast(`Marked "${field.rawIdentifier}" as required.`);
      });
    }

    const btnInspect = card.querySelector('.btn-inspect');
    if (btnInspect) {
      btnInspect.addEventListener('click', (e) => {
        e.stopPropagation();
        openEvidenceDossier(field);
      });
    }

    return card;
  }

  function update3DParticles() {
    if (!fieldParticleSpace || !currentReport) return;

    // Collect currently removed fields
    const removedNames = new Set();
    currentReport.fields.forEach(f => {
      const override = userSurgeryOverrides[f.rawIdentifier];
      if (override === 'remove' || (!override && f.necessityStatus === 'Likely excessive')) {
        removedNames.add(f.rawIdentifier);
      }
    });

    fieldParticleSpace.updateFields(currentReport.fields, removedNames);
  }

  // =========================================================================
  // RENDER EVIDENCE WALL & FINDINGS TABLE (Part 15)
  // =========================================================================
  function renderFindingsTable(fields) {
    findingsTableBodyEl.innerHTML = '';
    const searchTerm = (tableSearchInputEl.value || '').toLowerCase().trim();

    const filtered = fields.filter(field => {
      // Filter by category / status
      if (activeTableFilter === 'personal' && field.assessment !== 'Likely personal data') return false;
      if (activeTableFilter === 'excess' && field.necessityStatus !== 'Likely excessive') return false;
      if (activeTableFilter === 'review' && (field.necessityStatus !== 'Potentially necessary — justification needed' && field.necessityStatus !== 'Unknown — review required')) return false;

      // Filter by search query
      if (searchTerm) {
        const text = `${field.rawIdentifier} ${field.category} ${field.necessityStatus} ${field.recommendedAction}`.toLowerCase();
        if (!text.includes(searchTerm)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      findingsTableBodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No fields match current filter.</td></tr>`;
      return;
    }

    filtered.forEach(field => {
      const tr = document.createElement('tr');
      if (field.necessityStatus === 'Likely excessive') {
        tr.className = 'row-excess';
      }

      // 1. Identifier
      const tdId = document.createElement('td');
      tdId.innerHTML = `
        <span class="field-chip">${escapeHtml(field.rawIdentifier)}</span>
        <div class="field-type-tag">type: ${escapeHtml(field.type || 'text')}${field.required ? ' &bull; required' : ''}</div>
      `;

      // 2. Assessment
      const tdAssess = document.createElement('td');
      let assessColor = '#94a3b8';
      if (field.assessment === 'Likely personal data') assessColor = '#38bdf8';
      else if (field.assessment === 'Needs review') assessColor = '#f59e0b';
      tdAssess.innerHTML = `<span style="color:${assessColor}; font-weight:600; font-size:0.78rem;">${escapeHtml(field.assessment)}</span>`;

      // 3. Category Badge
      const tdCat = document.createElement('td');
      tdCat.innerHTML = `<span class="badge-cat ${getCategoryBadgeClass(field.category)}">${escapeHtml(field.category)}</span>`;

      // 4. Necessity Status
      const tdStatus = document.createElement('td');
      tdStatus.innerHTML = getStatusBadgeHtml(field.necessityStatus);

      // 5. Recommended Action & Reason
      const tdReason = document.createElement('td');
      tdReason.innerHTML = `
        <div style="font-weight:600; font-size:0.8rem; color:#fff; margin-bottom:2px;">${escapeHtml(field.recommendedAction)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.35;">${escapeHtml(field.whyUnnecessary)}</div>
      `;

      // 6. Dossier Button
      const tdAction = document.createElement('td');
      tdAction.innerHTML = `<button class="btn btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;">Dossier</button>`;

      tr.appendChild(tdId);
      tr.appendChild(tdAssess);
      tr.appendChild(tdCat);
      tr.appendChild(tdStatus);
      tr.appendChild(tdReason);
      tr.appendChild(tdAction);

      // Click to open evidence dossier
      tr.addEventListener('click', () => {
        openEvidenceDossier(field);
      });

      findingsTableBodyEl.appendChild(tr);
    });
  }

  function getStatusBadgeHtml(status) {
    if (status === 'Likely excessive') {
      return `<span class="badge badge-excess"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Excessive</span>`;
    }
    if (status === 'Likely necessary') {
      return `<span class="badge badge-needed"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Necessary</span>`;
    }
    if (status === 'Unknown — review required') {
      return `<span class="badge badge-warn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Review</span>`;
    }
    return `<span class="badge badge-operational">Optional / Review</span>`;
  }

  function getCategoryBadgeClass(category) {
    switch (category) {
      case 'Identity': return 'badge-cat-identity';
      case 'Contact': return 'badge-cat-contact';
      case 'Financial': return 'badge-cat-financial';
      case 'Health': return 'badge-cat-health';
      case 'Location': return 'badge-cat-location';
      case "Children's Data": return 'badge-cat-children';
      case 'Authentication & Security': return 'badge-cat-auth';
      case 'User-Generated Content': return 'badge-cat-content';
      case 'Unknown / Requiring Review': return 'badge-cat-unknown';
      default: return 'badge-cat-non-personal';
    }
  }

  // =========================================================================
  // PRIVACY DETECTIVE EVIDENCE DOSSIER MODAL (Part 10)
  // =========================================================================
  function openEvidenceDossier(field) {
    dossierFieldTitleEl.textContent = field.rawIdentifier;
    dossierMetaSubtitleEl.innerHTML = `Category: <strong>${field.category}</strong> &bull; Assessment: <strong>${field.assessment}</strong> &bull; Status: <strong>${field.necessityStatus}</strong>`;
    dossierEvidenceLevelEl.textContent = field.evidenceStrength || 'High Evidence';

    dossierQ1DetectedEl.textContent = field.whatDetected || `Matched alias: "${field.matchedAlias}" (${field.evidenceText})`;
    dossierQ2WhyEl.textContent = field.whyUnnecessary || 'Evaluated under DPDP Section 6(1) purpose limitation principle.';
    dossierQ3ActionEl.textContent = field.recommendedAction || 'Consider data minimization.';

    if (field.alternative) {
      dossierAltBoxEl.style.display = 'block';
      dossierAltBodyEl.textContent = field.alternative;
    } else {
      dossierAltBoxEl.style.display = 'none';
    }

    dossierModalEl.style.display = 'flex';
  }

  btnCloseDossierEl.addEventListener('click', () => {
    dossierModalEl.style.display = 'none';
  });

  dossierModalEl.addEventListener('click', (e) => {
    if (e.target === dossierModalEl) {
      dossierModalEl.style.display = 'none';
    }
  });

  // =========================================================================
  // CONSENT STUDIO & QUALITY CHECKLIST (Part 14)
  // =========================================================================
  function renderConsentNotice(report) {
    if (!report || !report.consentNotices) return;
    noticeEditorEl.value = report.consentNotices[activeLanguage] || report.consentNotices.en;
    updateQualityChecklist(noticeEditorEl.value);
  }

  function updateQualityChecklist(noticeText) {
    const checks = auditor.checkNoticeQuality(noticeText);
    noticeQualityListEl.innerHTML = '';

    checks.forEach(check => {
      const item = document.createElement('div');
      item.className = 'check-item';

      let iconClass = check.passed ? 'check-icon-pass' : 'check-icon-fail';
      let iconSvg = check.passed
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

      if (check.warning) {
        iconClass = 'check-icon-warn';
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      }

      item.innerHTML = `
        <span class="${iconClass}" style="flex-shrink:0; margin-top:2px;">${iconSvg}</span>
        <div>
          <div style="color:${check.passed ? '#e2e8f0' : '#fca5a5'}; font-weight:600;">${check.label}</div>
          ${check.warning ? `<div style="font-size:0.72rem; color:#fde047; margin-top:2px;">${check.warning}</div>` : ''}
        </div>
      `;
      noticeQualityListEl.appendChild(item);
    });
  }

  noticeEditorEl.addEventListener('input', () => {
    updateQualityChecklist(noticeEditorEl.value);
  });

  btnCopyNoticeEl.addEventListener('click', () => {
    const text = noticeEditorEl.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Draft consent notice copied to clipboard!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Draft consent notice copied to clipboard!');
    });
  });

  // Language Tabs
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLanguage = btn.getAttribute('data-lang');
      if (currentReport) {
        renderConsentNotice(currentReport);
      }
    });
  });

  // =========================================================================
  // SURGERY EXPORTS: COPY MINIMIZED FORM / HTML
  // =========================================================================
  btnCopyMinimizedListEl.addEventListener('click', () => {
    if (!currentReport) return;
    const kept = currentReport.fields
      .filter(f => userSurgeryOverrides[f.rawIdentifier] !== 'remove' && (userSurgeryOverrides[f.rawIdentifier] === 'keep' || f.necessityStatus !== 'Likely excessive'))
      .map(f => f.rawIdentifier);

    const listText = kept.join(', ');
    navigator.clipboard.writeText(listText).then(() => {
      showToast(`Copied ${kept.length} minimized fields to clipboard!`);
    });
  });

  btnCopyMinimizedHtmlEl.addEventListener('click', () => {
    if (!currentReport) return;
    const kept = currentReport.fields
      .filter(f => userSurgeryOverrides[f.rawIdentifier] !== 'remove' && (userSurgeryOverrides[f.rawIdentifier] === 'keep' || f.necessityStatus !== 'Likely excessive'));

    let html = `<!-- FormSentry Minimized Form (DPDP Section 6(1) Compliant) -->\n<form action="/submit" method="POST">\n`;
    kept.forEach(f => {
      const isReq = (userSurgeryOverrides[f.rawIdentifier] === 'keep' || f.necessityStatus === 'Likely necessary') ? ' required' : '';
      const type = f.type || 'text';
      html += `  <label for="${escapeHtml(f.normalizedName)}">${escapeHtml(f.rawIdentifier)}</label>\n`;
      html += `  <input type="${escapeHtml(type)}" id="${escapeHtml(f.normalizedName)}" name="${escapeHtml(f.normalizedName)}"${isReq} />\n\n`;
    });
    html += `  <button type="submit">Submit</button>\n</form>`;

    navigator.clipboard.writeText(html).then(() => {
      showToast('Clean minimized HTML form copied to clipboard!');
    });
  });

  btnResetSurgeryEl.addEventListener('click', () => {
    // Clear user overrides
    Object.keys(userSurgeryOverrides).forEach(key => delete userSurgeryOverrides[key]);
    if (currentReport) {
      renderPrivacySurgery(currentReport);
      update3DParticles();
    }
    showToast('Reset proposed form to engine recommendations.');
  });

  // =========================================================================
  // MOCK DEMONSTRATION CHIPS (Part 17)
  // =========================================================================
  document.querySelectorAll('.example-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.example-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mockKey = btn.getAttribute('data-mock');
      currentMockKey = mockKey;
      const mock = DPDPAuditor.MOCK_EXAMPLES[mockKey];

      if (mock) {
        // Clear user overrides on new mock load
        Object.keys(userSurgeryOverrides).forEach(key => delete userSurgeryOverrides[key]);

        formPurposeSelectEl.value = mock.purpose;
        customPurposeBoxEl.style.display = 'none';

        if (currentInputMode === 'html') {
          formInputEl.value = mock.html;
        } else {
          formInputEl.value = mock.input;
        }

        runAudit();
      }
    });
  });

  // =========================================================================
  // INPUT MODE TABS: HTML VS LIST
  // =========================================================================
  tabHtmlBtn.addEventListener('click', () => {
    tabHtmlBtn.classList.add('active');
    tabListBtn.classList.remove('active');
    currentInputMode = 'html';
    inputModeLabelEl.textContent = 'Paste HTML Form Code:';
    const mock = DPDPAuditor.MOCK_EXAMPLES[currentMockKey];
    if (mock) {
      formInputEl.value = mock.html;
      runAudit();
    }
  });

  tabListBtn.addEventListener('click', () => {
    tabListBtn.classList.add('active');
    tabHtmlBtn.classList.remove('active');
    currentInputMode = 'list';
    inputModeLabelEl.textContent = 'Enter Comma or Line-Separated Field Names:';
    const mock = DPDPAuditor.MOCK_EXAMPLES[currentMockKey];
    if (mock) {
      formInputEl.value = mock.input;
      runAudit();
    }
  });

  // =========================================================================
  // PURPOSE SELECTOR CHANGE
  // =========================================================================
  formPurposeSelectEl.addEventListener('change', () => {
    if (formPurposeSelectEl.value === 'custom') {
      customPurposeBoxEl.style.display = 'block';
    } else {
      customPurposeBoxEl.style.display = 'none';
    }

    if (chkLiveAuditEl.checked) {
      runAudit();
    }
  });

  formCustomPurposeEl.addEventListener('input', () => {
    if (chkLiveAuditEl.checked) {
      runAudit();
    }
  });

  // =========================================================================
  // MAIN AUDIT BUTTONS
  // =========================================================================
  btnAuditMainEl.addEventListener('click', () => {
    runAudit();
    if (currentReport) {
      showToast(`Audit Complete: ${currentReport.counts.total} fields analyzed (${currentReport.counts.excessive} excessive)`);
    }
  });

  btnHeroAuditEl.addEventListener('click', () => {
    runAudit();
    if (currentReport) {
      showToast(`Audit Complete: ${currentReport.counts.total} fields analyzed (${currentReport.counts.excessive} excessive)`);
      const target = document.querySelector('.grid-workspace');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  formInputEl.addEventListener('input', () => {
    if (chkLiveAuditEl.checked) {
      runAudit();
    }
  });

  btnClearAllEl.addEventListener('click', () => {
    formInputEl.value = '';
    renderEmptyState();
    showToast('Input cleared.');
  });

  btnResetAnalysisEl.addEventListener('click', () => {
    Object.keys(userSurgeryOverrides).forEach(key => delete userSurgeryOverrides[key]);
    runAudit();
    showToast('Analysis reset.');
  });

  // =========================================================================
  // FINDINGS TABLE SEARCH & FILTERS
  // =========================================================================
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTableFilter = btn.getAttribute('data-filter');
      if (currentReport) {
        renderFindingsTable(currentReport.fields);
      }
    });
  });

  tableSearchInputEl.addEventListener('input', () => {
    if (currentReport) {
      renderFindingsTable(currentReport.fields);
    }
  });

  // =========================================================================
  // EXPORT TXT & PRINT PDF (Part 19)
  // =========================================================================
  btnExportTxtEl.addEventListener('click', () => {
    if (!currentReport) runAudit();
    const textContent = auditor.exportAsText(currentReport);

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formsentry-audit-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Downloaded formsentry-audit-report.txt');
  });

  btnExportPdfEl.addEventListener('click', () => {
    if (!currentReport) runAudit();
    window.print();
  });

  // =========================================================================
  // IN-BROWSER AUTOMATED MASTER TEST SUITE (Part 21)
  // =========================================================================
  btnHeroTestsEl.addEventListener('click', () => {
    testSuitePanelEl.style.display = 'block';
    testSuiteResultsListEl.innerHTML = '';

    const testLogs = [];
    function assertTest(condition, name) {
      testLogs.push({ passed: Boolean(condition), name });
    }

    const tAuditor = new DPDPAuditor();

    // Battery 1: Messy aliases
    const b1 = tAuditor.audit('user_email, mob_no, mobileNumber, dob, aadhaar_no, addr, health_condition', 'newsletter signup');
    assertTest(b1.fields.length === 7, 'Battery 1: Parsed all 7 messy field aliases');
    assertTest(b1.fields.find(f => f.rawIdentifier === 'mob_no').isExcess, 'Battery 1: mob_no detected as Contact alias and flagged Excess');
    assertTest(b1.fields.find(f => f.rawIdentifier === 'dob').isExcess, 'Battery 1: dob detected as Identity alias and flagged Excess');

    // Battery 2: HTML parser
    const b2Html = `<form><label for="e">Email</label><input type="email" id="e" name="user_email" autocomplete="email" required /></form>`;
    const b2 = tAuditor.parseInput(b2Html);
    assertTest(b2[0].autocomplete === 'email' && b2[0].label === 'Email', 'Battery 2: Extracted autocomplete and connected label via for= attribute');

    // Battery 3: Dynamic purpose switching
    const b3News = tAuditor.audit('student_dob, home_address', 'newsletter signup');
    assertTest(b3News.fields.every(f => f.necessityStatus === 'Likely excessive'), 'Battery 3: student_dob and address are EXCESS for newsletter');
    const b3School = tAuditor.audit('student_dob, home_address', 'school admission');
    assertTest(b3School.fields.find(f => f.rawIdentifier === 'student_dob').necessityStatus === 'Likely necessary', 'Battery 3: student_dob dynamically recalculated as LIKELY NECESSARY for school admission');

    // Battery 4: Privacy Detective 3 Questions
    const b4 = tAuditor.audit('aadhaar_no', 'newsletter signup').fields[0];
    assertTest(b4.whatDetected && b4.whyUnnecessary && b4.recommendedAction, 'Battery 4: Detective provides answers to all 3 core evidence questions');

    // Battery 5: Privacy Surgery
    const b5 = tAuditor.audit('user_email, full_name, dob', 'newsletter signup');
    assertTest(b5.surgery.keep.length === 1 && b5.surgery.remove.length === 1, 'Battery 5: Surgery KEEP, OPTIONAL, and REMOVE groupings computed correctly');

    // Battery 6: Consent Studio
    const b6 = tAuditor.audit('user_email', 'newsletter signup');
    assertTest(b6.consentNotices.en.includes('DRAFT CONSENT NOTICE') && b6.consentNotices.hi && b6.consentNotices.mr, 'Battery 6: Multi-lingual templates generated in EN, HI, MR');
    assertTest(b6.noticeQuality.some(q => q.id === 'withdrawal' && q.passed), 'Battery 6: Consent Notice Quality Checklist verifies Section 6(4) withdrawal instructions');

    // Battery 7: Unknown fields
    const b7 = tAuditor.audit('x7_data', 'newsletter signup').fields[0];
    assertTest(b7.assessment === 'Needs review' && b7.necessityStatus === 'Unknown — review required', 'Battery 7: Unknown field is flagged "Needs review" (not assumed non-personal)');

    // Battery 8: Empty/Malformed input
    assertTest(tAuditor.parseInput('').length === 0, 'Battery 8: Empty string handled safely');

    // Battery 9: Export text
    assertTest(tAuditor.exportAsText(b6).includes('FORMSENTRY'), 'Battery 9: Text dossier generated with FormSentry formatting');

    // Battery 10: Mock examples
    const b10 = tAuditor.audit(DPDPAuditor.MOCK_EXAMPLES.newsletter.input, 'newsletter signup');
    assertTest(b10.counts.excessive >= 4, 'Battery 10: Mock Example A (Newsletter) flags excessive DOB, Aadhaar, address, and health');

    let passedCount = 0;
    testLogs.forEach(t => {
      if (t.passed) passedCount++;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '0.45rem 0.75rem';
      row.style.background = '#06090e';
      row.style.borderRadius = '4px';
      row.style.fontSize = '0.78rem';
      row.style.fontFamily = 'var(--font-mono)';

      row.innerHTML = `
        <span style="color:#e2e8f0;">${escapeHtml(t.name)}</span>
        <span style="color:${t.passed ? '#10e871' : '#f43f5e'}; font-weight:700;">
          ${t.passed ? '✓ PASSED' : '✗ FAILED'}
        </span>
      `;
      testSuiteResultsListEl.appendChild(row);
    });

    showToast(`Master Test Suite: ${passedCount}/${testLogs.length} assertions passed!`);
  });

  btnCloseTestsEl.addEventListener('click', () => {
    testSuitePanelEl.style.display = 'none';
  });

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
  // INITIAL RUN: LOAD MOCK EXAMPLE A (NEWSLETTER)
  // =========================================================================
  const initMock = DPDPAuditor.MOCK_EXAMPLES.newsletter;
  formPurposeSelectEl.value = initMock.purpose;
  formInputEl.value = initMock.html;
  runAudit();
});
