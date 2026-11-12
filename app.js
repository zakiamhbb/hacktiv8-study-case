/* =====================================================================
   TEST CASE GENERATOR — Client-Side Logic
   IBM Global AI Builders Challenge
   =====================================================================
   Architecture:
   ─ Generator:     rule-based NLP analysis producing structured test cases
   ─ Store:         in-memory array (testCases[])
   ─ Renderer:      renders store to DOM table
   ─ Filters:       filterCategory / filterPriority selections
   ─ Export/Copy:   CSV serialization
   ─ LLM hook:      generateWithLLM() stub — swap in real API call later

   All test case IDs follow the pattern TC-<FEATURE>-<CATEGORY>-<SEQ>
   ===================================================================== */

// ── State ──────────────────────────────────────────────────────────
let testCases = [];    // { id, title, category, priority, preconditions, steps[], testData, expected }
let idCounter = 1;

// ── DOM refs ────────────────────────────────────────────────────────
const requirementsInput = document.getElementById('requirementsInput');
const featureName       = document.getElementById('featureName');
const categorySelect    = document.getElementById('categorySelect');
const btnGenerate       = document.getElementById('btnGenerate');
const btnReset          = document.getElementById('btnReset');
const btnLoadExample    = document.getElementById('btnLoadExample');
const btnExport         = document.getElementById('btnExport');
const btnCopy           = document.getElementById('btnCopy');
const filterCategory    = document.getElementById('filterCategory');
const filterPriority    = document.getElementById('filterPriority');
const filterCount       = document.getElementById('filterCount');
const testCaseBody      = document.getElementById('testCaseBody');
const emptyState        = document.getElementById('emptyState');
const statsGrid         = document.getElementById('statsGrid');
const resultsSection    = document.getElementById('results-section');
const loadingOverlay    = document.getElementById('loadingOverlay');
const reqValidation     = document.getElementById('reqValidation');
const toast             = document.getElementById('toast');

// ── Category styling map ────────────────────────────────────────────
const CAT_CLASS = {
  'Positive':       'tag-positive',
  'Negative':       'tag-negative',
  'Boundary':       'tag-boundary',
  'Edge Case':      'tag-edge',
  'Validation':     'tag-validation',
  'Error Handling': 'tag-error',
};
const CAT_ABBR = {
  'Positive':       'POS',
  'Negative':       'NEG',
  'Boundary':       'BVT',
  'Edge Case':      'EDG',
  'Validation':     'VAL',
  'Error Handling': 'ERR',
};

// ── Example Requirements ────────────────────────────────────────────
const EXAMPLE_REQ = `User Story: User Login
As a registered user, I want to log in to the application using my email and password so that I can access my personalised dashboard.

Acceptance Criteria:
- The email field is required and must follow a valid email format (e.g., user@example.com).
- The password field is required and must be at least 8 characters long.
- A "Remember Me" checkbox is available and persists the session for 30 days if checked.
- The system must display a clear error message if the credentials are incorrect.
- The account must be locked after 5 consecutive failed login attempts.
- A locked account displays a message with instructions to contact support.
- Passwords are case-sensitive.
- After successful login, the user is redirected to the dashboard.
- A "Forgot Password" link is available on the login page.`;

const EXAMPLE_FEATURE = 'User Login';

// ── Load Example ────────────────────────────────────────────────────
btnLoadExample.addEventListener('click', () => {
  requirementsInput.value = EXAMPLE_REQ;
  featureName.value = EXAMPLE_FEATURE;
  categorySelect.value = 'all';
  hideValidation();
  showToast('Example requirements loaded.', 'success');
});

// ── Reset ────────────────────────────────────────────────────────────
btnReset.addEventListener('click', () => {
  requirementsInput.value = '';
  featureName.value = '';
  categorySelect.value = 'all';
  filterCategory.value = 'all';
  filterPriority.value = 'all';
  testCases = [];
  idCounter = 1;
  resultsSection.classList.remove('visible');
  hideValidation();
  showToast('Workspace reset.', 'success');
});

// ── Generate ─────────────────────────────────────────────────────────
btnGenerate.addEventListener('click', async () => {
  const req = requirementsInput.value.trim();
  if (!req) {
    showValidation();
    requirementsInput.focus();
    return;
  }
  hideValidation();

  showLoading(true);
  // Simulated async generation delay (deterministic, no external call)
  await delay(900);

  const feature = featureName.value.trim() || 'Feature';
  const catFilter = categorySelect.value;

  testCases = [];
  idCounter = 1;

  // ── Core generation ──────────────────────────────────────────────
  // LLM hook: replace generateTestCases() with generateWithLLM() for AI integration
  const generated = generateTestCases(req, feature);

  // Apply category filter from generation form
  const filtered = catFilter === 'all'
    ? generated
    : generated.filter(tc => normCat(tc.category) === catFilter);

  testCases = filtered;

  showLoading(false);
  renderStats();
  renderTable();
  resultsSection.classList.add('visible');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`${testCases.length} test cases generated.`, 'success');
});

