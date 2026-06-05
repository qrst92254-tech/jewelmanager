const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update, deleteRow } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

// Helper function to generate next bill number
async function nextSaleBillNumber() {
    const { data, error } = await supabase
        .from('sales')
        .select('bill_number')
        .order('bill_number', { ascending: false })
        .limit(1);
    
    if (error || !data || data.length === 0) {
        return 'BILL-0001';
    }
    
    const lastNumber = data[0].bill_number;
    const num = parseInt(lastNumber.split('-')[1]) || 0;
    return `BILL-${String(num + 1).padStart(4, '0')}`;
}

router.get('/', async (req, res) => {
    const uid = tenantId(req);
    try {
        const sales = await queryAll('sales', {
            select: 'id,bill_number,customer_name,sale_date,final_amount',
            order: { column: 'sale_date', ascending: false }
        }, uid);
        res.json(sales);
    } catch (error) {
        console.error('Failed to fetch sales:', error);
        res.status(500).json({ error: 'Database error while fetching sales.' });
    }
});

router.get('/:id', async (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    try {
        const sale = await queryOne('sales', { eq: { id: parseInt(id) } }, uid);
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found.' });
        }

        // Get sale items with product details
        const { data: items, error: itemsError } = await supabase
            .from('sale_items')
            .select(`
                quantity,
                price_at_sale,
                products!inner(name, sku, metal, purity, net_weight, hsn_code, user_id)
            `)
            .eq('sale_id', parseInt(id))
            .eq('products.user_id', uid);

        if (itemsError) {
            console.error('Failed to fetch sale items:', itemsError);
            return res.status(500).json({ error: 'Database error while fetching sale items.' });
        }

        sale.items = items.map(item => ({
            quantity: item.quantity,
            price_at_sale: item.price_at_sale,
            name: item.products.name,
            sku: item.products.sku,
            metal: item.products.metal,
            purity: item.products.purity,
            net_weight: item.products.net_weight,
            hsn_code: item.products.hsn_code
        }));

        res.json(sale);
    } catch (error) {
        console.error(`Failed to fetch sale ${id}:`, error);
        res.status(500).json({ error: 'Database error while fetching sale details.' });
    }
});

router.post('/', async (req, res) => {
    const uid = tenantId(req);
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
        const total_amount = items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
        const final_amount_before_gst = total_amount - (discount || 0);
        const cgst_rate = 1.5;
        const sgst_rate = 1.5;
        const cgst_amount = final_amount_before_gst * (cgst_rate / 100);
        const sgst_amount = final_amount_before_gst * (sgst_rate / 100);
        const final_amount = final_amount_before_gst + cgst_amount + sgst_amount;

        const bill_number = await nextSaleBillNumber();

        // Insert sale
        const saleData = {
            bill_number,
            customer_name,
            customer_phone,
            total_amount,
            discount: discount || 0,
            cgst_rate,
            sgst_rate,
            cgst_amount,
            sgst_amount,
            final_amount,
            payment_mode,
            notes
        };

        const saleResult = await insert('sales', saleData, uid);
        const sale_id = saleResult.id;

        // Insert sale items and update product stock
        for (const item of items) {
            const productId = parseInt(item.product_id, 10);
            
            // Verify product belongs to user
            const product = await queryOne('products', { eq: { id: productId } }, uid);
            if (!product) {
                throw new Error(`Product ${productId} not found for this account`);
            }

            // Insert sale item
            await supabase.from('sale_items').insert({
                sale_id,
                product_id: productId,
                quantity: item.quantity,
                price_at_sale: item.price_at_sale
            });

            // Update product stock
            const newQuantity = Math.max(0, product.quantity - item.quantity);
            await update('products', { quantity: newQuantity }, { id: productId }, uid);
        }

        res.status(201).json({ success: true, sale_id, bill_number });
    } catch (error) {
        console.error('Failed to create sale:', error);
        res.status(500).json({ error: error.message || 'Database transaction failed. Sale not created.' });
    }
});

router.delete('/:id', async (req, res) => {
    const uid = tenantId(req);
    const { id } = req.params;
    try {
        const result = await deleteRow('sales', { id: parseInt(id) }, uid);

        if (!result) {
            res.status(404).json({ error: 'Sale not found.' });
        } else {
            res.status(200).json({ success: true, message: 'Sale deleted successfully.' });
        }
    } catch (error) {
        console.error(`Failed to delete sale ${id}:`, error);
        res.status(500).json({ error: 'Database error while deleting sale.' });
    }
});

module.exports = router;
