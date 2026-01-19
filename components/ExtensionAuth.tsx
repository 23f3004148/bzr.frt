import React, { useEffect } from 'react';

const ExtensionAuth: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    const token =
      sessionStorage.getItem('buuzzer_token') || localStorage.getItem('buuzzer_token');

    if (redirectUri && token) {
      const url = `${redirectUri}#token=${encodeURIComponent(token)}`;
      window.location.assign(url);
      return;
    }

    const next = redirectUri ? `/login?redirect_uri=${encodeURIComponent(redirectUri)}` : '/login';
    window.location.replace(next);
  }, []);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div style={{ fontFamily: 'system-ui, sans-serif', color: '#475569', fontSize: '14px' }}>
        Redirecting...
      </div>
    </div>
  );
};

export default ExtensionAuth;
