const { useState, useEffect, useRef, useCallback } = React;

// ===== 配送状态定义 =====
const STATUS_LIST = [
  { key: 'accepted', label: '已接单', icon: '📋', desc: '商家已接单，正在备货中...' },
  { key: 'waiting', label: '等骑手', icon: '🏍️', desc: '等待骑手取货...' },
  { key: 'delivering', label: '配送中', icon: '🛵', desc: '骑手正在路上...' },
  { key: 'arrived', label: '已送达', icon: '✅', desc: '订单已送达，请查收！' },
];

// ===== 模拟骑手路径 =====
// 生成随机路径点（起点→中间3-4个拐点→终点）
function generateRoute() {
  // 北京大致范围
  const baseLat = 39.90 + (Math.random() - 0.5) * 0.04;
  const baseLng = 116.39 + (Math.random() - 0.5) * 0.05;
  
  // 随机角度和距离
  const angle = Math.random() * Math.PI * 2;
  const dist = 0.008 + Math.random() * 0.015; // 约1-2km
  
  const startLat = baseLat;
  const startLng = baseLng;
  const endLat = baseLat + Math.cos(angle) * dist;
  const endLng = baseLng + Math.sin(angle) * dist;

  // 生成中间拐点
  const waypoints = [];
  const numWaypoints = 3 + Math.floor(Math.random() * 3); // 3-5个拐点
  for (let i = 1; i <= numWaypoints; i++) {
    const t = i / (numWaypoints + 1);
    waypoints.push([
      startLng + (endLng - startLng) * t + (Math.random() - 0.5) * 0.003,
      startLat + (endLat - startLat) * t + (Math.random() - 0.5) * 0.003
    ]);
  }

  return {
    start: [startLng, startLat],
    end: [endLng, endLat],
    waypoints,
    fullPath: [[startLng, startLat], ...waypoints, [endLng, endLat]]
  };
}

