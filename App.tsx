
import React, { useState, useEffect } from 'react';
import { InvestmentPlan, TradeStatus } from './types';
import PlanForm from './components/PlanForm';
import ReviewModal from './components/ReviewModal';
import HistoryDetailsModal from './components/HistoryDetailsModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const App: React.FC = () => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reviewingPlan, setReviewingPlan] = useState<InvestmentPlan | null>(null);
  const [viewingHistoryPlan, setViewingHistoryPlan] = useState<InvestmentPlan | null>(null);
  const [isAiActive, setIsAiActive] = useState(true);

  // 检查 API Key 状态
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsAiActive(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleConnectAi = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsAiActive(true);
      alert("AI 导师已就位！");
    }
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zen_invest_plans');
    if (saved) setPlans(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('zen_invest_plans', JSON.stringify(plans));
  }, [plans]);

  const addPlan = (plan: InvestmentPlan) => {
    setPlans([plan, ...plans]);
    setShowForm(false);
  };

  const updatePlan = (updatedPlan: InvestmentPlan) => {
    setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setReviewingPlan(null);
  };

  const closedPlans = plans.filter(p => p.status === TradeStatus.CLOSED);
  const chartData = [...closedPlans].reverse();

  const stats = {
    total: closedPlans.length,
    wins: closedPlans.filter(p => (p.profitAndLoss || 0) > 0).length,
    totalPL: plans.reduce((acc, p) => acc + (p.profitAndLoss || 0), 0)
  };

  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

  const calculateRR = (plan: InvestmentPlan) => {
    const isBuy = plan.side === 'BUY';
    const reward = isBuy ? plan.targetPrice - plan.entryPrice : plan.entryPrice - plan.targetPrice;
    const risk = isBuy ? plan.entryPrice - plan.stopLoss : plan.stopLoss - plan.entryPrice;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '∞';
    const rewardPct = ((reward / plan.entryPrice) * 100).toFixed(1);
    return { rr, rewardPct };
  };

  return (
    <div className="min-h-screen bg-[#FDF8FB] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-pink-50 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-pink-500 tracking-tight">ZenInvest 🌸</h1>
            <p className="text-xs text-gray-400 mt-1">每一笔交易都是一次内心的修行</p>
          </div>
          {!isAiActive && (
             <button 
              onClick={handleConnectAi}
              className="bg-blue-100 text-blue-500 text-[10px] px-2 py-1 rounded-full font-bold animate-pulse"
             >
               点击激活 AI 导师
             </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">胜率</p>
            <p className="font-bold text-pink-500">{winRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
            {stats.total}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-pink-300 p-6 rounded-3xl text-white shadow-xl shadow-pink-100">
            <p className="opacity-80 text-sm">累计盈亏 (Disciplined Profit)</p>
            <h3 className="text-4xl font-black mt-1">¥ {stats.totalPL.toFixed(2)}</h3>
            <div className="mt-4 flex gap-2">
               <span className="bg-white/20 px-2 py-1 rounded text-xs">长期主义</span>
               <span className="bg-white/20 px-2 py-1 rounded text-xs">知行合一</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl cute-shadow flex flex-col justify-center border border-blue-50">
            <h4 className="text-gray-400 text-sm font-medium flex justify-between items-center">
              <span>成长记录</span>
              <span className="text-[10px] bg-blue-50 text-blue-400 px-2 py-0.5 rounded-full italic">盈亏趋势曲线</span>
            </h4>
            <div className="h-24 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="profitAndLoss" stroke="#AEC6CF" fill="#E0F2F7" strokeWidth={3} activeDot={{ r: 6, fill: '#ec4899' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Investment Rules Reminder */}
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <p className="text-sm text-blue-600 leading-relaxed">
            <b>今日心法：</b> 恐惧源于未知，贪婪源于无知。严格遵守止损计划是保护账户安全的唯一护身符。
          </p>
        </div>

        {/* Trade List Sections */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-700">当前计划</h2>
              <span className="bg-pink-100 text-pink-500 text-xs px-2 py-0.5 rounded-full font-bold">
                {plans.filter(p => p.status !== TradeStatus.CLOSED).length}
              </span>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-pink-400 hover:bg-pink-500 text-white px-6 py-2 rounded-2xl font-bold transition-all transform active:scale-95 shadow-md shadow-pink-100 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              新计划
            </button>
          </div>
          
          <div className="space-y-4">
            {plans.filter(p => p.status !== TradeStatus.CLOSED).length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-pink-100 flex flex-col items-center gap-4">
                <div className="text-4xl">🌱</div>
                <div className="text-gray-400">
                  <p>当前没有作战计划</p>
                  <p className="text-xs">冷静观察，等待属于你的出手机会</p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-400 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-100"
                >
                  开启第一笔修行计划
                </button>
              </div>
            )}
            {plans.filter(p => p.status !== TradeStatus.CLOSED).map(plan => {
              const { rr, rewardPct } = calculateRR(plan);
              return (
                <div key={plan.id} className="bg-white p-5 rounded-3xl cute-shadow border-l-8 border-pink-300 flex justify-between items-center group hover:bg-pink-50/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.side === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {plan.side === 'BUY' ? '做多' : '做空'}
                      </span>
                      <h3 className="font-black text-gray-700">{plan.symbol}</h3>
                      <span className="bg-blue-50 text-blue-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        赔率 1:{rr}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>买入: <b className="text-gray-800">{plan.entryPrice}</b></span>
                      <span>止损: <b className="text-red-400">{plan.stopLoss}</b></span>
                      <span>目标: <b className="text-green-500">{plan.targetPrice}</b> (+{rewardPct}%)</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-1 italic">“{plan.reasoning}”</p>
                  </div>
                  <div className="ml-4">
                     <button 
                      onClick={() => setReviewingPlan(plan)}
                      className="bg-blue-400 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-50"
                    >
                      结束并复盘
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>修行历程</span>
            <span className="text-xs font-normal text-gray-400">(历史记录)</span>
          </h2>
          <div className="space-y-4">
            {closedPlans.length === 0 && (
              <p className="text-center text-gray-300 py-8">暂无已结单，等待结果落定...</p>
            )}
            {closedPlans.map(plan => {
              const plPct = (( (plan.profitAndLoss || 0) / (plan.entryPrice) ) * 100).toFixed(2);
              return (
                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-gray-50 cute-shadow/20 overflow-hidden group hover:border-pink-100 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-gray-400 text-[10px] font-mono uppercase bg-gray-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                      <h3 className="font-black text-lg text-gray-700">
                        {plan.symbol} <span className="text-xs font-normal text-gray-400">({plan.side === 'BUY' ? '做多' : '做空'})</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${ (plan.profitAndLoss || 0) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {(plan.profitAndLoss || 0) >= 0 ? '+' : ''}¥{(plan.profitAndLoss || 0).toFixed(2)}
                      </div>
                      <div className={`text-xs font-bold ${ (plan.profitAndLoss || 0) >= 0 ? 'text-green-400' : 'text-red-300'}`}>
                        {plPct}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-sm">🤖</span>
                      <p className="text-xs font-bold text-blue-400">AI 导师复盘：</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      {plan.aiAnalysis || "分析正在生成中..."}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center text-[10px] text-gray-400">
                    <div className="flex gap-3">
                      <span>买入: <span className="text-gray-600">{plan.entryPrice}</span></span>
                      <span>离场: <span className="text-gray-600">{plan.exitPrice}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-gray-100 rounded text-gray-500 italic">
                        策略: {plan.strategy}
                      </div>
                      <button 
                        onClick={() => setViewingHistoryPlan(plan)}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Overlays */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg">
            <PlanForm onSave={addPlan} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {reviewingPlan && (
        <ReviewModal 
          plan={reviewingPlan} 
          onComplete={updatePlan} 
          onCancel={() => setReviewingPlan(null)} 
        />
      )}

      {/* History Details View Modal */}
      {viewingHistoryPlan && (
        <HistoryDetailsModal 
          plan={viewingHistoryPlan} 
          onClose={() => setViewingHistoryPlan(null)} 
        />
      )}

      {/* Mobile-first FAB for New Plan */}
      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-pink-300 transform transition-transform hover:scale-110 active:scale-90 z-40 border-4 border-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default App;
