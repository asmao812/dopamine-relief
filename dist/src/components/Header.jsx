const { useState, useEffect, useCallback } = React;

const Header = () => {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState(window.__LANG__ || 'zh');

  useEffect(() => {
    const stored = localStorage.getItem('dopamine_dark');
    if (stored === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDark(true);
    }
  }, []);

  const toggleDark = useCallback(() => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('dopamine_dark', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('dopamine_dark', 'false');
    }
  }, [dark]);

  const toggleLang = useCallback(() => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    window.__LANG__ = next;
    localStorage.setItem('dopamine_lang', next);
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: next } }));
  }, [lang]);

  return (
    <header className="app-header row" style={{ justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, letterSpacing: '0.02em', color: 'var(--text)' }}>{window.T('app.title')}</h1>
        <div className="subtitle" style={{ fontStyle: 'italic', fontFamily: "'Playfair Display', serif", color: 'var(--text-light)', fontSize: 12 }}>{window.T('app.subtitle')}</div>
      </div>
      <div className="header-actions">
        <button className="header-btn" onClick={toggleLang} title="Switch language">
          {window.T('lang')}
        </button>
        <button className="header-btn" onClick={toggleDark} title="Toggle dark mode">
          {dark ? '☀️' : '🌙'} {window.T('darkmode')}
        </button>
      </div>
    </header>
  );
};

window.Header = Header;