// ===== OrderTracking 组件 =====
function OrderTracking({ cartItems = [], savedAmount = 0, orderId, onGoHome }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [riderPos, setRiderPos] = useState(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const timerRef = useRef(null);
  const mapContainerRef = useRef(null);

  // 生成路线
  const route = useRef(generateRoute());
  const totalUpdates = useRef(4 + Math.floor(Math.random() * 2)); // 4-5次更新
  const deliveryMinutes = useRef(5 + Math.floor(Math.random() * 6)); // 5-10分钟
  const startTime = useRef(Date.now());

  // 计算预计到达时间
  useEffect(() => {
    const now = new Date();
    const eta = new Date(now.getTime() + deliveryMinutes.current * 60000);
    const h = eta.getHours().toString().padStart(2, '0');
    const m = eta.getMinutes().toString().padStart(2, '0');
    setEstimatedArrival(`${h}:${m}`);
  }, []);

  // 时间计数器
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 状态推进和骑手位置更新
  useEffect(() => {
    const fullPath = route.current.fullPath;
    const numUpdates = totalUpdates.current;
    const totalMs = deliveryMinutes.current * 60000;
    
    // 状态阶段分配: 0-已接单, 1-等骑手, 2-配送中, 3-已送达
    // 更新0: 已接单 (20%), 更新1: 等骑手 (40%), 更新2-4: 配送中(60%-95%), 更新last: 已送达(100%)
    const stageTimes = [
      totalMs * 0.20,  // 已接单 → 等骑手
      totalMs * 0.40,  // 等骑手 → 配送中
      totalMs * 0.95,  // 配送中 → 已送达
    ];

    const updatePoints = [];
    for (let i = 0; i < numUpdates; i++) {
      const t = (i + 1) / (numUpdates + 1);
      updatePoints.push({
        time: totalMs * t,
        pathIdx: Math.min(Math.floor((fullPath.length - 1) * t), fullPath.length - 1),
        pos: fullPath[Math.min(Math.floor((fullPath.length - 1) * t), fullPath.length - 1)]
      });
    }

    const now = Date.now();
    let currentUpdate = 0;

    // 检查是否应该立即触发某个状态
    const checkAndUpdate = () => {
      const elapsed = Date.now() - startTime.current;
      
      // 状态推进
      if (elapsed >= stageTimes[0] && statusIndex === 0) {
        setStatusIndex(1);
      }
      if (elapsed >= stageTimes[1] && statusIndex <= 1) {
        setStatusIndex(2);
      }
      if (elapsed >= stageTimes[2] && statusIndex <= 2) {
        setStatusIndex(3);
        // 送达：振动 + 提示音
        onDelivered();
        // 清除定时器，停止更新
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      // 骑手位置更新
      while (currentUpdate < updatePoints.length && elapsed >= updatePoints[currentUpdate].time) {
        const pt = updatePoints[currentUpdate];
        setRiderPos(pt.pos);
        setPathIndex(pt.pathIdx);
        currentUpdate++;
      }
    };

    // 初始检查
    checkAndUpdate();
    
    // 每2秒检查一次（节约额度，不频繁更新）
    timerRef.current = setInterval(checkAndUpdate, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 初始化地图
  useEffect(() => {
    // 等待高德地图 API 加载
    const initMap = () => {
      if (!window.AMap || !mapContainerRef.current) {
        setTimeout(initMap, 500);
        return;
      }

      if (mapRef.current) return; // 已初始化

      try {
        const { start, end } = route.current;
        
        const map = new window.AMap.Map(mapContainerRef.current, {
          zoom: 15,
          center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
          mapStyle: 'amap://styles/light',
          resizeEnable: true,
        });

        // 起点标记（餐厅）
        const startMarker = new window.AMap.Marker({
          position: start,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(28, 36),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
            imageSize: new window.AMap.Size(28, 36),
          }),
          anchor: 'bottom-center',
          label: {
            content: '<div style="background:#FF5D37;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;white-space:nowrap">商家</div>',
            offset: new window.AMap.Pixel(0, -40),
          }
        });
        map.add(startMarker);

        // 终点标记（收货地址）
        const endMarker = new window.AMap.Marker({
          position: end,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(28, 36),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            imageSize: new window.AMap.Size(28, 36),
          }),
          anchor: 'bottom-center',
          label: {
            content: '<div style="background:#3B82F6;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;white-space:nowrap">收货</div>',
            offset: new window.AMap.Pixel(0, -40),
          }
        });
        map.add(endMarker);

        // 骑手标记
        const riderMarker = new window.AMap.Marker({
          position: start,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(32, 32),
            image: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FF5D37" stroke="#fff" stroke-width="2"/><text x="20" y="26" text-anchor="middle" font-size="18">🛵</text></svg>'),
            imageSize: new window.AMap.Size(32, 32),
          }),
          anchor: 'center',
          zIndex: 100,
          label: {
            content: '<div style="background:#FF5D37;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;white-space:nowrap;animation:pulse 1.5s infinite">🏍️ 骑手</div>',
            offset: new window.AMap.Pixel(0, -34),
          }
        });
        map.add(riderMarker);

        // 绘制路径
        const polyline = new window.AMap.Polyline({
          path: route.current.fullPath,
          strokeColor: '#FF5D37',
          strokeWeight: 4,
          strokeOpacity: 0.5,
          strokeStyle: 'dashed',
          lineJoin: 'round',
        });
        map.add(polyline);

        map.setFitView(null, false, [60, 60, 60, 60]);

        mapRef.current = map;
        riderMarkerRef.current = riderMarker;
        routeRef.current = route.current;
        setShowMap(true);
      } catch(e) {
        console.warn('[OrderTracking] 地图初始化失败:', e);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  // 更新骑手位置
  useEffect(() => {
    if (!riderPos || !riderMarkerRef.current || !mapRef.current) return;
    riderMarkerRef.current.setPosition(riderPos);
  }, [riderPos]);

  // 送达处理
  const onDelivered = useCallback(() => {
    // 振动
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
    // 播放提示音
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // 愉快的三连音
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - 大三和弦
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.15);
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.4);
      });
    } catch(e) {
      // 静默失败
    }
  }, []);

  const currentStatus = STATUS_LIST[statusIndex];

  // 格式化时间
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 订单信息
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* 顶部订单编号 */}
      <div style={{
        padding: '16px', background: 'linear-gradient(135deg, #FF5D37, #FF8D58)',
        color: '#FFF', borderRadius: '0 0 20px 20px'
      }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
          订单号 #{orderId || 'DP' + Date.now()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
          {currentStatus.icon} {currentStatus.label}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          {currentStatus.desc}
        </div>
        {statusIndex < 3 && (
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
            预计 {estimatedArrival} 送达 · 已等 {formatTime(totalTime)}
          </div>
        )}
        {statusIndex === 3 && (
          <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600 }}>
            🎉 总共用时 {formatTime(totalTime)}，请查收！
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '20px 16px', background: 'var(--bg-card)',
        margin: '12px 16px', borderRadius: 16
      }}>
        {STATUS_LIST.map((s, i) => (
          <div key={s.key} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            flex: 1, position: 'relative'
          }}>
            {/* 连接线 */}
            {i < STATUS_LIST.length - 1 && (
              <div style={{
                position: 'absolute', top: 14, left: '50%',
                width: '100%', height: 2,
                background: i < statusIndex ? 'var(--primary)' : 'var(--border)',
                zIndex: 0
              }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: i <= statusIndex ? 'var(--primary)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, zIndex: 1, color: '#FFF',
              transition: 'all 0.3s'
            }}>
              {i < statusIndex ? '✓' : s.icon}
            </div>
            <span style={{
              fontSize: 10, color: i <= statusIndex ? 'var(--text)' : 'var(--text-light)',
              marginTop: 6, fontWeight: i === statusIndex ? 600 : 400,
              textAlign: 'center'
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* 地图 */}
      <div style={{ margin: '0 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          🗺️ 骑手实时位置
        </div>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%', height: 220, borderRadius: 16,
            overflow: 'hidden', backgroundColor: '#f5f5f5',
            border: '1px solid var(--border)'
          }}
        >
          {!showMap && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-light)', fontSize: 14
            }}>
              地图加载中...
            </div>
          )}
        </div>
        {/* 高德地图标注 */}
        <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4, textAlign: 'right' }}>
          数据来源：高德地图
        </div>
      </div>

      {/* 订单详情 */}
      <div style={{
        margin: '16px', padding: '16px', background: 'var(--bg-card)',
        borderRadius: 16
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
          📦 订单详情 ({itemCount}件)
        </div>
        {cartItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: i < cartItems.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: 13
          }}>
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
              {item.name} × {item.qty}
            </span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              ¥{item.price * item.qty}
            </span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
          fontSize: 15, fontWeight: 700
        }}>
          <span style={{ color: 'var(--text)' }}>合计</span>
          <span style={{ color: 'var(--primary)' }}>¥{savedAmount || cartItems.reduce((s, i) => s + i.price * i.qty, 0)}</span>
        </div>
      </div>

      {/* 返回按钮 */}
      {statusIndex === 3 && (
        <div style={{ padding: '0 16px', marginTop: 8 }}>
          <button
            onClick={onGoHome}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 28,
              border: 'none', background: 'var(--primary)',
              color: '#FFF', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(255,93,55,0.4)',
            }}
          >
            返回首页
          </button>
        </div>
      )}

      {/* 底部提示 */}
      <div style={{
        textAlign: 'center', fontSize: 10, color: 'var(--text-light)',
        opacity: 0.6, marginTop: 16
      }}>
        💡 以上均为模拟配送体验 · 骑手位置为虚拟轨迹
      </div>
    </div>
  );
}

window.OrderTracking = OrderTracking;
