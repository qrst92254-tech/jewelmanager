require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { initializeDatabase, saveDatabase } = require('./db/database');
const cookieParser = require('cookie-parser');
const path = require('path');
const dns = require('dns');

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
const importRoutes = require('./routes/import');
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON payload received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully.');

        // Resolve DATABASE_URL hostname to IPv4 to avoid ENETUNREACH on Render
        let dbUrl = (process.env.DATABASE_URL || '').trim();
        if (dbUrl) {
            let resolved = false;
            try {
                const parsed = new URL(dbUrl);
                if (parsed.hostname) {
                    // Try system DNS lookup with family 4
                    try {
                        const { address } = await dns.promises.lookup(parsed.hostname, { family: 4 });
                        if (address) {
                            const original = parsed.hostname;
                            parsed.hostname = address;
                            process.env.DATABASE_URL = parsed.toString();
                            console.log(`Resolved ${original} -> ${address} for session store`);
                            resolved = true;
                        }
                    } catch (_e) {
                        console.log(`No IPv4 for ${parsed.hostname} via system DNS, trying Google DNS...`);
                    }

                    // Try Google DNS-over-HTTPS as fallback
                    if (!resolved) {
                        try {
                            const https = require('https');
                            const json = await new Promise((resolve, reject) => {
                                https.get(`https://dns.google/resolve?name=${encodeURIComponent(parsed.hostname)}&type=A`, (res) => {
                                    let data = '';
                                    res.on('data', chunk => data += chunk);
                                    res.on('end', () => {
                                        try { resolve(JSON.parse(data)); }
                                        catch (e) { reject(e); }
                                    });
                                }).on('error', reject);
                            });
                            if (json?.Answer?.length > 0) {
                                const ip = json.Answer[0].data;
                                const original = parsed.hostname;
                                parsed.hostname = ip;
                                process.env.DATABASE_URL = parsed.toString();
                                console.log(`Resolved ${original} -> ${ip} via Google DNS for session store`);
                                resolved = true;
                            }
                        } catch (_e) {
                            console.log('Google DNS lookup also failed');
                        }
                    }

                    // Try Supabase pooler formats
                    if (!resolved && parsed.hostname.endsWith('.supabase.co')) {
                        const ref = parsed.hostname.replace(/^db\./, '').replace(/\.supabase\.co$/, '');
                        const poolerHosts = [
                            ref + '-pooler.supabase.com',
                            ref + '.pooler.supabase.com',
                            'aws-0-us-east-1.pooler.supabase.com',
                            'aws-0-us-east-2.pooler.supabase.com',
                            'aws-0-eu-west-1.pooler.supabase.com',
                            'aws-0-eu-central-1.pooler.supabase.com',
                            'aws-0-ap-southeast-1.pooler.supabase.com',
                        ];
                        for (const host of poolerHosts) {
                            try {
                                const { address } = await dns.promises.lookup(host, { family: 4 });
                                if (address) {
                                    parsed.hostname = host;
                                    parsed.port = '6543';
                                    parsed.search = 'pgbouncer=true';
                                    process.env.DATABASE_URL = parsed.toString();
                                    console.log(`Using Supabase pooler: ${host} (${address})`);
                                    resolved = true;
                                    break;
                                }
                            } catch (_e) { /* try next */ }
                        }
                    }

                    if (!resolved && parsed.hostname.endsWith('.supabase.co')) {
                        console.error('========================================================');
                        console.error('FATAL: Cannot reach your Supabase database from Render.');
                        console.error('Your database hostname resolves to IPv6 only.');
                        console.error('');  
                        console.error('Fix: Go to your Supabase Dashboard -> Database ->');
                        console.error('Connection string -> Copy the "Pooler" connection string.');
                        console.error('Then update the DATABASE_URL environment variable on Render.');
                        console.error('========================================================');
                    }
                }
            } catch (err) {
                console.warn('Failed to process DATABASE_URL for IPv4 resolution:', err.message);
            }
        }

        app.use(session({
          store: new pgSession({
            conObject: {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
            },
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
app.use('/api/import', requireApiAuth, importRoutes);
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
