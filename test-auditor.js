/**
 * FormSentry - Master Test Suite
 * Verifies all 10 Core Evaluation Batteries from Part 21 of the FormSentry Specification
 */

const DPDPAuditor = require('./dpdp-auditor.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
  }
}

console.log("==================================================================");
console.log("FORMSENTRY PRIVACY INVESTIGATION LAB — MASTER TEST SUITE");
console.log("==================================================================\n");

const auditor = new DPDPAuditor();

// -----------------------------------------------------------------
// TEST 1: Messy Aliases & Lexicon
// -----------------------------------------------------------------
console.log("--- Battery 1: Messy Aliases & Lexicon Verification ---");
const messyList = 'user_email, mob_no, mobileNumber, user_phone, dob, aadhaar_no, addr, health_condition';
const t1Report = auditor.audit(messyList, 'newsletter signup');

assert(t1Report.fields.length === 8, 'Parsed all 8 messy field aliases');

const fEmail = t1Report.fields.find(f => f.rawIdentifier === 'user_email');
assert(fEmail && fEmail.category === 'Contact' && fEmail.assessment === 'Likely personal data', 'user_email classified as Contact (Personal)');

const fMobNo = t1Report.fields.find(f => f.rawIdentifier === 'mob_no');
assert(fMobNo && fMobNo.category === 'Contact' && fMobNo.isExcess, 'mob_no detected as Contact alias and flagged as Excess for newsletter');

const fMobCamel = t1Report.fields.find(f => f.rawIdentifier === 'mobileNumber');
assert(fMobCamel && fMobCamel.category === 'Contact' && fMobCamel.isExcess, 'mobileNumber camelCase alias recognized');

const fDob = t1Report.fields.find(f => f.rawIdentifier === 'dob');
assert(fDob && fDob.category === 'Identity' && fDob.isExcess, 'dob recognized as Identity alias and flagged Excess');

const fAadhaar = t1Report.fields.find(f => f.rawIdentifier === 'aadhaar_no');
assert(fAadhaar && fAadhaar.category === 'Identity' && fAadhaar.isExcess, 'aadhaar_no recognized as Identity and flagged Excess');

const fHealth = t1Report.fields.find(f => f.rawIdentifier === 'health_condition');
assert(fHealth && fHealth.category === 'Health' && fHealth.isExcess, 'health_condition recognized as Health and flagged Excess');

// -----------------------------------------------------------------
// TEST 2: Safe HTML Parser with DOMParser / Attributes
// -----------------------------------------------------------------
console.log("\n--- Battery 2: HTML Form Parser with Deep Metadata ---");
const testHtml = `
<form id="audit-form">
  <label for="f_email">Primary Email</label>
  <input type="email" id="f_email" name="user_email" autocomplete="email" placeholder="you@domain.com" required />

  <label for="f_tel">Phone</label>
  <input type="tel" id="f_tel" name="mob_no" />

  <label for="f_country">Country</label>
  <select id="f_country" name="user_country">
    <option value="IN">India</option>
  </select>

  <label for="f_notes">Special Instructions</label>
  <textarea id="f_notes" name="comments"></textarea>

  <input type="hidden" name="csrf_token" value="sec_token_999" />
  <button type="submit">Submit Form</button>
</form>
`;

const parsedHtmlFields = auditor.parseInput(testHtml);
assert(parsedHtmlFields.length === 5, `Extracted 5 data controls excluding standalone submit button (got ${parsedHtmlFields.length})`);

const emailParsed = parsedHtmlFields.find(f => f.name === 'user_email');
assert(emailParsed && emailParsed.autocomplete === 'email' && emailParsed.type === 'email' && emailParsed.label === 'Primary Email', 'Extracted name, type, autocomplete, and connected label via for= attribute');

// -----------------------------------------------------------------
// TEST 3: Dynamic Purpose Switching
// -----------------------------------------------------------------
console.log("\n--- Battery 3: Dynamic Purpose-Aware Necessity Recalculation ---");
const multiPurposeFields = 'student_dob, home_address';

// For newsletter signup
const newsAudit = auditor.audit(multiPurposeFields, 'newsletter signup');
const newsDob = newsAudit.fields.find(f => f.rawIdentifier === 'student_dob');
const newsAddr = newsAudit.fields.find(f => f.rawIdentifier === 'home_address');
assert(newsDob.necessityStatus === 'Likely excessive', 'Newsletter: student_dob is LIKELY EXCESSIVE');
assert(newsAddr.necessityStatus === 'Likely excessive', 'Newsletter: home_address is LIKELY EXCESSIVE');

// Switch purpose to school admission
const schoolAudit = auditor.audit(multiPurposeFields, 'school admission');
const schoolDob = schoolAudit.fields.find(f => f.rawIdentifier === 'student_dob');
const schoolAddr = schoolAudit.fields.find(f => f.rawIdentifier === 'home_address');
assert(schoolDob.necessityStatus === 'Likely necessary', 'School Admission: student_dob dynamically recalculated as LIKELY NECESSARY');
assert(schoolAddr.necessityStatus === 'Potentially necessary — justification needed', 'School Admission: home_address recalculated as POTENTIALLY NECESSARY');

// -----------------------------------------------------------------
// TEST 4: Privacy Detective (3-Question Evidence Diagnosis)
// -----------------------------------------------------------------
console.log("\n--- Battery 4: Evidence-Based Privacy Detective ---");
const detectiveAudit = auditor.audit('aadhaar_no', 'newsletter signup');
const aadhaarField = detectiveAudit.fields[0];

