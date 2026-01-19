import React, { useState, useEffect } from 'react';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { useFlash } from './FlashMessage';
import { getAdminPaymentHistory } from '../services/backendApi';
import { PaymentHistoryRecord, User, AppState } from '../types';

interface Props {
  currentUser: User;
  onNavigate: (s: AppState) => void;
  onLogout: () => void;
}

/**
 * Admin-only payment history page. Fetches all payment intents and displays them
 * in a table, including user info for each payment. Only accessible when
 * currentUser.role === 'admin'.
 */
export const AdminPaymentHistoryPage: React.FC<Props> = ({ currentUser, onNavigate, onLogout }) => {
  const { showFlash } = useFlash();
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const hist = await getAdminPaymentHistory();
        setPayments(hist);
      } catch (err: any) {
        showFlash(err?.message || 'Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showFlash]);

  const fmtDate = (iso?: string) => {
    try {
      return iso ? new Date(iso).toLocaleString() : '';
    } catch {
      return iso || '';
    }
  };

  // Define nav items for admin payment page. Since admin pages use a different
  // navigation scheme, we simply provide a back action to return to the admin dashboard.
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', onClick: () => onNavigate(AppState.ADMIN_DASHBOARD) },
  ];

  return (
    <AppShell
      title="Payments (Admin)"
      subtitle="All wallet top-ups"
      activeKey={( 'dashboard' as unknown ) as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
    >
      <div className="max-w-6xl space-y-6">
        <Card>
          <div className="text-base font-semibold">All Payments</div>
          {loading ? (
            <div className="mt-4 text-sm text-slate-600">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">No payments found.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Currency</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="px-3 py-2">{fmtDate(p.createdAt)}</td>
                      <td className="px-3 py-2">
                        {p.user
                          ? `${p.user.name || p.user.loginId || p.user.email || p.user.id}`
                          : p.userId}
                      </td>
                      <td className="px-3 py-2">{p.creditType}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                      <td className="px-3 py-2">₹{(p.amount / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">{p.currency}</td>
                      <td className="px-3 py-2 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};

export default AdminPaymentHistoryPage;