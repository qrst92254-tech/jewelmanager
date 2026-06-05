const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update, deleteRow } = require('../db/database');
const { tenantId } = require('../db/tenant');

router.get('/', async (req, res) => {
    try {
        const uid = tenantId(req);
        const products = await queryAll('products', {
            order: { column: 'created_at', ascending: false }
        }, uid);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

router.post('/', async (req, res) => {
    const uid = tenantId(req);
    const {
        sku, name, category, metal, purity, gross_weight, net_weight,
        stone_weight = 0, making_charges_per_gram = 0, making_charges_percentage = 0,
        wastage_percentage = 0, stone_charges = 0, quantity = 1, hsn_code = null,
        stock_alert_threshold = 1, description = null, huid_number = null, tag_number = null,
        is_hallmarked = false, diamond_certificate = null, photo_path = null
    } = req.body || {};

    if (!sku || !name || !category || !metal || !gross_weight || !net_weight) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const productData = {
            sku, name, category, metal, purity, gross_weight, net_weight,
            stone_weight, making_charges_per_gram, making_charges_percentage,
            wastage_percentage, stone_charges, quantity, hsn_code,
            stock_alert_threshold, description, huid_number, tag_number,
            is_hallmarked, diamond_certificate, photo_path
        };

        const result = await insert('products', productData, uid);
        res.status(201).json({ id: result.id, message: 'Product created successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: `Product with SKU '${sku}' already exists.` });
        }
        console.error('Error creating product:', error.message);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

router.put('/:id', async (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    const {
        sku, name, category, metal, purity, gross_weight, net_weight,
        stone_weight = 0, making_charges_per_gram = 0, making_charges_percentage = 0,
        wastage_percentage = 0, stone_charges = 0, quantity = 1, hsn_code = null,
        stock_alert_threshold = 1, description = null, huid_number = null, tag_number = null,
        is_hallmarked = false, diamond_certificate = null, photo_path = null
    } = req.body || {};

    try {
        const updateData = {
            sku, name, category, metal, purity, gross_weight, net_weight,
            stone_weight, making_charges_per_gram, making_charges_percentage,
            wastage_percentage, stone_charges, quantity, hsn_code,
            stock_alert_threshold, description, huid_number, tag_number,
            is_hallmarked, diamond_certificate, photo_path,
            updated_at: new Date().toISOString()
        };

        const result = await update('products', updateData, { id: parseInt(id) }, uid);

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: `Product with SKU '${sku}' already exists.` });
        }
        console.error(`Error updating product ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

router.delete('/:id', async (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    try {
        const result = await deleteRow('products', { id: parseInt(id) }, uid);

        if (!result) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error.message);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
