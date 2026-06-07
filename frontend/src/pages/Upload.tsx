import { useState, useRef } from 'react';
import { api } from '../utils/api';
import type { UploadResult } from '../types';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Only CSV files are accepted');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.upload<UploadResult>('/products/upload', form);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Bulk Product Upload</h2>
        <p>Upload a CSV to ingest warehouse inventory. WID uniqueness is strictly enforced.</p>
      </div>

      <div className="card">
        <div className="info-box">
          Expected columns:&nbsp;
          <code>WID, EAN, Manufacturing_Date, Expiry_Date</code>
        </div>

        <div
          className={`dropzone${drag ? ' drag' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <span className="drop-icon">📤</span>
          {file ? (
            <>
              <strong>{file.name}</strong>
              <p className="hint">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <p>Drop CSV file here or <strong>click to browse</strong></p>
              <p className="hint">Optimised for large files · Streamed in 500-row batches</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />

        {error && <div className="alert alert-error">{error}</div>}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={upload} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : '↑ Upload & Import'}
          </button>
          {file && !uploading && (
            <button className="btn btn-outline" onClick={reset}>Clear</button>
          )}
        </div>

        {result && (
          <div className="upload-result">
            <div className="result-stat green">
              <div className="n">{result.inserted}</div>
              <div>Inserted</div>
            </div>
            <div className="result-stat amber">
              <div className="n">{result.duplicates}</div>
              <div>Skipped (duplicates)</div>
            </div>
            <div className="result-stat red">
              <div className="n">{result.errors}</div>
              <div>Errors</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Sample CSV Format</h3>
        <pre className="code-block">{`WID,EAN,Manufacturing_Date,Expiry_Date
WH-001-A,8901234567890,2024-03-15,2025-03-14
WH-001-B,8901234567890,2024-04-01,2025-03-31
WH-002-A,7501055362083,2024-01-10,2026-01-09`}</pre>
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          A single EAN can have multiple WIDs with different manufacturing/expiry dates.
          Duplicate WIDs are silently skipped.
        </p>
      </div>
    </div>
  );
}
