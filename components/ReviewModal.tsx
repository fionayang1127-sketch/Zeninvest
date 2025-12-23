
import React, { useState } from 'react';
import { InvestmentPlan, TradeStatus } from '../types';
import { analyzeTrade } from '../services/geminiService';

interface ReviewModalProps {
  plan: InvestmentPlan;
  onComplete: (updatedPlan: InvestmentPlan) => void;
  onCancel: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ plan, onComplete, onCancel }) => {
  const [exitPrice, setExitPrice] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fix: Handle the trade completion with an asynchronous call to Gemini for analysis
  const handleReview = async () => {
    if (exitPrice === 0) {
      alert("请输入出场价格哦~");
      return;
    }
    if (reviewNotes.trim().length < 5) {
      alert("请至少写 5 个字的总结，这是对你自己资产负责的表现哦！");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const profitAndLoss = (exitPrice - plan.entryPrice) * (plan.side === 'BUY' ? 1 : -1);
      
      const updatedPlan: InvestmentPlan = {
        ...plan,
        exitPrice,
        profitAndLoss,
        reviewNotes,
        status: TradeStatus.CLOSED,
      };

      // Call Gemini for automated trade review
      const aiAnalysis = await analyzeTrade(updatedPlan);
      onComplete({ ...updatedPlan, aiAnalysis });
    } catch (error) {
      console.error("Review error:", error);
      alert("结单过程中出现了一点小插曲。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-8 rounded-[40px] cute-shadow animate-in zoom-in duration-300">
        <h2 className="text-2xl font-black text-blue-500 mb-6 text-center">🏁 修行结单</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex justify-between items-center">
             <div>
               <p className="text-[10px] text-blue-400 font-black uppercase">标的物</p>
               <p className="font-black text-blue-800 text-lg">{plan.symbol}</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-blue-400 font-black uppercase">买入价</p>
               <p className="font-black text-blue-800 text-lg">{plan.entryPrice}</p>
             </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">离场结算价</label>
            <input 
              type="number" step="any"
              autoFocus
              disabled={isAnalyzing}
              className="w-full p-4 border-2 border-blue-50 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-lg font-black disabled:opacity-50"
              value={exitPrice || ''}
              onChange={e => setExitPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">总结与反思 (必填)</label>
            <textarea 
              rows={4}
              disabled={isAnalyzing}
              placeholder="这笔交易是否按计划执行了？入场理由还在吗？最大的教训是什么？"
              className="w-full p-4 border-2 border-blue-50 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-sm font-medium disabled:opacity-50"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onCancel}
              disabled={isAnalyzing}
              className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black active:scale-95 transition-transform disabled:opacity-50"
            >
              取消
            </button>
            <button 
              onClick={handleReview}
              disabled={isAnalyzing}
              className="flex-1 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin text-xl">🧘</span>
                  正在请教禅师...
                </>
              ) : (
                "保存修行记录 ✨"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
