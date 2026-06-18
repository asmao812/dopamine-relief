const { useState, useMemo } = React;

// ===== FoodHome 组件 =====
function FoodHome({ restaurants = [], stats, onSelectStore, cartItemCount, onCartClick }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 提取所有分类
  const categories = useMemo(() => {
    const cats = new Set();
    restaurants.forEach(r => {
      if (r.category) cats.add(r.category);
    });
    return ['all', ...cats];
  }, [restaurants]);

  // 过滤餐厅
  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      const matchCat = activeCategory === 'all' || r.category === activeCategory;
      const matchSearch = !search || (
        r.name && r.name.toLowerCase().includes(search.toLowerCase())
      );
      return matchCat && matchSearch;
    });
  }, [restaurants, activeCategory, search]);

  // 格式化金额
  const fmtMoney = (n) => {
    if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return '¥' + (n / 1000).toFixed(1) + 'k';
    return '¥' + n;
  };

  return (
    <div>
      {/* 搜索栏 */}
      <div className="px-16" style={{ paddingTop: 12, paddingBottom: 4 }}>
        <div style={{
          display: 'flex', alignItems: 'center', background: 'var(--bg)',
          borderRadius: 24, padding: '10px 16px', gap: 8
        }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            type="text"
            placeholder={window.T('home.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: 'var(--text)', fontFamily: 'inherit'
            }}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{ cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>
              ✕
            </span>
          )}
        </div>
      </div>

      {/* 分类 Tabs */}
      <div className="cat-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? '🔥 ' + window.T('home.recommend') : cat}
          </button>
        ))}
      </div>

      {/* Stats 栏 */}
      <div className="stats-bar animate-in">
        <div className="stat-item">
          <div className="stat-value">{fmtMoney(stats.saved)}</div>
          <div className="stat-label">{window.T('stats.saved')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.orders}</div>
          <div className="stat-label">{window.T('stats.orders')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.streak}🔥</div>
          <div className="stat-label">{window.T('stats.streak')}</div>
        </div>
      </div>

      {/* 餐厅列表 */}
      <div>
        <div className="px-16" style={{ paddingTop: 16, paddingBottom: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>
            {search ? `🔍 "${search}"` : window.T('home.nearby')}
            <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 400, marginLeft: 8 }}>
              ({filtered.length})
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center" style={{ color: 'var(--text-light)', paddingTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍜</div>
            <p>{search ? '没有找到匹配的餐厅' : '暂无餐厅数据'}</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>试试换个关键词搜索</p>
          </div>
        ) : (
          <div>
            {filtered.map((restaurant, idx) => (
              <div
                key={restaurant.id || idx}
                className="store-card animate-in"
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => onSelectStore(restaurant)}
              >
                <div
                  className="store-card-img"
                  style={{
                    background: restaurant.color || 'linear-gradient(135deg, #FDF4E0, #FEFCF5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28
                  }}
                >
                  {restaurant.emoji || '🍽️'}
                </div>
                <div className="store-card-info">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="store-card-name">{restaurant.name}</div>
                    {restaurant.rating && (
                      <span className="store-card-stars">⭐ {restaurant.rating}</span>
                    )}
                  </div>
                  <div className="store-card-type">
                    {restaurant.category || '美食'}
                    {restaurant.minPrice && (
                      <span style={{ marginLeft: 8 }}>· 人均 ¥{restaurant.minPrice}</span>
                    )}
                    {restaurant.deliveryTime && (
                      <span style={{ marginLeft: 8 }}>· {restaurant.deliveryTime}</span>
                    )}
                  </div>
                  {restaurant.tags && restaurant.tags.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {restaurant.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="store-card-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {restaurant.desc && (
                    <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                      {restaurant.desc}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.FoodHome = FoodHome;
