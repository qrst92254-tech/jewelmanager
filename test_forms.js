const API_URL = 'http://localhost:3001/api';

async function testAllForms() {
    try {
        // 1. LOGIN
        console.log('=== 1. LOGIN ===');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@jewelmanager.com', password: 'shopowner123' })
        });
        const loginData = await loginRes.json();
        console.log('Login:', loginRes.status, loginData);
        const token = loginData.token;

        const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. ADD PRODUCT (Inventory)
        console.log('\n=== 2. ADD PRODUCT ===');
        const productRes = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                sku: 'GLD-CHN-001',
                name: '22K Gold Chain',
                category: 'Chain',
                metal: 'Gold',
                purity: '22K',
                gross_weight: 25.5,
                net_weight: 22.3,
                stone_weight: 0,
                making_charges_per_gram: 350,
                wastage_percentage: 3,
                stone_charges: 0,
                quantity: 5,
                hsn_code: '7113',
                description: 'Handcrafted gold chain'
            })
        });
        console.log('Add Product:', productRes.status, await productRes.json());

        // 3. ADD CUSTOMER
        console.log('\n=== 3. ADD CUSTOMER ===');
        const custRes = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Rajesh Sharma',
                phone: '9876543210',
                email: 'rajesh@example.com',
                address: '123, Jewel Street, Mumbai',
                city: 'Mumbai',
                aadhaar_number: '123456789012',
                pan_number: 'ABCDE1234F',
                date_of_birth: '1985-05-15',
                anniversary_date: '2010-12-20',
                customer_type: 'vip',
                credit_limit: 500000,
                loyalty_points: 500,
                outstanding_amount: 25000,
                notes: 'Regular customer, prefers gold jewelry',
                gstin: '27ABCDE1234F1Z5'
            })
        });
        console.log('Add Customer:', custRes.status, await custRes.json());

        // 4. ADD KARIGAR (Craftsman)
        console.log('\n=== 4. ADD KARIGAR ===');
        const karigarRes = await fetch(`${API_URL}/karigar`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Mohan Lal',
                phone: '9876540000',
                address: '456, Artisan Colony, Jaipur',
                skill_type: 'chains, setting',
                id_proof: 'Aadhaar: 234567890123'
            })
        });
        console.log('Add Karigar:', karigarRes.status, await karigarRes.json());

        // 5. CREATE GIRVI (Gold Loan)
        console.log('\n=== 5. CREATE GOLD LOAN ===');
        const loanRes = await fetch(`${API_URL}/girvi`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                customer_name: 'Priya Patel',
                customer_phone: '9876543211',
                customer_address: '789, Diamond Road, Surat',
                customer_id_proof: 'PAN: FGHIJ5678K',
                item_description: 'Gold Bangles 22K',
                item_type: 'ornament',
                metal: 'gold',
                purity: '22K',
                gross_weight: 50,
                net_weight: 48,
                stone_weight: 2,
                valuation_rate: 6450,
                metal_value: 309600,
                loan_amount: 216720,
                interest_rate: 2.0,
                interest_type: 'simple',
                pledge_date: '2026-05-01',
                due_date: '2026-11-01',
                notes: 'Standard gold loan'
            })
        });
        console.log('Add Loan:', loanRes.status, await loanRes.json());

        // 6. CREATE REPAIR ORDER
        console.log('\n=== 6. CREATE REPAIR ORDER ===');
        const repairRes = await fetch(`${API_URL}/repairs`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                customer_name: 'Amit Singh',
                customer_phone: '9876543212',
                item_description: 'Gold Chain with broken clasp',
                item_type: 'ornament',
                metal: 'gold',
                purity: '22K',
                weight: 15.5,
                repair_type: 'clasp replacement, polishing',
                problem_description: 'Clasp is broken and chain needs polishing',
                estimated_charges: 1500,
                advance_paid: 500,
                received_date: '2026-05-30',
                promised_date: '2026-06-05',
                assigned_to_karigar_id: null,
                notes: 'Customer wants urgent delivery'
            })
        });
        console.log('Add Repair:', repairRes.status, await repairRes.json());

        // 7. CREATE SCHEME PLAN
        console.log('\n=== 7. CREATE SCHEME PLAN ===');
        const planRes = await fetch(`${API_URL}/schemes/plans`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                plan_name: '11+1 Golden Savings Plan',
                duration_months: 11,
                monthly_amount: 5000,
                bonus_month: 1,
                scheme_type: 'gold',
                description: 'Pay 11 months, get 1 month free gold bonus'
            })
        });
        console.log('Add Plan:', planRes.status, await planRes.json());

        // 8. ENROLL MEMBER IN SCHEME
        console.log('\n=== 8. ENROLL IN SCHEME ===');
        // First get plans to get plan_id
        const plansRes = await fetch(`${API_URL}/schemes/plans`);
        const plans = await plansRes.json();
        console.log('Plans available:', plans.length);
        
        if (plans.length > 0) {
            const enrollRes = await fetch(`${API_URL}/schemes/enrollments`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    plan_id: plans[0].id,
                    customer_name: 'Sunita Verma',
                    customer_phone: '9876543213',
                    start_date: '2026-05-01',
                    monthly_amount: 5000,
                    notes: 'Enrolled through shop promotion'
                })
            });
            console.log('Enroll Member:', enrollRes.status, await enrollRes.json());
        }

        // 9. ADD SUPPLIER
        console.log('\n=== 9. ADD SUPPLIER ===');
        const supplierRes = await fetch(`${API_URL}/purchases/suppliers`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Mumbai Gold Traders Pvt Ltd',
                contact_person: 'Mr. Mehta',
                phone: '9876543214',
                email: 'info@mumbaitraders.com',
                address: 'Zaveri Bazar, Mumbai - 400001',
                gstin: '27AABCM1234F1Z6',
                supplier_type: 'wholesaler'
            })
        });
        console.log('Add Supplier:', supplierRes.status, await supplierRes.json());

        // 10. CREATE PURCHASE ORDER
        console.log('\n=== 10. CREATE PURCHASE ORDER ===');
        const suppliersRes = await fetch(`${API_URL}/purchases/suppliers`);
        const suppliers = await suppliersRes.json();
        console.log('Suppliers available:', suppliers.length);

        if (suppliers.length > 0) {
            const poRes = await fetch(`${API_URL}/purchases/orders`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    supplier_id: suppliers[0].id,
                    order_date: '2026-05-30',
                    expected_date: '2026-06-02',
                    subtotal: 720000,
                    gst_amount: 21600,
                    grand_total: 741600,
                    amount_paid: 200000,
                    payment_method: 'bank',
                    notes: 'Purchase of raw gold bars',
                    items: [
                        {
                            product_name: 'Raw Gold Bar 999',
                            category: 'bullion',
                            metal: 'gold',
                            purity: '24K',
                            gross_weight: 100,
                            net_weight: 100,
                            quantity: 1,
                            rate_per_gram: 7200,
                            making_charges: 0,
                            item_total: 720000
                        }
                    ]
                })
            });
            console.log('Create PO:', poRes.status, await poRes.json());
        }

        // 11. CREATE QUOTATION
        console.log('\n=== 11. CREATE QUOTATION ===');
        const quoteRes = await fetch(`${API_URL}/quotations`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                customer_name: 'Neha Gupta',
                customer_phone: '9876543215',
                gold_rate_used: 6450,
                silver_rate_used: 85,
                valid_until: '2026-06-06',
                subtotal: 235500,
                gst_amount: 7065,
                grand_total: 242565,
                notes: 'Customer enquired about custom necklace',
                items: [
                    {
                        product_name: 'Custom Gold Necklace',
                        category: 'necklace',
                        purity: '22K',
                        net_weight: 30,
                        rate_per_gram: 6450,
                        making_charges: 12000,
                        stone_charges: 15000,
                        quantity: 1,
                        metal_value: 193500,
                        gst_amount: 6615,
                        item_total: 227115
                    },
                    {
                        product_name: 'Gold Earrings',
                        category: 'earring',
                        purity: '22K',
                        net_weight: 6,
                        rate_per_gram: 6450,
                        making_charges: 3000,
                        stone_charges: 5000,
                        quantity: 1,
                        metal_value: 38700,
                        gst_amount: 1401,
                        item_total: 48101
                    }
                ]
            })
        });
        console.log('Add Quotation:', quoteRes.status, await quoteRes.json());

        // 12. CREATE SALE (Invoice)
        console.log('\n=== 12. CREATE SALE ===');
        // Get products to sell
        const productsRes = await fetch(`${API_URL}/products`);
        const products = await productsRes.json();
        console.log('Products available for sale:', products.length);

        if (products.length > 0) {
            const saleRes = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    customer_name: 'Vikram Mehta',
                    customer_phone: '9876543216',
                    discount: 0,
                    payment_mode: 'Card',
                    notes: 'Walk-in customer, card payment',
                    items: [
                        {
                            product_id: products[0].id,
                            quantity: 1,
                            price_at_sale: products[0].net_weight * 2000
                        }
                    ]
                })
            });
            console.log('Add Sale:', saleRes.status, await saleRes.json());
        }

        console.log('\n=== ALL FORMS TESTED SUCCESSFULLY ===');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testAllForms();