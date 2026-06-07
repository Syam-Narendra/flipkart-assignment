import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import type { Product } from '../types';

const PAGE_SIZE = 50;

function expiryStatus(expDate: string) {
  const diff = (new Date(expDate).getTime() - Date.now()) / 86400000;
  if (diff < 0) return { label: 'Expired', cls: 'badge-danger' };
  if (diff < 30) return { label: 'Expiring Soon', cls: 'badge-warning' };
  return { label: 'Valid', cls: 'badge-success' };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  const fetchPage = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError('');
    try {
      const skip = pageIndex * PAGE_SIZE;
      const data = await api.get<Product[]>(`/products?skip=${skip}&limit=${PAGE_SIZE}`);
      setProducts(data);
      setHasMore(data.length === PAGE_SIZE);
      if (pageIndex === 0 && data.length < PAGE_SIZE) setTotal(data.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchPage(p);
  };

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.wid.toLowerCase().includes(search.toLowerCase()) ||
          p.ean.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Product Inventory</h2>
        <p>All products loaded into the system. Showing {PAGE_SIZE} per page.</p>
      </div>

      <div className="card">
        <div className="card-row">
          <div className="field" style={{ margin: 0, flex: 1, maxWidth: 360 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by WID or EAN…"
              className="mono"
            />
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => goToPage(0)}
            disabled={loading}
          >
            ↺ Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty-state"><div className="spinner" /><p>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>{search ? 'No products match your search.' : 'No products found. Upload a CSV to get started.'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>WID</th>
                    <th>EAN</th>
                    <th>Mfg. Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const st = expiryStatus(p.expiryDate);
                    return (
                      <tr key={p.id}>
                        <td className="muted">{page * PAGE_SIZE + i + 1}</td>
                        <td className="mono bold">{p.wid}</td>
                        <td className="mono small">{p.ean}</td>
                        <td className="small">{p.manufacturingDate}</td>
                        <td className="small">{p.expiryDate}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td className="muted small">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!search && (
              <div className="pagination">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 0 || loading}
                >
                  ← Prev
                </button>
                <span className="page-info">Page {page + 1}</span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={!hasMore || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {total !== null && (
        <p className="hint" style={{ marginTop: '0.5rem' }}>
          Total products on this page: {total}
        </p>
      )}
    </div>
  );
}
