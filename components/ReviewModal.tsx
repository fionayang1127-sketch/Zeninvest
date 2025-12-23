
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
    if (exitPrice === 0) {
      alert("请输入出场价格哦~");
      return;
    }
    
    setLoading(true);
    const profitAndLoss = (exitPrice - plan.entryPrice) * (plan.side === 'BUY' ? 1 : -1);
    
    const updatedPlan: InvestmentPlan = {
      ...plan,
      exitPrice,
      profitAndLoss,
      reviewNotes,
      status: TradeStatus.CLOSED,
    };

    try {
      const aiAnalysis = await analyzeTradeReview(updatedPlan, new Date().toLocaleDateString());
      onComplete({ ...updatedPlan, aiAnalysis });
    } catch (err: any) {
      let failMessage = "AI 导师暂时在休息，但这笔复盘已记录。";
      
      if (err.message === "API_KEY_MISSING") {
        failMessage = "⚠️ 导师离线！\n原因：Vercel 环境中找不到 API_KEY。\n\n解决办法：\n1. 在 Vercel Settings -> Environment Variables 填入 API_KEY。\n2. 点击 Deployments 菜单里的 'Create Deployment'。\n3. 等待部署变为绿色 Ready 状态再回来刷新。";
      } else {
        console.error("Review Error:", err);
      }
      
      onComplete({ ...updatedPlan, aiAnalysis: failMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-8 rounded-[40px] cute-shadow animate-in zoom-in duration-300">
        <h2 className="text-2xl font-black text-blue-500 mb-6 text-center">🏁 结单复盘</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex justify-between items-center">
             <div>
               <p className="text-[10px] text-blue-400 font-black uppercase">标的物</p>
               <p className="font-black text-blue-800">{plan.symbol}</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-blue-400 font-black uppercase">入场价</p>
               <p className="font-black text-blue-800">{plan.entryPrice}</p>
             </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">实际离场价格</label>
            <input 
              type="number" step="any"
              autoFocus
              className="w-full p-4 border-2 border-blue-50 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-lg font-black"
              value={exitPrice || ''}
              onChange={e => setExitPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">感悟与反思</label>
            <textarea 
              rows={3}
              placeholder="这笔交易让你学到了什么？是运气还是纪律？"
              className="w-full p-4 border-2 border-blue-50 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-sm font-medium"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              disabled={loading}
              onClick={onCancel}
              className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black active:scale-95 transition-transform"
            >
              取消
            </button>
            <button 
              disabled={loading}
              onClick={handleReview}
              className="flex-1 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {loading ? "点评中..." : "保存修行 ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
