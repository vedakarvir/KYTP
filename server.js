const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// SERVE STATIC FILES
app.use(express.static('public'));

// MOCK DATABASE
let users = [
  { id: 1, email: 'test@example.com', password: 'test123', token: 'mock-token-123' }
];

let invoices = [];
let payments = [];

// ═══════════════════════════════════════════════════════════════════════════
// GST VALIDATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

// Mock GST Database with registered businesses
const gstDatabase = {
  '27ABCDE1234F1Z5': {
    gstin: '27ABCDE1234F1Z5',
    businessName: 'TECH SOLUTIONS PRIVATE LIMITED',
    businessType: 'Private Limited Company',
    registeredAddress: '123 Business Park, Mumbai, Maharashtra 400001',
    state: 'Maharashtra',
    stateCode: '27',
    panNumber: 'ABCDE1234F',
    registrationDate: '2020-01-15',
    complianceStatus: 'Compliant',
    lastReturnFiled: '2024-07-15',
    returnStatus: 'Filed',
    outstandingTax: 0,
    invoicesPending: 0,
    filedReturns: 24,
    category: 'Regular',
    businessActivity: 'Software Development & IT Services'
  },
  '36AABCT1234H1Z0': {
    gstin: '36AABCT1234H1Z0',
    businessName: 'APEX MANUFACTURING CORPORATION',
    businessType: 'Partnership Firm',
    registeredAddress: 'Plot 45, Industrial Area, Hyderabad, Telangana 500032',
    state: 'Telangana',
    stateCode: '36',
    panNumber: 'AABCT1234H',
    registrationDate: '2019-06-20',
    complianceStatus: 'Compliant',
    lastReturnFiled: '2024-07-20',
    returnStatus: 'Filed',
    outstandingTax: 15000,
    invoicesPending: 5,
    filedReturns: 18,
    category: 'Regular',
    businessActivity: 'Manufacturing of Industrial Equipment'
  },
  '19AABCC1234G1Z5': {
    gstin: '19AABCC1234G1Z5',
    businessName: 'AGRO EXPORT SOLUTIONS LLP',
    businessType: 'Limited Liability Partnership',
    registeredAddress: 'Sector 12, Delhi 110001',
    state: 'Delhi',
    stateCode: '19',
    panNumber: 'AABCC1234G',
    registrationDate: '2021-03-10',
    complianceStatus: 'Non-Compliant',
    lastReturnFiled: '2024-05-30',
    returnStatus: 'Overdue',
    outstandingTax: 125000,
    invoicesPending: 23,
    filedReturns: 12,
    category: 'Regular',
    businessActivity: 'Agricultural Products Export'
  }
};

// Validate GST Number Format
function isValidGSTFormat(gstin) {
  // GST number format: 2 digit state code + 10 digit PAN + 1 digit entity + 1 digit check digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9]{1}$/;
  return gstRegex.test(gstin);
}

// Calculate GST Check Digit (Luhn Algorithm)
function calculateGSTCheckDigit(gstWithoutCheck) {
  const factor = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const charMap = {
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
    'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25,
    'Q': 26, 'R': 27, 'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33,
    'Y': 34, 'Z': 35
  };

  let sum = 0;
  let position = 0;

  for (let i = gstWithoutCheck.length - 1; i >= 0; i--) {
    const char = gstWithoutCheck[i];
    const digit = isNaN(char) ? charMap[char] : parseInt(char);
    const product = digit * factor[position % 10];
    sum += Math.floor(product / 36) + (product % 36);
    position++;
  }

  const checkDigit = (36 - (sum % 36)) % 36;
  return checkDigit < 10 ? checkDigit.toString() : String.fromCharCode(55 + checkDigit); // A=10, Z=35
}

