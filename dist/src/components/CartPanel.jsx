const { useEffect, useRef } = React;

const CartPanel = ({ cartItems = [], onUpdateQty, onRemove, onCheckout, onClose, visible }) => {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  if (!visible) return null;

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 94,
          animation: 'fadeInUp 0.3s ease-out'
        }}
      />

      {/* Cart Panel */}
      <div ref={panelRef} className="cart-panel" style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="cart-panel-header">
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
            {window.T('cart.title')} ({cartItems.reduce((s, i) => s + (i.qty || 0), 0)})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        {cartItems.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
            {window.T('cart.empty')}
          </div>
        ) : (
          <div>
            {cartItems.map((item, idx) => (
              <div key={item.id || idx} className="cart-item">
                <div className="cart-item-name">
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div className="cart-item-price">¥{item.price}</div>
                </div>
                <div className="cart-item-qty">
                  <button
                    className="qty-btn"
                    onClick={() => onUpdateQty && onUpdateQty(item.id, (item.qty || 1) - 1)}
                    style={{ color: 'var(--text)' }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>
                    {item.qty || 1}
                  </span>
                  <button
                    className="qty-btn"
                    onClick={() => onUpdateQty && onUpdateQty(item.id, (item.qty || 1) + 1)}
                    style={{ color: 'var(--text)' }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove && onRemove(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-light)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                      marginLeft: '4px'
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              {window.T('cart.total')}: <span className="price">¥{total.toFixed(2)}</span>
            </div>
            <button className="btn-checkout" onClick={onCheckout}>
              {window.T('cart.checkout')}
            </button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

window.CartPanel = CartPanel;
