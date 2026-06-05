-- Supabase SQL Schema for JewelManager
-- Run this in Supabase Dashboard → SQL Editor
-- This creates all tables with proper PostgreSQL types and multi-tenant isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MULTI-TENANT TABLES (with user_id)
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    metal TEXT NOT NULL,
    purity TEXT,
    gross_weight NUMERIC NOT NULL,
    net_weight NUMERIC NOT NULL,
    stone_weight NUMERIC DEFAULT 0,
    making_charges_per_gram NUMERIC,
    making_charges_percentage NUMERIC,
    wastage_percentage NUMERIC DEFAULT 0,
    stone_charges NUMERIC DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    hsn_code TEXT,
    stock_alert_threshold INTEGER DEFAULT 1,
    photo_path TEXT,
    description TEXT,
    huid_number TEXT,
    tag_number TEXT,
    is_hallmarked BOOLEAN DEFAULT FALSE,
    diamond_certificate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on products
CREATE INDEX idx_products_user_id ON products(user_id);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    cgst_rate NUMERIC DEFAULT 1.5,
    sgst_rate NUMERIC DEFAULT 1.5,
    cgst_amount NUMERIC NOT NULL,
    sgst_amount NUMERIC NOT NULL,
    final_amount NUMERIC NOT NULL,
    payment_mode TEXT DEFAULT 'Cash',
    notes TEXT
);

-- Create index for user_id on sales
CREATE INDEX idx_sales_user_id ON sales(user_id);

