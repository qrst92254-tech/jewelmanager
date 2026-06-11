const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { supabase } = require('../services/supabase');
const { insert } = require('../db/database');
const { requireApiAuth } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const COLUMNS = {
  customers: [
    { key: 'name', label: 'Name', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'aadhaar_number', label: 'Aadhaar Number' },
    { key: 'pan_number', label: 'PAN Number' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'anniversary_date', label: 'Anniversary Date' },
    { key: 'customer_type', label: 'Customer Type' },
    { key: 'credit_limit', label: 'Credit Limit' },
    { key: 'outstanding_amount', label: 'Outstanding Amount' },
    { key: 'notes', label: 'Notes' },
    { key: 'gstin', label: 'GSTIN' },
  ],
  sales: [
    { key: 'customer_name', label: 'Customer Name', required: true },
    { key: 'customer_phone', label: 'Customer Phone' },
    { key: 'sale_date', label: 'Sale Date', required: true },
    { key: 'total_amount', label: 'Total Amount', required: true },
    { key: 'discount', label: 'Discount' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'notes', label: 'Notes' },
  ],
  purchases: [
    { key: 'supplier_name', label: 'Supplier Name', required: true },
    { key: 'order_date', label: 'Order Date', required: true },
    { key: 'expected_date', label: 'Expected Date' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'gst_amount', label: 'GST Amount' },
    { key: 'grand_total', label: 'Grand Total' },
    { key: 'amount_paid', label: 'Amount Paid' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'notes', label: 'Notes' },
  ],
  products: [
    { key: 'sku', label: 'SKU', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'metal', label: 'Metal', required: true },
    { key: 'purity', label: 'Purity' },
    { key: 'gross_weight', label: 'Gross Weight', required: true },
    { key: 'net_weight', label: 'Net Weight', required: true },
    { key: 'stone_weight', label: 'Stone Weight' },
    { key: 'making_charges_per_gram', label: 'Making Charges per Gram' },
    { key: 'making_charges_percentage', label: 'Making Charges %' },
    { key: 'wastage_percentage', label: 'Wastage %' },
    { key: 'stone_charges', label: 'Stone Charges' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'hsn_code', label: 'HSN Code' },
    { key: 'stock_alert_threshold', label: 'Stock Alert Threshold' },
    { key: 'description', label: 'Description' },
  ],
};

function getCols(type) {
  return COLUMNS[type] || [];
}

async function nextSequentialNumber(table, column, prefix, uid) {
  let query = supabase.from(table).select(column);
  if (uid) query = query.eq('user_id', uid);
  const { data, error } = await query.order(column, { ascending: false }).limit(1);
  if (error || !data || data.length === 0) return `${prefix}-0001`;
  const lastNumber = data[0][column];
  const num = parseInt(lastNumber.split('-')[1]) || 0;
  return `${prefix}-${String(num + 1).padStart(4, '0')}`;
}