assert(aadhaarField.whatDetected && aadhaarField.whatDetected.includes('aadhaar_no'), 'Detective answers: What was detected');
assert(aadhaarField.whyUnnecessary && aadhaarField.whyUnnecessary.includes('purpose limitation'), 'Detective answers: Why it might be unnecessary');
assert(aadhaarField.recommendedAction && aadhaarField.recommendedAction.length > 0, 'Detective answers: What the owner should do');
assert(aadhaarField.alternative && aadhaarField.alternative.length > 0, 'Detective provides Minimum Data Alternative');

// -----------------------------------------------------------------
// TEST 5: Privacy Surgery (Grouping & Overrides)
// -----------------------------------------------------------------
console.log("\n--- Battery 5: Privacy Surgery Workspace ---");
const surgeryTest = auditor.audit('user_email, full_name, mob_no, dob, aadhaar_no', 'newsletter signup');
assert(surgeryTest.surgery.keep.some(f => f.rawIdentifier === 'user_email'), 'Surgery KEEP group contains user_email');
assert(surgeryTest.surgery.optional.some(f => f.rawIdentifier === 'full_name'), 'Surgery OPTIONAL group contains full_name');
assert(surgeryTest.surgery.remove.some(f => f.rawIdentifier === 'dob'), 'Surgery REMOVE group contains dob');
assert(surgeryTest.counts.total === 5 && surgeryTest.counts.excessive === 3, 'Surgery counts accurately match actual groupings');

// -----------------------------------------------------------------
// TEST 6: Consent Studio (Multi-Lingual & Quality Check)
// -----------------------------------------------------------------
console.log("\n--- Battery 6: Consent Studio & Quality Checklist ---");
const consentTest = auditor.audit('user_email, full_name', 'newsletter signup');
assert(consentTest.consentNotices.en.includes('DRAFT CONSENT NOTICE'), 'English draft consent notice generated');
assert(consentTest.consentNotices.hi.includes('डिजिटल वैयक्तिक डेटा संरक्षण'), 'Hindi draft consent notice generated with legal terms');
assert(consentTest.consentNotices.mr.includes('डिजिटल वैयक्तिक डेटा संरक्षण कायदा'), 'Marathi draft consent notice generated with legal terms');

const quality = consentTest.noticeQuality;
assert(quality.some(q => q.id === 'withdrawal' && q.passed), 'Notice quality check verifies consent withdrawal instructions');
assert(quality.some(q => q.id === 'disclaimer' && q.passed), 'Notice quality check verifies draft review disclaimer');

// -----------------------------------------------------------------
// TEST 7: Unknown Fields Handling
// -----------------------------------------------------------------
console.log("\n--- Battery 7: Unknown Fields are NOT Blindly Non-Personal ---");
const unknownTest = auditor.audit('x7_data', 'newsletter signup');
const unknownField = unknownTest.fields[0];
assert(unknownField.category === 'Unknown / Requiring Review', 'x7_data classified as Unknown category');
assert(unknownField.assessment === 'Needs review', 'x7_data assessment is "Needs review" (NOT falsely assumed non-personal)');
assert(unknownField.necessityStatus === 'Unknown — review required', 'x7_data necessity is "Unknown — review required"');

// -----------------------------------------------------------------
// TEST 8: Empty & Malformed Input Handling
// -----------------------------------------------------------------
console.log("\n--- Battery 8: Empty & Malformed Input Robustness ---");
assert(auditor.parseInput('').length === 0, 'Empty string returns empty array');
assert(auditor.parseInput('   ').length === 0, 'Whitespace returns empty array');
const malformed = auditor.parseInput('<form><input name="test" <input name="unclosed"');
assert(malformed.length >= 1, 'Malformed unclosed HTML handled safely without crashing');

// -----------------------------------------------------------------
// TEST 9: Privacy Assurance & Text Report Export
// -----------------------------------------------------------------
console.log("\n--- Battery 9: Privacy & Downloadable Text Dossier ---");
const exportReport = auditor.audit('user_email, mob_no', 'newsletter signup');
const textDoc = auditor.exportAsText(exportReport);
assert(textDoc.includes('FORMSENTRY // PRIVACY INVESTIGATION LAB REPORT'), 'Text export contains FormSentry header');
assert(textDoc.includes('PRIVACY SURGERY: RECOMMENDED MINIMIZED FORM'), 'Text export includes Privacy Surgery breakdown');
assert(textDoc.includes('DRAFT CONSENT NOTICE'), 'Text export includes draft consent notice');

// -----------------------------------------------------------------
// TEST 10: Mock Examples Verification
// -----------------------------------------------------------------
console.log("\n--- Battery 10: Mock Demonstration Cases Validation ---");
const exA = auditor.audit(DPDPAuditor.MOCK_EXAMPLES.newsletter.input, 'newsletter signup');
assert(exA.counts.excessive >= 4, 'Mock Example A (Newsletter) flags excess DOB, Aadhaar, address, and health');

const exB = auditor.audit(DPDPAuditor.MOCK_EXAMPLES.job.input, 'job application');
assert(exB.surgery.remove.some(f => f.rawIdentifier === 'bank_account'), 'Mock Example B (Job Application) flags premature bank details');

const exC = auditor.audit(DPDPAuditor.MOCK_EXAMPLES.school.input, 'school admission');
assert(exC.surgery.keep.some(f => f.rawIdentifier === 'student_name'), 'Mock Example C (School) preserves student name with Section 9 parental consent');

console.log("\n==================================================================");
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log("==================================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
