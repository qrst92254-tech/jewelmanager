const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase, queryAll, queryOne, lastInsertRowId } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { nextSaleBillNumber } = require('../db/documentNumbers');

router.get('/', (req, res) => {
    const uid = tenantId(req);
    try {
        const sales = queryAll(`
            SELECT s.id, s.bill_number, s.customer_name, s.sale_date, s.final_amount
            FROM sales s
            WHERE s.user_id = ?
            ORDER BY s.sale_date DESC
        `, [uid]);
        res.json(sales);
    } catch (error) {
        console.error('Failed to fetch sales:', error);
        res.status(500).json({ error: 'Database error while fetching sales.' });
    }
});

router.get('/:id', (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    try {
        const sale = queryOne('SELECT * FROM sales WHERE id = ? AND user_id = ?', [id, uid]);
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found.' });
        }

        const items = queryAll(`
            SELECT si.quantity, si.price_at_sale, p.name, p.sku, p.metal, p.purity, p.net_weight, p.hsn_code
            FROM sale_items si
            JOIN products p ON si.product_id = p.id AND p.user_id = ?
            WHERE si.sale_id = ?
        `, [uid, id]);
        sale.items = items;

        res.json(sale);
    } catch (error) {
        console.error(`Failed to fetch sale ${id}:`, error);
        res.status(500).json({ error: 'Database error while fetching sale details.' });
    }
});

router.post('/', (req, res) => {
    const uid = tenantId(req);
    const db = getDatabase();
    const {
        customer_name,
        customer_phone,
        items,
        discount,
        payment_mode,
        notes
    } = req.body;

    if (!customer_name || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer name and at least one item are required.' });
    }

    try {
        db.exec('BEGIN TRANSACTION;');

        const total_amount = items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
        const final_amount_before_gst = total_amount - (discount || 0);
        const cgst_rate = 1.5;
        const sgst_rate = 1.5;
        const cgst_amount = final_amount_before_gst * (cgst_rate / 100);
        const sgst_amount = final_amount_before_gst * (sgst_rate / 100);
        const final_amount = final_amount_before_gst + cgst_amount + sgst_amount;

        const bill_number = nextSaleBillNumber();

        const saleStmt = db.prepare(`
            INSERT INTO sales (user_id, bill_number, customer_name, customer_phone, total_amount, discount, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        saleStmt.run([uid, bill_number, customer_name, customer_phone, total_amount, discount || 0, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes]);
        saleStmt.free();
        const sale_id = lastInsertRowId();

        const itemStmt = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)');
        const stockStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ? AND user_id = ?');

        for (const item of items) {
            const productId = parseInt(item.product_id, 10);
            const owned = queryOne('SELECT id FROM products WHERE id = ? AND user_id = ?', [productId, uid]);
            if (!owned) {
                throw new Error(`Product ${productId} not found for this account`);
            }
            itemStmt.run([sale_id, productId, item.quantity, item.price_at_sale]);
            stockStmt.run([item.quantity, productId, uid]);
        }

        itemStmt.free();
        stockStmt.free();

        db.exec('COMMIT;');
        saveDatabase();

        res.status(201).json({ success: true, sale_id, bill_number });
    } catch (error) {
        console.error('Failed to create sale:', error);
        try { db.exec('ROLLBACK;'); } catch { /* ignore */ }
        res.status(500).json({ error: error.message || 'Database transaction failed. Sale not created.' });
    }
});

router.delete('/:id', (req, res) => {
    const uid = tenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM sales WHERE id = ? AND user_id = ?');
        stmt.run([id, uid]);
        const changes = db.getRowsModified();
        stmt.free();

        if (changes > 0) {
            saveDatabase();
            res.status(200).json({ success: true, message: 'Sale deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Sale not found.' });
        }
    } catch (error) {
        console.error(`Failed to delete sale ${id}:`, error);
        res.status(500).json({ error: 'Database error while deleting sale.' });
    }
});

module.exports = router;
