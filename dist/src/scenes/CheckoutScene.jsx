const { useState } = React;

// ===== CheckoutScene 组件 =====
function CheckoutScene({ cartItems = [], cartTotal, onPlaceOrder, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('wechat');
  const [loading, setLoading] = useState(false);

  // 假地址列表
  const addresses = [
    { id: 0, tag: '🏠 家', detail: window.T('order.fake_address'), name: '张三', phone: '138****8888' },
    { id: 1, tag: '🏢 公司', detail: '北京市海淀区中关村大街1号 理想国际大厦', name: '张三', phone: '138****8888' },
    { id: 2, tag: '🏫 学校', detail: '北京市海淀区学院路15号', name: '张三', phone: '138****8888' },
  ];

  // 支付方式
  const payMethods = [
    { id: 'wechat', icon: '💚', name: window.T('order.wechat') },
    { id: 'alipay', icon: '💙', name: window.T('order.alipay') },
    { id: 'card', icon: '💳', name: window.T('order.card') },
  ];

  const handleSubmit = () => {
    setLoading(true);
    onPlaceOrder();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '70vh', gap: 16
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          border: '4px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.7s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          🔒 安全支付中...
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-light)' }}>
          (假的啦，一分钱都不会扣)
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      paddingBottom: 80
    }}>
      {/* 步骤指示器 */}
      <div className="checkout-stepper">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`step-dot${s === step ? ' active' : ''}${s < step ? ' done' : ''}`}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          步骤 {step}/3
        </span>
      </div>

      {/* 步骤内容 */}
      <div className="checkout-content">
        {/* Step 1: 选择地址 */}
        {step === 1 && (
          <div className="animate-in">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              📍 {window.T('order.address')}
            </h3>
            {addresses.map((addr, i) => (
              <div
                key={addr.id}
                className="checkout-address"
                onClick={() => setSelectedAddress(i)}
                style={{
                  cursor: 'pointer',
                  border: selectedAddress === i ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
                  border: selectedAddress === i ? '6px solid var(--primary)' : '2px solid var(--border)',
                  flexShrink: 0, transition: 'all 0.2s'
                }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {addr.tag}
                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {addr.name} {addr.phone}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{addr.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: 支付方式 */}
        {step === 2 && (
          <div className="animate-in">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              💰 {window.T('order.pay_method')}
            </h3>
            <div className="checkout-pay-method">
              {payMethods.map(method => (
                <div
                  key={method.id}
                  className={`pay-option${selectedPayment === method.id ? ' selected' : ''}`}
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{method.icon}</div>
                  <div style={{ fontWeight: 500 }}>{method.name}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 24, padding: 12, borderRadius: 8,
              background: 'var(--bg)', fontSize: 11, color: 'var(--text-light)',
              textAlign: 'center'
            }}>
              🔒 支付由{window.T('app.title')}安全托管 · 所有支付均为模拟
            </div>
          </div>
        )}

        {/* Step 3: 确认订单 */}
        {step === 3 && (
          <div className="animate-in">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              ✅ {window.T('order.confirm')}
            </h3>

            {/* 地址 */}
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>
                {window.T('order.address')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {addresses[selectedAddress].tag} · {addresses[selectedAddress].detail}
              </div>
            </div>

            {/* 支付 */}
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>
                {window.T('order.pay_method')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {payMethods.find(m => m.id === selectedPayment)?.icon}{' '}
                {payMethods.find(m => m.id === selectedPayment)?.name}
              </div>
            </div>

            {/* 商品列表 */}
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 8 }}>
                📋 订单明细
              </div>
              {cartItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', fontSize: 13
                }}>
                  <span style={{ flex: 1 }}>{item.name} ×{item.qty}</span>
                  <span style={{ fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                    ¥{item.price * item.qty}
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8,
                fontWeight: 700, fontSize: 15
              }}>
                <span>{window.T('cart.total')}</span>
                <span style={{ color: 'var(--primary)' }}>
                  ¥{cartTotal}
                  <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 4 }}>
                    (实付 ¥0)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, zIndex: 10
      }}>
        <button
          onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 24,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          {step === 1 ? window.T('order.cancel') : '← 上一步'}
        </button>
        <button
          onClick={step === 3 ? handleSubmit : () => setStep(s => s + 1)}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 24,
            border: 'none', background: step === 3 ? 'var(--success)' : 'var(--primary)',
            color: '#FFF', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s'
          }}
        >
          {step === 3 ? `🎉 ${window.T('order.submit')}` : '下一步 →'}
        </button>
      </div>
    </div>
  );
}

window.CheckoutScene = CheckoutScene;
