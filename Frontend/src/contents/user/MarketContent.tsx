import React, { useState, useEffect, useRef } from 'react';
import MarketHeader from '../../components/MarketHeader';
import MarketHome from './tabs/MarketHome';
import MarketNetwork from './tabs/MarketNetwork';
import MarketNotifications from './tabs/MarketNotifications';
import MarketPublication from './tabs/MarketPublication';
import ListingService from "../../services/ListingService"; // Import du service

export default function MarketContentPage() {
  const [activeTab, setActiveTab] = useState("accueil");
  const [liveAssets, setLiveAssets] = useState<any[]>([]); // État pour les taux réels
  
  const starsRef = useRef<HTMLCanvasElement>(null);
  const tradingRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const priceRef = useRef(655); // Prix de départ centré sur l'Euro/XAF

  const COLORS = {
    primary: '#FF7A00',   // Orange ExchaPay
    secondary: '#333333', // Gris foncé
    grid: 'rgba(0, 0, 0, 0.05)',
    background: '#FFFFFF'
  };

  // 1. RÉCUPÉRATION DES TAUX RÉELS POUR LE TICKER
  useEffect(() => {
    const fetchRates = async () => {
      const pairs = [
        { from: 'USD', to: 'XAF' },
        { from: 'EUR', to: 'XAF' },
        { from: 'GBP', to: 'XAF' },
        { from: 'CAD', to: 'XAF' },
        { from: 'NGN', to: 'XAF' }
      ];

      try {
        const results = await Promise.all(
          pairs.map(async (p) => {
            const rate = await ListingService.getLiveMarketRate(p.from, p.to);
            // FIX: Vérification si rate est null avant d'appeler toFixed
            const displayRate = rate ? rate.toFixed(2) : "---";
            return [ `${p.from}/${p.to}`, displayRate, '+0.1%', true ];
          })
        );
        setLiveAssets(results);
      } catch (err) {
        // Fallback si l'API échoue
        setLiveAssets([
          ['USD/XAF','612.4','+0.2%',true],['EUR/XAF','655.9','+0.0%',true],
          ['GBP/XAF','780.2','+0.5%',true],['CAD/XAF','452.1','-0.1%',false]
        ]);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Update toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "accueil": return <MarketHome />;
      case "reseau": return <MarketNetwork />;
      case "publications": return <MarketPublication />;
      case "notifs": return <MarketNotifications />;
      default: return <MarketHome />;
    }
  };

  // 2. ANIMATION CANVAS (CHART & PARTICULES)
  useEffect(() => {
    const sc = starsRef.current;
    const tc = tradingRef.current;
    if (!sc || !tc) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    sc.width = W; sc.height = H;
    tc.width = W; tc.height = H;

    const sx = sc.getContext('2d')!;
    const cx = tc.getContext('2d')!;

    const points = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.5,
      o: Math.random() * 0.4 + 0.1,
      sp: Math.random() * 0.3 + 0.05,
      tw: Math.random() * 3 + 1,
    }));

    const CANDLE_W = 10, GAP = 5;
    const TOTAL = Math.floor((W - 100) / (CANDLE_W + GAP));
    let p = priceRef.current;
    const candles = Array.from({ length: TOTAL }, () => {
      const o = p + (Math.random() - 0.5) * 5;
      const c = o + (Math.random() - 0.5) * 8;
      const h = Math.max(o, c) + Math.random() * 3;
      const l = Math.min(o, c) - Math.random() * 3;
      p = c;
      return { o, c, h, l };
    });
    
    let ema = candles[0].o;
    const emaLine = candles.map(c => { ema = ema * 0.92 + ((c.o + c.c) / 2) * 0.08; return ema; });

    let starT = 0;
    let animId: number;

    function toY(v: number, min: number, max: number) {
      const chartTop = 100, chartH = H - 220;
      return chartTop + (1 - (v - min) / (max - min)) * chartH;
    }

    function loop() {
      animId = requestAnimationFrame(loop);
      frameRef.current++;

      sx.clearRect(0, 0, W, H);
      starT += 0.02;
      for (const s of points) {
        const alpha = s.o * (0.3 + 0.7 * Math.sin(starT / s.tw));
        sx.beginPath(); sx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sx.fillStyle = `rgba(0,0,0,${alpha})`; sx.fill();
        s.y -= s.sp; if (s.y < 0) s.y = H;
      }

      cx.clearRect(0, 0, W, H);
      const vals = candles.flatMap(c => [c.h, c.l]);
      const min = Math.min(...vals) - 5;
      const max = Math.max(...vals) + 5;
      const startX = 60;

      // Grille
      cx.setLineDash([2, 4]);
      for (let i = 0; i <= 5; i++) {
        const v = min + (max - min) * i / 5;
        const y = toY(v, min, max);
        cx.strokeStyle = 'rgba(0,0,0,0.04)';
        cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke();
        cx.fillStyle = 'rgba(0,0,0,0.3)';
        cx.font = '10px Inter, sans-serif';
        cx.fillText(v.toFixed(1), 10, y - 4);
      }
      cx.setLineDash([]);

      // EMA Orange
      cx.beginPath();
      emaLine.forEach((v, i) => {
        const x = startX + i * (CANDLE_W + GAP) + CANDLE_W / 2;
        i === 0 ? cx.moveTo(x, toY(v, min, max)) : cx.lineTo(x, toY(v, min, max));
      });
      cx.strokeStyle = 'rgba(255,122,0,0.4)';
      cx.lineWidth = 2; cx.stroke();

      // Candles (Orange vs Gris)
      candles.forEach((c, i) => {
        const x = startX + i * (CANDLE_W + GAP);
        const bull = c.c >= c.o;
        const col = bull ? COLORS.primary : '#94a3b8';
        
        cx.strokeStyle = col; cx.lineWidth = 1.2;
        cx.beginPath();
        cx.moveTo(x + CANDLE_W / 2, toY(c.h, min, max));
        cx.lineTo(x + CANDLE_W / 2, toY(c.l, min, max));
        cx.stroke();
        
        cx.fillStyle = bull ? col : '#FFFFFF'; 
        const by = Math.min(toY(c.o, min, max), toY(c.c, min, max));
        const bh = Math.max(Math.abs(toY(c.c, min, max) - toY(c.o, min, max)), 2);
        cx.fillRect(x, by, CANDLE_W, bh);
        if(!bull) cx.strokeRect(x, by, CANDLE_W, bh);
      });

      // Last price tag
      const last = candles[candles.length - 1];
      const ly = toY(last.c, min, max);
      cx.fillStyle = COLORS.primary;
      cx.beginPath();
      cx.roundRect(W - 65, ly - 10, 60, 20, 5);
      cx.fill();
      cx.fillStyle = '#FFF';
      cx.font = 'bold 11px Inter';
      cx.fillText(last.c.toFixed(2), W - 60, ly + 4);
    }

    loop();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-100 min-vh-100 market-root">
      <div className="bg-layer">
        <canvas ref={starsRef} className="stars-canvas" />
        <div className="grid-overlay" />
        <canvas ref={tradingRef} className="trading-canvas" />
      </div>

      {/* TICKER FIXE AVEC DEVISES RÉELLES */}
      <div className="ticker-bar">
        <div className="ticker-inner">
          {(liveAssets.length > 0 ? [...liveAssets, ...liveAssets] : []).map(([sym, pr, ch, up], i) => (
            <span key={i} className="ticker-item" style={{ color: up ? COLORS.primary : '#64748b' }}>
              <span className="symbol">{sym}</span> 
              <span className="price">{pr}</span> 
              <small className="change">{ch}</small>
            </span>
          ))}
        </div>
      </div>

      <MarketHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="w-100 py-3 px-0 px-md-3">
        <div className="animate__animated animate__fadeIn">
          {renderTabContent()}
        </div>
      </main>

      <style>{`
        .market-root {
          background: #FFFFFF;
          position: relative;
          overflow-x: hidden;
        }
        .bg-layer {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
        }
        .stars-canvas, .trading-canvas {
          position: absolute; inset: 0; width: 100%; height: 100%;
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 100px 100px;
        }
        .ticker-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 40px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex; align-items: center; z-index: 100;
        }
        .ticker-inner {
          display: flex; white-space: nowrap;
          animation: tickerMove 50s linear infinite;
        }
        .ticker-item {
          margin-right: 60px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          display: flex; align-items: center; gap: 8px;
        }
        .ticker-item .symbol { color: #1e293b; }
        .ticker-item .price { color: #FF7A00; }
        .ticker-item .change { font-size: 10px; opacity: 0.8; }
        @keyframes tickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        main { position: relative; z-index: 1; padding-bottom: 70px; }
      `}</style>
    </div>
  );
}