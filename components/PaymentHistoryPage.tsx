import React, { useEffect, useMemo, useState } from 'react';
import { FiCpu, FiUsers } from 'react-icons/fi';
import { AppState, PaymentHistoryRecord, User } from '../types';
import { getPaymentHistory } from '../services/backendApi';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { useFlash } from './FlashMessage';

interface Props {
  currentUser: User;
  onNavigate: (s: AppState) => void;
  onLogout: () => void;
}

/**
 * Displays a list of all purchases made by the current user. Payment records
 * are retrieved from the backend via GET /api/payments/history. Each record
 * includes the order date, credit type, quantity, amount, currency, and status.
 */
export const PaymentHistoryPage: React.FC<Props> = ({ currentUser, onNavigate, onLogout }) => {
  const { showFlash } = useFlash();
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const formatINR = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const hist = await getPaymentHistory();
        setPayments(hist);
      } catch (err: any) {
        showFlash(err?.message || 'Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showFlash]);

  const navItems = [
    { key: 'sessions', label: 'Sessions', onClick: () => onNavigate(AppState.DASHBOARD) },
    { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
    { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
    { key: 'credits', label: 'Credits', onClick: () => onNavigate(AppState.BUY_AI_CREDITS) },
    { key: 'payments', label: 'Payments', onClick: () => onNavigate(AppState.PAYMENT_HISTORY) },
  ];

  const fmtDate = (iso?: string) => {
    try {
      return iso ? new Date(iso).toLocaleString() : '';
    } catch {
      return iso || '';
    }
  };

  return (
    <AppShell
      title="Payment History"
      subtitle={`User ID: ${currentUser.loginId || ''}${currentUser.email ? ` | ${currentUser.email}` : ''}`}
      activeKey={'payments' as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      /* Adopt the admin gradient header styling */
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="text-white"
      subtitleClassName="text-white/70"
      contentClassName="max-w-[1400px]"
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-green-900">
            <FiCpu className="h-4 w-4" />
            <span className="font-semibold">{currentUser.wallet?.aiInterviewCredits ?? 0}</span>
            <span className="text-xs">AI Credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-blue-900">
            <FiUsers className="h-4 w-4" />
            <span className="font-semibold">{currentUser.wallet?.mentorSessionCredits ?? 0}</span>
            <span className="text-xs">Mentor Credits</span>
          </div>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        <Card>
          <div className="text-base font-semibold">Your Payments</div>
          {loading ? (
            <div className="mt-4 text-sm text-slate-600">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">No payments found.</div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-100 md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Quantity</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Currency</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-200 last:border-0">
                        <td className="px-3 py-2">{fmtDate(p.createdAt)}</td>
                        <td className="px-3 py-2">{p.creditType}</td>
                        <td className="px-3 py-2">{p.quantity}</td>
                        <td className="px-3 py-2">{formatINR.format(p.amount / 100)}</td>
                        <td className="px-3 py-2">{p.currency}</td>
                        <td className="px-3 py-2 capitalize">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm"
                  >
                    <div className="text-xs text-slate-500">{fmtDate(p.createdAt)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      {p.creditType} • {p.quantity} credits
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm text-slate-700">
                      <span>{formatINR.format(p.amount / 100)}</span>
                      <span className="text-xs uppercase text-slate-500">{p.currency}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {p.status}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
};

export default PaymentHistoryPage;
