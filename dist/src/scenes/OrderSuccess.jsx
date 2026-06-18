const { useState, useEffect, useCallback } = React;

// ===== Confetti 粒子 =====
const CONFETTI_COLORS = ['#FEA031', '#FCB354', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
const CONFETTI_EMOJIS = ['🎉', '✨', '💸', '🎊', '💰', '🤑', '🔥', '💎', '🥳'];

function randomConfetti() {
  return {
    id: Math.random(),
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 2,
    size: 12 + Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
    rotation: Math.random() * 720 - 360,
  };
}

// ===== OrderSuccess 组件 =====
function OrderSuccess({ savedAmount = 0, stats = {}, onGoHome }) {
  const [showContent, setShowContent] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [bigNumberAnim, setBigNumberAnim] = useState(false);

  // 生成 confetti
  useEffect(() => {
    const pieces = Array.from({ length: 50 }, () => randomConfetti());
    setConfetti(pieces);
    setTimeout(() => setShowContent(true), 200);
    setTimeout(() => setBigNumberAnim(true), 600);
  }, []);

  // 分享
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: window.T('app.title'),
        text: `我在${window.T('app.title')}省下了 ¥${savedAmount}！零成本解压，你也来试试！`,
        url: window.location.origin
      }).catch(() => {});
    } else {
      // fallback: 复制到剪贴板
      const text = `我在${window.T('app.title')}省下了 ¥${savedAmount}！零成本解压，你也来试试！`;
      navigator.clipboard?.writeText(text).then(() => {
        alert('已复制分享文案到剪贴板！');
      }).catch(() => {
        alert(text);
      });
    }
  }, [savedAmount]);

  // 格式化
  const fmtMoney = (n) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString();
  };

  return (
    <div className="success-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Confetti 粒子 */}
      {confetti.map(p => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* 彩虹背景光晕 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 280, height: 280, borderRadius: 140,
        background: 'radial-gradient(circle, rgba(255,93,55,0.08) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite',
        pointerEvents: 'none'
      }}></div>

      {/* 内容 */}
      <div style={{
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease-out',
        zIndex: 1
      }}>
        {/* 大图标 */}
        <div className="success-icon" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
          🎉
        </div>

        {/* 标题 */}
        <div className="success-title">{window.T('success.title')}</div>

        {/* 省下金额大字 */}
        <div style={{
          fontSize: 14, color: 'var(--text-secondary)',
          marginBottom: 4, marginTop: 8
        }}>
          {window.T('success.saved')}
        </div>
        <div
          className="success-saved"
          style={{
            transform: bigNumberAnim ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontSize: 36
          }}
        >
          ¥{fmtMoney(savedAmount)}
        </div>

        {/* 副标题 */}
        <div className="success-subtitle">{window.T('success.subtitle')}</div>

        {/* Stats 迷你更新 */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          margin: '16px 0 24px', padding: '12px 20px',
          background: 'var(--bg)', borderRadius: 16
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
              ¥{fmtMoney(stats.saved)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
              {window.T('stats.saved')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
              {stats.orders}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
              {window.T('stats.orders')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
              {stats.streak}🔥
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
              {window.T('stats.streak')}
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column', width: '100%', maxWidth: 280 }}>
          <button
            onClick={onGoHome}
            className="btn-pulse"
            style={{
              width: '100%', padding: '14px 0', borderRadius: 28,
              border: 'none', background: 'var(--primary)',
              color: '#FFF', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(255,93,55,0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            🛒 {window.T('success.back')}
          </button>
          <button
            onClick={handleShare}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 28,
              border: '2px solid var(--primary)', background: 'transparent',
              color: 'var(--primary)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            📤 {window.T('success.share')}
          </button>
        </div>
      </div>

      {/* 底部"假"提示 */}
      <div style={{
        position: 'absolute', bottom: 20, fontSize: 10,
        color: 'var(--text-light)', opacity: 0.6, zIndex: 1
      }}>
        💡 以上均为模拟体验 · 未产生实际消费
      </div>
    </div>
  );
}

window.OrderSuccess = OrderSuccess;