-- Sale items junction table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price_at_sale NUMERIC NOT NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    credit_limit NUMERIC DEFAULT 0,
    outstanding_amount NUMERIC DEFAULT 0,
    notes TEXT,
    city TEXT,
    gstin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on customers
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Karigars (goldsmiths) table
CREATE TABLE IF NOT EXISTS karigars (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    skill_type TEXT,
    id_proof TEXT,
    photo_path TEXT,
    balance_gold_grams NUMERIC DEFAULT 0,
    balance_silver_grams NUMERIC DEFAULT 0,
    total_orders_completed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on karigars
CREATE INDEX idx_karigars_user_id ON karigars(user_id);

-- Karigar transactions table
CREATE TABLE IF NOT EXISTS karigar_transactions (
    id SERIAL PRIMARY KEY,
    karigar_id INTEGER NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    metal TEXT NOT NULL,
    gross_weight NUMERIC,
    fine_weight NUMERIC,
    purity TEXT,
    making_charges NUMERIC DEFAULT 0,
    wastage_percent NUMERIC DEFAULT 0,
    wastage_grams NUMERIC DEFAULT 0,
    order_description TEXT,
    expected_date DATE,
    actual_date DATE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Karigar job cards table
CREATE TABLE IF NOT EXISTS karigar_job_cards (
    id SERIAL PRIMARY KEY,
    karigar_id INTEGER NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
    job_card_number TEXT UNIQUE,
    product_description TEXT,
    category TEXT,
    purity TEXT,
    gold_issued_grams NUMERIC,
    gold_received_grams NUMERIC,
    wastage_grams NUMERIC,
    wastage_percent NUMERIC,
    making_charges NUMERIC,
    order_date DATE,
    expected_date DATE,
    completion_date DATE,
    status TEXT DEFAULT 'open',
    customer_order_id INTEGER,
    notes TEXT
);

-- Girvi (Gold Loan) records table
CREATE TABLE IF NOT EXISTS girvi_records (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    girvi_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    customer_id_proof TEXT,
    item_description TEXT NOT NULL,
    item_type TEXT,
    metal TEXT,
    purity TEXT,
    gross_weight NUMERIC NOT NULL,
    net_weight NUMERIC,
    stone_weight NUMERIC DEFAULT 0,
    photo_path TEXT,
    valuation_rate NUMERIC,
    metal_value NUMERIC,
    loan_amount NUMERIC NOT NULL,
    interest_rate NUMERIC DEFAULT 2.0,
    interest_type TEXT DEFAULT 'simple',
    pledge_date DATE NOT NULL,
    due_date DATE,
    release_date DATE,
    status TEXT DEFAULT 'active',
    total_interest_due NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    transferred_to TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on girvi_records
CREATE INDEX idx_girvi_records_user_id ON girvi_records(user_id);

-- Girvi payments table
CREATE TABLE IF NOT EXISTS girvi_payments (
    id SERIAL PRIMARY KEY,
    girvi_id INTEGER NOT NULL REFERENCES girvi_records(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount_paid NUMERIC NOT NULL,
    interest_amount NUMERIC,
    principal_amount NUMERIC,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT
);

-- Scheme plans table
CREATE TABLE IF NOT EXISTS scheme_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    duration_months INTEGER NOT NULL,
    monthly_amount NUMERIC NOT NULL,
    bonus_month INTEGER DEFAULT 1,
    total_value NUMERIC,
    scheme_type TEXT DEFAULT 'gold',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- Create index for user_id on scheme_plans
CREATE INDEX idx_scheme_plans_user_id ON scheme_plans(user_id);

-- Scheme enrollments table
CREATE TABLE IF NOT EXISTS scheme_enrollments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_number TEXT UNIQUE NOT NULL,
    plan_id INTEGER NOT NULL REFERENCES scheme_plans(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_id INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_amount NUMERIC NOT NULL,
    months_paid INTEGER DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    bonus_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    redeemed_bill_id INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on scheme_enrollments
CREATE INDEX idx_scheme_enrollments_user_id ON scheme_enrollments(user_id);

-- Scheme payments table
CREATE TABLE IF NOT EXISTS scheme_payments (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES scheme_enrollments(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    month_number INTEGER,
    amount_paid NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    receipt_number TEXT,
    notes TEXT
);

-- Repair orders table
CREATE TABLE IF NOT EXISTS repair_orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_id INTEGER,
    item_description TEXT NOT NULL,
    item_type TEXT,
    metal TEXT,
    purity TEXT,
    weight NUMERIC,
    repair_type TEXT,
    problem_description TEXT,
    repair_instructions TEXT,
    estimated_charges NUMERIC,
    actual_charges NUMERIC,
    advance_paid NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'received',
    received_date DATE NOT NULL,
    promised_date DATE,
    completion_date DATE,
    delivery_date DATE,
    assigned_to_karigar_id INTEGER,
    photo_before TEXT,
    photo_after TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on repair_orders
CREATE INDEX idx_repair_orders_user_id ON repair_orders(user_id);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quotation_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_id INTEGER,
    gold_rate_used NUMERIC,
    silver_rate_used NUMERIC,
    valid_until DATE,
    subtotal NUMERIC,
    gst_amount NUMERIC,
    grand_total NUMERIC,
    status TEXT DEFAULT 'draft',
    converted_to_sale_id INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on quotations
CREATE INDEX idx_quotations_user_id ON quotations(user_id);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    category TEXT,
    purity TEXT,
    net_weight NUMERIC,
    rate_per_gram NUMERIC,
    metal_value NUMERIC,
    making_charges NUMERIC,
    stone_charges NUMERIC,
    gst_amount NUMERIC,
    item_total NUMERIC,
    quantity INTEGER DEFAULT 1
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    supplier_type TEXT DEFAULT 'wholesaler',
    outstanding_amount NUMERIC DEFAULT 0,
    total_purchases NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on suppliers
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status TEXT DEFAULT 'pending',
    subtotal NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    payment_method TEXT,
    notes TEXT
);

-- Create index for user_id on purchase_orders
CREATE INDEX idx_purchase_orders_user_id ON purchase_orders(user_id);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT,
    metal TEXT,
    purity TEXT,
    gross_weight NUMERIC,
    net_weight NUMERIC,
    quantity INTEGER DEFAULT 1,
    rate_per_gram NUMERIC,
    making_charges NUMERIC DEFAULT 0,
    item_total NUMERIC,
    hsn_code TEXT DEFAULT '7113',
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    paid_to TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on expenses
CREATE INDEX idx_expenses_user_id ON expenses(user_id);

-- Staff users table
CREATE TABLE IF NOT EXISTS staff_users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'sales',
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id on staff_users
CREATE INDEX idx_staff_users_user_id ON staff_users(user_id);

-- ============================================
-- JUNCTION TABLES (foreign keys provide isolation)
-- ============================================

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    balance INTEGER,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT
);

-- Sale returns table
CREATE TABLE IF NOT EXISTS sale_returns (
    id SERIAL PRIMARY KEY,
    return_number TEXT UNIQUE NOT NULL,
    original_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    return_date DATE NOT NULL,
    return_reason TEXT,
    gold_rate_today NUMERIC,
    refund_amount NUMERIC,
    refund_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'processed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL,
    account_name TEXT NOT NULL,
    description TEXT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    balance NUMERIC,
    reference_id INTEGER,
    reference_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GLOBAL/SHARED TABLES (no user_id)
-- ============================================

-- Price cache table
CREATE TABLE IF NOT EXISTS price_cache (
    id SERIAL PRIMARY KEY,
    metal TEXT NOT NULL,
    city TEXT DEFAULT 'mumbai',
    currency TEXT NOT NULL,
    price NUMERIC NOT NULL,
    prices TEXT,
    source TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- City multipliers table
CREATE TABLE IF NOT EXISTS city_multipliers (
    id SERIAL PRIMARY KEY,
    city_name TEXT UNIQUE NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1.0
);

-- City price adjustments table
CREATE TABLE IF NOT EXISTS city_price_adjustments (
    id SERIAL PRIMARY KEY,
    city_name TEXT UNIQUE NOT NULL,
    gold_adjustment_percent NUMERIC DEFAULT 0,
    silver_adjustment_percent NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTH & SESSION MANAGEMENT
-- ============================================

-- Active sessions table for session management
CREATE TABLE IF NOT EXISTS active_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_token)
);

-- Create index for user_id on active_sessions
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert city multipliers
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
('Salem', 1.013)
ON CONFLICT (city_name) DO NOTHING;

-- Insert shop settings
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
('default_wastage_percent', '2')
ON CONFLICT (key) DO NOTHING;

-- Insert city price adjustments
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
('Salem', -0.3)
ON CONFLICT (city_name) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE girvi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sales" ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON sales FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own karigars" ON karigars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own karigars" ON karigars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own karigars" ON karigars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own karigars" ON karigars FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own girvi_records" ON girvi_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own girvi_records" ON girvi_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own girvi_records" ON girvi_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own girvi_records" ON girvi_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheme_plans" ON scheme_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheme_plans" ON scheme_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheme_plans" ON scheme_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheme_plans" ON scheme_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheme_enrollments" ON scheme_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheme_enrollments" ON scheme_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheme_enrollments" ON scheme_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheme_enrollments" ON scheme_enrollments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own repair_orders" ON repair_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repair_orders" ON repair_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repair_orders" ON repair_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own repair_orders" ON repair_orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own suppliers" ON suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON suppliers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchase_orders" ON purchase_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchase_orders" ON purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchase_orders" ON purchase_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchase_orders" ON purchase_orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own staff_users" ON staff_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own staff_users" ON staff_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own staff_users" ON staff_users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own staff_users" ON staff_users FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on junction tables that need protection
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigar_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigar_job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE girvi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for junction tables (via parent table access)
CREATE POLICY "Service role can manage sale_items" ON sale_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage karigar_transactions" ON karigar_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage karigar_job_cards" ON karigar_job_cards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage girvi_payments" ON girvi_payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage scheme_payments" ON scheme_payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage quotation_items" ON quotation_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage purchase_items" ON purchase_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage loyalty_transactions" ON loyalty_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage sale_returns" ON sale_returns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage ledger_entries" ON ledger_entries FOR ALL USING (auth.role() = 'service_role');

-- Global tables are publicly readable (no RLS or permissive policies)
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price_cache" ON price_cache FOR SELECT USING (true);
CREATE POLICY "Service role can manage price_cache" ON price_cache FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE city_multipliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read city_multipliers" ON city_multipliers FOR SELECT USING (true);
CREATE POLICY "Service role can manage city_multipliers" ON city_multipliers FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE city_price_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read city_price_adjustments" ON city_price_adjustments FOR SELECT USING (true);
CREATE POLICY "Service role can manage city_price_adjustments" ON city_price_adjustments FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "Service role can manage shop_settings" ON shop_settings FOR ALL USING (auth.role() = 'service_role');

-- Active sessions table RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON active_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage active_sessions" ON active_sessions FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
