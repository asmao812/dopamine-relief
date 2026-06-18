const { useState, useEffect } = React;

const StatsBar = () => {
  const [stats, setStats] = useState({
    saved: 0,
    orders: 0,
    streak: 0
  });

  useEffect(() => {
    const loadStats = () => {
      setStats({
        saved: parseFloat(localStorage.getItem('dopamine_saved') || '0'),
        orders: parseInt(localStorage.getItem('dopamine_orders') || '0', 10),
        streak: parseInt(localStorage.getItem('dopamine_streak') || '0', 10)
      });
    };

    loadStats();

    // Listen for storage changes from other tabs
    const handleStorage = (e) => {
      if (e.key && e.key.startsWith('dopamine_')) {
        loadStats();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Listen for custom update event from same tab
    const handleUpdate = () => loadStats();
    window.addEventListener('statsupdate', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('statsupdate', handleUpdate);
    };
  }, []);

  const formatMoney = (amount) => {
    if (amount >= 10000) {
      return '¥' + (amount / 10000).toFixed(1) + '万';
    }
    return '¥' + amount.toFixed(0);
  };

  return (
    <div className="stats-bar animate-in">
      <div className="stat-item">
        <div className="stat-value">{formatMoney(stats.saved)}</div>
        <div className="stat-label">{window.T('stats.saved')}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.orders}</div>
        <div className="stat-label">{window.T('stats.orders')}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">
          {stats.streak}
          <span style={{ fontSize: '14px', marginLeft: '2px' }}>🔥</span>
        </div>
        <div className="stat-label">{window.T('stats.streak')}</div>
      </div>
    </div>
  );
};

window.StatsBar = StatsBar;