// ── Filters ───────────────────────────────────────────────────────────
filterCategory.addEventListener('change', renderTable);
filterPriority.addEventListener('change', renderTable);

// ── Export CSV ────────────────────────────────────────────────────────
btnExport.addEventListener('click', () => {
  if (!testCases.length) { showToast('No test cases to export.', 'error'); return; }
  const csv = buildCSV(testCases);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-cases-${sanitizeFilename(featureName.value || 'export')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully.', 'success');
});

// ── Copy to Clipboard ─────────────────────────────────────────────────
btnCopy.addEventListener('click', async () => {
  if (!testCases.length) { showToast('No test cases to copy.', 'error'); return; }
  const csv = buildCSV(testCases);
  try {
    await navigator.clipboard.writeText(csv);
    showToast('Copied to clipboard as CSV.', 'success');
  } catch {
    showToast('Clipboard access denied. Try Export CSV instead.', 'error');
  }
});

// =====================================================================
//  GENERATION ENGINE
//  Modular, rule-based. Swap generateTestCases() for LLM calls later.
// =====================================================================

/**
 * LLM hook stub — replace this function body with a real fetch() call to
 * an LLM API endpoint. The return value must be the same format as
 * generateTestCases(): an array of test case objects.
 */
// async function generateWithLLM(requirements, featureName) {
//   const response = await fetch('/api/generate', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ requirements, featureName })
//   });
//   return await response.json(); // must return TestCase[]
// }

/**
 * Main generation function.
 * Analyses the requirement text and produces test cases per category.
 */
function generateTestCases(req, featureName) {
  const results = [];
  const lines = req.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract key entities for richer test data
  const entities = extractEntities(req);
  const feature = featureName.replace(/\s+/g, '-').toUpperCase().slice(0, 8) || 'FT';

  // ── 1. Positive / Happy Path ─────────────────────────────────────
  results.push(...buildPositiveCases(req, lines, entities, feature));

  // ── 2. Negative ─────────────────────────────────────────────────
  results.push(...buildNegativeCases(req, lines, entities, feature));

  // ── 3. Boundary Value ────────────────────────────────────────────
  results.push(...buildBoundaryCases(req, lines, entities, feature));

  // ── 4. Edge Cases ────────────────────────────────────────────────
  results.push(...buildEdgeCases(req, lines, entities, feature));

  // ── 5. Validation ────────────────────────────────────────────────
  results.push(...buildValidationCases(req, lines, entities, feature));

  // ── 6. Error Handling ────────────────────────────────────────────
  results.push(...buildErrorHandlingCases(req, lines, entities, feature));

  return results;
}

// ─── Entity Extraction ──────────────────────────────────────────────
function extractEntities(req) {
  const entities = {
    hasLogin:    /log.?in|sign.?in|auth/i.test(req),
    hasPassword: /password/i.test(req),
    hasEmail:    /email/i.test(req),
    hasForm:     /form|submit|field|input/i.test(req),
    hasSearch:   /search|find|query/i.test(req),
    hasUpload:   /upload|file|attachment/i.test(req),
    hasPayment:  /pay|checkout|card|billing/i.test(req),
    hasUser:     /user|account|profile/i.test(req),
    hasNumber:   /number|amount|quantity|count|limit|max|min/i.test(req),
    hasDate:     /date|time|expir/i.test(req),
    hasRole:     /role|permission|admin|access/i.test(req),
    minChars:    extractNumber(req, /at least (\d+) char/i),
    maxChars:    extractNumber(req, /(?:max|maximum|up to|no more than) (\d+)/i),
    maxAttempts: extractNumber(req, /(\d+) (?:failed|consecutive|wrong)/i),
    sessionDays: extractNumber(req, /(\d+) days?/i),
    // extract field names mentioned
    fields:      extractFields(req),
    // extract explicit conditions (lines starting with - or •)
    criteria:    req.split('\n').filter(l => /^\s*[-•*]/.test(l)).map(l => l.replace(/^\s*[-•*]\s*/, '').trim()),
  };
  return entities;
}

function extractNumber(text, regex) {
  const m = text.match(regex);
  return m ? parseInt(m[1]) : null;
}

function extractFields(text) {
  const patterns = [
    /(\w[\w\s]*)\s+field/gi,
    /(?:enter|provide|input)\s+(?:your\s+)?(\w[\w\s]*)/gi,
  ];
  const fields = new Set();
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const f = m[1].trim().toLowerCase();
      if (f.length < 25 && !['the', 'a', 'an', 'this', 'that', 'valid', 'invalid'].includes(f)) {
        fields.add(f);
      }
    }
  }
  return [...fields].slice(0, 6);
}

// ─── ID Generator ──────────────────────────────────────────────────
function makeId(feature, category) {
  const abbr = CAT_ABBR[category] || 'TC';
  return `TC-${feature}-${abbr}-${String(idCounter++).padStart(3, '0')}`;
}

