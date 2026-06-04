const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase, convertSqljsResult } = require('../db/database');
const { tenantId } = require('../db/tenant');

router.get('/', (req, res) => {
    const uid = tenantId(req);
    const db = getDatabase();
    try {
        const salesRes = db.exec(`
            SELECT s.id, s.bill_number, s.customer_name, s.sale_date, s.final_amount
            FROM sales s
            WHERE s.user_id = ?
            ORDER BY s.sale_date DESC
        `, [uid]);
        const sales = convertSqljsResult(salesRes);
        res.json(sales);
    } catch (error) {
        console.error('Failed to fetch sales:', error);
        res.status(500).json({ error: 'Database error while fetching sales.' });
    }
});

router.get('/:id', (req, res) => {
    const uid = tenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    try {
        const saleRes = db.exec('SELECT * FROM sales WHERE id = ? AND user_id = ?', [id, uid]);
        const sale = convertSqljsResult(saleRes)[0];

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found.' });
        }

        const itemsRes = db.exec(`
            SELECT si.quantity, si.price_at_sale, p.name, p.sku, p.metal, p.purity
            FROM sale_items si
            JOIN products p ON si.product_id = p.id AND p.user_id = ?
            WHERE si.sale_id = ?
        `, [uid, id]);
        sale.items = convertSqljsResult(itemsRes);

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

        const date = new Date();
        const prefix = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-`;
        const lastSale = db.exec('SELECT id FROM sales WHERE user_id = ? ORDER BY id DESC LIMIT 1', [uid]);
        const nextId = lastSale.length > 0 ? convertSqljsResult(lastSale)[0].id + 1 : 1;
        const bill_number = prefix + nextId.toString().padStart(4, '0');

        const saleStmt = db.prepare(`
            INSERT INTO sales (user_id, bill_number, customer_name, customer_phone, total_amount, discount, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id;
        `);
        const saleResult = saleStmt.get([uid, bill_number, customer_name, customer_phone, total_amount, discount || 0, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes]);
        const sale_id = saleResult[0];
        saleStmt.free();

        const itemStmt = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?);');
        const stockStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ? AND user_id = ?;');

        for (const item of items) {
            const owned = db.exec('SELECT id FROM products WHERE id = ? AND user_id = ?', [item.product_id, uid]);
            if (!owned.length || !owned[0].values.length) {
                throw new Error(`Product ${item.product_id} not found for this account`);
            }
            itemStmt.run([sale_id, item.product_id, item.quantity, item.price_at_sale]);
            stockStmt.run([item.quantity, item.product_id, uid]);
        }

        itemStmt.free();
        stockStmt.free();

        db.exec('COMMIT;');
        saveDatabase();

        res.status(201).json({ success: true, sale_id, bill_number });
    } catch (error) {
        console.error('Failed to create sale:', error);
        db.exec('ROLLBACK;');
        res.status(500).json({ error: error.message || 'Database transaction failed. Sale not created.' });
    }
});

router.delete('/:id', (req, res) => {
    const uid = tenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM sales WHERE id = ? AND user_id = ?');
        const result = stmt.run([id, uid]);
        stmt.free();

        if (result.changes > 0) {
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
