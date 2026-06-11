const { supabase } = require('../services/supabase');

/**
 * Initialize database connection to Supabase
 * This is a no-op since Supabase client is already initialized in services/supabase.js
 */
async function initializeDatabase() {
    // Supabase client is already initialized in services/supabase.js
    // Just verify connection is available
    if (!supabase) {
        throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    console.log('Supabase database connection ready.');
    return true;
}

/**
 * Get Supabase client
 * This replaces getDatabase() from SQLite implementation
 */
function getDatabase() {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Call initializeDatabase() first.');
    }
    return supabase;
}

/**
 * Save database - no-op for Supabase (data is auto-saved)
 * This replaces saveDatabase() from SQLite implementation
 */
function saveDatabase() {
    // Supabase automatically persists data, no manual save needed
    // This function exists for compatibility with existing code
}

/**
 * Convert Supabase result to match SQLite format
 * This replaces convertSqljsResult() from SQLite implementation
 */
function convertSqljsResult(res) {
    // Supabase already returns data in the correct format
    // This function exists for compatibility with existing code
    return res || [];
}

/**
 * Execute a SELECT query and return all rows
 * This replaces queryAll() from SQLite implementation
 * @param {string} table - Table name
 * @param {object} options - Query options (select, eq, order, limit, etc.)
 * @param {string} userId - User ID for multi-tenant filtering
 */
