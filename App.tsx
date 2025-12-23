
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
  
  // 状态：AI 导师是否已连接
  const [isAiActive, setIsAiActive] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      // 1. 优先检查 Vercel 注入的环境变量
      const envKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
      if (envKey && envKey.length > 5) {
        setIsAiActive(true);
        return;
      }

      // 2. 备选检查 AI Studio 环境
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsAiActive(hasKey);
      }
    };

    checkKey();
    const timer = setInterval(checkKey, 2000); // 持续检测，确保即时生效
    return () => clearInterval(timer);
  }, []);

  const handleConnectAi = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setIsAiActive(true);
      } catch (e) {
        console.error("授权失败", e);
      }
    } else {
      alert("✨ 导师贴士：\n\n请点击 Vercel 部署页面的 'Create Deployment' 重新部署。一旦部署完成，这个按钮就会自动消失！");
    }
  };

  // 本地存储
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
    <div className="min-h-screen bg-[#FDF8FB] pb-24 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-pink-500 tracking-tight flex items-center gap-2">
              ZenInvest <span className="text-xl">🌸</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 font-black uppercase tracking-widest">每一笔交易都是一次内心的修行</p>
          </div>
          {!isAiActive && (
             <button 
              onClick={handleConnectAi}
              className="bg-blue-500 hover:bg-blue-600 text-white text-[11px] px-4 py-1.5 rounded-full font-bold animate-pulse shadow-lg shadow-blue-200 transition-all"
             >
               ✨ 激活 AI 导师
             </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 font-bold uppercase">修行胜率</p>
            <p className="font-black text-pink-500 text-lg">{winRate}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-500 font-black shadow-inner">
            {stats.total}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-pink-300 p-8 rounded-[32px] text-white shadow-2xl shadow-pink-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl rotate-12 transition-transform group-hover:rotate-45 duration-700">📈</div>
            <p className="opacity-80 text-xs font-bold uppercase tracking-widest">累计盈亏 (Realized P&L)</p>
            <h3 className="text-5xl font-black mt-2">¥ {stats.totalPL.toFixed(2)}</h3>
            <div className="mt-6 flex gap-3">
               <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">长期主义</span>
               <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">知行合一</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] cute-shadow flex flex-col justify-center border border-pink-50/50">
            <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest flex justify-between items-center mb-4">
              <span>心路曲线</span>
              <span className="text-[10px] bg-blue-50 text-blue-400 px-3 py-1 rounded-full italic font-bold uppercase">Equity Curve</span>
            </h4>
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

        {/* AI Key Status Hint - Only show if not fully active */}
        {!isAiActive && (
          <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <span className="text-3xl">🧩</span>
              <div>
                <p className="text-sm text-amber-800 font-bold">钥匙已就位，等待重新部署</p>
                <p className="text-[11px] text-amber-600 mt-1 leading-relaxed">
                  请点击 Vercel 后台的 <b>Create Deployment</b> 按钮。只需一次，AI 导师便会永久激活。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Investment Rules Reminder */}
        <div className="bg-white p-5 rounded-[24px] border border-blue-50 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-xl">🧘‍♂️</div>
          <div>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">牛散心法</p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              恐惧源于未知，贪婪源于无知。严格遵守止损计划是保护账户安全的唯一护身符。
            </p>
          </div>
        </div>

        {/* Trade List Sections */}
        <section className="pt-4">
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">进行中的修行</h2>
              <span className="bg-pink-100 text-pink-500 text-[11px] px-3 py-1 rounded-full font-black">
                {plans.filter(p => p.status !== TradeStatus.CLOSED).length} ACTIVE
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {plans.filter(p => p.status !== TradeStatus.CLOSED).length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-pink-100 flex flex-col items-center gap-6">
                <div className="text-6xl animate-bounce">🌱</div>
                <div className="space-y-2">
                  <p className="text-lg font-black text-gray-700">虚位以待</p>
                  <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">冷静观察，等待属于你的出手机会，不要为了交易而交易。</p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-500 text-white px-10 py-4 rounded-[20px] font-black hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                  开启第一笔修行计划
                </button>
              </div>
            )}
            {plans.filter(p => p.status !== TradeStatus.CLOSED).map(plan => {
              const { rr, rewardPct } = calculateRR(plan);
              return (
                <div key={plan.id} className="bg-white p-6 rounded-[32px] cute-shadow border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-pink-50/20 transition-all border-l-[12px] border-l-pink-400">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${plan.side === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {plan.side === 'BUY' ? 'LONG' : 'SHORT'}
                      </span>
                      <h3 className="font-black text-xl text-gray-800">{plan.symbol}</h3>
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-500 text-[10px] px-3 py-1 rounded-full font-black">
                        <span>赔率</span>
                        <span>1:{rr}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold">
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span><span className="text-gray-400 uppercase">Entry</span> <span className="text-gray-700">{plan.entryPrice}</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span><span className="text-gray-400 uppercase">Stop</span> <span className="text-red-400">{plan.stopLoss}</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span><span className="text-gray-400 uppercase">Target</span> <span className="text-green-500">{plan.targetPrice}</span> <span className="text-[10px] text-green-300">(+{rewardPct}%)</span></div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                     <button 
                      onClick={() => setReviewingPlan(plan)}
                      className="w-full bg-blue-500 text-white px-8 py-3 rounded-[18px] text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                      结单复盘
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pt-8 pb-12">
          <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 px-2">
            <span>修行历程</span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </h2>
          <div className="space-y-6">
            {closedPlans.length === 0 && (
              <p className="text-center text-gray-300 py-12 font-medium italic">暂无历史，等待第一枚勋章...</p>
            )}
            {closedPlans.map(plan => {
              const profitValue = plan.profitAndLoss || 0;
              const plPct = (( profitValue / (plan.entryPrice) ) * 100).toFixed(2);
              const isWin = profitValue >= 0;
              return (
                <div key={plan.id} className="bg-white p-8 rounded-[40px] border border-gray-50 cute-shadow/30 overflow-hidden relative group transition-all hover:border-pink-200">
                  <div className={`absolute top-0 right-0 p-4 font-black text-[80px] leading-none opacity-[0.03] select-none ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                    {isWin ? 'WIN' : 'LOSS'}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6 relative z-10">
                    <div className="mb-4 sm:mb-0">
                      <span className="text-gray-400 text-[10px] font-black uppercase bg-gray-50 px-3 py-1 rounded-full mb-3 inline-block tracking-widest">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                      <h3 className="font-black text-2xl text-gray-800 flex items-center gap-2">
                        {plan.symbol} <span className="text-xs font-bold text-gray-400 px-2 py-0.5 border border-gray-100 rounded-lg">{plan.side === 'BUY' ? '做多' : '做空'}</span>
                      </h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`text-3xl font-black ${ isWin ? 'text-green-500' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}¥{profitValue.toFixed(2)}
                      </div>
                      <div className={`text-sm font-black mt-1 px-3 py-0.5 rounded-full inline-block ${ isWin ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                        {plPct}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-[28px] border border-gray-100 mb-6 group-hover:from-blue-50/50 transition-all relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">🤖</div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Mentor Analysis</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic font-medium">
                      {plan.aiAnalysis || "导师正在赶来的路上..."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 relative z-10">
                    <div className="flex gap-6">
                      <div className="flex flex-col"><span className="opacity-50 mb-0.5 uppercase">Entry</span><span className="text-gray-600 text-xs">{plan.entryPrice}</span></div>
                      <div className="flex flex-col"><span className="opacity-50 mb-0.5 uppercase">Exit</span><span className="text-gray-600 text-xs">{plan.exitPrice}</span></div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                      <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px]">
                        {plan.strategy}
                      </div>
                      <button 
                        onClick={() => setViewingHistoryPlan(plan)}
                        className="text-blue-500 hover:text-pink-500 transition-colors font-black underline underline-offset-4"
                      >
                        详情
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

      {/* Mobile-first FAB */}
      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-pink-500 text-white rounded-[28px] flex items-center justify-center shadow-2xl shadow-pink-300 transform transition-all hover:scale-110 active:scale-90 z-40 border-8 border-white group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default App;
