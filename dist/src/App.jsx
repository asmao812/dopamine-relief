const { useState, useEffect, useCallback, useMemo } = React;

// ===== localStorage helpers (与 StatsBar 兼容) =====
function loadStats() {
  return {
    saved: parseFloat(localStorage.getItem('dopamine_saved') || '0'),
    orders: parseInt(localStorage.getItem('dopamine_orders') || '0', 10),
    streak: parseInt(localStorage.getItem('dopamine_streak') || '0', 10),
    lastDate: localStorage.getItem('dopamine_lastdate') || ''
  };
}

function saveStats(stats) {
  localStorage.setItem('dopamine_saved', String(stats.saved));
  localStorage.setItem('dopamine_orders', String(stats.orders));
  localStorage.setItem('dopamine_streak', String(stats.streak));
  localStorage.setItem('dopamine_lastdate', stats.lastDate || '');
  // 通知 StatsBar 更新
  window.dispatchEvent(new CustomEvent('statsupdate'));
}

function updateStreak(stats) {
  const today = new Date().toISOString().slice(0, 10);
  if (stats.lastDate === today) return stats;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = stats.lastDate === yesterday ? stats.streak + 1 : 1;
  return { ...stats, streak: newStreak, lastDate: today };
}

function loadLang() {
  return localStorage.getItem('dopamine_lang') || 'zh';
}