// ─── Positive Cases ─────────────────────────────────────────────────
function buildPositiveCases(req, lines, ent, feature) {
  const cases = [];

  if (ent.hasLogin && ent.hasEmail && ent.hasPassword) {
    cases.push({
      id: makeId(feature, 'Positive'),
      title: 'Successful login with valid credentials',
      category: 'Positive',
      priority: 'High',
      preconditions: 'User has a registered account. System is accessible.',
      steps: [
        'Navigate to the login page.',
        'Enter a valid registered email address.',
        'Enter the correct password.',
        'Click the "Login" button.',
      ],
      testData: `Email: user@example.com | Password: ValidPass1!`,
      expected: 'User is authenticated and redirected to the dashboard. Session is established.',
    });
  }

  if (ent.criteria.length > 0) {
    // Generate one positive case per major acceptance criterion
    ent.criteria.slice(0, 3).forEach((criterion, i) => {
      if (!isNegativeCriterion(criterion)) {
        cases.push({
          id: makeId(feature, 'Positive'),
          title: `Happy path: ${capitalise(criterion.slice(0, 60))}`,
          category: 'Positive',
          priority: i === 0 ? 'High' : 'Medium',
          preconditions: 'System is in the expected initial state. All dependencies are available.',
          steps: [
            'Set up the preconditions as described.',
            `Perform the action described by: "${criterion.slice(0, 80)}"`,
            'Observe the system response.',
          ],
          testData: 'Valid inputs meeting all stated requirements.',
          expected: `System behaves as specified: ${criterion.slice(0, 100)}.`,
        });
      }
    });
  }

  if (ent.hasSearch) {
    cases.push({
      id: makeId(feature, 'Positive'),
      title: 'Successful search with valid keyword',
      category: 'Positive',
      priority: 'High',
      preconditions: 'System has at least one matching record available.',
      steps: ['Navigate to the search interface.', 'Enter a valid, known keyword.', 'Submit the search.'],
      testData: 'Keyword: "existing item name"',
      expected: 'Search results are displayed and include the expected matching records.',
    });
  }

  if (ent.hasUpload) {
    cases.push({
      id: makeId(feature, 'Positive'),
      title: 'Successful file upload with supported format',
      category: 'Positive',
      priority: 'High',
      preconditions: 'User is authenticated. Upload feature is enabled.',
      steps: ['Navigate to the upload section.', 'Select a supported file type (e.g. PDF, JPG).', 'Click Upload.'],
      testData: 'File: valid_document.pdf (< max size limit)',
      expected: 'File is uploaded successfully. Confirmation message is displayed.',
    });
  }

  if (ent.hasPayment) {
    cases.push({
      id: makeId(feature, 'Positive'),
      title: 'Successful payment with valid card details',
      category: 'Positive',
      priority: 'High',
      preconditions: 'Cart has at least one item. User is authenticated.',
      steps: ['Proceed to checkout.', 'Enter valid card details.', 'Confirm the payment.'],
      testData: 'Card: 4242 4242 4242 4242 | Expiry: 12/28 | CVV: 123',
      expected: 'Payment is processed. Confirmation email is sent. Order is created.',
    });
  }

  // Fallback positive case if nothing specific was found
  if (cases.length === 0) {
    cases.push({
      id: makeId(feature, 'Positive'),
      title: 'Core functionality with valid inputs',
      category: 'Positive',
      priority: 'High',
      preconditions: 'System is operational. All preconditions from the requirement are met.',
      steps: ['Prepare all required inputs as specified.', 'Execute the primary action described.', 'Observe the output.'],
      testData: 'All inputs are within valid ranges and formats.',
      expected: 'System completes the action successfully and produces the expected output.',
    });
  }

  return cases;
}

