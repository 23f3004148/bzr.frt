import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCpu, FiInfo, FiUsers } from 'react-icons/fi';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { useFlash } from './FlashMessage';
import {
  getWallet,
  getCreditPricing,
  createRazorpayOrder,
  createRazorpayBundleOrder,
  verifyRazorpayPayment,
  purchaseCredits,
  fetchPricingBundles,
} from '../services/backendApi';
import { AppState, User, Wallet, PricingBundle } from '../types';

interface Props {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (s: AppState) => void;
}

type CreditKind = 'AI' | 'MENTOR';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

const isOfferActive = (bundle: PricingBundle) => {
  const hasOffer =
    Number(bundle.offerDiscountPercent || 0) > 0 || Number(bundle.offerBonusCredits || 0) > 0;
  if (!hasOffer) return false;
  const now = Date.now();
  const start = bundle.offerStart ? Date.parse(bundle.offerStart) : null;
  const end = bundle.offerEnd ? Date.parse(bundle.offerEnd) : null;
  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;
  return true;
};

const resolveBundleOffer = (bundle: PricingBundle) => {
  const offerActive = isOfferActive(bundle);
  const basePrice = Number(bundle.priceInr || 0);
  const discountPercent = offerActive ? Number(bundle.offerDiscountPercent || 0) : 0;
  const effectivePrice =
    discountPercent > 0
      ? Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)))
      : basePrice;
  const offerBonus = offerActive ? Number(bundle.offerBonusCredits || 0) : 0;
  const totalCredits =
    Number(bundle.credits || 0) + Number(bundle.bonusCredits || 0) + offerBonus;
  const badge = offerActive
    ? bundle.offerBadge || (discountPercent > 0 ? `Save ${discountPercent}%` : `+${offerBonus} credits`)
    : bundle.tag || '';
  return { offerActive, effectivePrice, discountPercent, offerBonus, totalCredits, badge };
};

const clampQty = (val: number) => {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1000, Math.floor(val)));
};