router.get('/template/:type', requireApiAuth, (req, res) => {
  const { type } = req.params;
  const cols = getCols(type);
  if (!cols.length) return res.status(400).json({ error: 'Invalid import type' });

  const headerRow = cols.map(c => c.label);
  const sampleRow = cols.map(c => {
    const samples = {
      'Name': 'Ramesh Sharma',
      'Phone': '9876543210',
      'Email': 'ramesh@example.com',
      'Address': '42 Gold Street, Mumbai',
      'City': 'Mumbai',
      'Aadhaar Number': '1234-5678-9012',
      'PAN Number': 'ABCDE1234F',
      'Date of Birth': '1985-06-15',
      'Anniversary Date': '2010-12-01',
      'Customer Type': 'retail',
      'Credit Limit': '50000',
      'Outstanding Amount': '0',
      'Notes': 'Regular customer',
      'GSTIN': '27AAAAA0000A1Z1',
      'Customer Name': 'Priya Patel',
      'Customer Phone': '9876543211',
      'Sale Date': '2026-06-01',
      'Total Amount': '50000',
      'Discount': '2000',
      'Payment Mode': 'Cash',
      'Supplier Name': 'Mumbai Gold Traders',
      'Order Date': '2026-06-01',
      'Expected Date': '2026-06-10',
      'Subtotal': '48000',
      'GST Amount': '1440',
      'Grand Total': '49440',
      'Amount Paid': '49440',
      'Payment Method': 'bank',
      'SKU': 'GOLD-CHAIN-001',
      'Category': 'chain',
      'Metal': 'gold',
      'Purity': '22K',
      'Gross Weight': '25.5',
      'Net Weight': '25.0',
      'Stone Weight': '0',
      'Making Charges per Gram': '50',
      'Making Charges %': '8',
      'Wastage %': '2',
      'Stone Charges': '0',
      'Quantity': '1',
      'HSN Code': '7113',
      'Stock Alert Threshold': '2',
      'Description': 'Gold chain for retail',
    };
    return samples[c.label] || '';
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
  XLSX.utils.book_append_sheet(wb, ws, type);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${type}-template.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

router.post('/:type', requireApiAuth, upload.single('file'), async (req, res) => {
  const { type } = req.params;
  const confirm = req.query.confirm === 'true';
  const uid = req.session.userId;
  const cols = getCols(type);

  if (!cols.length) return res.status(400).json({ error: 'Invalid import type' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rawRows.length) return res.status(400).json({ error: 'File is empty' });

    const labelMap = {};
    for (const col of cols) {
      labelMap[col.label.toLowerCase()] = col.label;
    }
    const ALIASES = {
      qty: 'Quantity',
      quantity: 'Quantity',
      'making charges per g': 'Making Charges per Gram',
      'making charges': 'Making Charges per Gram',
      making: 'Making Charges per Gram',
      'making %': 'Making Charges %',
      'gross wt': 'Gross Weight',
      weight: 'Gross Weight',
      'net wt': 'Net Weight',
      net: 'Net Weight',
      'stone wt': 'Stone Weight',
      'hsn': 'HSN Code',
      'alert threshold': 'Stock Alert Threshold',
      desc: 'Description',
      dob: 'Date of Birth',
      anniversary: 'Anniversary Date',
      'customer type': 'Customer Type',
      'credit limit': 'Credit Limit',
      'outstanding': 'Outstanding Amount',
      'total': 'Total Amount',
      'payment mode': 'Payment Mode',
      'supplier': 'Supplier Name',
      'order date': 'Order Date',
      'expected date': 'Expected Date',
      'sub total': 'Subtotal',
      'gst': 'GST Amount',
      'grand total': 'Grand Total',
      'amount paid': 'Amount Paid',
      'payment method': 'Payment Method',
      'bill date': 'Sale Date',
      'sale date': 'Sale Date',
      date: 'Sale Date',
      'cust name': 'Customer Name',
      'customer': 'Customer Name',
      'cust phone': 'Customer Phone',
    };
    for (const [alias, canonical] of Object.entries(ALIASES)) {
      labelMap[alias] = canonical;
    }
    rawRows = rawRows.map(row => {
      const mapped = {};
      for (const key of Object.keys(row)) {
        const canonical = labelMap[key.trim().toLowerCase()];
        if (canonical) {
          mapped[canonical] = row[key];
        } else {
          mapped[key] = row[key];
        }
      }
      return mapped;
    });

    const errors = [];
    const validRows = [];

    rawRows.forEach((row, i) => {
      const rowErrors = [];

      for (const col of cols) {
        const val = row[col.label];
        if (val === undefined || val === null) row[col.label] = '';
      }

      for (const col of cols) {
        if (col.required) {
          const val = String(row[col.label] || '').trim();
          if (!val) {
            rowErrors.push(`Missing: ${col.label}`);
          }
        }
      }

      const allEmpty = cols.every(col => String(row[col.label] || '').trim() === '');
      if (allEmpty) return;

      if (rowErrors.length) {
        errors.push({ row: i + 2, errors: rowErrors, data: { ...row } });
      } else {
        validRows.push(row);
      }
    });

    if (confirm) {
      const saved = [];
      const saveErrors = [];

      const { count, error: countError } = await supabase
        .from(type === 'purchases' ? 'purchase_orders' : type)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      if (countError) throw countError;

      const limits = { customers: 100, sales: 500, purchases: 200, products: 200 };
      const limit = limits[type] || 100;
      if (count + validRows.length > limit) {
        return res.status(400).json({
          error: `Import would exceed the ${limit} record limit for this section. You currently have ${count} records. You can import at most ${limit - count} more.`
        });
      }

      for (const row of validRows) {
        try {
          let data;

          switch (type) {
            case 'customers': {
              data = {
                name: row['Name'],
                phone: row['Phone'],
                email: row['Email'],
                address: row['Address'],
                city: row['City'],
                aadhaar_number: row['Aadhaar Number'],
                pan_number: row['PAN Number'],
                date_of_birth: row['Date of Birth'] || null,
                anniversary_date: row['Anniversary Date'] || null,
                customer_type: row['Customer Type'] || 'retail',
                credit_limit: parseFloat(row['Credit Limit']) || 0,
                outstanding_amount: parseFloat(row['Outstanding Amount']) || 0,
                notes: row['Notes'],
                gstin: row['GSTIN'],
              };
              const result = await insert('customers', data, uid);
              saved.push(result.id);
              break;
            }

            case 'sales': {
              const totalAmount = parseFloat(row['Total Amount']) || 0;
              const discount = parseFloat(row['Discount']) || 0;
              const cgstRate = 1.5;
              const sgstRate = 1.5;
              const amountBeforeGst = totalAmount - discount;
              const cgstAmount = amountBeforeGst * (cgstRate / 100);
              const sgstAmount = amountBeforeGst * (sgstRate / 100);
              const finalAmount = amountBeforeGst + cgstAmount + sgstAmount;

              const billNumber = await nextSequentialNumber('sales', 'bill_number', 'BILL', uid);
              data = {
                bill_number: billNumber,
                customer_name: row['Customer Name'],
                customer_phone: row['Customer Phone'],
                sale_date: row['Sale Date'] || new Date().toISOString(),
                total_amount: totalAmount,
                discount,
                cgst_rate: cgstRate,
                sgst_rate: sgstRate,
                cgst_amount: cgstAmount,
                sgst_amount: sgstAmount,
                final_amount: finalAmount,
                payment_mode: row['Payment Mode'] || 'Cash',
                notes: row['Notes'],
              };
              const result = await insert('sales', data, uid);
              saved.push(result.id);
              break;
            }

            case 'purchases': {
              const supplierName = String(row['Supplier Name'] || '').trim();
              const { data: suppliers } = await supabase
                .from('suppliers')
                .select('id')
                .eq('user_id', uid)
                .ilike('name', supplierName)
                .limit(1);

              if (!suppliers || suppliers.length === 0) {
                saveErrors.push({ row: `Supplier "${supplierName}" not found` });
                continue;
              }

              const poNumber = await nextSequentialNumber('purchase_orders', 'po_number', 'PO', uid);
              data = {
                po_number: poNumber,
                supplier_id: suppliers[0].id,
                order_date: row['Order Date'] || new Date().toISOString().split('T')[0],
                expected_date: row['Expected Date'] || null,
                subtotal: parseFloat(row['Subtotal']) || 0,
                gst_amount: parseFloat(row['GST Amount']) || 0,
                grand_total: parseFloat(row['Grand Total']) || 0,
                amount_paid: parseFloat(row['Amount Paid']) || 0,
                payment_method: row['Payment Method'] || 'cash',
                notes: row['Notes'],
              };
              const result = await insert('purchase_orders', data, uid);
              saved.push(result.id);
              break;
            }

            case 'products': {
              data = {
                sku: String(row['SKU'] || '').trim(),
                name: row['Name'],
                category: row['Category'],
                metal: row['Metal'],
                purity: row['Purity'],
                gross_weight: parseFloat(row['Gross Weight']) || 0,
                net_weight: parseFloat(row['Net Weight']) || 0,
                stone_weight: parseFloat(row['Stone Weight']) || 0,
                making_charges_per_gram: parseFloat(row['Making Charges per Gram']) || 0,
                making_charges_percentage: parseFloat(row['Making Charges %']) || 0,
                wastage_percentage: parseFloat(row['Wastage %']) || 0,
                stone_charges: parseFloat(row['Stone Charges']) || 0,
                quantity: parseInt(row['Quantity']) || 1,
                hsn_code: row['HSN Code'] || null,
                stock_alert_threshold: parseInt(row['Stock Alert Threshold']) || 1,
                description: row['Description'] || null,
              };

              const { error: upsertError } = await supabase
                .from('products')
                .upsert({ ...data, user_id: uid }, { onConflict: 'sku' })
                .select()
                .single();

              if (upsertError) throw upsertError;
              saved.push(data.sku);
              break;
            }
          }
        } catch (err) {
          saveErrors.push({ row: JSON.stringify(row), error: err.message });
        }
      }

      return res.json({
        success: true,
        imported: saved.length,
        errors: errors.concat(saveErrors),
        total: rawRows.length,
      });
    }

    const preview = {
      columns: cols.map(c => c.label),
      rows: validRows.slice(0, 10).map(r => cols.map(c => r[c.label] || '')),
      totalRows: validRows.length,
      errorRows: errors.map(e => ({
        rowNumber: e.row,
        errors: e.errors,
        data: cols.map(c => e.data[c.label] || ''),
      })),
      totalErrors: errors.length,
    };

    res.json(preview);
  } catch (e) {
    console.error('Import error:', e);
    res.status(500).json({ error: e.message || 'Failed to process file' });
  }
});

module.exports = router;