// ─── Negative Cases ─────────────────────────────────────────────────
function buildNegativeCases(req, lines, ent, feature) {
  const cases = [];

  if (ent.hasLogin) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Login with incorrect password',
      category: 'Negative',
      priority: 'High',
      preconditions: 'Valid user account exists.',
      steps: ['Navigate to the login page.', 'Enter a valid email address.', 'Enter an incorrect password.', 'Click Login.'],
      testData: 'Email: user@example.com | Password: WrongPass99!',
      expected: 'Login is rejected. An error message is displayed (e.g. "Invalid credentials"). User remains on the login page.',
    });

    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Login with non-existent email',
      category: 'Negative',
      priority: 'High',
      preconditions: 'System is accessible.',
      steps: ['Navigate to the login page.', 'Enter an email not registered in the system.', 'Enter any password.', 'Click Login.'],
      testData: 'Email: noone@notexist.xyz | Password: AnyPassword1!',
      expected: 'Login fails. A generic error message is shown. The system does not confirm or deny account existence.',
    });
  }

  if (ent.hasEmail) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Submit with invalid email format',
      category: 'Negative',
      priority: 'High',
      preconditions: 'Form is displayed.',
      steps: ['Focus on the email field.', 'Enter a value in an invalid format.', 'Attempt to submit.'],
      testData: 'Email: "notanemail", "user@", "@domain.com", "user@domain"',
      expected: 'Form submission is prevented. Inline validation error states the email format is invalid.',
    });
  }

  if (ent.hasForm || ent.fields.length > 0) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Submit form with all required fields empty',
      category: 'Negative',
      priority: 'High',
      preconditions: 'Form is displayed and all fields are empty.',
      steps: ['Leave all fields blank.', 'Click the submit button.'],
      testData: 'All fields: (empty)',
      expected: 'Submission is blocked. Validation errors are shown for each required field.',
    });
  }

  if (ent.hasSearch) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Search for a non-existent record',
      category: 'Negative',
      priority: 'Medium',
      preconditions: 'No matching record exists in the system.',
      steps: ['Navigate to search.', 'Enter a keyword that has no matches.', 'Submit the search.'],
      testData: 'Keyword: "@@##$$%%NONEXISTENT_RECORD_XYZ"',
      expected: 'An empty-state message is displayed (e.g. "No results found"). The page does not crash.',
    });
  }

  if (ent.hasUpload) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Upload a file with an unsupported format',
      category: 'Negative',
      priority: 'Medium',
      preconditions: 'Upload feature is accessible.',
      steps: ['Navigate to the upload section.', 'Attempt to upload an unsupported file type.'],
      testData: 'File: script.exe',
      expected: 'Upload is rejected. An error message states the file type is not supported.',
    });
  }

  if (ent.hasPayment) {
    cases.push({
      id: makeId(feature, 'Negative'),
      title: 'Payment with an expired credit card',
      category: 'Negative',
      priority: 'High',
      preconditions: 'Cart has items. User is on the checkout page.',
      steps: ['Enter an expired card number.', 'Attempt to submit payment.'],
      testData: 'Card: 4242 4242 4242 4242 | Expiry: 01/20 | CVV: 123',
      expected: 'Payment is declined. An error message informs the user the card is expired.',
    });
  }

  return cases;
}

