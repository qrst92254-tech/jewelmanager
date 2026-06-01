const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase, convertSqljsResult } = require('../db/database');

// GET all sales with basic details
router.get('/', (req, res) => {
    const db = getDatabase();
    try {
        const salesRes = db.exec(`
            SELECT s.id, s.bill_number, s.customer_name, s.sale_date, s.final_amount
            FROM sales s
            ORDER BY s.sale_date DESC
        `);
        const sales = convertSqljsResult(salesRes);
        res.json(sales);
    } catch (error) {
        console.error("Failed to fetch sales:", error);
        res.status(500).json({ error: "Database error while fetching sales." });
    }
});

// GET a single sale with full details including items
router.get('/:id', (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    try {
        // Fetch sale details
        const saleRes = db.exec(`SELECT * FROM sales WHERE id = ${id}`);
        const sale = convertSqljsResult(saleRes)[0];

        if (!sale) {
            return res.status(404).json({ error: "Sale not found." });
        }

        // Fetch associated sale items
        const itemsRes = db.exec(`
            SELECT si.quantity, si.price_at_sale, p.name, p.sku, p.metal, p.purity
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ${id}
        `);
        sale.items = convertSqljsResult(itemsRes);

        res.json(sale);
    } catch (error) {
        console.error(`Failed to fetch sale ${id}:`, error);
        res.status(500).json({ error: "Database error while fetching sale details." });
    }
});

// POST a new sale
router.post('/', (req, res) => {
    const db = getDatabase();
    const {
        customer_name,
        customer_phone,
        items, // Expected to be an array of { product_id, quantity, price_at_sale }
        discount,
        payment_mode,
        notes
    } = req.body;

    if (!customer_name || !items || items.length === 0) {
        return res.status(400).json({ error: "Customer name and at least one item are required." });
    }

    try {
        db.exec("BEGIN TRANSACTION;");

        // 1. Calculate totals
        const total_amount = items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
        const final_amount_before_gst = total_amount - (discount || 0);
        const cgst_rate = 1.5;
        const sgst_rate = 1.5;
        const cgst_amount = final_amount_before_gst * (cgst_rate / 100);
        const sgst_amount = final_amount_before_gst * (sgst_rate / 100);
        const final_amount = final_amount_before_gst + cgst_amount + sgst_amount;

        // 2. Create the bill number (e.g., 'INV-YYYYMMDD-XXXX')
        const date = new Date();
        const prefix = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-`;
        const lastSale = db.exec("SELECT id FROM sales ORDER BY id DESC LIMIT 1;");
        const nextId = lastSale.length > 0 ? convertSqljsResult(lastSale)[0].id + 1 : 1;
        const bill_number = prefix + nextId.toString().padStart(4, '0');

        // 3. Insert into sales table
        const saleStmt = db.prepare(`
            INSERT INTO sales (bill_number, customer_name, customer_phone, total_amount, discount, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id;
        `);
        const saleResult = saleStmt.get([bill_number, customer_name, customer_phone, total_amount, discount || 0, cgst_rate, sgst_rate, cgst_amount, sgst_amount, final_amount, payment_mode, notes]);
        const sale_id = saleResult[0];
        saleStmt.free();

        // 4. Insert into sale_items and update product stock
        const itemStmt = db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?);");
        const stockStmt = db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?;");

        for (const item of items) {
            itemStmt.run([sale_id, item.product_id, item.quantity, item.price_at_sale]);
            stockStmt.run([item.quantity, item.product_id]);
        }

        itemStmt.free();
        stockStmt.free();

        db.exec("COMMIT;");
        saveDatabase();

        res.status(201).json({ success: true, sale_id, bill_number });

    } catch (error) {
        console.error("Failed to create sale:", error);
        db.exec("ROLLBACK;");
        res.status(500).json({ error: "Database transaction failed. Sale not created." });
    }
});

// DELETE a sale
// Note: Deleting a sale here does NOT restock products to keep historical data accurate.
// A more complex system might have a "return" feature instead.
router.delete('/:id', (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    try {
        const stmt = db.prepare("DELETE FROM sales WHERE id = ?");
        const result = stmt.run([id]);
        stmt.free();

        if (result.changes > 0) {
            saveDatabase();
            res.status(200).json({ success: true, message: "Sale deleted successfully." });
        } else {
            res.status(404).json({ error: "Sale not found." });
        }
    } catch (error) {
        console.error(`Failed to delete sale ${id}:`, error);
        res.status(500).json({ error: "Database error while deleting sale." });
    }
});


module.exports = router;