
import React, { useState } from 'react';
import { InvestmentPlan, TradeStatus } from '../types';
import { analyzeTradeReview } from '../services/geminiService';

interface ReviewModalProps {
  plan: InvestmentPlan;
  onComplete: (updatedPlan: InvestmentPlan) => void;
  onCancel: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ plan, onComplete, onCancel }) => {
  const [exitPrice, setExitPrice] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    const profitAndLoss = (exitPrice - plan.entryPrice) * (plan.side === 'BUY' ? 1 : -1);
    
    const updatedPlan: InvestmentPlan = {
      ...plan,
      exitPrice,
      profitAndLoss,
      reviewNotes,
      status: TradeStatus.CLOSED,
    };

    const aiAnalysis = await analyzeTradeReview(updatedPlan, new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }));
    onComplete({ ...updatedPlan, aiAnalysis });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-3xl cute-shadow animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-blue-500 mb-6 text-center">🌈 交易复盘</h2>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-bold">{plan.symbol}</span> 入场价: {plan.entryPrice}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">实际出场价格</label>
            <input 
              type="number" step="any"
              className="w-full mt-1 p-3 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-300"
              value={exitPrice}
              onChange={e => setExitPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">反思心得 (你的进步阶梯)</label>
            <textarea 
              rows={4}
              placeholder="这笔交易是因为运气还是实力？你学到了什么？"
              className="w-full mt-1 p-3 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-300"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-2xl font-bold"
            >
              取消
            </button>
            <button 
              disabled={loading}
              onClick={handleReview}
              className="flex-1 py-3 bg-blue-400 text-white rounded-2xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-200 relative overflow-hidden disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                   AI导师点评中...
                </span>
              ) : "完成复盘 ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
