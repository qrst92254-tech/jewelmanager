require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase, saveDatabase } = require('./db/database');

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

// Middleware
// ✅ CORS must come FIRST before all other middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ These must come BEFORE routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle malformed JSON payloads cleanly
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON payload received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

// Root
app.get('/', (req, res) => {
    res.send('JewelManager Pro API is running...');
});

// API Routes
app.use('/api/prices', priceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/karigar', karigarRoutes);
app.use('/api/girvi', girviRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/settings', settingsRoutes);

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
            console.log(`Server is running on http://localhost:${PORT}`);
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