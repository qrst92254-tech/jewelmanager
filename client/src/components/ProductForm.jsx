import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

const initialFormState = {
    sku: '', name: '', category: 'Ring', metal: 'Gold', purity: '22K',
    gross_weight: '', net_weight: '', stone_weight: '', making_charges_per_gram: '',
    wastage_percentage: '', stone_charges: '', quantity: 1, hsn_code: '7113', description: '',
    stock: 0,
    tags: [],
    images: [],
};

const ProductForm = ({ product, onSubmit, onClear }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState(null);
    const isEditing = !!product;

    useEffect(() => {
        setFormData(isEditing ? { ...initialFormState, ...product } : initialFormState);
        setFormError(null);
    }, [product, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.sku?.trim()) {
            setFormError('Product name and SKU are required.');
            return;
        }

        const normalizedData = {
            ...formData,
            gross_weight: parseFloat(formData.gross_weight) || 0,
            net_weight: parseFloat(formData.net_weight) || 0,
            stone_weight: parseFloat(formData.stone_weight) || 0,
            making_charges_per_gram: parseFloat(formData.making_charges_per_gram) || 0,
            wastage_percentage: parseFloat(formData.wastage_percentage) || 0,
            stone_charges: parseFloat(formData.stone_charges) || 0,
            quantity: parseInt(formData.quantity, 10) || 1,
            stock: parseInt(formData.stock, 10) || 0,
        };

        try {
            setFormError(null);
            onSubmit(normalizedData);
        } catch (submitError) {
            setFormError(submitError?.message || 'Failed to save product.');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField name="sku" label="SKU / Tag" value={formData.sku} onChange={handleChange} required />
                    <InputField name="name" label="Product Name" value={formData.name} onChange={handleChange} required />
                    <SelectField name="category" label="Category" value={formData.category} onChange={handleChange} options={['Ring', 'Necklace', 'Earring', 'Bangle', 'Bracelet', 'Chain', 'Pendant']} />
                    <SelectField name="metal" label="Metal" value={formData.metal} onChange={handleChange} options={['Gold', 'Silver', 'Platinum']} />
                    <SelectField name="purity" label="Purity" value={formData.purity} onChange={handleChange} options={['24K', '22K', '18K', '14K', '999 Silver', '925 Silver']} />
                    <InputField name="quantity" label="Quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                </div>
                
                <div style={{ margin: '1.5rem 0', borderTop: '1px dashed var(--border)' }}></div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Weight Details (g)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <InputField name="gross_weight" label="Gross Wt." type="number" value={formData.gross_weight} onChange={handleChange} required />
                    <InputField name="net_weight" label="Net Wt." type="number" value={formData.net_weight} onChange={handleChange} required />
                    <InputField name="stone_weight" label="Stone Wt." type="number" value={formData.stone_weight} onChange={handleChange} />
                </div>

                <div style={{ margin: '1.5rem 0', borderTop: '1px dashed var(--border)' }}></div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Charges & Taxes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField name="making_charges_per_gram" label="Making (₹/g)" type="number" value={formData.making_charges_per_gram} onChange={handleChange} />
                    <InputField name="wastage_percentage" label="Wastage (%)" type="number" value={formData.wastage_percentage} onChange={handleChange} />
                    <InputField name="stone_charges" label="Stone Charges (₹)" type="number" value={formData.stone_charges} onChange={handleChange} />
                    <InputField name="hsn_code" label="HSN Code" value={formData.hsn_code} onChange={handleChange} />
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <label>Description</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Optional product description..." />
                </div>
                {formError && (
                    <div style={{ marginTop: '1rem', color: '#FF5252', fontSize: '0.95rem' }}>{formError}</div>
                )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={onClear} className="btn-secondary">
                    Cancel
                </button>
                <button type="submit" className="btn-primary">
                    <Save size={16} style={{ marginRight: '8px' }} />
                    {isEditing ? 'Save Changes' : 'Add Product'}
                </button>
            </div>
        </form>
    );
};

const InputField = ({ label, ...props }) => (
    <div>
        <label>{label}</label>
        <input {...props} />
    </div>
);

const SelectField = ({ label, options, ...props }) => (
    <div>
        <label>{label}</label>
        <select {...props}>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default ProductForm;