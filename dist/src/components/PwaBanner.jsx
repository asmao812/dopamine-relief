const { useState, useEffect, useCallback } = React;

const PwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissedTime = localStorage.getItem('dopamine_pwa_dismissed');
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      // Show again after 7 days
      if (elapsed < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for appinstalled to hide banner
    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setVisible(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('PWA install prompt failed:', err);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('dopamine_pwa_dismissed', String(Date.now()));
    // Will show again after 7 days
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="pwa-banner">
      <span style={{ fontSize: '28px', flexShrink: 0 }}>📲</span>
      <div className="pwa-banner-text">
        {window.T('install.text')}
      </div>
      <button className="pwa-banner-btn" onClick={handleInstall}>
        {window.T('install.install')}
      </button>
      <button className="pwa-banner-close" onClick={handleDismiss} aria-label="Close">
        ✕
      </button>
    </div>
  );
};

window.PwaBanner = PwaBanner;
