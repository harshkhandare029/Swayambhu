const DPDPAuditor = require('./dpdp-auditor.js');
const a = new DPDPAuditor();

const demoHtml = `
<form id="subscriber_onboarding" action="/join" method="POST">
  <label for="f_name">First Name</label>
  <input type="text" id="f_name" name="fname" placeholder="Your name" />

  <label for="primary_email">Email Address</label>
  <input type="email" id="primary_email" name="user_email" autocomplete="email" required />

  <label for="cell_num">Mobile Contact</label>
  <input type="tel" id="cell_num" name="mob_no" placeholder="+91 9876543210" />

  <label for="dob_input">Date of Birth</label>
  <input type="date" id="dob_input" name="txt_dob" />

  <label for="postal_pin">Postal Area</label>
  <input type="text" id="postal_pin" name="cust_pin" placeholder="PIN Code" />

  <label for="nat_id">National ID</label>
  <input type="text" id="nat_id" name="usr_aadhaar_num" placeholder="12-digit Aadhaar" />

  <label for="blood_type">Blood Group</label>
  <input type="text" id="blood_type" name="blood_grp" placeholder="e.g. O+" />

  <input type="hidden" name="csrf_token" value="sec_b94d27b9934d" />
  <button type="submit">Subscribe Now</button>
</form>
`;

const report = a.audit(demoHtml, 'newsletter');
console.log("Minimization Score:", report.score.score, `(Grade ${report.score.grade})`);
console.log("Status:", report.score.status);
console.log("Total Fields:", report.counts.total);
console.log("Personal:", report.counts.personal);
console.log("Excessive:", report.counts.excessive);
console.log("\nField Breakdown:");
report.fields.forEach(f => {
  console.log(`- ${f.rawIdentifier} (${f.category}) => ${f.necessityStatus}`);
});
