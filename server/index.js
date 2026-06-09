require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { initializeDatabase, saveDatabase } = require('./db/database');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'jewel-manager-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON payload received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

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
app.use('/', pricingRoutes);
app.use('/', creatorRoutes);

app.get('/dashboard*', checkSubscription, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  if (req.path === '/pricing' || req.path === '/creator') {
    return res.render(req.path.replace('/', ''), { error: null });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something broke!' });
});

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

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    saveDatabase();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
