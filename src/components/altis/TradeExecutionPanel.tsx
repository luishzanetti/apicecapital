import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTradeExecuted: () => void;
  totalCapital: number;
  canOpenNew: boolean;
  maxLeverage: number;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'LINKUSDT', 'AVAXUSDT', 'DOGEUSDT'];

export function TradeExecutionPanel({ isOpen, onClose, onTradeExecuted, totalCapital, canOpenNew, maxLeverage }: Props) {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [sizeUsd, setSizeUsd] = useState(100);
  const [leverage, setLeverage] = useState(2);
  const [tpPct, setTpPct] = useState(5);
  const [slPct, setSlPct] = useState(3);
  const [showTpSl, setShowTpSl] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [step, setStep] = useState<'config' | 'confirm'>('config');

  const riskPerTrade = sizeUsd * leverage * (slPct / 100);
  const riskPct = totalCapital > 0 ? (riskPerTrade / totalCapital) * 100 : 0;
  const maxSize = totalCapital * 0.25; // 25% of capital max per trade
  const isRiskOk = riskPct <= 5;

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const action = side === 'long' ? 'open-long' : 'open-short';
      const qty = (sizeUsd / 100).toFixed(4); // Approximate qty, edge fn handles sizing

      const body: Record<string, unknown> = {
        action, symbol, qty, leverage,
        strategyType: 'manual',
      };

      // Add TP/SL if configured
      if (showTpSl) {
        // These would need current price to calculate absolute values
        // For now, pass as percentage hints that the edge function can use
        body.takeProfitPct = tpPct;
        body.stopLossPct = slPct;
      }

      const { error } = await invokeEdgeFunction('leveraged-trade-execute', { body });

      if (error) {
        toast.error(`Trade failed: ${error.message}`);
      } else {
        toast.success(`${side.toUpperCase()} ${symbol.replace('USDT', '')} ${leverage}x opened`, {
          description: `Size: $${sizeUsd} | Risk: $${riskPerTrade.toFixed(2)}`,
        });
        onTradeExecuted();
        onClose();
        setStep('config');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto"
            style={{
              background: 'hsl(var(--card) / 0.95)',
              backdropFilter: 'blur(40px)',
              border: '1px solid hsl(var(--border) / 0.15)',
              borderBottom: 'none',
            }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Open Position</h2>
                <button onClick={onClose} className="text-muted-foreground text-sm">Close</button>
              </div>

              {!canOpenNew && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-xs text-red-400 font-medium">Heat limit reached — cannot open new positions</p>
                  <p className="text-[10px] text-muted-foreground">Close existing positions or wait for heat to decrease.</p>
                </div>
              )}

              {step === 'config' && (
                <>
                  {/* Symbol selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Symbol</label>
                    <div className="flex gap-2 flex-wrap">
                      {SYMBOLS.map(s => (
                        <button key={s} onClick={() => setSymbol(s)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            symbol === s ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-light text-muted-foreground'
                          }`}>
                          {s.replace('USDT', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction toggle */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setSide('long')}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                          side === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/40 ring-1 ring-green-500/20' :
                          'glass-light text-muted-foreground'
                        }`}>
                        ↑ LONG
                      </button>
                      <button onClick={() => setSide('short')}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                          side === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500/40 ring-1 ring-red-500/20' :
                          'glass-light text-muted-foreground'
                        }`}>
                        ↓ SHORT
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Size (USD)</label>
                      <span className="text-[10px] text-muted-foreground">Max: {maxSize > 0 ? `$${maxSize.toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-foreground">${sizeUsd.toLocaleString()}</span>
                    </div>
                    <input type="range" min={10} max={Math.max(maxSize, 100)} step={10}
                      value={sizeUsd} onChange={e => setSizeUsd(Number(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex gap-2">
                      {[50, 100, 250, 500].filter(v => v <= maxSize || v <= 100).map(v => (
                        <button key={v} onClick={() => setSizeUsd(v)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${
                            sizeUsd === v ? 'bg-primary/20 text-primary' : 'glass-light text-muted-foreground'
                          }`}>${v}</button>
                      ))}
                    </div>
                  </div>

                  {/* Leverage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Leverage</label>
                      <span className="text-sm font-bold text-foreground">{leverage}x</span>
                    </div>
                    <input type="range" min={1} max={maxLeverage} step={1}
                      value={leverage} onChange={e => setLeverage(Number(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex gap-2">
                      {[1, 2, 3, 5].filter(v => v <= maxLeverage).map(v => (
                        <button key={v} onClick={() => setLeverage(v)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${
                            leverage === v ? 'bg-primary/20 text-primary' : 'glass-light text-muted-foreground'
                          }`}>{v}x</button>
                      ))}
                    </div>
                  </div>

                  {/* TP/SL Toggle */}
                  <div className="space-y-2">
                    <button onClick={() => setShowTpSl(!showTpSl)}
                      className="text-xs text-primary font-medium">
                      {showTpSl ? '▼ Hide TP/SL' : '▶ Set Take Profit & Stop Loss'}
                    </button>

                    {showTpSl && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-green-400">Take Profit %</label>
                          <input type="number" value={tpPct} onChange={e => setTpPct(Number(e.target.value))}
                            min={1} max={50} step={0.5}
                            className="w-full bg-secondary/30 border border-green-500/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500/50" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-red-400">Stop Loss %</label>
                          <input type="number" value={slPct} onChange={e => setSlPct(Number(e.target.value))}
                            min={0.5} max={20} step={0.5}
                            className="w-full bg-secondary/30 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/50" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Risk preview */}
                  <div className={`rounded-xl p-3 space-y-1 ${isRiskOk ? 'glass-card' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Preview</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[8px] text-muted-foreground">Position</p>
                        <p className="text-xs font-semibold">${(sizeUsd * leverage).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Risk</p>
                        <p className={`text-xs font-semibold ${isRiskOk ? 'text-foreground' : 'text-red-400'}`}>
                          ${riskPerTrade.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">% of Capital</p>
                        <p className={`text-xs font-semibold ${isRiskOk ? 'text-foreground' : 'text-red-400'}`}>
                          {riskPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {!isRiskOk && (
                      <p className="text-[10px] text-red-400 text-center">Risk exceeds 5% of capital. Reduce size or leverage.</p>
                    )}
                  </div>

                  {/* Continue to confirm */}
                  <button onClick={() => setStep('confirm')} disabled={!canOpenNew || !isRiskOk}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Review Order
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <div className="glass-card rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-center text-foreground">Confirm Trade</h3>

                    <div className="flex items-center justify-center gap-3">
                      <span className={`text-lg font-bold px-3 py-1 rounded-lg ${
                        side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{side.toUpperCase()}</span>
                      <span className="text-lg font-bold text-foreground">{symbol.replace('USDT', '')}</span>
                      <span className="text-lg font-bold text-primary">{leverage}x</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="glass-light rounded-lg p-2">
                        <p className="text-[8px] text-muted-foreground">Size</p>
                        <p className="text-sm font-bold">${sizeUsd.toLocaleString()}</p>
                      </div>
                      <div className="glass-light rounded-lg p-2">
                        <p className="text-[8px] text-muted-foreground">Exposure</p>
                        <p className="text-sm font-bold">${(sizeUsd * leverage).toLocaleString()}</p>
                      </div>
                      <div className="glass-light rounded-lg p-2">
                        <p className="text-[8px] text-muted-foreground">Risk</p>
                        <p className="text-sm font-bold">${riskPerTrade.toFixed(2)}</p>
                      </div>
                      <div className="glass-light rounded-lg p-2">
                        <p className="text-[8px] text-muted-foreground">% Capital</p>
                        <p className="text-sm font-bold">{riskPct.toFixed(1)}%</p>
                      </div>
                    </div>

                    {showTpSl && (
                      <div className="flex justify-center gap-4 text-xs">
                        <span className="text-green-400">TP: +{tpPct}%</span>
                        <span className="text-red-400">SL: -{slPct}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('config')}
                      className="flex-1 py-3 rounded-xl glass-light text-muted-foreground font-medium">Back</button>
                    <button onClick={handleExecute} disabled={executing}
                      className={`flex-1 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] disabled:opacity-50 ${
                        side === 'long'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                      }`}>
                      {executing ? 'Executing...' : `${side === 'long' ? '↑ Open Long' : '↓ Open Short'}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
