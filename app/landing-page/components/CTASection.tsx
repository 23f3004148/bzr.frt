'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import SpaLink, { spaNavigate } from '../../../components/common/SpaLink';
import { fetchSiteInfo } from '@/services/backendApi';
import { SiteInfo } from '@/types';

const CTASection = () => {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    fetchSiteInfo().then(setSiteInfo).catch(() => setSiteInfo(null));
  }, []);

  const extensionUrl =
    siteInfo?.chromeExtensionUrl ||
    'https://chrome.google.com/webstore/detail';

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-headline text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
          Be Prepared — Even in Real Interviews
        </h2>

        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join professionals who are using Interview Copilot to perform at their best when it matters most.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <SpaLink
            href="/signup"
            className="px-8 py-4 bg-accent text-accent-foreground rounded-lg text-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2">
            Start Free Trial
            <Icon name="ArrowRightIcon" size={20} />
          </SpaLink>
          <a
            href={extensionUrl}
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary-foreground/20 transition-all duration-250 flex items-center justify-center gap-2 border border-primary-foreground/20"
          >
            <Icon name="PuzzlePieceIcon" size={20} />
            Install Chrome Extension
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
            <Icon name="ShieldCheckIcon" size={20} variant="solid" />
            <span className="text-sm font-medium">Privacy-first design</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
            <Icon name="LockClosedIcon" size={20} variant="solid" />
            <span className="text-sm font-medium">No data storage</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
            <Icon name="HandRaisedIcon" size={20} />
            <span className="text-sm font-medium">Full user control</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
