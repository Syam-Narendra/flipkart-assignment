import { useAuth } from '../hooks/useAuth';
import type { PageName } from '../components/Layout';

interface Props {
  setPage: (p: PageName) => void;
}

export default function Dashboard({ setPage }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome back, {user?.name}</h2>
        <p>
          {isAdmin
            ? 'Supply Chain Digital Verification System — Admin Console'
            : 'Supply Chain Digital Verification System — Operator View'}
        </p>
      </div>

      <div className="stat-grid">
        <StatCard
          icon="✓"
          label="Verify Product"
          desc="Scan or enter a WID to verify product details on the warehouse floor"
          actionLabel="Verify Now"
          color="blue"
          onClick={() => setPage('verify')}
        />
        {isAdmin && (
          <>
            <StatCard
              icon="↑"
              label="Bulk Upload"
              desc="Import a CSV file to populate the product inventory database"
              actionLabel="Upload CSV"
              color="green"
              onClick={() => setPage('upload')}
            />
            <StatCard
              icon="📊"
              label="Reports"
              desc="Generate QA audit reports filtered by a date range"
              actionLabel="View Reports"
              color="purple"
              onClick={() => setPage('reports')}
            />
            <StatCard
              icon="👥"
              label="User Management"
              desc="Create operator and admin accounts for your warehouse team"
              actionLabel="Manage Users"
              color="orange"
              onClick={() => setPage('users')}
            />
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>{isAdmin ? '🗺️ Quick Start — Admin' : '🗺️ How to Verify a Product'}</h3>
        <div className="guide-steps">
          {isAdmin ? (
            <>
              <Step n={1} text="Upload a CSV with WID, EAN, Manufacturing_Date, Expiry_Date columns to load inventory." />
              <Step n={2} text="Create operator accounts and share their login credentials with your team." />
              <Step n={3} text="Operators scan product WIDs on the floor and the system verifies details in real time." />
              <Step n={4} text="Download date-range reports from the Reports section to audit all activity." />
            </>
          ) : (
            <>
              <Step n={1} text="Go to Verify and scan the barcode or manually type the product WID." />
              <Step n={2} text="Optionally open the camera and capture a photo of the product label." />
              <Step n={3} text="Tap Verify to display EAN, Manufacturing Date, and Expiry Date from the system." />
              <Step n={4} text="Compare the displayed data against the physical product label to confirm accuracy." />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, desc, actionLabel, color, onClick,
}: {
  icon: string;
  label: string;
  desc: string;
  actionLabel: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div className={`stat-card stat-card-${color}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <p className="stat-desc">{desc}</p>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 'auto' }}>
        {actionLabel} →
      </button>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="guide-step">
      <div className="step-num">{n}</div>
      <p>{text}</p>
    </div>
  );
}