// Main GST Validation Function
function validateGST(gstin) {
  const cleanGST = gstin.toUpperCase().trim();

  // Check format
  if (!isValidGSTFormat(cleanGST)) {
    return {
      isValid: false,
      message: 'Invalid GST format. GST must be 15 characters (e.g., 27ABCDE1234F1Z5)',
      error: 'FORMAT_INVALID'
    };
  }

  // Check if in database (mock)
  if (gstDatabase[cleanGST]) {
    return {
      isValid: true,
      message: 'Valid GST Number',
      data: gstDatabase[cleanGST]
    };
  }

  // For demonstration, validate format and return test data
  // In production, connect to actual GST API
  const stateCode = cleanGST.substring(0, 2);
  const panNumber = cleanGST.substring(2, 12);
  const entity = cleanGST.substring(12, 13);

  // Validate check digit
  const gstWithoutCheckDigit = cleanGST.substring(0, 14);
  const providedCheckDigit = cleanGST[14];
  const calculatedCheckDigit = calculateGSTCheckDigit(gstWithoutCheckDigit);

  if (providedCheckDigit !== calculatedCheckDigit) {
    return {
      isValid: false,
      message: 'Invalid GST checksum',
      error: 'CHECKSUM_INVALID'
    };
  }

  // Mock data for valid format GST
  const mockData = {
    gstin: cleanGST,
    businessName: 'REGISTERED BUSINESS NAME',
    businessType: 'Private Limited Company',
    registeredAddress: 'Address will be fetched from GST registry',
    state: 'State Name',
    stateCode: stateCode,
    panNumber: panNumber,
    registrationDate: '2020-01-15',
    complianceStatus: 'Compliant',
    lastReturnFiled: new Date().toISOString().split('T')[0],
    returnStatus: 'Filed',
    outstandingTax: 0,
    invoicesPending: 0,
    filedReturns: 12,
    category: 'Regular',
    businessActivity: 'General Business Activity'
  };

  return {
    isValid: true,
    message: 'Valid GST Number (Mock Data)',
    data: mockData
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GST VALIDATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/gst/validate', (req, res) => {
  const { gstin } = req.body;

  if (!gstin) {
    return res.status(400).json({
      isValid: false,
      message: 'GST number is required',
      error: 'GSTIN_REQUIRED'
    });
  }

  const result = validateGST(gstin);
  const statusCode = result.isValid ? 200 : 400;
  res.status(statusCode).json(result);
});

app.get('/api/gst/validate/:gstin', (req, res) => {
  const result = validateGST(req.params.gstin);
  const statusCode = result.isValid ? 200 : 400;
  res.status(statusCode).json(result);
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = {
    id: users.length + 1,
    email,
    password,
    token: 'token-' + Math.random().toString(36).substr(2, 9)
  };

  users.push(user);

  res.json({
    email: user.email,
    token: user.token,
    message: 'Registration successful'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ email: user.email, token: user.token, message: 'Login successful' });
});

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/invoices', (req, res) => {
  res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
  // Validate vendor GSTIN if provided
  if (req.body.vendor_gstin) {
    const gstValidation = validateGST(req.body.vendor_gstin);
    if (!gstValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid vendor GST number',
        details: gstValidation
      });
    }
    // Add vendor details from GST validation
    req.body.vendor_business_name = gstValidation.data.businessName;
    req.body.vendor_compliance_status = gstValidation.data.complianceStatus;
  }

  const invoice = {
    id: invoices.length + 1,
    ...req.body,
    created_at: new Date(),
    status: 'Pending'
  };

  invoices.push(invoice);
  res.json(invoice);
});

app.put('/api/invoices/:id', (req, res) => {
  const invoice = invoices.find(i => i.id === parseInt(req.params.id));
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  Object.assign(invoice, req.body);
  res.json(invoice);
});

app.delete('/api/invoices/:id', (req, res) => {
  invoices = invoices.filter(i => i.id !== parseInt(req.params.id));
  res.json({ message: 'Invoice deleted' });
});

app.post('/api/invoices/upload', (req, res) => {
  res.json({
    vendor_name: 'Sample Vendor',
    vendor_gstin: '27ABCDE1234F1Z5',
    total_amount: 10000,
    tax_amount: 1800
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.post('/api/payments/initiate', (req, res) => {
  const payment = {
    id: payments.length + 1,
    ...req.body,
    reference_id: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    status: 'pending',
    created_at: new Date()
  };
  payments.push(payment);
  res.json(payment);
});

app.post('/api/payments/:id/verify', (req, res) => {
  const payment = payments.find(p => p.id === parseInt(req.params.id));
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  payment.status = 'completed';
  res.json(payment);
});

// ═══════════════════════════════════════════════════════════════════════════
// GST ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/gst/monthly-summary', (req, res) => {
  const { month, year } = req.query;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

  res.json({
    month,
    year,
    taxable_amount: totalAmount,
    sgst: totalTax / 2,
    cgst: totalTax / 2,
    igst: 0,
    total_tax: totalTax,
    payer_state: '27'
  });
});

app.get('/api/gst/reports', (req, res) => {
  res.json({
    invoices,
    payments,
    summary: {
      total_invoices: invoices.length,
      total_payments: payments.length
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    message: 'GST Payment Platform API is running'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'GST Payment Platform API',
    version: '0.1.0',
    endpoints: {
      gst: {
        validate: 'POST /api/gst/validate',
        validateGet: 'GET /api/gst/validate/:gstin'
      },
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      }
    }
  });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date()
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GST Payment Platform running on port ${PORT}`);
  console.log(`✅ GST Validation: POST /api/gst/validate`);
});


const upiRoutes = require('./routes/upiStringGenerator');
app.use('/api/upi', upiRoutes);