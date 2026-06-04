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
  'ledger_entries',
  'expenses',
  'loyalty_transactions',
  'sale_returns',
];

function tableHasColumn(db, table, column) {
  try {
    const info = db.exec(`PRAGMA table_info(${table})`);
    if (!info.length) return false;
    return info[0].values.some((row) => row[1] === column);
  } catch {
    return false;
  }
}

function tableExists(db, table) {
  try {
    const res = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [table]
    );
    return res.length > 0 && res[0].values.length > 0;
  } catch {
    return false;
  }
}

function migrateShopSettings(db) {
  if (!tableExists(db, 'shop_settings')) return;
  if (tableHasColumn(db, 'shop_settings', 'user_id')) return;

  db.exec(`
    CREATE TABLE shop_settings_tenant (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key)
    );
  `);
  db.exec(`
    INSERT INTO shop_settings_tenant (user_id, key, value, updated_at)
    SELECT '_unassigned', key, value, COALESCE(updated_at, CURRENT_TIMESTAMP) FROM shop_settings;
  `);
  db.exec('DROP TABLE shop_settings;');
  db.exec('ALTER TABLE shop_settings_tenant RENAME TO shop_settings;');
  console.log('Migrated shop_settings to per-tenant schema.');
}

function runTenantMigrations(db) {
  for (const table of TENANT_TABLES) {
    if (!tableExists(db, table)) continue;
    if (tableHasColumn(db, table, 'user_id')) continue;
    db.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT;`);
    console.log(`Added user_id column to ${table}`);
  }
  migrateShopSettings(db);
}

module.exports = { runTenantMigrations, TENANT_TABLES };
