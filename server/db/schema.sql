-- Database schema for JewelManager Pro

-- Product inventory table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    metal TEXT NOT NULL,
    purity TEXT,
    gross_weight REAL NOT NULL,
    net_weight REAL NOT NULL,
    stone_weight REAL DEFAULT 0,
    making_charges_per_gram REAL,
    making_charges_percentage REAL,
    wastage_percentage REAL DEFAULT 0,
    stone_charges REAL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    hsn_code TEXT,
    stock_alert_threshold INTEGER DEFAULT 1,
    photo_path TEXT,
    description TEXT,
    huid_number TEXT,
    tag_number TEXT,
    is_hallmarked INTEGER DEFAULT 0,
    diamond_certificate TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales records table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    discount REAL DEFAULT 0,
    cgst_rate REAL DEFAULT 1.5,
    sgst_rate REAL DEFAULT 1.5,
    cgst_amount REAL NOT NULL,
    sgst_amount REAL NOT NULL,
    final_amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'Cash',
    notes TEXT
);

-- Junction table for items in a sale
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_sale REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- User authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Price cache
CREATE TABLE IF NOT EXISTS price_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal TEXT NOT NULL,
    city TEXT DEFAULT 'mumbai',
    currency TEXT NOT NULL,
    price REAL NOT NULL,
    prices TEXT,
    source TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- City multipliers
CREATE TABLE IF NOT EXISTS city_multipliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_name TEXT UNIQUE NOT NULL,
    multiplier REAL NOT NULL DEFAULT 1.0
);

-- Customers table with KYC fields
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    aadhaar_number TEXT,
    pan_number TEXT,
    date_of_birth DATE,
    anniversary_date DATE,
    photo_path TEXT,
    customer_type TEXT DEFAULT 'retail',
    loyalty_points INTEGER DEFAULT 0,
    credit_limit REAL DEFAULT 0,
    outstanding_amount REAL DEFAULT 0,
    notes TEXT,
    city TEXT,
    gstin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Karigars (goldsmiths)
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

-- Karigar transactions
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

-- Karigar job cards
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

-- Girvi (Gold Loan) records
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

-- Girvi payments
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

-- Scheme plans
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

-- Scheme enrollments
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

-- Scheme payments
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

-- Repair orders
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

-- Quotations
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

-- Quotation items
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

-- Suppliers
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

-- Purchase orders
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

-- Purchase items
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

-- Shop settings
CREATE TABLE IF NOT EXISTS shop_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty transactions
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

-- City price adjustments
CREATE TABLE IF NOT EXISTS city_price_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_name TEXT UNIQUE NOT NULL,
    gold_adjustment_percent REAL DEFAULT 0,
    silver_adjustment_percent REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- Sale returns
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

-- Ledger entries
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

-- Expenses
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

-- Staff users
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

-- Seed data
INSERT INTO users (username, password_hash) VALUES ('admin', 'hashed_password_placeholder');

INSERT INTO city_multipliers (city_name, multiplier) VALUES
('Mumbai', 1.01),
('Delhi', 1.005),
('Chennai', 1.012),
('Kolkata', 1.008),
('Bengaluru', 1.011),
('Hyderabad', 1.009),
('Pune', 1.007),
('Ahmedabad', 1.006),
('Jaipur', 1.004),
('Salem', 1.013);

INSERT INTO shop_settings (key, value) VALUES
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

INSERT INTO city_price_adjustments (city_name, gold_adjustment_percent) VALUES
('Mumbai', 0.0),
('Delhi', 0.2),
('Chennai', -0.1),
('Kolkata', 0.1),
('Bengaluru', -0.1),
('Hyderabad', -0.2),
('Pune', 0.0),
('Ahmedabad', 0.1),
('Jaipur', 0.3),
('Salem', -0.3);

INSERT INTO scheme_plans (plan_name, duration_months, monthly_amount, bonus_month, total_value, scheme_type) VALUES
('12 Month Gold Scheme', 12, 5000, 1, 65000, 'gold'),
('24 Month Gold Scheme', 24, 2500, 2, 65000, 'gold'),
('6 Month Silver Scheme', 6, 2000, 0, 12000, 'silver'),
('Monthly Flexi Gold Plan', 1, 10000, 0, 10000, 'gold');

INSERT INTO staff_users (username, password_hash, full_name, role) VALUES
('admin', 'hashed_password_placeholder', 'Shop Owner', 'admin'),
('salesman1', 'hashed_password_placeholder', 'Salesman One', 'sales');
