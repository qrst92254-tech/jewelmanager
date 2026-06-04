const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');

const convertSqljsResult = (res) => {
    if (!res || res.length === 0) {
        return [];
    }
    const columns = res[0].columns;
    return res[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });
        return obj;
    });
};

router.get('/', (req, res) => {
    try {
        const uid = tenantId(req);
        const db = getDatabase();
        const result = db.exec('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', [uid]);
        const products = convertSqljsResult(result);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

router.post('/', (req, res) => {
    const uid = tenantId(req);
    const {
        sku, name, category, metal, purity, gross_weight, net_weight,
        stone_weight = 0, making_charges_per_gram = 0, making_charges_percentage = 0,
        wastage_percentage = 0, stone_charges = 0, quantity = 1, hsn_code = null,
        stock_alert_threshold = 1, description = null
    } = req.body || {};

    if (!sku || !name || !category || !metal || !gross_weight || !net_weight) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT INTO products (user_id, sku, name, category, metal, purity, gross_weight, net_weight, stone_weight, making_charges_per_gram, making_charges_percentage, wastage_percentage, stone_charges, quantity, hsn_code, stock_alert_threshold, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const db = getDatabase();
        const values = [
            uid, sku, name, category, metal, purity, gross_weight, net_weight,
            stone_weight, making_charges_per_gram, making_charges_percentage,
            wastage_percentage, stone_charges, quantity, hsn_code,
            stock_alert_threshold, description
        ];
        const safeValues = values.map(v => v === undefined ? null : v);
        db.run(sql, safeValues);

        const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
        saveDatabase();

        res.status(201).json({ id, message: 'Product created successfully' });
    } catch (error) {
        const message = error?.message || String(error || 'Unknown error');
        if (message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `Product with SKU '${sku}' already exists.` });
        }
        console.error('Error creating product:', message, 'raw:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

router.put('/:id', (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    const {
        sku, name, category, metal, purity, gross_weight, net_weight,
        stone_weight = 0, making_charges_per_gram = 0, making_charges_percentage = 0,
        wastage_percentage = 0, stone_charges = 0, quantity = 1, hsn_code = null,
        stock_alert_threshold = 1, description = null
    } = req.body || {};

    const sql = `UPDATE products SET 
                    sku = ?, name = ?, category = ?, metal = ?, purity = ?, 
                    gross_weight = ?, net_weight = ?, stone_weight = ?, 
                    making_charges_per_gram = ?, making_charges_percentage = ?, 
                    wastage_percentage = ?, stone_charges = ?, quantity = ?, 
                    hsn_code = ?, stock_alert_threshold = ?, description = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?`;

    try {
        const db = getDatabase();
        db.run(sql, [
            sku, name, category, metal, purity, gross_weight, net_weight,
            stone_weight, making_charges_per_gram, making_charges_percentage,
            wastage_percentage, stone_charges, quantity, hsn_code,
            stock_alert_threshold, description, id, uid
        ]);

        const changes = db.getRowsModified();
        if (changes === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }

        saveDatabase();
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        const message = error?.message || String(error || 'Unknown error');
        if (message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `Product with SKU '${sku}' already exists.` });
        }
        console.error(`Error updating product ${id}:`, message, 'raw:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

router.delete('/:id', (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    try {
        const db = getDatabase();
        db.run('DELETE FROM products WHERE id = ? AND user_id = ?', [id, uid]);

        const changes = db.getRowsModified();
        if (changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        saveDatabase();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
