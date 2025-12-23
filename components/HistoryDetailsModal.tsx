
import React from 'react';
import { InvestmentPlan } from '../types';

interface HistoryDetailsModalProps {
  plan: InvestmentPlan;
  onClose: () => void;
}

const HistoryDetailsModal: React.FC<HistoryDetailsModalProps> = ({ plan, onClose }) => {
  const plPct = (((plan.profitAndLoss || 0) / plan.entryPrice) * 100).toFixed(2);
  
  const calculatePlannedRR = () => {
    const isBuy = plan.side === 'BUY';
    const reward = isBuy ? plan.targetPrice - plan.entryPrice : plan.entryPrice - plan.targetPrice;
    const risk = isBuy ? plan.entryPrice - plan.stopLoss : plan.stopLoss - plan.entryPrice;
    return risk > 0 ? (reward / risk).toFixed(2) : '∞';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md p-8 rounded-[40px] cute-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="text-gray-300 hover:text-pink-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-center mb-6">
          <span className="text-5xl">📓</span>
          <h2 className="text-2xl font-black text-gray-700 mt-4">{plan.symbol} 修行报告</h2>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">
            {new Date(plan.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/50 p-4 rounded-3xl">
              <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">入场理由</p>
              <p className="text-sm font-bold text-gray-700 truncate">{plan.reasoning}</p>
            </div>
            <div className="bg-pink-50/50 p-4 rounded-3xl">
              <p className="text-[10px] text-pink-400 font-bold uppercase mb-1">当时心态</p>
              <p className="text-sm font-bold text-gray-700">{plan.psychologicalState}</p>
            </div>
          </div>

          <div className={`p-6 rounded-[32px] text-center border-2 ${ (plan.profitAndLoss || 0) >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
            <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mb-1">最终损益状况</p>
            <p className="text-4xl font-black">¥ {(plan.profitAndLoss || 0).toFixed(2)}</p>
            <p className="text-sm font-black mt-1">收益率: {plPct}%</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner">
            <p className="text-[10px] font-black text-gray-400 mb-2 uppercase flex items-center gap-1">
              <span>✍️</span> 我的修行自省
            </p>
            <p className="text-sm text-gray-600 leading-relaxed italic font-medium">
              {plan.reviewNotes}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-pink-400 text-white rounded-2xl font-black shadow-lg shadow-pink-100 mt-4 hover:bg-pink-500 transition-all transform active:scale-95"
          >
            收悉，继续前进
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetailsModal;