async function queryAll(table, options = {}, userId = null) {
    try {
        let query = supabase.from(table).select(options.select || '*');

        // Apply user_id filter if provided and table supports it
        if (userId && isMultiTenantTable(table)) {
            query = query.eq('user_id', userId);
        }

        // Apply filters
        if (options.eq) {
            for (const [column, value] of Object.entries(options.eq)) {
                query = query.eq(column, value);
            }
        }

        if (options.neq) {
            for (const [column, value] of Object.entries(options.neq)) {
                query = query.neq(column, value);
            }
        }

        if (options.like) {
            for (const [column, value] of Object.entries(options.like)) {
                query = query.like(column, value);
            }
        }

        if (options.ilike) {
            for (const [column, value] of Object.entries(options.ilike)) {
                query = query.ilike(column, value);
            }
        }

        if (options.in) {
            for (const [column, values] of Object.entries(options.in)) {
                query = query.in(column, values);
            }
        }

        if (options.gte) {
            for (const [column, value] of Object.entries(options.gte)) {
                query = query.gte(column, value);
            }
        }

        if (options.lte) {
            for (const [column, value] of Object.entries(options.lte)) {
                query = query.lte(column, value);
            }
        }

        if (options.gt) {
            for (const [column, value] of Object.entries(options.gt)) {
                query = query.gt(column, value);
            }
        }

        if (options.lt) {
            for (const [column, value] of Object.entries(options.lt)) {
                query = query.lt(column, value);
            }
        }

        // Apply ordering
        if (options.order) {
            query = query.order(options.order.column, { 
                ascending: options.order.ascending !== false 
            });
        }

        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }

        // Apply range
        if (options.range) {
            query = query.range(options.range.from, options.range.to);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Supabase queryAll error on ${table}:`, error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error(`queryAll failed for table ${table}:`, error);
        throw error;
    }
}

/**
 * Execute a SELECT query and return first row
 * This replaces queryOne() from SQLite implementation
 * @param {string} table - Table name
 * @param {object} options - Query options
 * @param {string} userId - User ID for multi-tenant filtering
 */
async function queryOne(table, options = {}, userId = null) {
    try {
        const results = await queryAll(table, { ...options, limit: 1 }, userId);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error(`queryOne failed for table ${table}:`, error);
        throw error;
    }
}

/**
 * Execute an INSERT query
 * This replaces runSql() for INSERT operations
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @param {string} userId - User ID for multi-tenant filtering
 */
async function insert(table, data, userId = null) {
    try {
        // Add user_id if provided and table supports it
        const insertData = userId && isMultiTenantTable(table) 
            ? { ...data, user_id: userId } 
            : data;

        const { data: result, error } = await supabase
            .from(table)
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error(`Supabase insert error on ${table}:`, error);
            throw error;
        }

        return result;
    } catch (error) {
        console.error(`insert failed for table ${table}:`, error);
        throw error;
    }
}

/**
 * Execute an UPDATE query
 * This replaces runSql() for UPDATE operations
 * @param {string} table - Table name
 * @param {object} data - Data to update
 * @param {object} filter - Filter conditions (e.g., { id: 1 })
 * @param {string} userId - User ID for multi-tenant filtering
 */
async function update(table, data, filter, userId = null) {
    try {
        let query = supabase.from(table).update(data);

        // Apply user_id filter if provided and table supports it
        if (userId && isMultiTenantTable(table)) {
            query = query.eq('user_id', userId);
        }

        // Apply filter conditions
        for (const [column, value] of Object.entries(filter)) {
            query = query.eq(column, value);
        }

        const { data: result, error } = await query.select();

        if (error) {
            console.error(`Supabase update error on ${table}:`, error);
            throw error;
        }

        return result;
    } catch (error) {
        console.error(`update failed for table ${table}:`, error);
        throw error;
    }
}

/**
 * Execute a DELETE query
 * This replaces runSql() for DELETE operations
 * @param {string} table - Table name
 * @param {object} filter - Filter conditions (e.g., { id: 1 })
 * @param {string} userId - User ID for multi-tenant filtering
 */
async function deleteRow(table, filter, userId = null) {
    try {
        let query = supabase.from(table).delete();

        // Apply user_id filter if provided and table supports it
        if (userId && isMultiTenantTable(table)) {
            query = query.eq('user_id', userId);
        }

        // Apply filter conditions
        for (const [column, value] of Object.entries(filter)) {
            query = query.eq(column, value);
        }

        const { error } = await query;

        if (error) {
            console.error(`Supabase delete error on ${table}:`, error);
            throw error;
        }

        return true;
    } catch (error) {
        console.error(`delete failed for table ${table}:`, error);
        throw error;
    }
}

/**
 * Execute a raw SQL query (for complex queries)
 * This replaces runSql() for raw SQL operations
 * Note: Supabase doesn't support raw SQL in the client, use RPC functions instead
 * @deprecated Use specific query functions instead
 */
async function runSql(sql, params = []) {
    console.warn('runSql is deprecated in Supabase. Use specific query functions instead.');
    console.warn('SQL:', sql, 'Params:', params);
    throw new Error('Raw SQL queries are not supported. Use queryAll, queryOne, insert, update, or deleteRow instead.');
}

/**
 * Get last insert row ID
 * This replaces lastInsertRowId() from SQLite implementation
 * Note: Supabase returns the inserted row with ID, so this is not needed
 * @deprecated Use insert() which returns the inserted row with ID
 */
function lastInsertRowId() {
    console.warn('lastInsertRowId is deprecated in Supabase. Use insert() which returns the inserted row with ID.');
    throw new Error('lastInsertRowId is not supported. Use insert() which returns the inserted row with ID.');
}

/**
 * Check if a table is multi-tenant (has user_id column)
 */
function isMultiTenantTable(table) {
    const multiTenantTables = [
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
        'expenses',
        'staff_users',
        // 'ledger_entries', - removed: table does not have user_id column
        'shop_settings'
    ];
    return multiTenantTables.includes(table);
}

/**
 * Execute a transaction (multiple operations)
 * @param {function} callback - Function that receives supabase client and performs operations
 */
async function transaction(callback) {
    // Supabase doesn't support client-side transactions like SQLite
    // Operations are automatically atomic at the row level
    // For complex transactions, use Supabase RPC functions
    console.warn('Transactions are not supported in Supabase client. Operations are atomic at row level.');
    return callback(supabase);
}

module.exports = {
    initializeDatabase,
    getDatabase,
    saveDatabase,
    convertSqljsResult,
    queryAll,
    queryOne,
    insert,
    update,
    deleteRow,
    runSql,
    lastInsertRowId,
    transaction,
    isMultiTenantTable,
};