// ─── Boundary Value Cases ────────────────────────────────────────────
function buildBoundaryCases(req, lines, ent, feature) {
  const cases = [];
  const min = ent.minChars;
  const max = ent.maxChars;

  if (min !== null && ent.hasPassword) {
    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Password exactly at minimum length (${min} characters)`,
      category: 'Boundary',
      priority: 'High',
      preconditions: 'Registration or password change form is accessible.',
      steps: [`Enter a password of exactly ${min} characters.`, 'Submit the form.'],
      testData: `Password: ${'A'.repeat(Math.min(min - 1, 5))}1a${'!'.repeat(Math.max(min - 7, 1))} (${min} chars)`,
      expected: `Password is accepted. The system treats ${min} characters as a valid minimum.`,
    });

    if (min > 1) {
      cases.push({
        id: makeId(feature, 'Boundary'),
        title: `Password one character below minimum (${min - 1} characters)`,
        category: 'Boundary',
        priority: 'High',
        preconditions: 'Form is accessible.',
        steps: [`Enter a password of exactly ${min - 1} characters.`, 'Submit the form.'],
        testData: `Password: ${'A'.repeat(min - 1)} (${min - 1} chars)`,
        expected: `Password is rejected. Error message indicates the minimum length is ${min} characters.`,
      });
    }
  }

  if (max !== null) {
    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Input at maximum allowed length (${max} characters)`,
      category: 'Boundary',
      priority: 'Medium',
      preconditions: 'Input field is visible.',
      steps: [`Enter exactly ${max} characters into the relevant input field.`, 'Submit.'],
      testData: `Value: ${'x'.repeat(max)} (${max} chars)`,
      expected: `Input is accepted. No error is shown for the ${max}-character boundary.`,
    });

    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Input one character above maximum (${max + 1} characters)`,
      category: 'Boundary',
      priority: 'High',
      preconditions: 'Input field is visible.',
      steps: [`Enter ${max + 1} characters.`, 'Attempt to submit.'],
      testData: `Value: ${'x'.repeat(max + 1)} (${max + 1} chars)`,
      expected: `Input is rejected or truncated. System enforces the ${max}-character maximum.`,
    });
  }

  if (ent.maxAttempts !== null && ent.hasLogin) {
    const n = ent.maxAttempts;
    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Account lockout at exactly ${n} failed attempts`,
      category: 'Boundary',
      priority: 'High',
      preconditions: 'Valid user account exists. No prior failed attempts.',
      steps: [`Perform ${n - 1} failed login attempts.`, 'Attempt one more login with wrong credentials.'],
      testData: `Email: user@example.com | Password: WrongPass (repeated ${n}×)`,
      expected: `Account is locked on the ${n}th attempt. A lockout message is displayed.`,
    });

    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Verify ${n - 1} failed attempts does NOT lock the account`,
      category: 'Boundary',
      priority: 'Medium',
      preconditions: 'Valid user account exists. No prior failed attempts.',
      steps: [`Perform ${n - 1} failed login attempts.`, 'Attempt login with the correct password.'],
      testData: `Wrong password ×${n - 1}, then correct credentials`,
      expected: `Account is not locked. Login succeeds on the ${n}th attempt using correct credentials.`,
    });
  }

  if (ent.sessionDays !== null) {
    cases.push({
      id: makeId(feature, 'Boundary'),
      title: `Session expires exactly at ${ent.sessionDays}-day boundary`,
      category: 'Boundary',
      priority: 'Medium',
      preconditions: '"Remember Me" was checked at login.',
      steps: [`Simulate time advancing to exactly ${ent.sessionDays} days after login.`, 'Attempt to access a protected page.'],
      testData: `Session age: ${ent.sessionDays} days exactly`,
      expected: `Session expires. User is redirected to the login page.`,
    });
  }

  // Generic numeric boundary if numbers detected but no specific rule
  if (cases.length === 0 && ent.hasNumber) {
    cases.push({
      id: makeId(feature, 'Boundary'),
      title: 'Input at the lower boundary value',
      category: 'Boundary',
      priority: 'Medium',
      preconditions: 'Numeric input field is accessible.',
      steps: ['Enter the minimum allowed numeric value.', 'Submit.'],
      testData: 'Value: minimum boundary (as per specification)',
      expected: 'Input is accepted. System processes the minimum boundary correctly.',
    });

    cases.push({
      id: makeId(feature, 'Boundary'),
      title: 'Input at the upper boundary value',
      category: 'Boundary',
      priority: 'Medium',
      preconditions: 'Numeric input field is accessible.',
      steps: ['Enter the maximum allowed numeric value.', 'Submit.'],
      testData: 'Value: maximum boundary (as per specification)',
      expected: 'Input is accepted. System processes the maximum boundary correctly.',
    });
  }

  return cases;
}

// ─── Edge Cases ──────────────────────────────────────────────────────
function buildEdgeCases(req, lines, ent, feature) {
  const cases = [];

  if (ent.hasLogin) {
    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Login with leading/trailing spaces in email',
      category: 'Edge Case',
      priority: 'Medium',
      preconditions: 'Valid user account exists.',
      steps: ['Enter email with a leading or trailing space (e.g. " user@example.com").', 'Enter correct password.', 'Submit.'],
      testData: 'Email: " user@example.com " (with spaces)',
      expected: 'System trims whitespace and processes the login, OR displays an appropriate validation error.',
    });

    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Login with email in mixed case',
      category: 'Edge Case',
      priority: 'Low',
      preconditions: 'User account was registered with a lowercase email.',
      steps: ['Enter the registered email in mixed case (e.g. USER@EXAMPLE.COM).', 'Enter the correct password.', 'Submit.'],
      testData: 'Email: USER@EXAMPLE.COM | Password: ValidPass1!',
      expected: 'Login succeeds. Email comparison is case-insensitive.',
    });
  }

  if (ent.hasPassword) {
    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Password containing special characters and Unicode',
      category: 'Edge Case',
      priority: 'Medium',
      preconditions: 'Registration form is accessible.',
      steps: ['Enter a password with special characters and/or non-ASCII characters.', 'Submit.'],
      testData: "Password: P@$$w0rd!\u2713\u03b1\u03b2",
      expected: 'Password is accepted and stored securely. No truncation or encoding errors occur.',
    });
  }

  if (ent.hasForm) {
    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Submit form by pressing Enter key',
      category: 'Edge Case',
      priority: 'Low',
      preconditions: 'Form is displayed with data entered.',
      steps: ['Fill in valid form data.', 'Press the Enter key instead of clicking Submit.'],
      testData: 'Standard valid inputs.',
      expected: 'Form is submitted via the Enter key. Behaviour is identical to clicking the submit button.',
    });

    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Double-click the submit button rapidly',
      category: 'Edge Case',
      priority: 'Medium',
      preconditions: 'Valid form data is entered.',
      steps: ['Double-click the submit button in quick succession.'],
      testData: 'Valid form inputs.',
      expected: 'The action is processed only once. No duplicate submissions or errors occur.',
    });
  }

  if (ent.hasSearch) {
    cases.push({
      id: makeId(feature, 'Edge Case'),
      title: 'Search with SQL injection string',
      category: 'Edge Case',
      priority: 'High',
      preconditions: 'Search interface is accessible.',
      steps: ["Enter a potential SQL injection string into the search field.", "Submit the search."],
      testData: "Keyword: '; DROP TABLE users; --",
      expected: 'Input is sanitised. No SQL error is exposed. System returns empty results or displays a validation message.',
    });
  }

  cases.push({
    id: makeId(feature, 'Edge Case'),
    title: 'Behaviour when session expires mid-interaction',
    category: 'Edge Case',
    priority: 'Medium',
    preconditions: 'User is authenticated and on a form or page.',
    steps: ['Allow the user session to expire (simulate timeout).', 'Attempt to perform an action or submit data.'],
    testData: 'Session token: expired',
    expected: 'User is redirected to the login page. A message informs the user the session has expired. No data is lost silently.',
  });

  cases.push({
    id: makeId(feature, 'Edge Case'),
    title: 'Page refresh during an ongoing operation',
    category: 'Edge Case',
    priority: 'Low',
    preconditions: 'User has started an operation (e.g. uploading, submitting).',
    steps: ['Initiate the operation.', 'Immediately refresh the browser page.'],
    testData: 'Any in-progress action.',
    expected: 'System handles the refresh gracefully. Either the action completes or the user is informed they need to retry.',
  });

  return cases;
}

// ─── Validation Cases ────────────────────────────────────────────────
function buildValidationCases(req, lines, ent, feature) {
  const cases = [];

  if (ent.hasEmail) {
    cases.push({
      id: makeId(feature, 'Validation'),
      title: 'Email field accepts only valid format',
      category: 'Validation',
      priority: 'High',
      preconditions: 'Form containing an email field is displayed.',
      steps: ['Enter each invalid format listed in test data.', 'Attempt to submit after each entry.'],
      testData: 'Invalid: "test", "test@", "@domain.com", "test.domain.com", "test @example.com"',
      expected: 'Each invalid format triggers an inline validation error. The form is not submitted.',
    });
  }

  if (ent.hasPassword && ent.minChars !== null) {
    cases.push({
      id: makeId(feature, 'Validation'),
      title: `Password field enforces ${ent.minChars}-character minimum`,
      category: 'Validation',
      priority: 'High',
      preconditions: 'Password input field is visible.',
      steps: [`Enter a password shorter than ${ent.minChars} characters.`, 'Attempt to submit.'],
      testData: `Password: "abc" (3 chars, below minimum of ${ent.minChars})`,
      expected: `Validation error: "Password must be at least ${ent.minChars} characters." Form is not submitted.`,
    });
  }

  if (ent.fields.length > 0) {
    cases.push({
      id: makeId(feature, 'Validation'),
      title: `Required fields display errors when left blank`,
      category: 'Validation',
      priority: 'High',
      preconditions: 'Form is displayed.',
      steps: ['Leave all detected required fields empty.', 'Click the submit button.'],
      testData: `Required fields: ${ent.fields.join(', ')}`,
      expected: 'All required fields are highlighted. Specific validation messages appear for each field.',
    });
  }

  if (ent.hasNumber) {
    cases.push({
      id: makeId(feature, 'Validation'),
      title: 'Numeric field rejects alphabetical input',
      category: 'Validation',
      priority: 'Medium',
      preconditions: 'Form with a numeric input is displayed.',
      steps: ['Enter alphabetical or special characters in a numeric-only field.', 'Attempt to submit.'],
      testData: 'Input: "abc", "12.34.56", "-1e5"',
      expected: 'Input is rejected or filtered. Validation error message is displayed.',
    });
  }

  if (ent.hasDate) {
    cases.push({
      id: makeId(feature, 'Validation'),
      title: 'Date field validates correct date format',
      category: 'Validation',
      priority: 'Medium',
      preconditions: 'Date input field is visible.',
      steps: ['Enter a date in an incorrect format.', 'Enter a non-existent date (e.g. 31/02/2024).', 'Attempt to submit.'],
      testData: 'Invalid dates: "13/32/2024", "99-99-9999", "Feb 30 2024"',
      expected: 'Invalid dates are rejected. A validation error is shown.',
    });
  }

  // Generic validation case
  cases.push({
    id: makeId(feature, 'Validation'),
    title: 'Input fields enforce character type restrictions',
    category: 'Validation',
    priority: 'Medium',
    preconditions: 'Form is accessible.',
    steps: ['Identify fields with type restrictions (numeric, alpha, etc.).', 'Enter values violating the type constraint.', 'Submit.'],
    testData: 'Cross-type inputs: numbers in text-only fields, text in numeric fields.',
    expected: 'Inappropriate character types are rejected with informative validation messages.',
  });

  return cases;
}

// ─── Error Handling Cases ────────────────────────────────────────────
function buildErrorHandlingCases(req, lines, ent, feature) {
  const cases = [];

  if (ent.maxAttempts !== null && ent.hasLogin) {
    const n = ent.maxAttempts;
    cases.push({
      id: makeId(feature, 'Error Handling'),
      title: `Locked account message after ${n} failed attempts`,
      category: 'Error Handling',
      priority: 'High',
      preconditions: 'Account lockout has been triggered.',
      steps: [`Perform ${n} consecutive failed login attempts.`, 'View the displayed message.'],
      testData: `Wrong password repeated ${n}×`,
      expected: `Account is locked. Message clearly states the account is locked and provides instructions (e.g. contact support or wait).`,
    });

    cases.push({
      id: makeId(feature, 'Error Handling'),
      title: 'Attempt login on a locked account',
      category: 'Error Handling',
      priority: 'High',
      preconditions: `Account is already locked after ${n} failed attempts.`,
      steps: ['Attempt to log in with valid credentials on a locked account.'],
      testData: 'Email: locked@example.com | Password: CorrectPass1!',
      expected: 'Login is blocked. Locked account message is shown. User is NOT logged in even with correct credentials.',
    });
  }

  cases.push({
    id: makeId(feature, 'Error Handling'),
    title: 'System handles server error (HTTP 500) gracefully',
    category: 'Error Handling',
    priority: 'High',
    preconditions: 'Server is configured to return a 500 error for this request (test environment).',
    steps: ['Perform a standard action (e.g. submit a form, load a page).', 'Observe the error response.'],
    testData: 'Simulated: server returns HTTP 500',
    expected: 'A user-friendly error message is displayed. No raw stack traces or technical details are exposed to the user.',
  });

  cases.push({
    id: makeId(feature, 'Error Handling'),
    title: 'Network timeout during form submission',
    category: 'Error Handling',
    priority: 'High',
    preconditions: 'Network is throttled or disabled in developer tools.',
    steps: ['Fill in valid form data.', 'Submit the form.', 'Observe behaviour when the network times out.'],
    testData: 'Network: simulated timeout (> 30s)',
    expected: 'A timeout error message is shown. The user can retry. No partial or corrupt data is saved.',
  });

  cases.push({
    id: makeId(feature, 'Error Handling'),
    title: 'Error messages do not reveal sensitive system information',
    category: 'Error Handling',
    priority: 'High',
    preconditions: 'Various error conditions are triggered.',
    steps: ['Trigger validation errors, authentication failures, and server errors.', 'Examine all error messages.'],
    testData: 'Invalid inputs, wrong credentials, network failures.',
    expected: 'Error messages are informative for the user but do not expose internal paths, database details, stack traces, or user data.',
  });

  if (ent.hasUpload) {
    cases.push({
      id: makeId(feature, 'Error Handling'),
      title: 'Upload failure shows clear retry guidance',
      category: 'Error Handling',
      priority: 'Medium',
      preconditions: 'Upload service is unavailable or returns an error.',
      steps: ['Attempt to upload a valid file when the service is down.'],
      testData: 'File: valid_document.pdf | Server: simulated upload failure',
      expected: 'Upload error is shown. User is presented with a clear retry option or support instructions.',
    });
  }

  if (ent.hasPayment) {
    cases.push({
      id: makeId(feature, 'Error Handling'),
      title: 'Payment gateway timeout returns user-friendly error',
      category: 'Error Handling',
      priority: 'High',
      preconditions: 'Payment gateway is simulated to time out.',
      steps: ['Complete checkout and submit payment.', 'Payment gateway does not respond.'],
      testData: 'Gateway: simulated timeout',
      expected: 'User sees a clear error message. Order is NOT marked as paid. No duplicate charge occurs.',
    });
  }

  return cases;
}

// ─── Helpers ────────────────────────────────────────────────────────
function isNegativeCriterion(text) {
  return /\b(not|no|reject|block|prevent|deny|fail|error|invalid|lock|restrict)\b/i.test(text);
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normCat(cat) {
  const map = {
    'Positive': 'positive',
    'Negative': 'negative',
    'Boundary': 'boundary',
    'Edge Case': 'edge',
    'Validation': 'validation',
    'Error Handling': 'error',
  };
  return map[cat] || cat.toLowerCase();
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-]/gi, '-').toLowerCase().slice(0, 40) || 'export';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── CSV Builder ──────────────────────────────────────────────────────
function buildCSV(cases) {
  const headers = ['ID', 'Title', 'Category', 'Priority', 'Preconditions', 'Steps', 'Test Data', 'Expected Result'];
  const rows = cases.map(tc => [
    tc.id,
    tc.title,
    tc.category,
    tc.priority,
    tc.preconditions,
    Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps,
    tc.testData,
    tc.expected,
  ].map(cell => `"${String(cell).replace(/"/g, '""')}"`));
  return [headers.map(h => `"${h}"`), ...rows].map(r => r.join(',')).join('\r\n');
}

