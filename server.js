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

// SERVE STATIC FILES (Frontend)
app.use(express.static('public'));

// MOCK DATABASE (for demo)
let users = [
  { id: 1, email: 'test@example.com', password: 'test123', token: 'mock-token-123' }
];

let invoices = [];
let payments = [];

// AUTH ROUTES
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
  res.json({ email: user.email, token: user.token, message: 'Registration successful' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ email: user.email, token: user.token, message: 'Login successful' });
});

// INVOICE ROUTES
app.get('/api/invoices', (req, res) => {
  res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
  const invoice = { id: invoices.length + 1, ...req.body, created_at: new Date(), status: 'Pending' };
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
  res.json({ vendor_name: 'Sample Vendor', vendor_gstin: '27ABCDE1234F1Z5', total_amount: 10000, tax_amount: 1800 });
});

// PAYMENT ROUTES
app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.post('/api/payments/initiate', (req, res) => {
  const payment = { id: payments.length + 1, ...req.body, reference_id: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(), status: 'pending', created_at: new Date() };
  payments.push(payment);
  res.json(payment);
});

app.post('/api/payments/:id/verify', (req, res) => {
  const payment = payments.find(p => p.id === parseInt(req.params.id));
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  payment.status = 'completed';
  res.json(payment);
});

// GST ROUTES
app.get('/api/gst/monthly-summary', (req, res) => {
  const { month, year } = req.query;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
  res.json({ month, year, taxable_amount: totalAmount, sgst: totalTax / 2, cgst: totalTax / 2, igst: 0, total_tax: totalTax, payer_state: '27' });
});

app.get('/api/gst/reports', (req, res) => {
  res.json({ invoices, payments, summary: { total_invoices: invoices.length, total_payments: payments.length } });
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), message: 'GST Payment Platform API is running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'GST Payment Platform API', version: '0.1.0' });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', timestamp: new Date() });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GST Payment Platform running on port ${PORT}`);
});