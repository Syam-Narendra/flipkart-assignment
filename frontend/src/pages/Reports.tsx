import { useState } from 'react';
import { api, downloadReport } from '../utils/api';
import type { VerificationLog } from '../types';

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState('2024-01-01');
  const [end, setEnd] = useState(today);
  const [logs, setLogs] = useState<VerificationLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<VerificationLog[]>(
        `/reports?start_date=${start}&end_date=${end}`,
      );
      setLogs(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadReport(start, end);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Verification Reports</h2>
        <p>QA audit trail — select a date range to generate a report.</p>
      </div>

      <div className="card">
        <div className="date-row">
          <div className="field">
            <label htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="end-date">End Date</label>
            <input
              id="end-date"
              type="date"
              value={end}
              min={start}
              max={today}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Loading…' : 'Generate Report'}
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {logs !== null && (
        <div className="card">
          <div className="card-row">
            <h3>{logs.length} verification event{logs.length !== 1 ? 's' : ''}</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={exportCsv}
              disabled={exporting || logs.length === 0}
            >
              {exporting ? 'Exporting…' : '↓ Export CSV'}
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state">
              <p>No verification events in this date range.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>WID</th>
                    <th>EAN</th>
                    <th>Operator</th>
                    <th>Timestamp</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id}>
                      <td className="muted">{i + 1}</td>
                      <td className="mono bold">{log.wid}</td>
                      <td className="mono small">{log.product?.ean ?? '—'}</td>
                      <td>{log.user.name}</td>
                      <td className="muted small">
                        {new Date(log.verifiedAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${log.hasPhoto ? 'badge-success' : 'badge-warning'}`}
                        >
                          {log.hasPhoto ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