// ── Render Stats ─────────────────────────────────────────────────────
function renderStats() {
  const counts = {};
  testCases.forEach(tc => { counts[tc.category] = (counts[tc.category] || 0) + 1; });
  const total = testCases.length;
  const high  = testCases.filter(t => t.priority === 'High').length;

  const catColors = {
    'Positive':       '#3fb950',
    'Negative':       '#f85149',
    'Boundary':       '#388bfd',
    'Edge Case':      '#bc8cff',
    'Validation':     '#d29922',
    'Error Handling': '#f0883e',
  };

  const statsHtml = [
    `<div class="stat-card"><div class="stat-value" style="color:var(--accent)">${total}</div><div class="stat-label">Total Test Cases</div></div>`,
    `<div class="stat-card"><div class="stat-value" style="color:var(--red)">${high}</div><div class="stat-label">High Priority</div></div>`,
    ...Object.entries(counts).map(([cat, n]) =>
      `<div class="stat-card"><div class="stat-value" style="color:${catColors[cat] || 'var(--text)'}">${n}</div><div class="stat-label">${cat}</div></div>`
    ),
  ].join('');
  statsGrid.innerHTML = statsHtml;
}

// ── Render Table ─────────────────────────────────────────────────────
function renderTable() {
  const catVal  = filterCategory.value;
  const priVal  = filterPriority.value;

  const visible = testCases.filter(tc => {
    const catOk = catVal === 'all' || tc.category === catVal;
    const priOk = priVal === 'all' || tc.priority === priVal;
    return catOk && priOk;
  });

  filterCount.textContent = `${visible.length} of ${testCases.length} case${testCases.length !== 1 ? 's' : ''}`;

  if (visible.length === 0) {
    testCaseBody.innerHTML = '';
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    testCaseBody.innerHTML = visible.map(tc => renderRow(tc)).join('');
    attachRowHandlers();
  }
}

