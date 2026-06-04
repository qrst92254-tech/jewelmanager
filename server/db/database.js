const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'jewel-shop.db');
const schemaPath = path.join(__dirname, 'schema.sql');
const { runTenantMigrations } = require('./tenantMigration');

let db;

async function initializeDatabase() {
    const SQL = await initSqlJs({
        // Required to load the wasm binary from the file system
        locateFile: file => path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file)
    });

    let dbFileBuffer;
    try {
        // If the database file exists, load it
        dbFileBuffer = fs.readFileSync(dbPath);
        console.log('Loading existing database from file.');
        db = new SQL.Database(dbFileBuffer);
        runTenantMigrations(db);
        saveDatabase();
    } catch (error) {
        // If it doesn't exist, create a new one
        console.log('Database file not found, creating a new one.');
        db = new SQL.Database();
        // Apply the schema to the new database
        try {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema);
            console.log('Database schema loaded and applied.');
            // Write the new database with schema to the file
            saveDatabase();
            runTenantMigrations(db);
            saveDatabase();
        } catch (schemaError) {
            console.error('Error loading or applying schema:', schemaError.message);
            throw schemaError;
        }
    }
    return db;
}

function getDatabase() {
    if (!db) {
        throw new Error('Database has not been initialized. Call initializeDatabase() first.');
    }
    return db;
}

function saveDatabase() {
    if (db) {
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
            console.log('Database saved successfully.');
        } catch (error) {
            console.error('Failed to save database:', error.message);
        }
    }
}

function convertSqljsResult(res) {
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
    });
}

/** Run SELECT with bound parameters (reliable vs raw exec for some sql.js builds). */
function queryAll(sql, params = []) {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    try {
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        return rows;
    } finally {
        stmt.free();
    }
}

function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows[0] || null;
}

function runSql(sql, params = []) {
    const database = getDatabase();
    database.run(sql, params);
    return database.getRowsModified();
}

function lastInsertRowId() {
    const database = getDatabase();
    const res = database.exec('SELECT last_insert_rowid() AS id');
    return res[0]?.values[0][0];
}

module.exports = {
    initializeDatabase,
    getDatabase,
    saveDatabase,
    convertSqljsResult,
    queryAll,
    queryOne,
    runSql,
    lastInsertRowId,
};