// ===== App 主组件 =====
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedStore, setSelectedStore] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(loadStats());
  const [toast, setToast] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // 监听 Header 触发的语言变更事件
  useEffect(() => {
    const handler = (e) => {
      // Header 已经更新了 window.__LANG__ 和 localStorage
      // 这里只需要强制重新渲染
      forceUpdate();
    };
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  // 用于强制刷新的计数器
  const [renderKey, setRenderKey] = useState(0);
  const forceUpdate = useCallback(() => setRenderKey(k => k + 1), []);

  // 初始化语言
  useEffect(() => {
    window.__LANG__ = loadLang();
  }, []);

  // 加载餐厅数据
  useEffect(() => {
    fetch('/data/restaurants.json')
      .then(res => res.json())
      .then(data => setRestaurants(data))
      .catch(() => {
        console.warn('[App] 无法加载 /data/restaurants.json，使用空数据');
        setRestaurants([]);
      });
  }, []);

  // Toast 提示
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  // 购物车操作
  const addItem = useCallback((item, store) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.storeId === store.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id && i.storeId === store.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, {
        id: item.id,
        storeId: store.id,
        storeName: store.name,
        name: item.name,
        price: item.price,
        qty: 1
      }];
    });
    showToast(window.T('toast.added'));
  }, [showToast]);

  // CartPanel 用 itemId 来移除，需要找到对应 item
  const handleRemove = useCallback((itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
    showToast(window.T('toast.removed'));
  }, [showToast]);

  // CartPanel 用 (itemId, newQty) 来更新
  const handleUpdateQty = useCallback((itemId, newQty) => {
    setCartItems(prev => {
      if (newQty <= 0) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i => i.id === itemId ? { ...i, qty: newQty } : i);
    });
  }, []);

  // 合计金额
  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [cartItems]);

  // 导航
  const navigateTo = useCallback((page, store) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
    setCartOpen(false);
    if (store) setSelectedStore(store);
    if (page === 'home') setSelectedStore(null);
  }, []);

  // 下单 (假支付)
  const placeOrder = useCallback(() => {
    const savedAmount = cartTotal;
    setCurrentPage('paying');
    setTimeout(() => {
      setStats(prev => {
        const updated = updateStreak(prev);
        const newStats = {
          saved: updated.saved + savedAmount,
          orders: updated.orders + 1,
          streak: updated.streak,
          lastDate: updated.lastDate
        };
        saveStats(newStats);
        return newStats;
      });
      setCartItems([]);
      setCurrentPage('success');
    }, 1500);
  }, [cartTotal]);

  // 成功页返回
  const handleGoHome = useCallback(() => {
    navigateTo('home');
  }, [navigateTo]);

  // ===== 渲染 =====
  const renderPage = () => {
    switch (currentPage) {
      case 'paying':
        return (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '70vh', gap: 20
          }}>
            <div style={{
              width: 48, height: 48, border: '4px solid var(--border)',
              borderTopColor: 'var(--primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {window.T('order.submit')}...
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              (假的支付，放心~)
            </p>
          </div>
        );

      case 'store':
        return window.StorePage ? (
          <window.StorePage
            store={selectedStore}
            cartItems={cartItems}
            onAddItem={addItem}
            onGoBack={() => navigateTo('home')}
            key={selectedStore?.id || 'store'}
          />
        ) : (
          <Fallback msg="StorePage 组件未加载" />
        );

      case 'checkout':
        return window.CheckoutScene ? (
          <window.CheckoutScene
            cartItems={cartItems}
            cartTotal={cartTotal}
            onPlaceOrder={placeOrder}
            onCancel={() => navigateTo('home')}
          />
        ) : (
          <Fallback msg="CheckoutScene 组件未加载" />
        );

      case 'success':
        return window.OrderSuccess ? (
          <window.OrderSuccess
            savedAmount={cartTotal || stats.saved}
            stats={stats}
            onGoHome={handleGoHome}
            key={renderKey}
          />
        ) : (
          <Fallback msg="OrderSuccess 组件未加载" />
        );

      case 'home':
      default:
        return window.FoodHome ? (
          <window.FoodHome
            restaurants={restaurants}
            stats={stats}
            onSelectStore={(store) => navigateTo('store', store)}
            key={renderKey}
          />
        ) : (
          <Fallback msg="FoodHome 组件未加载" />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header — 自管理 dark/language 状态，派发 langchange 事件 */}
      {window.Header ? (
        <window.Header key={renderKey} />
      ) : (
        <header className="app-header row" style={{ justifyContent: 'space-between' }}>
          <div style={{ cursor: 'pointer' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22 }}>{window.T('app.title')}</h1>
            <div className="subtitle" style={{ fontStyle: 'italic', fontFamily: "'Playfair Display', serif", color: 'var(--text-light)', fontSize: 12 }}>{window.T('app.subtitle')}</div>
          </div>
        </header>
      )}

      {/* 主内容 */}
      <main style={{ flex: 1, paddingBottom: cartItems.length > 0 && !cartOpen ? 80 : 16 }}>
        {renderPage()}
      </main>

      {/* Toast */}
      {toast && <div className="toast" key={toast}>{toast}</div>}

      {/* Cart FAB */}
      {cartItems.length > 0 && currentPage !== 'checkout' && currentPage !== 'success' && currentPage !== 'paying' && (
        <button
          className="cart-fab"
          onClick={() => setCartOpen(prev => !prev)}
          style={{ animation: cartOpen ? 'none' : 'pulse 2s infinite' }}
        >
          🛒
          <span className="cart-badge">
            {cartItems.reduce((s, i) => s + i.qty, 0)}
          </span>
        </button>
      )}

      {/* Cart Panel — 由 visible prop 控制显隐 */}
      {window.CartPanel && (
        <window.CartPanel
          cartItems={cartItems}
          visible={cartOpen}
          onUpdateQty={handleUpdateQty}
          onRemove={handleRemove}
          onCheckout={() => { setCartOpen(false); navigateTo('checkout'); }}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* PWA 安装横幅 — 自管理状态，无需 props */}
      {window.PwaBanner && <window.PwaBanner />}
    </div>
  );
}

// ===== Fallback 组件 =====
function Fallback({ msg }) {
  return (
    <div className="p-16 text-center" style={{ color: 'var(--text-secondary)', paddingTop: 60 }}>
      <p>{msg}</p>
    </div>
  );
}

// ===== 挂载到 window 并渲染 =====
window.App = App;

// DOM 就绪后渲染
document.addEventListener('DOMContentLoaded', () => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<App />);
  }
});

// 如果脚本在 DOMContentLoaded 之后执行，直接渲染
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<App />);
  }
}