function renderRow(tc) {
  const catClass = CAT_CLASS[tc.category] || '';
  const priClass = `priority-${tc.priority.toLowerCase()}`;
  const stepsHtml = Array.isArray(tc.steps)
    ? `<ol>${tc.steps.map(s => `<li>${escHtml(s)}</li>`).join('')}</ol>`
    : escHtml(tc.steps);

  return `<tr data-id="${escHtml(tc.id)}">
    <td class="td-id">${escHtml(tc.id)}</td>
    <td><span class="editable" data-field="title">${escHtml(tc.title)}</span></td>
    <td><span class="tag ${catClass}">${escHtml(tc.category)}</span></td>
    <td><span class="${priClass}">${escHtml(tc.priority)}</span></td>
    <td><span class="editable" data-field="preconditions">${escHtml(tc.preconditions)}</span></td>
    <td class="td-steps">${stepsHtml}</td>
    <td><span class="editable" data-field="testData">${escHtml(tc.testData)}</span></td>
    <td><span class="editable" data-field="expected">${escHtml(tc.expected)}</span></td>
    <td>
      <button class="btn btn-ghost btn-edit" data-id="${escHtml(tc.id)}" title="Edit title" style="padding:3px 8px; font-size:.8rem;" aria-label="Edit test case ${escHtml(tc.id)}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn btn-danger btn-delete" data-id="${escHtml(tc.id)}" title="Delete test case" aria-label="Delete test case ${escHtml(tc.id)}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </td>
  </tr>`;
}

