/**
 * Tenant migrations are handled by supabase_schema.sql in Supabase.
 * This file is kept for compatibility — no SQLite operations needed.
 */

const TENANT_TABLES = [
  'products',
  'sales',
  'customers',
  'karigars',
  'girvi_records',
  'scheme_plans',
  'scheme_enrollments',
  'repair_orders',
  'quotations',
  'suppliers',
  'purchase_orders',
  // 'ledger_entries', - removed: table does not have user_id column
  'expenses',
  'loyalty_transactions',
  'sale_returns',
];

function runTenantMigrations() {
  // No-op: schema is managed in Supabase via supabase_schema.sql
}

module.exports = { runTenantMigrations, TENANT_TABLES };
