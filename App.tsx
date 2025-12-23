
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
  
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(false);

  // 诊断逻辑
  const checkStatus = async () => {
    const envKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (envKey && envKey.length > 5) {
      setIsAiConfigured(true);
      return;
    }
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsAiConfigured(hasKey);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectAi = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsAiConfigured(true);
    } else {
      alert("💡 诊断报告：\n\n1. 请检查 Vercel 项目设置里的 Environment Variables。\n2. 确保变量名是 API_KEY（全大写）。\n3. 填完后必须点击 'Create Deployment' 重新打包代码。");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('zen_invest_plans');
    if (saved) setPlans(JSON.parse(saved));
  }, []);

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
    <div className="min-h-screen bg-[#FDF8FB] pb-24 font-sans text-gray-700 selection:bg-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-pink-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-pink-100">🧘</div>
          <div>
            <h1 className="text-xl font-black text-pink-500 tracking-tight">ZenInvest</h1>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Mastering the inner market</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] text-gray-400 font-black uppercase">胜率</p>
            <p className="font-black text-pink-500 text-lg leading-none mt-1">{winRate}%</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-pink-200 hover:rotate-90 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-pink-300 p-8 rounded-[40px] text-white shadow-2xl shadow-pink-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-9xl font-black rotate-12 transition-transform group-hover:rotate-0">PROFIT</div>
            <p className="opacity-80 text-[10px] font-black uppercase tracking-widest">已实现总盈亏</p>
            <h3 className="text-5xl font-black mt-2 tracking-tighter">¥ {stats.totalPL.toFixed(2)}</h3>
          </div>
          
          <div className="bg-white p-6 rounded-[40px] cute-shadow flex flex-col justify-center border border-pink-50/50">
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AEC6CF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#AEC6CF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    itemStyle={{ color: '#ec4899', fontWeight: '900' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="profitAndLoss" stroke="#AEC6CF" fillOpacity={1} fill="url(#colorPl)" strokeWidth={4} activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rules with Diagnostic Link */}
        <div className="bg-white p-5 rounded-[32px] border border-blue-50 shadow-sm flex items-start gap-4 hover:border-pink-100 transition-all group">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform">💡</div>
          <div className="flex-1">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">牛散心法</p>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              不要在乎一城一池的得失，要在乎你的交易系统是否得到了严格执行。
            </p>
          </div>
          {!isAiConfigured && (
            <button 
              onClick={handleConnectAi}
              className="text-[10px] bg-pink-50 text-pink-400 px-4 py-2 rounded-full font-black hover:bg-pink-100 transition-all border border-pink-100"
            >
              通电诊断
            </button>
          )}
        </div>

        {/* Active List */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-black text-gray-800">持仓监控</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4"></div>
          </div>
          
          <div className="space-y-4">
            {plans.filter(p => p.status !== TradeStatus.CLOSED).length === 0 && (
              <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-pink-50 flex flex-col items-center gap-4">
                <span className="text-5xl opacity-40">🍃</span>
                <p className="text-sm text-gray-400 font-bold">目前无持仓，这正是休息的好时机</p>
              </div>
            )}
            {plans.filter(p => p.status !== TradeStatus.CLOSED).map(plan => {
              const { rr, rewardPct } = calculateRR(plan);
              return (
                <div key={plan.id} className="bg-white p-6 rounded-[32px] cute-shadow border border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 border-l-[10px] border-l-pink-400 hover:scale-[1.01] transition-transform">
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${plan.side === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {plan.side === 'BUY' ? '做多' : '做空'}
                      </span>
                      <h3 className="font-black text-xl text-gray-800">{plan.symbol}</h3>
                    </div>
                    <div className="flex justify-center sm:justify-start gap-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      <span>入场: <b className="text-gray-700">{plan.entryPrice}</b></span>
                      <span>预期: <b className="text-green-500">+{rewardPct}%</b></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReviewingPlan(plan)}
                    className="bg-blue-500 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
                  >
                    结单复盘
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className="pt-8">
           <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black text-gray-800">修行成果</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4"></div>
          </div>
          <div className="space-y-6">
            {closedPlans.map(plan => {
              const profitValue = plan.profitAndLoss || 0;
              const isWin = profitValue >= 0;
              return (
                <div key={plan.id} className="bg-white p-8 rounded-[40px] border border-gray-50 cute-shadow/30 relative group transition-all hover:bg-pink-50/10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(plan.createdAt).toLocaleDateString()}</p>
                      <h3 className="font-black text-2xl text-gray-800 mt-1">{plan.symbol}</h3>
                    </div>
                    <div className={`text-3xl font-black ${ isWin ? 'text-green-500' : 'text-red-400'}`}>
                      {isWin ? '+' : ''}¥{profitValue.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-5 bg-gray-50/50 rounded-[32px] border border-gray-100 mb-6 group-hover:bg-blue-50/50 transition-colors">
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      {plan.aiAnalysis || "导师正在赶来的路上..."}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex gap-4 font-black uppercase text-gray-400">
                       <span>{plan.strategy}</span>
                       <span className="w-px bg-gray-200"></span>
                       <span className={plan.side === 'BUY' ? 'text-green-500' : 'text-red-400'}>{plan.side === 'BUY' ? '做多' : '做空'}</span>
                    </div>
                    <button 
                      onClick={() => setViewingHistoryPlan(plan)}
                      className="text-blue-500 hover:text-pink-500 font-black underline underline-offset-4"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Overlays */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg animate-in zoom-in duration-300">
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

      {viewingHistoryPlan && (
        <HistoryDetailsModal 
          plan={viewingHistoryPlan} 
          onClose={() => setViewingHistoryPlan(null)} 
        />
      )}
    </div>
  );
};

export default App;
