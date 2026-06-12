import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const API_URL = '';

const TYPE_LABELS = {
  customers: 'Customers',
  sales: 'Sales',
  purchases: 'Purchases',
  products: 'Products',
};

const ImportModal = ({ isOpen, onClose, importType, onSuccess }) => {
  const [step, setStep] = useState('upload');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const a = document.createElement('a');
    a.href = `${API_URL}/api/import/template/${importType}`;
    a.download = `${importType}-template.xlsx`;
    fetch(a.href, { credentials: 'include' })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = a.download;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Failed to download template'));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/import/${importType}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process file');
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      setError('No file selected. Please upload again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`${API_URL}/api/import/${importType}?confirm=true`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPreview(null);
    setResult(null);
    setError('');
    setLoading(false);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleSuccessClose = () => {
    if (onSuccess) onSuccess();
    handleClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} color="var(--gold)" />
            Import {TYPE_LABELS[importType] || importType}
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FFF4F4', borderLeft: '4px solid #FF5252', color: '#D32F2F', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {step === 'upload' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Upload size={48} color="var(--border)" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Upload an Excel (.xlsx) or CSV file with the correct columns.<br />
                Download the template first to see the required format.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ padding: '0.5rem 1.25rem' }}>
                  <Download size={16} style={{ marginRight: '6px' }} /> Download Template
                </button>
                <label className="btn-primary" style={{ padding: '0.5rem 1.25rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  <Upload size={16} style={{ marginRight: '6px' }} /> Select File
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{preview.totalRows} rows found</span>
                  {preview.totalErrors > 0 && (
                    <span style={{ marginLeft: '1rem', color: '#FF5252', fontSize: '0.9rem' }}>
                      {preview.totalErrors} with errors
                    </span>
                  )}
                </div>
              </div>

              {preview.totalErrors > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#D32F2F', marginBottom: '0.5rem' }}>Rows with errors (will be skipped)</h4>
                  {preview.errorRows.map((er, i) => (
                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#FFF4F4', borderRadius: '4px', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      <strong>Row {er.rowNumber}:</strong> {er.errors.join(', ')}
                    </div>
                  ))}
                </div>
              )}

              {preview.rows.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Preview (first {preview.rows.length} rows)</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ fontSize: '0.8rem', width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '6px 8px', border: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', left: 0 }}>#</th>
                          {preview.columns.map((col, i) => (
                            <th key={i} style={{ padding: '6px 8px', border: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px 8px', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', left: 0, background: 'white' }}>{i + 1}</td>
                            {row.map((cell, j) => (
                              <td key={j} style={{ padding: '6px 8px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.rows.length === 0 && preview.totalErrors > 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  All rows have errors. Fix and upload again.
                </div>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Import Complete</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                {result.imported} records imported successfully
                {result.errors?.length > 0 && ` (${result.errors.length} errors)`}
              </p>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: '1rem', textAlign: 'left', maxHeight: '200px', overflowY: 'auto' }}>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ padding: '0.35rem 0.5rem', background: '#FFF4F4', borderRadius: '4px', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#D32F2F' }}>
                      {err.row ? `Row: ${err.row} — ` : ''}{err.error || err.errors?.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader size={36} className="spin" style={{ color: 'var(--gold)', margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Processing file...</p>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {step === 'preview' && (
            <>
              <button type="button" onClick={handleClose} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
              <button type="button" onClick={handleConfirmImport} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }} disabled={loading || preview.rows.length === 0}>
                {loading ? 'Importing...' : `Import ${preview.validRows || preview.rows.length} Records`}
              </button>
            </>
          )}
          {step === 'result' && (
            <button type="button" onClick={handleSuccessClose} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Close</button>
          )}
          {step === 'upload' && (
            <button type="button" onClick={handleClose} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
