const { useState } = React;

// ===== StorePage 组件 =====
function StorePage({ store, cartItems, onAddItem, onGoBack }) {
  const [animItems, setAnimItems] = useState({});
  const [activeTab, setActiveTab] = useState('menu');

  if (!store) {
    return (
      <div className="p-16 text-center" style={{ color: 'var(--text-secondary)', paddingTop: 60 }}>
        <p>未选择餐厅</p>
        <button
          onClick={onGoBack}
          style={{
            marginTop: 16, padding: '8px 20px', background: 'var(--primary)',
            color: '#FFF', border: 'none', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14
          }}
        >
          ← 返回首页
        </button>
      </div>
    );
  }

  // 获取某item的购物车数量
  const getItemQty = (item) => {
    const found = cartItems.find(i => i.id === item.id && i.storeId === store.id);
    return found ? found.qty : 0;
  };

  // 添加动画反馈
  const handleAdd = (item) => {
    const key = item.id;
    setAnimItems(prev => ({ ...prev, [key]: true }));
    onAddItem(item, store);
    setTimeout(() => {
      setAnimItems(prev => ({ ...prev, [key]: false }));
    }, 400);
  };

  const menuItems = store.menu || [];
  const tabs = ['menu', 'review', 'info'];

  return (
    <div className="animate-in">
      {/* 返回按钮 */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onGoBack}
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            width: 32, height: 32, borderRadius: 16,
            background: 'rgba(0,0,0,0.4)', color: '#FFF', border: 'none',
            cursor: 'pointer', fontSize: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
          aria-label="返回"
        >
          ←
        </button>
      </div>

      {/* 餐厅头部 */}
      <div className="store-header">
        <div
          className="store-header-bg"
          style={{
            background: store.color || 'linear-gradient(135deg, #FF5D37, #FF8D58)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64
          }}
        >
          {store.emoji || '🍽️'}
        </div>
        <div className="store-header-info">
          <div className="store-header-name">{store.name}</div>
          <div className="store-header-meta">
            {store.rating && <span>⭐ {store.rating}  </span>}
            {store.category && <span>{store.category}</span>}
            {store.minPrice && <span> · 人均 ¥{store.minPrice}</span>}
            {store.deliveryTime && <span> · {store.deliveryTime}</span>}
          </div>
          {store.tags && store.tags.length > 0 && (
            <div className="store-header-tags">
              {store.tags.map((tag, i) => (
                <span key={i} className="store-header-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 5
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '14px 0', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontFamily: 'inherit', transition: 'all 0.2s'
            }}
          >
            {window.T(`store.${tab}`)}
          </button>
        ))}
      </div>

      {/* Menu 内容 */}
      {activeTab === 'menu' && (
        <div style={{ paddingBottom: 80 }}>
          {menuItems.length === 0 ? (
            <div className="p-16 text-center" style={{ color: 'var(--text-light)', paddingTop: 40 }}>
              <p>暂无菜单</p>
            </div>
          ) : (
            <div>
              {menuItems.map((item, idx) => {
                const qty = getItemQty(item);
                const isAnimating = animItems[item.id];
                return (
                  <div
                    key={item.id || idx}
                    className={`cart-item animate-in`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* 图片占位 */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 8,
                      background: 'linear-gradient(135deg, #FFE8DC, #FFF3EB)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, flexShrink: 0
                    }}>
                      {item.emoji || '🍜'}
                    </div>

                    {/* 信息 */}
                    <div className="cart-item-name">
                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                        {item.name}
                      </div>
                      {item.desc && (
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>
                          {item.desc}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>
                          ¥{item.price}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span style={{ color: 'var(--text-light)', fontSize: 11, textDecoration: 'line-through' }}>
                            ¥{item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 加购按钮 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {qty > 0 && (
                        <span style={{
                          minWidth: 24, textAlign: 'center',
                          fontWeight: 600, fontSize: 14, color: 'var(--primary)'
                        }}>
                          {qty}
                        </span>
                      )}
                      <button
                        onClick={() => handleAdd(item)}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          border: 'none', cursor: 'pointer',
                          background: isAnimating ? 'var(--success)' : 'var(--primary)',
                          color: '#FFF', fontSize: 18, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
                          boxShadow: isAnimating ? '0 0 16px rgba(34, 197, 94, 0.5)' : 'none'
                        }}
                      >
                        {isAnimating ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 评价 Tab */}
      {activeTab === 'review' && (
        <div className="p-16 text-center" style={{ paddingTop: 40, color: 'var(--text-light)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>
            {store.rating || '4.8'} 分
          </p>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            这家店太火了，评价加载中...
          </p>
          <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-light)' }}>
            (反正是假的，别在意这些细节 😄)
          </p>
        </div>
      )}

      {/* 店铺信息 Tab */}
      {activeTab === 'info' && (
        <div className="p-16" style={{ color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              📍 地址
            </h3>
            <p style={{ fontSize: 13 }}>{store.address || '北京市朝阳区建国路88号 SOHO现代城'}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              🕐 营业时间
            </h3>
            <p style={{ fontSize: 13 }}>每日 10:00 - 22:00</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              📞 电话
            </h3>
            <p style={{ fontSize: 13 }}>400-888-{String(store.id || '0000').padStart(4, '0')}</p>
          </div>
          <div style={{
            marginTop: 24, padding: 12, borderRadius: 8,
            background: 'var(--bg)', fontSize: 11, color: 'var(--text-light)',
            textAlign: 'center'
          }}>
            ⚠️ 温馨提示：本店纯属虚构，仅供解压体验，不提供真实外卖服务
          </div>
        </div>
      )}
    </div>
  );
}

window.StorePage = StorePage;
