/**
 * Comprehensive Test Suite for DPDP Form Auditor Core Engine
 * Verifies all Hackathon requirements, edge cases, and judge test scenarios.
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

console.log("=================================================");
console.log("RUNNING DPDP FORM AUDITOR TEST SUITE");
console.log("=================================================\n");

const auditor = new DPDPAuditor();

// -----------------------------------------------------------------
// TEST 1: Parsing messy real-world HTML form with odd field names
// -----------------------------------------------------------------
console.log("--- Test Suite 1: Messy Real-World Form Parsing ---");
const messyHtmlForm = `
<form id="signup-form">
  <input type="text" name="fname" placeholder="First Name" />
  <input type="email" name="user_email" required />
  <input type="tel" id="mob_no" name="mob_no" />
  <input type="text" name="cust_pin" placeholder="PIN Code" />
  <input type="text" id="usr_aadhaar_num" />
  <input type="date" name="txt_dob" />
  <input type="hidden" name="csrf_token" value="abc123xyz" />
  <button type="submit">Submit</button>
</form>
`;

const parsedFields = auditor.parseInput(messyHtmlForm);
assert(parsedFields.length === 7, `Correctly parsed 7 input fields from messy HTML (got ${parsedFields.length})`);

// -----------------------------------------------------------------
// TEST 2: Classification of odd field variations
// -----------------------------------------------------------------
console.log("\n--- Test Suite 2: Field Keyword & Pattern Classification ---");

const testCases = [
  { raw: 'mob_no', expectedCat: 'Contact', expectedPersonal: true },
  { raw: 'user_phone', expectedCat: 'Contact', expectedPersonal: true },
  { raw: 'fname', expectedCat: 'Identity', expectedPersonal: true },
  { raw: 'txt_dob', expectedCat: 'Identity', expectedPersonal: true },
  { raw: 'cust_pin', expectedCat: 'Contact', expectedPersonal: true },
  { raw: 'usr_aadhaar_num', expectedCat: 'Identity', expectedPersonal: true },
  { raw: 'pan_card', expectedCat: 'Financial', expectedPersonal: true },
  { raw: 'bank_acc_no', expectedCat: 'Financial', expectedPersonal: true },
  { raw: 'blood_group', expectedCat: 'Health', expectedPersonal: true },
  { raw: 'curr_loc', expectedCat: 'Location', expectedPersonal: true },
  { raw: 'child_name', expectedCat: "Children's Data", expectedPersonal: true },
  { raw: 'csrf_token', expectedCat: 'Non-Personal / Technical', expectedPersonal: false },
  { raw: 'discount_coupon', expectedCat: 'Non-Personal / Technical', expectedPersonal: false }
];

testCases.forEach(tc => {
  const result = auditor.classifyField({ rawIdentifier: tc.raw, name: tc.raw });
  assert(
    result.category === tc.expectedCat && result.isPersonal === tc.expectedPersonal,
    `Field "${tc.raw}" classified as ${result.category} (Personal: ${result.isPersonal})`
  );
});

// -----------------------------------------------------------------
// TEST 3: Purpose-Driven Excess Collection - Newsletter Signup
// -----------------------------------------------------------------
console.log("\n--- Test Suite 3: Purpose-Driven Excess Collection (Newsletter) ---");
const newsletterAudit = auditor.audit(messyHtmlForm, 'newsletter signup');

// Check that email is needed
const emailField = newsletterAudit.fields.find(f => f.name === 'user_email');
assert(emailField && !emailField.isExcess, 'Newsletter: user_email is NOT excess (Needed)');

// Check that mob_no, dob, cust_pin, aadhaar are flagged as EXCESS
const mobField = newsletterAudit.fields.find(f => f.name === 'mob_no');
assert(mobField && mobField.isExcess, 'Newsletter: mob_no is flagged as EXCESS');

const dobField = newsletterAudit.fields.find(f => f.name === 'txt_dob');
assert(dobField && dobField.isExcess, 'Newsletter: txt_dob is flagged as EXCESS');

const aadhaarField = newsletterAudit.fields.find(f => f.id === 'usr_aadhaar_num');
assert(aadhaarField && aadhaarField.isExcess, 'Newsletter: usr_aadhaar_num is flagged as EXCESS');

const csrfField = newsletterAudit.fields.find(f => f.name === 'csrf_token');
assert(csrfField && !csrfField.isExcess, 'Newsletter: csrf_token is non-personal (Operational)');

// -----------------------------------------------------------------
// TEST 4: Purpose-Driven Excess Collection - E-Commerce Checkout
// -----------------------------------------------------------------
console.log("\n--- Test Suite 4: Purpose-Driven Excess Collection (E-Commerce) ---");
const ecommerceForm = `name, phone, shipping_address, cust_pin, email, credit_card_no, blood_group, religion`;
const ecomAudit = auditor.audit(ecommerceForm, 'ecommerce checkout');

const bloodField = ecomAudit.fields.find(f => f.rawIdentifier === 'blood_group');
assert(bloodField && bloodField.isExcess, 'E-Commerce: blood_group is flagged as EXCESS');

const religionField = ecomAudit.fields.find(f => f.rawIdentifier === 'religion');
assert(religionField && religionField.isExcess, 'E-Commerce: religion is flagged as EXCESS');

const phoneField = ecomAudit.fields.find(f => f.rawIdentifier === 'phone');
assert(phoneField && !phoneField.isExcess, 'E-Commerce: phone is legitimately needed');

// -----------------------------------------------------------------
// TEST 5: Compliance Score Calculation
// -----------------------------------------------------------------
console.log("\n--- Test Suite 5: Compliance Score & Grade Calculation ---");
assert(newsletterAudit.compliance.score < 60, `Newsletter with excessive data has low score (Score: ${newsletterAudit.compliance.score})`);

// Clean form test
const cleanForm = `email`;
const cleanAudit = auditor.audit(cleanForm, 'newsletter signup');
assert(cleanAudit.compliance.score >= 90, `Clean form has high score (Score: ${cleanAudit.compliance.score}, Grade: ${cleanAudit.compliance.grade})`);

// -----------------------------------------------------------------
// TEST 6: Multi-Language Consent Notice Generation (EN, HI, MR)
// -----------------------------------------------------------------
console.log("\n--- Test Suite 6: Multi-Language Consent Notices (EN, HI, MR) ---");
const enNotice = newsletterAudit.consentNotices.en;
const hiNotice = newsletterAudit.consentNotices.hi;
const mrNotice = newsletterAudit.consentNotices.mr;

assert(enNotice.includes("DRAFT CONSENT NOTICE") && /Section 5 of DPDP Act/i.test(enNotice), "English notice properly formatted");
assert(hiNotice.includes("डिजिटल वैयक्तिक डेटा संरक्षण") && hiNotice.includes("सहमति सूचना का प्रारूप"), "Hindi notice properly generated with legal terminology");
assert(mrNotice.includes("डिजिटल वैयक्तिक डेटा संरक्षण कायदा") && mrNotice.includes("संमती नोटीस मसुदा"), "Marathi notice properly generated with legal terminology");

// -----------------------------------------------------------------
// TEST 7: Plain Text Export
// -----------------------------------------------------------------
console.log("\n--- Test Suite 7: Plain Text Export Generation ---");
const exportedText = auditor.exportAsText(newsletterAudit);
assert(exportedText.includes("FIELD ANALYSIS SUMMARY TABLE") && exportedText.includes("Compliance Score"), "Exported audit report generated successfully");

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log("=================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