const PurchaseCreditsPage: React.FC<Props> = ({ currentUser, onLogout, onNavigate }) => {
  const { showFlash } = useFlash();
  const [wallet, setWallet] = useState<Wallet>({
    aiInterviewCredits: currentUser.wallet?.aiInterviewCredits ?? 0,
    mentorSessionCredits: currentUser.wallet?.mentorSessionCredits ?? 0,
  });
  const [minPurchase, setMinPurchase] = useState<number>(120);
  const [aiQty, setAiQty] = useState<number>(minPurchase);
  const [mentorQty, setMentorQty] = useState<number>(0);
  const [aiPrice, setAiPrice] = useState<number>(5);
  const [mentorPrice, setMentorPrice] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<'AI' | 'MENTOR' | 'BOTH' | null>(null);
  const [bundles, setBundles] = useState<PricingBundle[]>([]);
  const sortedBundles = useMemo(() => {
    return [...bundles].sort((a, b) => {
      const orderA = Number(a.displayOrder ?? 0);
      const orderB = Number(b.displayOrder ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return Number(a.priceInr || 0) - Number(b.priceInr || 0);
    });
  }, [bundles]);

  const navItems = useMemo(
    () => [
      { key: 'sessions', label: 'Sessions', onClick: () => onNavigate(AppState.DASHBOARD) },
      { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
      { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
      { key: 'credits', label: 'Credits', onClick: () => onNavigate(AppState.BUY_AI_CREDITS) },
      { key: 'payments', label: 'Payments', onClick: () => onNavigate(AppState.PAYMENT_HISTORY) },
    ],
    [onNavigate]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [walletResult, pricingResult, bundlesResult] = await Promise.allSettled([
        getWallet(),
        getCreditPricing(),
        fetchPricingBundles(),
      ]);
      if (walletResult.status === 'fulfilled') {
        setWallet(walletResult.value);
      }
      if (pricingResult.status === 'fulfilled') {
        const { aiCreditPrice, mentorCreditPrice, minCreditPurchase } = pricingResult.value;
        if (Number.isFinite(aiCreditPrice)) setAiPrice(aiCreditPrice);
        if (Number.isFinite(mentorCreditPrice)) setMentorPrice(mentorCreditPrice);
        if (Number.isFinite(minCreditPurchase)) {
          setMinPurchase(minCreditPurchase);
          setAiQty((prev) => (prev && prev > 0 ? Math.max(prev, minCreditPurchase) : minCreditPurchase));
        }
      }
      if (bundlesResult.status === 'fulfilled' && Array.isArray(bundlesResult.value)) {
        setBundles(bundlesResult.value);
      }
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Failed to load wallet or pricing', 'error');
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureRazorpayScript = useCallback(async () => {
    if ((window as any).Razorpay) return true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
    return true;
  }, []);

  const runCheckout = async (creditType: CreditKind, quantity: number) => {
    const label = creditType === 'AI' ? 'AI' : 'Mentor';
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`${label} quantity must be greater than zero`);
    }
    if (quantity < minPurchase) {
      throw new Error(`Minimum purchase is ${minPurchase} ${label} credits`);
    }

    try {
      await ensureRazorpayScript();
      const { order, keyId } = await createRazorpayOrder({ creditType, quantity });
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'Buuzzer',
          description: `${quantity} ${label} credit(s)`,
          prefill: {
            email: currentUser.email || '',
            name: currentUser.name || '',
            contact: '',
          },
          handler: async (resp: any) => {
            try {
              const w = await verifyRazorpayPayment({
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              });
              setWallet(w);
              showFlash(`${label} credits added.`, 'success');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: { color: '#0f172a' },
        });
        rzp.open();
      });
    } catch (err: any) {
      // Fallback to direct purchase for development/testing
      if (/razorpay/i.test(String(err?.message || ''))) {
        const w = await purchaseCredits({
          creditType: creditType === 'AI' ? 'aiInterviewCredits' : 'mentorSessionCredits',
          quantity,
        });
        setWallet(w);
        showFlash(`${label} credits added (fallback).`, 'success');
        return;
      }
      throw err;
    }
  };

  const handleCheckout = async (mode: 'AI' | 'MENTOR' | 'BOTH') => {
    const wantsAi = aiQty > 0;
    const wantsMentor = mentorQty > 0;
    if (!wantsAi && !wantsMentor) {
      showFlash('Add a quantity for AI and/or Mentor credits.', 'warning');
      return;
    }
    if (wantsAi && aiQty < minPurchase) {
      showFlash(`Minimum purchase is ${minPurchase} AI credits.`, 'warning');
      return;
    }
    if (wantsMentor && mentorQty < minPurchase) {
      showFlash(`Minimum purchase is ${minPurchase} Mentor credits.`, 'warning');
      return;
    }
    setPaying(mode);
    try {
      if (mode === 'AI') {
        await runCheckout('AI', aiQty);
      } else if (mode === 'MENTOR') {
        await runCheckout('MENTOR', mentorQty);
      } else {
        if (wantsAi) {
          await runCheckout('AI', aiQty);
        }
        if (wantsMentor) {
          await runCheckout('MENTOR', mentorQty);
        }
      }
      onNavigate(AppState.DASHBOARD);
    } catch (err: any) {
      const message = err?.message === 'Payment cancelled' ? 'Payment cancelled.' : err?.message || 'Checkout failed';
      showFlash(message, err?.message === 'Payment cancelled' ? 'warning' : 'error');
    } finally {
      setPaying(null);
    }
  };

  const aiTotal = aiQty * aiPrice;
  const mentorTotal = mentorQty * mentorPrice;
  const grandTotal = aiTotal + mentorTotal;

  const isBusy = Boolean(paying);

  const handleBundlePurchase = async (bundle: PricingBundle) => {
    const bundleId = String(bundle.id || bundle._id || '');
    if (!bundleId) {
      showFlash('Bundle is missing an ID', 'error');
      return;
    }
    const { totalCredits } = resolveBundleOffer(bundle);
    if (totalCredits <= 0) {
      showFlash('Bundle has no credits configured', 'warning');
      return;
    }
    if (totalCredits < minPurchase) {
      showFlash(`Bundles must include at least ${minPurchase} credits.`, 'warning');
      return;
    }
    setPaying('AI');
    try {
      await ensureRazorpayScript();
      const { order, keyId, credits } = await createRazorpayBundleOrder({ bundleId });
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'Buuzzer',
          description: `${credits || totalCredits} credits (${bundle.name})`,
          prefill: {
            email: currentUser.email || '',
            name: currentUser.name || '',
            contact: '',
          },
          handler: async (resp: any) => {
            try {
              const w = await verifyRazorpayPayment({
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              });
              setWallet(w);
              showFlash('Credits added.', 'success');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          theme: { color: '#0f172a' },
        });
        rzp.open();
      });
      onNavigate(AppState.DASHBOARD);
    } catch (err: any) {
      if (/razorpay/i.test(String(err?.message || ''))) {
        try {
          const w = await purchaseCredits({
            creditType: 'aiInterviewCredits',
            quantity: totalCredits,
          });
          setWallet(w);
          showFlash('Credits added (fallback).', 'success');
          onNavigate(AppState.DASHBOARD);
        } catch (fallbackErr: any) {
          const message = fallbackErr?.message || 'Checkout failed';
          showFlash(message, 'error');
        }
      } else {
        const message = err?.message === 'Payment cancelled' ? 'Payment cancelled.' : err?.message || 'Checkout failed';
        showFlash(message, err?.message === 'Payment cancelled' ? 'warning' : 'error');
      }
    } finally {
      setPaying(null);
    }
  };

  return (
    <AppShell
      title="Buy Credits"
      subtitle={`User ID: ${currentUser.loginId || ''}${currentUser.email ? ` | ${currentUser.email}` : ''}`}
      activeKey={'credits' as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="text-white"
      subtitleClassName="text-white/70"
      contentClassName="max-w-[1400px]"
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-green-900">
            <FiCpu className="h-4 w-4" />
            <span className="font-semibold">{wallet.aiInterviewCredits}</span>
            <span className="text-xs">AI Credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-blue-900">
            <FiUsers className="h-4 w-4" />
            <span className="font-semibold">{wallet.mentorSessionCredits}</span>
            <span className="text-xs">Mentor Credits</span>
          </div>
        </div>
      }
    >
      {bundles.length > 0 && (
        <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bundles</h2>
              <p className="text-sm text-slate-500">Quick-pick packages that mirror landing page pricing.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sortedBundles.map((bundle) => {
              const offer = resolveBundleOffer(bundle);
              const metaBits = [offer.badge, bundle.popular ? 'Popular' : '']
                .filter(Boolean)
                .join(' | ');
              return (
                <Card key={bundle._id || bundle.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{bundle.name}</h3>
                      <p className="text-xs text-slate-500">{metaBits}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">{formatINR(offer.effectivePrice)}</div>
                      {offer.discountPercent > 0 ? (
                        <div className="text-xs text-slate-400 line-through">{formatINR(Number(bundle.priceInr || 0))}</div>
                      ) : null}
                      <div className="text-xs text-slate-500">{offer.totalCredits} credits</div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li>{bundle.credits} base credits</li>
                    {bundle.bonusCredits ? <li>+{bundle.bonusCredits} bonus credits</li> : null}
                    {offer.offerBonus > 0 ? <li>+{offer.offerBonus} offer credits</li> : null}
                    {(bundle.features || []).map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant="primary"
                    disabled={isBusy}
                    onClick={() => handleBundlePurchase(bundle)}
                  >
                    {isBusy ? 'Processing...' : 'Buy Bundle'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Your wallet</div>
              <div className="text-xs text-slate-500">Live balance updates after each purchase.</div>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase text-slate-500">AI credits</div>
              <div className="text-xl font-semibold text-slate-900">{wallet.aiInterviewCredits}</div>
              <div className="text-xs text-slate-500">Used for AI interview sessions.</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase text-slate-500">Mentor credits</div>
              <div className="text-xl font-semibold text-slate-900">{wallet.mentorSessionCredits}</div>
              <div className="text-xs text-slate-500">Used for mentor-led sessions.</div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <FiInfo className="mt-0.5 h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-700">
              Buy both in one place. If you enter quantities for both, you&apos;ll complete two quick checkouts
              (one per credit type) and see balances update instantly.
            </p>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="text-base font-semibold">Choose quantities</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">AI credits</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={aiQty}
                onChange={(e) => setAiQty(clampQty(Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <div className="text-[11px] text-slate-500">Minimum purchase: {minPurchase} credits</div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Price per</span>
                <span className="font-semibold">{formatINR(aiPrice)}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold">{formatINR(aiTotal)}</span>
              </div>
              <Button
                onClick={() => handleCheckout('AI')}
                disabled={isBusy || aiQty <= 0}
                fullWidth
              >
                {paying === 'AI' ? 'Processing...' : 'Checkout AI'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Mentor credits</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={mentorQty}
                onChange={(e) => setMentorQty(clampQty(Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <div className="text-[11px] text-slate-500">Minimum purchase: {minPurchase} credits</div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Price per</span>
                <span className="font-semibold">{formatINR(mentorPrice)}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold">{formatINR(mentorTotal)}</span>
              </div>
              <Button
                onClick={() => handleCheckout('MENTOR')}
                disabled={isBusy || mentorQty <= 0}
                fullWidth
              >
                {paying === 'MENTOR' ? 'Processing...' : 'Checkout Mentor'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>AI total</span>
              <span className="font-semibold">{formatINR(aiTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Mentor total</span>
              <span className="font-semibold">{formatINR(mentorTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Grand total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
            <Button
              className="mt-3"
              onClick={() => handleCheckout('BOTH')}
              disabled={isBusy || (aiQty <= 0 && mentorQty <= 0)}
              fullWidth
            >
              {paying === 'BOTH' ? 'Processing...' : 'Checkout selected'}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default PurchaseCreditsPage;

