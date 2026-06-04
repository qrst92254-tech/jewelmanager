require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase, saveDatabase } = require('./db/database');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Import all route handlers
const priceRoutes = require('./routes/prices');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const karigarRoutes = require('./routes/karigar');
const girviRoutes = require('./routes/girvi');
const schemesRoutes = require('./routes/schemes');
const repairsRoutes = require('./routes/repairs');
const quotationsRoutes = require('./routes/quotations');
const purchasesRoutes = require('./routes/purchases');
const reportsRoutes = require('./routes/reports');
const accountingRoutes = require('./routes/accounting');
const settingsRoutes = require('./routes/settings');
const pricingRoutes = require('./routes/pricing');
const creatorRoutes = require('./routes/creator');
const adminRoutes = require('./routes/admin');
const { requireApiAuth } = require('./middleware/auth');
const { checkSubscription } = require('./middleware/subscription');

// Middleware
// ✅ CORS must come FIRST before all other middleware
// CHANGE 3d: Updated CORS for local dev only (not needed in production on Render)
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:3000',   // alternate local
    'http://localhost:4173',   // vite preview
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// ✅ These must come BEFORE routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Setup view engine for server-rendered pages (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Handle malformed JSON payloads cleanly
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON payload received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', requireApiAuth, productRoutes);
app.use('/api/sales', requireApiAuth, salesRoutes);
app.use('/api/customers', requireApiAuth, customersRoutes);
app.use('/api/karigar', requireApiAuth, karigarRoutes);
app.use('/api/girvi', requireApiAuth, girviRoutes);
app.use('/api/schemes', requireApiAuth, schemesRoutes);
app.use('/api/repairs', requireApiAuth, repairsRoutes);
app.use('/api/quotations', requireApiAuth, quotationsRoutes);
app.use('/api/purchases', requireApiAuth, purchasesRoutes);
app.use('/api/reports', requireApiAuth, reportsRoutes);
app.use('/api/accounting', requireApiAuth, accountingRoutes);
app.use('/api/settings', requireApiAuth, settingsRoutes);
// Mount new routes for pricing, subscriptions, and creator admin
app.use('/', pricingRoutes);
app.use('/', creatorRoutes);

// Protect all dashboard routes with subscription middleware
app.get('/dashboard*', checkSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// CHANGE 3b: Health check endpoint — used for UptimeRobot/keep-alive monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// CHANGE 3c: Serve the built React frontend from dist/ folder
// The dist/ folder is created when you run: npm run build
app.use(express.static(path.join(__dirname, '../dist')));

// For any route that is NOT an API route, send the React app
// This allows React Router to handle client-side routing in production
app.get('*', (req, res) => {
  // If a server-rendered view exists for the path, render it first
  if (req.path === '/signup' || req.path === '/login' || req.path === '/pricing' || req.path === '/creator') {
    return res.render(req.path.replace('/', ''), { error: null });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Centralized error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something broke!' });
});

// Initialize and start the server
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error.message);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    saveDatabase();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);