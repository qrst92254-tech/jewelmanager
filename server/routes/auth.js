const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, saveDatabase, convertSqljsResult } = require('../db/database');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
    return res.status(403).json({ 
        success: false, 
        message: 'Registration is disabled. Use the default credentials.' 
    });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === validUser && password === validPass) {
        const token = jwt.sign(
            { username, role: 'admin' },
            process.env.JWT_SECRET || 'jewel_secret_key',
            { expiresIn: '7d' }
        );
        return res.json({ success: true, token, username });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    let token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>
    if (!token) {
        token = req.headers['authorization']; // fallback if no Bearer
    }
    if (!token) {
        return res.status(403).json({ error: 'A token is required for authentication.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jewel_secret_key');
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({ error: 'Invalid Token.' });
    }
    return next();
};

// GET /api/auth/dashboard-stats (Protected Route)
router.get('/dashboard-stats', verifyToken, (req, res) => {
    const db = getDatabase();
    try {
        const totalSalesRes = db.exec("SELECT COUNT(id) as count, SUM(final_amount) as revenue FROM sales");
        const totalSalesRows = convertSqljsResult(totalSalesRes) || [];
        const totalSales = totalSalesRows?.[0]?.count || 0;
        const totalRevenue = totalSalesRows?.[0]?.revenue || 0;

        const totalProductsRes = db.exec("SELECT COUNT(id) as count, SUM(quantity) as total_stock FROM products");
        const totalProductsRows = convertSqljsResult(totalProductsRes) || [];
        const uniqueProducts = totalProductsRows?.[0]?.count || 0;
        const totalStock = totalProductsRows?.[0]?.total_stock || 0;

        const recentSalesRes = db.exec(`
            SELECT id, bill_number, customer_name, final_amount, sale_date 
            FROM sales 
            ORDER BY sale_date DESC 
            LIMIT 5
        `);
        const recentSales = convertSqljsResult(recentSalesRes) || [];

        res.json({
            totalSales,
            totalRevenue,
            uniqueProducts,
            totalStock,
            recentSales
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics." });
    }
});


module.exports = router;