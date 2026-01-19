import LandingPageInteractive from '../app/landing-page/components/LandingPageInteractive';

export interface LandingPageProps {
  onLogin: () => void;
  onNavigate: (state: any) => void;
}

export default function LandingPage(_props: LandingPageProps) {
  // Navigation is handled via URL (SpaLink + popstate)
  return <LandingPageInteractive />;
}
