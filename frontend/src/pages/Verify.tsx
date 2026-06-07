import { useState, useRef } from 'react';
import { api } from '../utils/api';
import type { Product } from '../types';

type ExpiryStatus = { label: string; cls: string };

function expiryStatus(expDate: string): ExpiryStatus {
  const diff = (new Date(expDate).getTime() - Date.now()) / 86400000;
  if (diff < 0) return { label: 'EXPIRED', cls: 'badge-danger' };
  if (diff < 30) return { label: 'EXPIRING SOON', cls: 'badge-warning' };
  return { label: 'VALID', cls: 'badge-success' };
}

export default function Verify() {
  const [wid, setWid] = useState('');
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      alert('Camera access denied or unavailable.');
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPhotoURL(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const retakePhoto = () => {
    if (photoURL) URL.revokeObjectURL(photoURL);
    setPhotoBlob(null);
    setPhotoURL(null);
  };

  const verify = async () => {
    if (!wid.trim()) return setError('Please enter a WID');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const product = await api.get<Product>(`/verify/${encodeURIComponent(wid.trim())}`);
      await api.post('/verify/log', {
        wid: product.wid,
        has_photo: !!photoBlob,
        photo_url: photoBlob ? 'demo://captured' : null,
      });
      setResult(product);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setWid('');
    setResult(null);
    setError('');
    retakePhoto();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Product Verification</h2>
        <p>Scan barcode or enter WID to verify a product on the warehouse floor</p>
      </div>

      <div className="grid-2">
        {/* Input panel */}
        <div className="card">
          <h3>Scan / Enter WID</h3>

          <div className="field">
            <label htmlFor="wid-input">Warehouse ID (WID)</label>
            <input
              id="wid-input"
              value={wid}
              onChange={(e) => setWid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="e.g. WH-001-A"
              className="mono"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Product Photo <span className="hint">(optional)</span></label>
            {!cameraActive && !photoURL && (
              <button className="btn btn-outline" onClick={openCamera}>
                📷 Open Camera
              </button>
            )}
            {cameraActive && (
              <div>
                <video ref={videoRef} autoPlay playsInline className="camera-preview" />
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={capture}>Capture</button>
                  <button className="btn btn-outline" onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            )}
            {photoURL && !cameraActive && (
              <div>
                <img src={photoURL} alt="Captured product" className="photo-preview" />
                <button className="btn btn-outline btn-sm" onClick={retakePhoto}>
                  ↺ Retake
                </button>
              </div>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="btn-row">
            <button className="btn btn-primary full" onClick={verify} disabled={loading}>
              {loading ? 'Verifying…' : '✓ Verify Product'}
            </button>
            {result && (
              <button className="btn btn-outline" onClick={reset}>Reset</button>
            )}
          </div>
        </div>

        {/* Result panel */}
        <div>
          {result ? (
            <div className="card result-card">
              <h3 className="success">✓ Verification Result</h3>
              <div className="result-fields">
                <Row label="WID" value={result.wid} mono />
                <Row label="EAN" value={result.ean} mono />
                <Row label="Manufacturing Date" value={result.manufacturing_date} />
                <Row
                  label="Expiry Date"
                  value={
                    <>
                      {result.expiry_date}&nbsp;
                      <span className={`badge ${expiryStatus(result.expiry_date).cls}`}>
                        {expiryStatus(result.expiry_date).label}
                      </span>
                    </>
                  }
                />
                <Row label="Photo" value={photoURL ? '✓ Captured' : '—'} />
                <Row label="Verified At" value={new Date().toLocaleString()} muted />
              </div>
              <div className="alert alert-success">Verification logged successfully.</div>
            </div>
          ) : (
            <div className="card empty-state">
              <span style={{ fontSize: '2.5rem' }}>🔍</span>
              <p>Enter a WID and press Verify to see product details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="result-row">
      <span className="result-label">{label}</span>
      <span className={`result-value${mono ? ' mono' : ''}${muted ? ' muted' : ''}`}>
        {value}
      </span>
    </div>
  );
}