// ── Inline Edit & Delete ─────────────────────────────────────────────
function attachRowHandlers() {
  // Delete
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      testCases = testCases.filter(tc => tc.id !== id);
      renderStats();
      renderTable();
      showToast('Test case deleted.', 'success');
    });
  });

  // Edit (click on editable cells)
  document.querySelectorAll('.editable').forEach(span => {
    span.style.cursor = 'pointer';
    span.title = 'Click to edit';
    span.addEventListener('click', function () {
      const row   = span.closest('tr');
      const tcId  = row.dataset.id;
      const field = span.dataset.field;
      const current = span.textContent;

      const input = document.createElement('textarea');
      input.className = 'edit-input';
      input.value = current;
      input.rows = 2;
      span.replaceWith(input);
      input.focus();

      const actions = document.createElement('div');
      actions.className = 'edit-actions';
      actions.innerHTML = `<button class="btn-save-edit" type="button">Save</button><button class="btn-cancel-edit" type="button">Cancel</button>`;
      input.after(actions);

      actions.querySelector('.btn-save-edit').addEventListener('click', () => {
        const newVal = input.value.trim();
        const tc = testCases.find(t => t.id === tcId);
        if (tc) tc[field] = newVal;
        renderTable();
        showToast('Test case updated.', 'success');
      });

      actions.querySelector('.btn-cancel-edit').addEventListener('click', () => {
        renderTable();
      });
    });
  });

  // Edit button (title shortcut)
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const titleSpan = row.querySelector('.editable[data-field="title"]');
      if (titleSpan) titleSpan.click();
    });
  });
}

// ── UI Helpers ───────────────────────────────────────────────────────
function showLoading(on) {
  loadingOverlay.classList.toggle('visible', on);
  btnGenerate.disabled = on;
}

function showValidation() {
  reqValidation.classList.add('visible');
  requirementsInput.setAttribute('aria-invalid', 'true');
}

function hideValidation() {
  reqValidation.classList.remove('visible');
  requirementsInput.removeAttribute('aria-invalid');
}

let toastTimer = null;
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
