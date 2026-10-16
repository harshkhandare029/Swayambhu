/**
 * DPDP Form Auditor - Core Analysis Engine
 * Digital Personal Data Protection Act, 2023 (India) Compliance Engine
 * 
 * 100% Client-Side, Rule-Based, Zero External Dependencies
 * Built for "Vibe Coding: Swayambhu 2K26"
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DPDPAuditor = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. DATA CATEGORIES & SENSITIVITY DEFINITIONS (DPDP Act, 2023)
  // =========================================================================
  const CATEGORIES = {
    IDENTITY: 'Identity',
    CONTACT: 'Contact',
    FINANCIAL: 'Financial',
    HEALTH: 'Health',
    LOCATION: 'Location',
    CHILDREN: "Children's Data",
    NON_PERSONAL: 'Non-Personal / Technical'
  };

  const SENSITIVITY = {
    LOW: 'Standard',
    MEDIUM: 'Sensitive',
    HIGH: 'Critical (High Risk)'
  };

  // =========================================================================
  // 2. COMPREHENSIVE FIELD & ATTRIBUTE KEYWORD DICTIONARY
  // Handles variations like mob_no, user_phone, dob, cust_pin, fname, aadhaar
  // =========================================================================
  const FIELD_DICTIONARY = [
    // --- CHILDREN'S DATA (DPDP Section 9 Special Category) ---
    {
      category: CATEGORIES.CHILDREN,
      isPersonal: true,
      sensitivity: SENSITIVITY.HIGH,
      keywords: [
        'child', 'kid', 'minor', 'student_age', 'child_name', 'kids_name',
        'parent_name', 'guardian', 'guardian_name', 'parent_consent',
        'school_name', 'grade', 'class_standard', 'school_id', 'pediatric',
        'parent_phone', 'parent_email', 'under_18', 'minor_consent'
      ],
      patterns: [
        /\bchild(ren)?\b/i,
        /\bkid(s)?\b/i,
        /\bminor\b/i,
        /\bguardian\b/i,
        /\bparent(al)?\b/i,
        /\bunder_?18\b/i,
        /\bstudent_?(age|class|grade|dob)\b/i
      ],
      description: "Data relating to an individual below 18 years of age. Requires verifiable parental consent under DPDP Sec 9."
    },

    // --- FINANCIAL DATA ---
    {
      category: CATEGORIES.FINANCIAL,
      isPersonal: true,
      sensitivity: SENSITIVITY.HIGH,
      keywords: [
        'bank', 'account', 'acc_no', 'bank_acc', 'ifsc', 'ifsc_code',
        'card', 'cc_num', 'credit_card', 'debit_card', 'card_number', 'card_no',
        'cvv', 'cvc', 'expiry', 'exp_date', 'card_expiry',
        'upi', 'upi_id', 'vpa', 'bhim', 'gpay', 'paytm_no',
        'salary', 'income', 'annual_income', 'net_worth', 'ctc',
        'tax', 'pan', 'pan_card', 'pan_no', 'panno', 'tin', 'gst', 'gstin',
        'wallet_balance', 'crypto_address', 'billing_info'
      ],
      patterns: [
        /\b(bank|acc(ount)?)[_-]?(no|num|number)?\b/i,
        /\bifsc([_-]?code)?\b/i,
        /\b(credit|debit|card)[_-]?(no|num|number)?\b/i,
        /\bcvv|cvc\b/i,
        /\b(upi|vpa)([_-]?id)?\b/i,
        /\b(salary|income|ctc|net_?worth)\b/i,
        /\bpan([_-]?(card|no|num|number))?\b/i,
        /\bgst(in)?\b/i
      ],
      autocomplete: ['cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-amount'],
      description: "Financial identifiers, banking credentials, tax numbers, or payment tokens."
    },

    // --- HEALTH & BIOMETRIC DATA ---
    {
      category: CATEGORIES.HEALTH,
      isPersonal: true,
      sensitivity: SENSITIVITY.HIGH,
      keywords: [
        'health', 'medical', 'condition', 'disease', 'symptom', 'diagnosis',
        'blood', 'blood_group', 'blood_type', 'rh_factor',
        'disability', 'handicapped', 'pwd', 'physical_challenge',
        'prescription', 'doctor', 'physician', 'allergy', 'allergies',
        'medication', 'vaccine', 'vaccination', 'covid', 'biometric',
        'fingerprint', 'iris', 'retina', 'dna', 'genetic', 'mental_health',
        'psychiatric', 'hospital_id', 'insurance_policy_no', 'tpa_id'
      ],
      patterns: [
        /\bblood[_-]?(group|type)\b/i,
        /\bmedic(al|ine)?\b/i,
        /\bhealth([_-]?status)?\b/i,
        /\bdisabilit(y|ies)\b/i,
        /\bprescript(ion)?\b/i,
        /\bbiometric(s)?\b/i,
        /\bfingerprint\b/i,
        /\ballerg(y|ies)\b/i
      ],
      description: "Physical, physiological, mental health records, blood groups, or biometric characteristics."
    },

    // --- LOCATION DATA ---
    {
      category: CATEGORIES.LOCATION,
      isPersonal: true,
      sensitivity: SENSITIVITY.MEDIUM,
      keywords: [
        'location', 'gps', 'geo', 'coordinates', 'latitude', 'lat',
        'longitude', 'long', 'lng', 'live_loc', 'curr_loc', 'current_location',
        'tracking', 'ip', 'ip_address', 'device_location', 'beacon',
        'geofence', 'wifi_ssid', 'cell_tower', 'user_loc'
      ],
      patterns: [
        /\b(gps|geo(location)?)\b/i,
        /\b(lat(itude)?|long(itude)?|lng)\b/i,
        /\b(curr(ent)?|live)[_-]?loc(ation)?\b/i,
        /\bip([_-]?address)?\b/i
      ],
      description: "Real-time geolocation telemetry, GPS coordinates, or IP network footprints."
    },

    // --- CONTACT DATA ---
    {
      category: CATEGORIES.CONTACT,
      isPersonal: true,
      sensitivity: SENSITIVITY.LOW,
      keywords: [
        'email', 'mail', 'e_mail', 'user_email', 'work_email', 'personal_email',
        'phone', 'mobile', 'mob', 'mob_no', 'mobile_no', 'cell', 'cellphone',
        'tel', 'telephone', 'phone_number', 'user_phone', 'contact_no', 'whatsapp',
        'address', 'addr', 'street', 'city', 'state', 'province', 'country',
        'pin', 'pincode', 'pin_code', 'postal', 'postal_code', 'zip', 'zipcode',
        'zip_code', 'cust_pin', 'delivery_address', 'shipping_address', 'billing_address',
        'house_no', 'flat_no', 'apt_no', 'landmark'
      ],
      patterns: [
        /\be?[-_]?mail\b/i,
        /\b(mob(ile)?|phone|tel(ephone)?|cell)[_-]?(no|num|number)?\b/i,
        /\buser[_-]?(phone|mob|email)\b/i,
        /\bcontact[_-]?(no|num|number)?\b/i,
        /\bwhat?s?app\b/i,
        /\baddr(ess)?\b/i,
        /\b(pin|postal|zip)([_-]?code)?\b/i,
        /\bcust[_-]?pin\b/i
      ],
      inputTypes: ['email', 'tel'],
      autocomplete: ['email', 'tel', 'tel-national', 'tel-country-code', 'address-line1', 'address-line2', 'address-level1', 'address-level2', 'postal-code', 'country', 'country-name', 'street-address'],
      description: "Communication channels including phone, email, WhatsApp, and residential addresses."
    },

    // --- IDENTITY DATA ---
    {
      category: CATEGORIES.IDENTITY,
      isPersonal: true,
      sensitivity: SENSITIVITY.MEDIUM,
      keywords: [
        'name', 'fname', 'lname', 'first_name', 'last_name', 'full_name',
        'sur_name', 'surname', 'middle_name', 'user_name', 'username',
        'dob', 'date_of_birth', 'birth_date', 'birthdate', 'age', 'year_of_birth',
        'gender', 'sex', 'marital_status', 'father_name', 'mother_name',
        'aadhaar', 'aadhar', 'uidai', 'aadhaar_no', 'uid', 'usr_aadhaar',
        'passport', 'passport_no', 'voter_id', 'epic_no', 'driving_license',
        'dl_no', 'national_id', 'photo', 'avatar', 'profile_pic', 'signature',
        'religion', 'caste', 'nationality', 'citizenship'
      ],
      patterns: [
        /\b(first|last|full|sur|middle|user)[_-]?name\b/i,
        /\b(fname|lname)\b/i,
        /\bname\b/i,
        /\b(dob|birth[_-]?date|date[_-]?of[_-]?birth)\b/i,
        /\bage\b/i,
        /\bgender|sex\b/i,
        /\baadh?a?ar([_-]?no)?\b/i,
        /\bpassport([_-]?no)?\b/i,
        /\bvoter[_-]?id\b/i,
        /\b(driving[_-]?license|dl[_-]?no)\b/i
      ],
      autocomplete: ['name', 'given-name', 'family-name', 'additional-name', 'nickname', 'username', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex'],
      description: "Legal and biographical identifiers including official government IDs, name, age, and photographs."
    },

    // --- NON-PERSONAL / TECHNICAL DATA ---
    {
      category: CATEGORIES.NON_PERSONAL,
      isPersonal: false,
      sensitivity: SENSITIVITY.LOW,
      keywords: [
        'csrf', 'token', '_token', 'authenticity_token', 'captcha', 'recaptcha',
        'hcaptcha', 'nonce', 'timestamp', 'submit', 'btn', 'button', 'action',
        'query', 'search', 'q', 'filter', 'sort', 'page', 'limit', 'offset',
        'quantity', 'qty', 'color', 'size', 'theme', 'dark_mode', 'currency',
        'coupon', 'promo', 'discount_code', 'terms', 'agree', 'checkbox',
        'utm_source', 'utm_medium', 'utm_campaign', 'comment', 'feedback', 'message',
        'notes', 'subject', 'rating', 'review'
      ],
      patterns: [
        /\bcsrf[_-]?token\b/i,
        /\b_?token\b/i,
        /\bcaptcha\b/i,
        /\b(submit|btn|action)\b/i,
        /\b(qty|quantity|sort|filter|page)\b/i,
        /\b(terms|agree|consent_checkbox)\b/i
      ],
      inputTypes: ['submit', 'button', 'reset', 'hidden'],
      description: "System parameters, UI state variables, security tokens, or transaction attributes that do not identify an individual."
    }
  ];

  // =========================================================================
  // 3. PURPOSE SPECIFICATION & LEGITIMATE FIELD MAPPING
  // Maps declared purposes to genuinely necessary fields under DPDP Sec 6(1)
  // =========================================================================
  const PURPOSE_REGISTRY = [
    {
      id: 'newsletter',
      label: 'Newsletter / Mailing List',
      matchTerms: ['newsletter', 'subscribe', 'subscription', 'mailing', 'email list', 'updates', 'blog digest', 'weekly digest'],
      allowedCategories: [CATEGORIES.CONTACT, CATEGORIES.IDENTITY],
      necessaryFields: ['email', 'mail'],
      optionalFields: ['first_name', 'fname', 'name'],
      disallowedCategories: [CATEGORIES.FINANCIAL, CATEGORIES.HEALTH, CATEGORIES.LOCATION, CATEGORIES.CHILDREN],
      disallowedFields: ['dob', 'date_of_birth', 'birth', 'age', 'phone', 'mobile', 'mob', 'mob_no', 'cell', 'tel', 'address', 'pin', 'pincode', 'pin_code', 'postal', 'zip', 'cust_pin', 'pan', 'aadhaar', 'blood', 'blood_group', 'gps', 'loc'],
      explanation: "Email newsletters only require an email address (and optionally a first name for personalized greetings). Collecting phone numbers, date of birth, home addresses, or financial data violates the DPDP Section 6(1) purpose limitation principle."
    },
    {
      id: 'ecommerce_checkout',
      label: 'E-commerce Checkout & Delivery',
      matchTerms: ['ecommerce', 'checkout', 'shopping', 'buy', 'order', 'delivery', 'shipping', 'store', 'cart', 'purchase'],
      allowedCategories: [CATEGORIES.CONTACT, CATEGORIES.IDENTITY, CATEGORIES.FINANCIAL],
      necessaryFields: ['name', 'full_name', 'phone', 'mobile', 'address', 'pin_code', 'postal_code', 'city', 'state', 'email'],
      optionalFields: ['payment_method', 'billing_address', 'landmark'],
      disallowedCategories: [CATEGORIES.HEALTH, CATEGORIES.CHILDREN],
      disallowedFields: ['dob', 'date_of_birth', 'religion', 'caste', 'blood_group', 'aadhaar', 'voter_id', 'parent_name', 'salary'],
      explanation: "Product delivery requires recipient identity, delivery address, contact phone for courier, and payment information. Demographic data like religion, caste, blood group, or government IDs are non-essential and excessive."
    },
    {
      id: 'job_application',
      label: 'Job Application / Career Portal',
      matchTerms: ['job', 'career', 'employment', 'hire', 'recruitment', 'application', 'vacancy', 'resume', 'internship'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT],
      necessaryFields: ['name', 'email', 'phone', 'mobile', 'resume', 'education', 'experience'],
      optionalFields: ['city', 'linkedin', 'portfolio', 'current_employer'],
      disallowedCategories: [CATEGORIES.CHILDREN],
      disallowedFields: ['religion', 'caste', 'blood_group', 'bank_acc', 'credit_card', 'aadhaar', 'pan_card', 'gps', 'parents_aadhaar'],
      explanation: "Recruitment legitimately requires professional credentials and contact details. Collecting bank account info, sensitive demographic traits (caste/religion), or government ID numbers at initial application stage is excessive prior to formal hiring."
    },
    {
      id: 'account_registration',
      label: 'User Account Signup / Registration',
      matchTerms: ['signup', 'sign up', 'register', 'registration', 'create account', 'user account', 'onboarding'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT],
      necessaryFields: ['username', 'email', 'password'],
      optionalFields: ['name', 'phone', 'mobile'],
      disallowedCategories: [CATEGORIES.FINANCIAL, CATEGORIES.HEALTH, CATEGORIES.LOCATION, CATEGORIES.CHILDREN],
      disallowedFields: ['dob', 'date_of_birth', 'address', 'pan', 'aadhaar', 'bank_account', 'blood_group', 'curr_loc'],
      explanation: "Standard user account creation requires basic authentication credentials (email/username and password). Collecting physical home addresses, government IDs, or health metrics without specific functional need is unnecessary."
    },
    {
      id: 'healthcare_consultation',
      label: 'Healthcare / Doctor Teleconsultation',
      matchTerms: ['health', 'doctor', 'clinic', 'hospital', 'teleconsultation', 'medical', 'patient', 'appointment', 'consultation'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT, CATEGORIES.HEALTH],
      necessaryFields: ['name', 'phone', 'age', 'dob', 'gender', 'symptom', 'medical_history'],
      optionalFields: ['blood_group', 'allergies', 'emergency_contact'],
      disallowedCategories: [CATEGORIES.LOCATION],
      disallowedFields: ['pan', 'salary', 'income', 'religion', 'caste', 'live_loc', 'voter_id'],
      explanation: "Clinical consultations need patient identity, contact, age, and relevant health symptoms. Collecting annual income, caste, religion, or persistent real-time GPS telemetry is unwarranted."
    },
    {
      id: 'banking_kyc',
      label: 'Banking / KYC Verification / Financial Loan',
      matchTerms: ['bank', 'banking', 'kyc', 'loan', 'credit card', 'demat', 'investment', 'finance', 'fintech'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT, CATEGORIES.FINANCIAL],
      necessaryFields: ['name', 'phone', 'email', 'address', 'dob', 'pan', 'aadhaar', 'income'],
      optionalFields: ['bank_account', 'father_name', 'gender'],
      disallowedCategories: [CATEGORIES.HEALTH],
      disallowedFields: ['religion', 'caste', 'blood_group', 'medical_history', 'browser_history'],
      explanation: "Regulated financial services require statutory KYC identifiers (PAN, Aadhaar/ID) and income verification. However, collecting health records, religious affiliations, or biometric tracking outside statutory mandates is excessive."
    },
    {
      id: 'event_registration',
      label: 'Event / Webinar Registration',
      matchTerms: ['event', 'webinar', 'conference', 'workshop', 'seminar', 'meetup', 'rsvp', 'summit'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT],
      necessaryFields: ['name', 'email'],
      optionalFields: ['organization', 'company', 'designation', 'phone'],
      disallowedCategories: [CATEGORIES.FINANCIAL, CATEGORIES.HEALTH, CATEGORIES.LOCATION, CATEGORIES.CHILDREN],
      disallowedFields: ['address', 'dob', 'date_of_birth', 'aadhaar', 'pan', 'blood_group', 'home_address'],
      explanation: "Conferences and webinars require attendee identity and communication links. Physical home addresses, blood groups, and tax numbers are superfluous."
    },
    {
      id: 'children_education',
      label: "Children's Education / School Portal",
      matchTerms: ['child', 'kid', 'school', 'student', 'tuition', 'edtech', 'minor', 'k12'],
      allowedCategories: [CATEGORIES.CHILDREN, CATEGORIES.IDENTITY, CATEGORIES.CONTACT],
      necessaryFields: ['student_name', 'grade', 'parent_name', 'parent_phone', 'parent_email', 'parent_consent'],
      optionalFields: ['dob', 'address'],
      disallowedCategories: [CATEGORIES.FINANCIAL],
      disallowedFields: ['student_phone', 'child_pan', 'live_tracking', 'behavioral_profiling'],
      explanation: "DPDP Section 9 mandates verifiable parental consent for children. Direct marketing, behavioral tracking, or collecting child payment accounts is explicitly prohibited."
    },
    {
      id: 'contact_feedback',
      label: 'Contact Us / Support / Feedback Form',
      matchTerms: ['contact', 'support', 'help', 'inquiry', 'enquiry', 'feedback', 'message', 'reach us'],
      allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT, CATEGORIES.NON_PERSONAL],
      necessaryFields: ['email', 'message'],
      optionalFields: ['name', 'phone', 'subject'],
      disallowedCategories: [CATEGORIES.FINANCIAL, CATEGORIES.HEALTH, CATEGORIES.LOCATION, CATEGORIES.CHILDREN],
      disallowedFields: ['dob', 'date_of_birth', 'address', 'pin_code', 'aadhaar', 'pan', 'salary', 'blood_group'],
      explanation: "General contact and feedback forms only need a reply address and message text. Demanding date of birth, home address, or government IDs constitutes unlawful over-collection."
    }
  ];

  // =========================================================================
  // 4. PARSER HELPER UTILITIES
  // Tokenization, normalizers, and attribute cleaners
  // =========================================================================
  function cleanToken(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
      .replace(/[_\-\.]+/g, ' ')          // replace delimiters with space
      .replace(/^(txt|inp|input|ctl\d+|form|field|usr|user|lbl|id)[_\-\s]+/i, '') // strip common Hungarian prefixes
      .replace(/[_\-\s]+(val|txt|str|id|num|no|input|code)$/i, '')               // strip suffixes
      .trim()
      .toLowerCase();
  }

  function tokenize(str) {
    const cleaned = cleanToken(str);
    return cleaned.split(/\s+/).filter(Boolean);
  }

  // =========================================================================
  // 5. MAIN DPDPAuditor CLASS
  // =========================================================================
  class DPDPAuditor {
    constructor(options = {}) {
      this.options = Object.assign({
        strictMode: true,
        defaultPurpose: 'newsletter'
      }, options);
    }

    /**
     * Parse raw HTML or list of field names into structured field objects
     * @param {string} input - HTML string or comma/newline separated field list
     * @returns {Array<Object>} List of parsed fields with metadata
     */
    parseInput(input) {
      if (!input || typeof input !== 'string') {
        return [];
      }

      const trimmed = input.trim();
      const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);

      if (isHtml) {
        return this._parseHtmlForm(trimmed);
      } else {
        return this._parseFieldList(trimmed);
      }
    }

    /**
     * Parse HTML using DOMParser (browser) or regex fallback
     * Inspects name, id, type, autocomplete, placeholder, label text
     */
    _parseHtmlForm(htmlString) {
      const fields = [];

      // If in browser environment with DOMParser
      if (typeof DOMParser !== 'undefined') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');
          const elements = doc.querySelectorAll('input, select, textarea');

          elements.forEach((el, index) => {
            const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
            const name = el.getAttribute('name') || '';
            const id = el.getAttribute('id') || '';
            const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
            const placeholder = el.getAttribute('placeholder') || '';
            const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

            // Find associated label
            let labelText = '';
            if (id) {
              const labelEl = doc.querySelector(`label[for="${id}"]`);
              if (labelEl) labelText = labelEl.textContent.trim();
            }
            if (!labelText && el.closest('label')) {
              labelText = el.closest('label').textContent.trim();
            }
            if (!labelText && el.getAttribute('aria-label')) {
              labelText = el.getAttribute('aria-label').trim();
            }

            // Exclude pure submit buttons unless they have custom data
            if (['submit', 'reset', 'button'].includes(type) && !name && !id) {
              return;
            }

            const rawIdentifier = name || id || placeholder || labelText || `field_${index + 1}`;

            fields.push({
              rawIdentifier: rawIdentifier,
              name: name,
              id: id,
              type: type,
              autocomplete: autocomplete,
              placeholder: placeholder,
              label: labelText,
              required: required,
              source: 'html'
            });
          });

          if (fields.length > 0) return fields;
        } catch (e) {
          console.warn("DOMParser failed, falling back to regex parser:", e);
        }
      }

      // Regex fallback for non-browser or malformed HTML
      const tagRegex = /<(input|select|textarea)\b([^>]*)>/gi;
      let match;
      let counter = 1;

      while ((match = tagRegex.exec(htmlString)) !== null) {
        const tagName = match[1].toLowerCase();
        const attrString = match[2];

        const getAttr = (attr) => {
          const m = new RegExp(`\\b${attr}\\s*=\\s*["']([^"']*)["']`, 'i').exec(attrString);
          return m ? m[1] : '';
        };

        const type = (getAttr('type') || tagName).toLowerCase();
        const name = getAttr('name');
        const id = getAttr('id');
        const autocomplete = getAttr('autocomplete');
        const placeholder = getAttr('placeholder');
        const required = /\brequired\b/i.test(attrString);

        if (['submit', 'reset', 'button'].includes(type) && !name && !id) {
          continue;
        }

        fields.push({
          rawIdentifier: name || id || placeholder || `field_${counter}`,
          name: name,
          id: id,
          type: type,
          autocomplete: autocomplete,
          placeholder: placeholder,
          label: '',
          required: required,
          source: 'regex'
        });
        counter++;
      }

      return fields;
    }

    /**
     * Parse plain text / comma-separated / newline-separated field list
     */
    _parseFieldList(text) {
      // Split on commas, newlines, semicolons, or pipes
      const lines = text.split(/[\n,;|]+/);
      const fields = [];

      lines.forEach((item, index) => {
        const clean = item.trim();
        if (!clean) return;

        // Check if item contains type hint like "email: email" or "dob (date)"
        let fieldName = clean;
        let typeHint = 'text';

        const parenMatch = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (parenMatch) {
          fieldName = parenMatch[1].trim();
          typeHint = parenMatch[2].trim().toLowerCase();
        } else if (clean.includes(':')) {
          const parts = clean.split(':');
          fieldName = parts[0].trim();
          typeHint = parts[1].trim().toLowerCase();
        }

        fields.push({
          rawIdentifier: fieldName,
          name: fieldName,
          id: fieldName.replace(/\s+/g, '_').toLowerCase(),
          type: typeHint,
          autocomplete: '',
          placeholder: '',
          label: fieldName,
          required: false,
          source: 'list'
        });
      });

      return fields;
    }

    /**
     * Classifies a single field into DPDP Category and Personal Data status
     * @param {Object} field - The parsed field descriptor
     * @returns {Object} Classification result
     */
    classifyField(field) {
      const identifiers = [
        field.rawIdentifier,
        field.name,
        field.id,
        field.label,
        field.placeholder
      ].filter(Boolean);

      const combinedText = identifiers.join(' ').toLowerCase();
      const cleaned = cleanToken(combinedText);
      const tokens = tokenize(combinedText);
      const inputType = (field.type || '').toLowerCase();
      const autocomplete = (field.autocomplete || '').toLowerCase();

      // Check each category in dictionary
      for (const entry of FIELD_DICTIONARY) {
        // 1. Direct autocomplete match
        if (entry.autocomplete && autocomplete) {
          if (entry.autocomplete.some(ac => autocomplete.includes(ac))) {
            return {
              category: entry.category,
              isPersonal: entry.isPersonal,
              sensitivity: entry.sensitivity,
              confidence: 'High',
              matchedRule: `Autocomplete attribute: "${autocomplete}"`,
              description: entry.description
            };
          }
        }

        // 2. Direct inputType match (e.g. type="email", type="tel")
        if (entry.inputTypes && entry.inputTypes.includes(inputType)) {
          return {
            category: entry.category,
            isPersonal: entry.isPersonal,
            sensitivity: entry.sensitivity,
            confidence: 'High',
            matchedRule: `HTML input type: "${inputType}"`,
            description: entry.description
          };
        }

        // 3. Regex pattern match
        if (entry.patterns) {
          for (const pattern of entry.patterns) {
            if (pattern.test(combinedText) || pattern.test(cleaned)) {
              return {
                category: entry.category,
                isPersonal: entry.isPersonal,
                sensitivity: entry.sensitivity,
                confidence: 'High',
                matchedRule: `Pattern match: ${pattern}`,
                description: entry.description
              };
            }
          }
        }

        // 4. Keyword exact or substring match in tokens
        if (entry.keywords) {
          for (const kw of entry.keywords) {
            // Exact token match
            if (tokens.includes(kw) || cleaned.includes(kw)) {
              return {
                category: entry.category,
                isPersonal: entry.isPersonal,
                sensitivity: entry.sensitivity,
                confidence: 'Medium',
                matchedRule: `Keyword match: "${kw}"`,
                description: entry.description
              };
            }
            // Underscore or hyphen joined variants (e.g. mob_no, user_phone)
            const kwNoUnderscore = kw.replace(/_/g, '');
            const cleanedNoSpace = cleaned.replace(/\s+/g, '');
            if (cleanedNoSpace.includes(kwNoUnderscore) && kwNoUnderscore.length >= 3) {
              return {
                category: entry.category,
                isPersonal: entry.isPersonal,
                sensitivity: entry.sensitivity,
                confidence: 'Medium',
                matchedRule: `Normalized keyword: "${kw}"`,
                description: entry.description
              };
            }
          }
        }
      }

      // Default fallback: Check if input looks like general personal text
      // If field is a password or secret
      if (['password'].includes(inputType) || /pass(word)?|secret/i.test(cleaned)) {
        return {
          category: CATEGORIES.IDENTITY,
          isPersonal: true,
          sensitivity: SENSITIVITY.HIGH,
          confidence: 'High',
          matchedRule: 'Security Credential / Password',
          description: 'Authentication secrets and passwords.'
        };
      }

      // If field is a general text input without matches, treat as non-personal / unclassified
      return {
        category: CATEGORIES.NON_PERSONAL,
        isPersonal: false,
        sensitivity: SENSITIVITY.LOW,
        confidence: 'Low',
        matchedRule: 'Default fallback (No personal data pattern identified)',
        description: 'Generic non-identifying input field.'
      };
    }

    /**
     * Resolves the user-provided purpose string into a purpose profile
     * @param {string} userPurpose - One-line purpose description
     */
    resolvePurpose(userPurpose) {
      if (!userPurpose || typeof userPurpose !== 'string') {
        return PURPOSE_REGISTRY[0]; // Newsletter default
      }

      const cleanP = userPurpose.toLowerCase().trim();

      // Check registered purposes with matchTerms
      for (const p of PURPOSE_REGISTRY) {
        for (const term of p.matchTerms) {
          if (cleanP.includes(term)) {
            return p;
          }
        }
      }

      // Dynamic generic purpose profile if no exact preset matches
      return {
        id: 'custom_generic',
        label: `Custom: "${userPurpose.slice(0, 40)}"`,
        userPurpose: userPurpose,
        matchTerms: [],
        allowedCategories: [CATEGORIES.IDENTITY, CATEGORIES.CONTACT, CATEGORIES.NON_PERSONAL],
        necessaryFields: ['email', 'name'],
        optionalFields: ['phone', 'message'],
        disallowedCategories: [CATEGORIES.FINANCIAL, CATEGORIES.HEALTH, CATEGORIES.CHILDREN],
        disallowedFields: ['aadhaar', 'pan', 'blood_group', 'bank_acc', 'gps', 'credit_card'],
        explanation: `Custom purpose "${userPurpose}". Under DPDP Act Sec 6(1), only fields strictly required for this stated objective are permitted. Sensitive financial, biometric, or health data requires explicit statutory justification.`
      };
    }

    /**
     * Evaluate whether a classified field is necessary or excess for the given purpose
     * @param {Object} field - Raw field data
     * @param {Object} classification - Result of classifyField()
     * @param {Object} purposeProfile - Resolved purpose profile
     */
    evaluateExcess(field, classification, purposeProfile) {
      // Non-personal data is never "excess personal collection"
      if (!classification.isPersonal || classification.category === CATEGORIES.NON_PERSONAL) {
        return {
          isExcess: false,
          necessityStatus: 'Needed (Operational)',
          reason: 'Field does not collect personal data (operational / UI control / CSRF token).'
        };
      }

      const idLower = (field.rawIdentifier + ' ' + (field.name || '') + ' ' + (field.id || '')).toLowerCase();
      const tokens = tokenize(idLower);

      // Check children's data special restriction (DPDP Section 9)
      if (classification.category === CATEGORIES.CHILDREN && purposeProfile.id !== 'children_education') {
        return {
          isExcess: true,
          necessityStatus: 'Excess (Severe - Section 9)',
          reason: `DPDP Sec 9 Violation: Collection of children's personal data is prohibited without verifiable parental consent and is unwarranted for "${purposeProfile.label}".`
        };
      }

      // Check explicitly disallowed categories
      if (purposeProfile.disallowedCategories.includes(classification.category)) {
        return {
          isExcess: true,
          necessityStatus: 'Excess Collection',
          reason: `${classification.category} is irrelevant for "${purposeProfile.label}". DPDP Act Section 6(1) mandates strict data minimization.`
        };
      }

      // Check explicitly disallowed fields
      for (const disallowed of purposeProfile.disallowedFields) {
        const disClean = cleanToken(disallowed);
        if (tokens.includes(disallowed) || 
            tokens.some(t => t === disallowed || (t.length >= 3 && disallowed.includes(t)) || (disallowed.length >= 3 && t.includes(disallowed))) ||
            cleanToken(idLower).includes(disClean) ||
            idLower.includes(disallowed)) {
          return {
            isExcess: true,
            necessityStatus: 'Excess Collection',
            reason: `Field "${field.rawIdentifier}" is non-essential for "${purposeProfile.label}". Data minimization requires excluding it.`
          };
        }
      }

      // Newsletter strict purpose limitation
      if (purposeProfile.id === 'newsletter') {
        const isEmail = tokens.includes('email') || tokens.includes('mail') || idLower.includes('email') || field.type === 'email';
        const isName = tokens.includes('name') || tokens.includes('fname') || idLower.includes('name');
        if (!isEmail && !isName) {
          return {
            isExcess: true,
            necessityStatus: 'Excess Collection',
            reason: `Field "${field.rawIdentifier}" (${classification.category}) is unnecessary for newsletter dispatch. DPDP Section 6(1) restricts collection to email.`
          };
        }
      }

      // Check if it matches strictly necessary fields
      for (const nec of purposeProfile.necessaryFields) {
        if (tokens.includes(nec) || cleanToken(idLower).includes(nec)) {
          return {
            isExcess: false,
            necessityStatus: 'Strictly Necessary',
            reason: `Directly required to fulfill the specified purpose: "${purposeProfile.label}".`
          };
        }
      }

      // Check if it is permitted optional field
      if (purposeProfile.optionalFields) {
        for (const opt of purposeProfile.optionalFields) {
          if (tokens.includes(opt) || cleanToken(idLower).includes(opt)) {
            return {
              isExcess: false,
              necessityStatus: 'Permissible / Optional',
              reason: `Legitimately complementary to "${purposeProfile.label}" (e.g. personalization or secondary communication).`
            };
          }
        }
      }

      // If category is allowed but field was not specifically whitelisted
      if (purposeProfile.allowedCategories.includes(classification.category)) {
        // High sensitivity fields in allowed category (e.g., Aadhaar in Identity) are excess unless needed
        if (classification.sensitivity === SENSITIVITY.HIGH) {
          return {
            isExcess: true,
            necessityStatus: 'Excess Collection',
            reason: `High-sensitivity identifier in ${classification.category} is disproportionate for "${purposeProfile.label}".`
          };
        }

        return {
          isExcess: false,
          necessityStatus: 'Permissible',
          reason: `Falls within acceptable ${classification.category} scope for "${purposeProfile.label}".`
        };
      }

      // Default: If not allowed, it's excess
      return {
        isExcess: true,
        necessityStatus: 'Excess Collection',
        reason: `Not justified by the stated purpose: "${purposeProfile.label}". Violates DPDP Section 6(1) purpose limitation.`
      };
    }

    /**
     * Compute DPDP Compliance Score (0 - 100)
     */
    calculateComplianceScore(auditResults) {
      const personalFields = auditResults.filter(r => r.isPersonal);

      if (personalFields.length === 0) {
        return {
          score: 100,
          grade: 'A+',
          status: 'Exemplary Compliance',
          explanation: 'No personal data collected; zero privacy liability under DPDP Act, 2023.'
        };
      }

      const totalPersonal = personalFields.length;
      let penaltyPoints = 0;

      personalFields.forEach(field => {
        if (field.isExcess) {
          let fieldPenalty = 20; // Base penalty per excess field

          // Severe penalties for sensitive excess
          if (field.category === CATEGORIES.CHILDREN) {
            fieldPenalty = 45; // Section 9 violation
          } else if (field.category === CATEGORIES.FINANCIAL) {
            fieldPenalty = 35; // Sensitive financial over-collection
          } else if (field.category === CATEGORIES.HEALTH) {
            fieldPenalty = 35; // Sensitive biometric/health over-collection
          } else if (field.category === CATEGORIES.LOCATION) {
            fieldPenalty = 25; // Continuous tracking over-collection
          }

          penaltyPoints += fieldPenalty;
        }
      });

      // Calculate score bounded [0, 100]
      const rawScore = Math.max(0, 100 - penaltyPoints);
      const score = Math.round(rawScore);

      let grade = 'A';
      let status = 'High Compliance';
      let explanation = '';

      if (score >= 90) {
        grade = 'A+';
        status = 'Excellent DPDP Compliance';
        explanation = 'Form adheres strictly to the Data Minimization Principle (Section 6). Personal data collected matches legitimate purpose requirements.';
      } else if (score >= 70) {
        grade = 'B';
        status = 'Moderate Compliance (Warnings)';
        explanation = 'Minor excess collection detected. Some personal data fields are not strictly necessary for the stated purpose. Pruning recommended.';
      } else if (score >= 45) {
        grade = 'C';
        status = 'Non-Compliant (High Risk)';
        explanation = 'Significant excess collection identified. Fields collect sensitive identity, financial, or demographic data not justified by purpose.';
      } else {
        grade = 'F';
        status = 'Severe Non-Compliance (Critical)';
        explanation = 'Unlawful over-collection under DPDP Act 2023. Contains critical excess data (children, financial, biometric, or location) without lawful basis.';
      }

      return {
        score,
        grade,
        status,
        penaltyPoints,
        explanation
      };
    }

    /**
     * Generate DPDP Section 5 Draft Consent Notice
     * Supports English, Hindi (हिंदी), and Marathi (मराठी)
     */
    generateConsentNotice(auditResults, purposeProfile, lang = 'en') {
      const personalFields = auditResults.filter(r => r.isPersonal);
      const collectedItems = personalFields.map(f => f.rawIdentifier).join(', ') || 'No personal data';
      const categoriesSet = [...new Set(personalFields.map(f => f.category))];
      const categoriesText = categoriesSet.join(', ') || 'None';
      const purposeText = purposeProfile.userPurpose || purposeProfile.label;

      const notices = {
        en: `
================================================================================
DRAFT CONSENT NOTICE (UNDER SECTION 5 OF DPDP ACT, 2023)
[LEGAL NOTICE: This is a generated automated draft for informational guidance and does not constitute formal legal counsel.]
================================================================================

1. DATA FIDUCIARY NOTICE:
We respect your privacy under the Digital Personal Data Protection Act, 2023 (DPDP Act). Before providing your personal data, please review the specified purpose and categories of data being processed.

2. SPECIFIED PURPOSE OF PROCESSING (SECTION 6):
Your personal data will be collected and processed strictly for the following purpose:
"${purposeText}".

3. CATEGORIES OF PERSONAL DATA PROCESSED:
Categories: ${categoriesText}
Specific Fields Collected: ${collectedItems}

4. PURPOSE LIMITATION & DATA RETENTION:
Your personal data shall only be used for the specified purpose above and shall not be retained longer than necessary to achieve this purpose or to comply with applicable statutory obligations.

5. WITHDRAWAL OF CONSENT (SECTION 6(4)):
You have the unconditional right to withdraw your consent at any time. The process of withdrawing consent is as simple as the process of giving consent. You may withdraw consent by contacting our Data Protection Officer (DPO) at:
Email: privacy@organization.in / dpo@organization.in
Upon receipt of consent withdrawal, processing of your personal data will cease within statutory timelines, unless required by law.

6. DATA PRINCIPAL RIGHTS & GRIEVANCE REDRESSAL:
Under the DPDP Act, 2023, you have the right to:
- Access a summary of personal data processed.
- Request correction, updating, or erasure of personal data.
- Nominate an individual in the event of death or incapacity.
- Register a grievance with our Grievance Officer (resolution within 30 days).
- Escalate unresolved complaints to the Data Protection Board of India (DPBI).
================================================================================
`.trim(),

        hi: `
================================================================================
डिजिटल वैयक्तिक डेटा संरक्षण अधिनियम, 2023 के अंतर्गत सहमति सूचना का प्रारूप
[अस्वीकरण: यह एक स्वचालित सूचना प्रारूप है, इसे कानूनी सलाह न माना जाए।]
================================================================================

1. डेटा फिड्यूशियरी (Data Fiduciary) सूचना:
हम डिजिटल वैयक्तिक डेटा संरक्षण अधिनियम, 2023 (DPDP Act) के तहत आपकी निजता का सम्मान करते हैं। अपना वैयक्तिक डेटा प्रदान करने से पहले, कृपया निर्दिष्ट उद्देश्य और डेटा श्रेणियों की समीक्षा करें।

2. डेटा प्रसंस्करण का निर्दिष्ट उद्देश्य (धारा 6):
आपका वैयक्तिक डेटा केवल निम्नलिखित उद्देश्य के लिए एकत्र और संसाधित किया जाएगा:
"${purposeText}".

3. एकत्र किए गए वैयक्तिक डेटा की श्रेणियां:
श्रेणियां: ${categoriesText}
विशिष्ट डेटा फ़ील्ड: ${collectedItems}

4. उद्देश्य परिसीमन एवं डेटा प्रतिधारण:
आपके वैयक्तिक डेटा का उपयोग केवल ऊपर बताए गए उद्देश्य के लिए किया जाएगा और उद्देश्य पूरा होने के बाद इसे सुरक्षित रूप से हटा दिया जाएगा।

5. सहमति वापस लेने का अधिकार (धारा 6(4)):
आपको किसी भी समय अपनी सहमति वापस लेने का पूर्ण अधिकार है। सहमति वापस लेने की प्रक्रिया उतनी ही सरल है जितनी सहमति देने की प्रक्रिया थी। आप हमारे डेटा संरक्षण अधिकारी से संपर्क कर सकते हैं:
ईमेल: privacy@organization.in / dpo@organization.in

6. डेटा स्वामी (Data Principal) के अधिकार और शिकायत निवारण:
DPDP अधिनियम, 2023 के तहत आपको डेटा सुधार, हटाने और शिकायत निवारण का अधिकार प्राप्त है। असंतुष्ट होने पर आप भारत के डेटा संरक्षण बोर्ड (DPBI) में शिकायत दर्ज कर सकते हैं।
================================================================================
`.trim(),

        mr: `
================================================================================
डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३ अंतर्गत संमती नोटीस मसुदा
[टीप: हा एक संगणक-निर्मित मसुदा असून कायदेशीर सल्ला नाही.]
================================================================================

1. डेटा फिड्युशियरी (Data Fiduciary) सूचना:
आम्ही डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३ (DPDP Act) नुसार तुमच्या गोपनीयतेचा आदर करतो. तुमचा वैयक्तिक डेटा देण्यापूर्वी कृपया खालील उद्देश आणि गोळा केल्या जाणाऱ्या डेटाचे वर्गीकरण काळजीपूर्वक वाचावे.

2. डेटा प्रक्रियेचा स्पष्ट उद्देश (कलम ६):
तुमचा वैयक्तिक डेटा केवळ खालील कारणासाठी संकलित आणि वापरला जाईल:
"${purposeText}".

3. संकलित वैयक्तिक डेटाच्या श्रेणी:
श्रेणी: ${categoriesText}
विशिष्ट डेटा घटक: ${collectedItems}

4. उद्देश मर्यादा आणि डेटा साठवणूक:
तुमचा डेटा केवळ नमूद केलेल्या कारणासाठीच वापरला जाईल आणि उद्दिष्ट पूर्ण झाल्यानंतर कायदेशीर नियमांनुसार नष्ट केला जाईल.

5. संमती मागे घेण्याचा अधिकार (कलम ६(४)):
तुम्हाला दिलेली संमती कधीही मागे घेण्याचा पूर्ण अधिकार आहे. संमती मागे घेण्याची पद्धत संमती देण्याइतकीच सुलभ आहे. यासाठी तुम्ही आमच्या डेटा संरक्षण अधिकाऱ्याशी संपर्क साधू शकता:
ईमेल: privacy@organization.in / dpo@organization.in

6. तक्रार निवारण आणि अधिकार:
DPDP कायदा, २०२३ अंतर्गत तुम्हाला डेटा तपासण्याचा, दुरुस्त करण्याचा किंवा हटवण्याचा अधिकार आहे. निराकरण न झाल्यास तुम्ही भारतीय डेटा संरक्षण मंडळाकडे (DPBI) दाद मागू शकता.
================================================================================
`.trim()
      };

      return notices[lang] || notices.en;
    }

    /**
     * Complete Audit Pipeline
     * @param {string} formInput - Raw HTML form or list of field names
     * @param {string} purpose - Stated purpose (e.g. "newsletter signup")
     * @returns {Object} Comprehensive audit report
     */
    audit(formInput, purpose) {
      const parsedFields = this.parseInput(formInput);
      const purposeProfile = this.resolvePurpose(purpose);

      const fieldResults = parsedFields.map(field => {
        const classification = this.classifyField(field);
        const excessEval = this.evaluateExcess(field, classification, purposeProfile);

        return {
          rawIdentifier: field.rawIdentifier,
          name: field.name,
          id: field.id,
          type: field.type,
          autocomplete: field.autocomplete,
          required: field.required,
          isPersonal: classification.isPersonal,
          category: classification.category,
          sensitivity: classification.sensitivity,
          confidence: classification.confidence,
          matchedRule: classification.matchedRule,
          isExcess: excessEval.isExcess,
          necessityStatus: excessEval.necessityStatus,
          reason: excessEval.reason
        };
      });

      const complianceScore = this.calculateComplianceScore(fieldResults);

      const categoriesSummary = {};
      Object.values(CATEGORIES).forEach(cat => {
        categoriesSummary[cat] = fieldResults.filter(f => f.category === cat).length;
      });

      const personalCount = fieldResults.filter(f => f.isPersonal).length;
      const excessCount = fieldResults.filter(f => f.isExcess).length;
      const neededCount = personalCount - excessCount;

      return {
        timestamp: new Date().toISOString(),
        purpose: purposeProfile,
        fieldsCount: fieldResults.length,
        personalCount,
        excessCount,
        neededCount,
        categoriesSummary,
        fields: fieldResults,
        compliance: complianceScore,
        consentNotices: {
          en: this.generateConsentNotice(fieldResults, purposeProfile, 'en'),
          hi: this.generateConsentNotice(fieldResults, purposeProfile, 'hi'),
          mr: this.generateConsentNotice(fieldResults, purposeProfile, 'mr')
        }
      };
    }

    /**
     * Export audit report as formatted plain text / markdown
     */
    exportAsText(auditReport) {
      const c = auditReport.compliance;
      const p = auditReport.purpose;

      let text = '';
      text += `====================================================================\n`;
      text += `         DPDP FORM AUDITOR - COMPLIANCE AUDIT REPORT\n`;
      text += `      Digital Personal Data Protection Act, 2023 (India)\n`;
      text += `====================================================================\n\n`;
      text += `Audit Timestamp  : ${auditReport.timestamp}\n`;
      text += `Declared Purpose : ${p.label} ("${p.userPurpose || p.label}")\n`;
      text += `Total Fields     : ${auditReport.fieldsCount}\n`;
      text += `Personal Fields  : ${auditReport.personalCount}\n`;
      text += `Excess Fields    : ${auditReport.excessCount}\n`;
      text += `Compliance Score : ${c.score}/100 [Grade: ${c.grade}] (${c.status})\n`;
      text += `Score Analysis   : ${c.explanation}\n\n`;

      text += `--------------------------------------------------------------------\n`;
      text += `                    FIELD ANALYSIS SUMMARY TABLE\n`;
      text += `--------------------------------------------------------------------\n`;
      text += `Field Name            | Category        | Personal? | Status    | Reason\n`;
      text += `--------------------------------------------------------------------\n`;

      auditReport.fields.forEach(f => {
        const name = (f.rawIdentifier || 'unnamed').padEnd(21).slice(0, 21);
        const cat = (f.category || 'N/A').padEnd(15).slice(0, 15);
        const isP = (f.isPersonal ? 'Yes' : 'No').padEnd(9);
        const status = (f.isExcess ? 'EXCESS' : 'NEEDED').padEnd(9);
        text += `${name} | ${cat} | ${isP} | ${status} | ${f.reason}\n`;
      });

      text += `\n--------------------------------------------------------------------\n`;
      text += `                 DRAFT CONSENT NOTICE (SECTION 5)\n`;
      text += `--------------------------------------------------------------------\n`;
      text += auditReport.consentNotices.en;
      text += `\n\n[Report generated by DPDP Form Auditor - 100% Client-Side Engine]\n`;

      return text;
    }
  }

  // Expose presets and categories on class
  DPDPAuditor.CATEGORIES = CATEGORIES;
  DPDPAuditor.SENSITIVITY = SENSITIVITY;
  DPDPAuditor.PURPOSE_REGISTRY = PURPOSE_REGISTRY;

  return DPDPAuditor;
}));
