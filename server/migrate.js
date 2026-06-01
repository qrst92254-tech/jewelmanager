/**
 * migrate.js - Run this ONCE to add all new tables to the live jewel-shop.db
 * Usage: node migrate.js
 */
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'db', 'jewel-shop.db');

async function migrate() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  });

  let db;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
    console.log('Loaded existing database.');
  } else {
    db = new SQL.Database();
    console.log('Created new database.');
  }

  const migrations = `
  -- ============================================================
  -- CUSTOMERS TABLE (create if not exists, then add new columns)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ============================================================
  -- LOYALTY TRANSACTIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    balance INTEGER,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT
  );

  -- ============================================================
  -- KARIGARS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS karigars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    skill_type TEXT,
    id_proof TEXT,
    photo_path TEXT,
    balance_gold_grams REAL DEFAULT 0,
    balance_silver_grams REAL DEFAULT 0,
    total_orders_completed INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS karigar_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    karigar_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    metal TEXT NOT NULL,
    gross_weight REAL,
    fine_weight REAL,
    purity TEXT,
    making_charges REAL DEFAULT 0,
    wastage_percent REAL DEFAULT 0,
    wastage_grams REAL DEFAULT 0,
    order_description TEXT,
    expected_date DATE,
    actual_date DATE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (karigar_id) REFERENCES karigars(id)
  );

  CREATE TABLE IF NOT EXISTS karigar_job_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_card_number TEXT UNIQUE,
    karigar_id INTEGER NOT NULL,
    product_description TEXT,
    category TEXT,
    purity TEXT,
    gold_issued_grams REAL,
    gold_received_grams REAL,
    wastage_grams REAL,
    wastage_percent REAL,
    making_charges REAL,
    order_date DATE,
    expected_date DATE,
    completion_date DATE,
    status TEXT DEFAULT 'open',
    customer_order_id INTEGER,
    notes TEXT,
    FOREIGN KEY (karigar_id) REFERENCES karigars(id)
  );

  -- ============================================================
  -- GIRVI
  -- ============================================================
  CREATE TABLE IF NOT EXISTS girvi_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    girvi_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    customer_id_proof TEXT,
    item_description TEXT NOT NULL,
    item_type TEXT,
    metal TEXT,
    purity TEXT,
    gross_weight REAL NOT NULL,
    net_weight REAL,
    stone_weight REAL DEFAULT 0,
    photo_path TEXT,
    valuation_rate REAL,
    metal_value REAL,
    loan_amount REAL NOT NULL,
    interest_rate REAL DEFAULT 2.0,
    interest_type TEXT DEFAULT 'simple',
    pledge_date DATE NOT NULL,
    due_date DATE,
    release_date DATE,
    status TEXT DEFAULT 'active',
    total_interest_due REAL DEFAULT 0,
    total_paid REAL DEFAULT 0,
    transferred_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS girvi_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    girvi_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid REAL NOT NULL,
    interest_amount REAL,
    principal_amount REAL,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    FOREIGN KEY (girvi_id) REFERENCES girvi_records(id)
  );

  -- ============================================================
  -- GOLD SCHEMES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS scheme_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT NOT NULL,
    duration_months INTEGER NOT NULL,
    monthly_amount REAL NOT NULL,
    bonus_month INTEGER DEFAULT 1,
    total_value REAL,
    scheme_type TEXT DEFAULT 'gold',
    is_active INTEGER DEFAULT 1,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS scheme_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheme_number TEXT UNIQUE NOT NULL,
    plan_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_id INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_amount REAL NOT NULL,
    months_paid INTEGER DEFAULT 0,
    total_paid REAL DEFAULT 0,
    bonus_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    redeemed_bill_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES scheme_plans(id)
  );

  CREATE TABLE IF NOT EXISTS scheme_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    month_number INTEGER,
    amount_paid REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    receipt_number TEXT,
    notes TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES scheme_enrollments(id)
  );

  -- ============================================================
  -- REPAIRS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS repair_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_id INTEGER,
    item_description TEXT NOT NULL,
    item_type TEXT,
    metal TEXT,
    purity TEXT,
    weight REAL,
    repair_type TEXT,
    problem_description TEXT,
    repair_instructions TEXT,
    estimated_charges REAL,
    actual_charges REAL,
    advance_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'received',
    received_date DATE NOT NULL,
    promised_date DATE,
    completion_date DATE,
    delivery_date DATE,
    assigned_to_karigar_id INTEGER,
    photo_before TEXT,
    photo_after TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ============================================================
  -- QUOTATIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_id INTEGER,
    gold_rate_used REAL,
    silver_rate_used REAL,
    valid_until DATE,
    subtotal REAL,
    gst_amount REAL,
    grand_total REAL,
    status TEXT DEFAULT 'draft',
    converted_to_sale_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT,
    category TEXT,
    purity TEXT,
    net_weight REAL,
    rate_per_gram REAL,
    metal_value REAL,
    making_charges REAL,
    stone_charges REAL,
    gst_amount REAL,
    item_total REAL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id)
  );

  -- ============================================================
  -- SUPPLIERS & PURCHASES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    supplier_type TEXT DEFAULT 'wholesaler',
    outstanding_amount REAL DEFAULT 0,
    total_purchases REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status TEXT DEFAULT 'pending',
    subtotal REAL DEFAULT 0,
    gst_amount REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    metal TEXT,
    purity TEXT,
    gross_weight REAL,
    net_weight REAL,
    quantity INTEGER DEFAULT 1,
    rate_per_gram REAL,
    making_charges REAL DEFAULT 0,
    item_total REAL,
    hsn_code TEXT DEFAULT '7113',
    product_id INTEGER,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
  );

  -- ============================================================
  -- ACCOUNTING
  -- ============================================================
  CREATE TABLE IF NOT EXISTS ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL,
    account_name TEXT NOT NULL,
    description TEXT,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    balance REAL,
    reference_id INTEGER,
    reference_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    paid_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ============================================================
  -- STAFF USERS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS staff_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'sales',
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ============================================================
  -- SALE RETURNS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS sale_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_number TEXT UNIQUE NOT NULL,
    original_sale_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    return_date DATE NOT NULL,
    return_reason TEXT,
    gold_rate_today REAL,
    refund_amount REAL,
    refund_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'processed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ============================================================
  -- SHOP SETTINGS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS shop_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO shop_settings (key, value) VALUES
    ('shop_name', 'My Jewellery Shop'),
    ('shop_address', 'Address Line 1, City'),
    ('shop_phone', '9876543210'),
    ('shop_gstin', ''),
    ('shop_logo', ''),
    ('bill_footer', 'Thank you for shopping with us!'),
    ('loyalty_points_rate', '1'),
    ('loyalty_redemption_rate', '100'),
    ('default_making_charge_ring', '400'),
    ('default_making_charge_necklace', '300'),
    ('default_wastage_percent', '2');
  `;

  // Execute each statement separately (sql.js requires this for DDL)
  const stmts = migrations.split(';').map(s => s.trim()).filter(s => s.length > 0);
  let success = 0, failed = 0;
  for (const stmt of stmts) {
    try {
      db.run(stmt + ';');
      success++;
    } catch (e) {
      // Many "IF NOT EXISTS" errors are safe to ignore (column already exists)
      if (!e.message.includes('duplicate column') && !e.message.includes('already exists')) {
        console.warn('WARN:', stmt.substring(0, 60), '->', e.message);
        failed++;
      }
    }
  }

  // Now add columns to existing customers table safely
  const customerCols = [
    "ALTER TABLE customers ADD COLUMN aadhaar_number TEXT",
    "ALTER TABLE customers ADD COLUMN pan_number TEXT",
    "ALTER TABLE customers ADD COLUMN date_of_birth DATE",
    "ALTER TABLE customers ADD COLUMN anniversary_date DATE",
    "ALTER TABLE customers ADD COLUMN photo_path TEXT",
    "ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'retail'",
    "ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN outstanding_amount REAL DEFAULT 0",
    "ALTER TABLE customers ADD COLUMN notes TEXT",
    "ALTER TABLE customers ADD COLUMN city TEXT",
    "ALTER TABLE customers ADD COLUMN gstin TEXT",
    "ALTER TABLE customers ADD COLUMN is_active INTEGER DEFAULT 1",
  ];
  for (const col of customerCols) {
    try { db.run(col); } catch(e) { /* already exists */ }
  }

  // Add HUID columns to products
  const productCols = [
    "ALTER TABLE products ADD COLUMN huid_number TEXT",
    "ALTER TABLE products ADD COLUMN tag_number TEXT",
    "ALTER TABLE products ADD COLUMN is_hallmarked INTEGER DEFAULT 0",
    "ALTER TABLE products ADD COLUMN diamond_certificate TEXT",
  ];
  for (const col of productCols) {
    try { db.run(col); } catch(e) { /* already exists */ }
  }

  // Save
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log(`\nMigration complete. ${success} statements run, ${failed} failed.`);
  console.log('Database saved to:', dbPath);
  db.close();
}

migrate().catch(console.error);
