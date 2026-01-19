import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { fetchPricingBundles, fetchSiteInfo } from '@/services/backendApi';
import { PricingBundle, SiteInfo } from '@/types';
import { spaNavigate } from '../../../components/common/SpaLink';

const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const offerWindowActive = (bundle: PricingBundle) => {
  const hasOffer = Number(bundle.offerDiscountPercent || 0) > 0 || Number(bundle.offerBonusCredits || 0) > 0;
  if (!hasOffer) return false;
  const now = Date.now();
  const start = bundle.offerStart ? Date.parse(bundle.offerStart) : null;
  const end = bundle.offerEnd ? Date.parse(bundle.offerEnd) : null;
  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;
  return true;
};

const offerBadgeText = (bundle: PricingBundle) => {
  if (bundle.offerBadge) return bundle.offerBadge;
  const pct = Number(bundle.offerDiscountPercent || 0);
  if (pct > 0) return `Save ${pct}%`;
  const bonus = Number(bundle.offerBonusCredits || 0);
  if (bonus > 0) return `+${bonus} credits`;
  return '';
};

const PricingSection = () => {
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      try {
        const token = sessionStorage.getItem('buuzzer_token') || localStorage.getItem('buuzzer_token');
        setIsLoggedIn(Boolean(token));
      } catch (_e) {
        setIsLoggedIn(false);
      }
    };
    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  useEffect(() => {
    fetchSiteInfo().then(setSiteInfo).catch(() => setSiteInfo(null));

    fetchPricingBundles()
      .then((bundles: PricingBundle[]) => {
        if (Array.isArray(bundles) && bundles.length) {
          const mapped = bundles.map((b, idx) => {
            const offerActive = offerWindowActive(b);
            const basePrice = Number(b.priceInr || 0);
            const discountPercent = offerActive ? Number(b.offerDiscountPercent || 0) : 0;
            const effectivePrice =
              discountPercent > 0
                ? Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)))
                : basePrice;
            const offerBonus = offerActive ? Number(b.offerBonusCredits || 0) : 0;
            const totalCredits =
              Number(b.credits || 0) + Number(b.bonusCredits || 0) + offerBonus;
            return {
              id: b._id || b.id || `bundle-${idx}`,
              name: b.name,
              credits: `${totalCredits} credits`,
              price: formatInr(effectivePrice),
              originalPrice: discountPercent > 0 ? formatInr(basePrice) : '',
              description: b.description || '',
              features: [
                `${b.credits} base credits`,
                b.bonusCredits ? `+${b.bonusCredits} bonus credits` : null,
                offerBonus ? `+${offerBonus} offer credits` : null,
                ...(b.features || []),
              ].filter(Boolean),
              cta: 'Buy',
              popular: Boolean(b.popular),
              tag: offerActive ? offerBadgeText(b) : (b.tag || ''),
              displayOrder: b.displayOrder ?? 0,
              showOnLanding: b.showOnLanding !== false,
            };
          });
          setPricingTiers(mapped);
        } else {
          throw new Error('No bundles');
        }
      })
      .catch(() => {
        setPricingTiers([]);
      });
  }, []);

  const freeTrialCredits =
    (siteInfo?.freeTrialAiCredits || 0) + (siteInfo?.freeTrialMentorCredits || 0) || 25;

  const paidTiers = useMemo(
    () =>
      pricingTiers
        .filter((tier) => tier.showOnLanding !== false)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [pricingTiers]
  );

  const tiersToRender = [
    {
      id: 'free-trial',
      name: 'Free Trial',
      credits: `${freeTrialCredits} credits`,
      price: formatInr(0),
      description: 'Perfect for testing the platform',
      features: [
        `${freeTrialCredits} credits to start`,
        'Basic AI assistance',
        'Chrome Extension access',
        'Single device mode',
        'Email support',
      ],
      cta: 'Start Free Trial',
      popular: false,
      tag: '',
    },
    ...(paidTiers.length
      ? paidTiers.slice(0, 2)
      : [
          {
            id: 'professional',
            name: 'Professional Pack',
            credits: '180 credits',
            price: formatInr(1299),
            description: 'Most popular choice for serious job seekers',
            features: [
              '180 minutes of interview time',
              '3 hours of practice time',
              'Advanced analytics',
              'Priority email support',
              '10% savings vs starter',
              'All features included',
            ],
            cta: 'Buy Professional Pack',
            popular: true,
            tag: 'Most Popular',
          },
          {
            id: 'premium',
            name: 'Premium Pack',
            credits: '360 credits',
            price: formatInr(2399),
            description: 'Best value for comprehensive interview preparation',
            features: [
              '360 minutes of interview time',
              '6 hours of practice time',
              'Premium analytics dashboard',
              '24/7 chat support',
              '20% savings vs starter',
              'Career coaching session',
              'Priority AI processing',
            ],
            cta: 'Buy Premium Pack',
            popular: false,
            tag: '',
          },
        ]),
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-6">
            <Icon name="CurrencyDollarIcon" size={20} className="text-accent" />
            <span className="text-sm font-medium text-accent">Simple & Honest Pricing</span>
          </div>
          <h2 className="font-headline text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Credits Based Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pay only for what you use. No inflated promises, no fake ROI claims. Just honest, transparent pricing.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {tiersToRender.map((tier) => (
            <div
              key={tier.id}
              className={`bg-card rounded-2xl shadow-xl border overflow-hidden transition-all duration-250 hover:shadow-2xl ${
                tier.popular ? 'border-accent ring-2 ring-accent/20 scale-105' : 'border-border'
              }`}
            >
              {tier.tag ? (
                <div className="bg-accent text-accent-foreground text-center py-2 font-semibold text-sm">
                  {tier.tag}
                </div>
              ) : null}

              <div className="p-8">
                <h3 className="font-headline text-2xl font-semibold text-foreground mb-2">
                  {tier.name}
                </h3>
                <div className="text-sm text-accent font-medium mb-4">{tier.credits}</div>
                <p className="text-muted-foreground mb-6">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                    {tier.originalPrice ? (
                      <span className="text-sm text-muted-foreground line-through">{tier.originalPrice}</span>
                    ) : null}
                  </div>
                </div>

                {tier.id === 'free-trial' ? (
                  <button
                    type="button"
                    className="w-full py-4 rounded-lg font-semibold transition-all duration-250 mb-8 bg-[#ff6b4a] text-white hover:bg-[#ff5a2a] shadow-cta"
                    onClick={() => spaNavigate(isLoggedIn ? '/credits' : '/login?trial=1')}
                  >
                    {tier.cta}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center py-4 rounded-lg font-semibold transition-all duration-250 mb-8 bg-[#e4e8f0] text-foreground hover:bg-[#d8deec]"
                    onClick={() => spaNavigate(isLoggedIn ? '/credits' : '/login')}
                  >
                    {tier.cta}
                  </button>
                )}

                <div className="space-y-3">
                  {tier.features?.map((feature: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" variant="solid" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
