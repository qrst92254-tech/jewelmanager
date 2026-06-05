const { getDatabase, saveDatabase, queryOne, runSql } = require('./database');
const { TENANT_TABLES } = require('./tenantMigration');

const claimedThisSession = new Set();

/**
 * Legacy rows were created before per-user isolation (user_id IS NULL).
 * Re-attach them to the logged-in shop owner so data is visible again.
 */
function shouldClaimOrphans(userId) {
  const orphans = queryOne('SELECT COUNT(*) AS c FROM products WHERE user_id IS NULL');
  if (!(orphans?.c > 0)) return false;

  const distinctOwners = queryOne(
    'SELECT COUNT(DISTINCT user_id) AS c FROM products WHERE user_id IS NOT NULL'
  );
  const ownerCount = distinctOwners?.c || 0;

  // Single shop on this server — merge all legacy rows into the active account
  if (ownerCount <= 1) return true;

  // Multi-tenant: only claim for a new account that has no products yet
  const owned = queryOne('SELECT COUNT(*) AS c FROM products WHERE user_id = ?', [userId]);
  return (owned?.c || 0) === 0;
}

function claimOrphanDataForUser(userId) {
  if (!userId || claimedThisSession.has(userId)) return;
  if (!shouldClaimOrphans(userId)) {
    claimedThisSession.add(userId);
    return;
  }

  try {
    const db = getDatabase();
    db.exec('BEGIN TRANSACTION;');
    for (const table of TENANT_TABLES) {
      runSql(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`, [userId]);
    }
    runSql(
      `UPDATE shop_settings SET user_id = ? WHERE user_id = '_unassigned' OR user_id IS NULL`,
      [userId]
    );
    db.exec('COMMIT;');
    saveDatabase();
    console.log(`Claimed legacy shop data for user ${userId}`);
  } catch (err) {
    try {
      getDatabase().exec('ROLLBACK;');
    } catch {
      /* ignore */
    }
    console.error('Failed to claim legacy data:', err.message);
  }

  claimedThisSession.add(userId);
}

module.exports = { claimOrphanDataForUser, shouldClaimOrphans };
