
import React, { useState, useMemo } from 'react';
import { InvestmentPlan, TradeStatus } from '../types';

interface PlanFormProps {
  onSave: (plan: InvestmentPlan) => void;
  onCancel: () => void;
}

const PRESET_STRATEGIES = [
  '趋势跟踪',
  '价值投资',
  '超跌反弹',
  '波段操作',
  '套利策略',
  '其他（自定义）'
];

const PlanForm: React.FC<PlanFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'BUY' as 'BUY' | 'SELL',
    strategy: PRESET_STRATEGIES[0],
    entryPrice: 0,
    stopLoss: 0,
    targetPrice: 0,
    positionSize: '',
    psychologicalState: '平静',
    reasoning: '',
  });

  const [customStrategy, setCustomStrategy] = useState('');

  // 计算实时赔率和百分比
  const metrics = useMemo(() => {
    const { entryPrice, stopLoss, targetPrice, side } = formData;
    if (!entryPrice || !stopLoss || !targetPrice) return null;

    const isBuy = side === 'BUY';
    const reward = isBuy ? targetPrice - entryPrice : entryPrice - targetPrice;
    const risk = isBuy ? entryPrice - stopLoss : stopLoss - entryPrice;
    
    const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : '∞';
    const rewardPct = ((reward / entryPrice) * 100).toFixed(2);
    const riskPct = ((risk / entryPrice) * 100).toFixed(2);

    return { rrRatio, rewardPct, riskPct, isValid: reward > 0 && risk > 0 };
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStrategy = formData.strategy === '其他（自定义）' ? customStrategy || '未分类策略' : formData.strategy;
    
    const newPlan: InvestmentPlan = {
      ...formData,
      strategy: finalStrategy,
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: TradeStatus.PLANNED,
    };
    onSave(newPlan);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl cute-shadow space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-pink-500 mb-4 text-center">📝 制定作战计划</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">标的代码</label>
          <input 
            required
            type="text" 
            placeholder="如: BTC, NVDA"
            className="w-full mt-1 p-2 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300"
            value={formData.symbol}
            onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">操作方向</label>
          <select 
            className="w-full mt-1 p-2 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300"
            value={formData.side}
            onChange={e => setFormData({...formData, side: e.target.value as 'BUY' | 'SELL'})}
          >
            <option value="BUY">做多 (买入)</option>
            <option value="SELL">做空 (卖出)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">投资策略</label>
        <select 
          className="w-full mt-1 p-2 border-2 border-blue-100 rounded-xl focus:outline-none focus:border-blue-300"
          value={formData.strategy}
          onChange={e => setFormData({...formData, strategy: e.target.value})}
        >
          {PRESET_STRATEGIES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {formData.strategy === '其他（自定义）' && (
          <input 
            required
            type="text"
            placeholder="请输入自定义策略名称..."
            className="w-full mt-2 p-2 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 animate-in slide-in-from-top-1 duration-200"
            value={customStrategy}
            onChange={e => setCustomStrategy(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">计划买入价</label>
          <input 
            type="number" step="any"
            className="w-full mt-1 p-2 border-2 border-blue-100 rounded-xl"
            value={formData.entryPrice}
            onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 text-xs">止损 (护命符)</label>
          <input 
            type="number" step="any"
            className="w-full mt-1 p-2 border-2 border-red-100 rounded-xl"
            value={formData.stopLoss}
            onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">目标价</label>
          <input 
            type="number" step="any"
            className="w-full mt-1 p-2 border-2 border-green-100 rounded-xl"
            value={formData.targetPrice}
            onChange={e => setFormData({...formData, targetPrice: Number(e.target.value)})}
          />
        </div>
      </div>

      {/* 实时赔率显示区域 */}
      {metrics && (
        <div className={`p-3 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${metrics.isValid ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-[10px] text-gray-400">预期收益</p>
              <p className={`font-bold ${metrics.isValid ? 'text-green-500' : 'text-gray-400'}`}>+{metrics.rewardPct}%</p>
            </div>
            <div className="w-px h-8 bg-blue-200 mx-2" />
            <div className="text-center flex-1">
              <p className="text-[10px] text-gray-400">预期赔率 (盈亏比)</p>
              <p className={`text-lg font-black ${Number(metrics.rrRatio) >= 3 ? 'text-pink-500' : 'text-blue-500'}`}>1 : {metrics.rrRatio}</p>
            </div>
            <div className="w-px h-8 bg-blue-200 mx-2" />
            <div className="text-center flex-1">
              <p className="text-[10px] text-gray-400">最大风险</p>
              <p className="font-bold text-red-400">-{metrics.riskPct}%</p>
            </div>
          </div>
          {!metrics.isValid && (
            <p className="text-[10px] text-red-400 text-center mt-2 font-bold">⚠️ 警告：当前的止损或目标设置不合理</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-500">当前心态 (核心！)</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['平静', '兴奋', '恐惧', '贪婪', '疲惫', '焦虑'].map(state => (
            <button
              key={state}
              type="button"
              onClick={() => setFormData({...formData, psychologicalState: state})}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                formData.psychologicalState === state 
                ? 'bg-pink-400 text-white scale-110 shadow-md shadow-pink-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">为什么进行这次交易？</label>
        <textarea 
          required
          rows={3}
          placeholder="请说服自己，这不是冲动交易。列出你的理由..."
          className="w-full mt-1 p-2 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300"
          value={formData.reasoning}
          onChange={e => setFormData({...formData, reasoning: e.target.value})}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button 
          type="submit"
          className="flex-1 py-3 bg-pink-400 text-white rounded-2xl font-bold hover:bg-pink-500 transition-all transform active:scale-95 shadow-lg shadow-pink-200"
        >
          锁定计划 🚀
        </button>
      </div>
    </form>
  );
};

export default PlanForm;
