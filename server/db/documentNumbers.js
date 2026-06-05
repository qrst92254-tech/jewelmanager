const { queryAll, queryOne } = require('./database');

/**
 * Allocate the next globally-unique document number for a table column.
 * Legacy rows (user_id NULL) share the same UNIQUE constraint, so we must
 * scan all existing numbers, not just the current tenant's count.
 */
function nextSequentialNumber(table, column, prefix) {
  const yr = new Date().getFullYear();
  const pattern = `${prefix}-${yr}-%`;
  const rows = queryAll(
    `SELECT ${column} AS num FROM ${table} WHERE ${column} LIKE ?`,
    [pattern]
  );

  let maxSeq = 0;
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${yr}-(\\d+)$`);
  for (const row of rows) {
    const match = String(row.num).match(re);
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }

  for (let seq = maxSeq + 1; seq <= maxSeq + 100000; seq += 1) {
    const candidate = `${prefix}-${yr}-${String(seq).padStart(4, '0')}`;
    if (!queryOne(`SELECT id FROM ${table} WHERE ${column} = ?`, [candidate])) {
      return candidate;
    }
  }
  throw new Error(`Could not allocate unique ${column}`);
}

function nextSaleBillNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const prefix = `INV-${y}${m}${day}-`;

  const rows = queryAll(
    'SELECT bill_number AS num FROM sales WHERE bill_number LIKE ?',
    [`${prefix}%`]
  );

  let maxSeq = 0;
  const re = new RegExp(`^INV-${y}${m}${day}-(\\d+)$`);
  for (const row of rows) {
    const match = String(row.num).match(re);
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }

  for (let seq = maxSeq + 1; seq <= maxSeq + 100000; seq += 1) {
    const candidate = `${prefix}${String(seq).padStart(4, '0')}`;
    if (!queryOne('SELECT id FROM sales WHERE bill_number = ?', [candidate])) {
      return candidate;
    }
  }
  throw new Error('Could not allocate unique bill_number');
}

module.exports = { nextSequentialNumber, nextSaleBillNumber };
