
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
  
  // 仅作为内部参考，不再阻塞 UI
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
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
    checkKey();
  }, []);

  const handleConnectAi = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setIsAiConfigured(true);
      } catch (e) {
        console.error("授权失败", e);
      }
    } else {
      alert("✨ 导师提示：\n\n看起来你已经在 Vercel 配置了钥匙。如果复盘时提示失败，请回到 Vercel 点击 'Create Deployment' 确保配置生效。");
    }
  };

  // 数据持久化
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
    <div className="min-h-screen bg-[#FDF8FB] pb-24 font-sans text-gray-700">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-pink-500 tracking-tight flex items-center gap-2">
              ZenInvest <span className="text-xl">🌸</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 font-black uppercase tracking-widest">不以物喜，不以己悲</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 font-bold uppercase">修行胜率</p>
            <p className="font-black text-pink-500 text-lg">{winRate}%</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-pink-100 hover:scale-110 transition-transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-pink-300 p-8 rounded-[32px] text-white shadow-2xl shadow-pink-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl rotate-12 transition-transform group-hover:rotate-45 duration-700">📈</div>
            <p className="opacity-80 text-xs font-bold uppercase tracking-widest">累计收益 (Realized P&L)</p>
            <h3 className="text-5xl font-black mt-2">¥ {stats.totalPL.toFixed(2)}</h3>
            <div className="mt-6 flex gap-3">
               <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">保持耐心</span>
               <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">反思进取</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] cute-shadow flex flex-col justify-center border border-pink-50/50">
            <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest flex justify-between items-center mb-4">
              <span>资产曲线</span>
              <span className="text-[10px] bg-blue-50 text-blue-400 px-3 py-1 rounded-full italic font-bold">EQUITY</span>
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

        {/* Unified Rules Component */}
        <div className="bg-white p-5 rounded-[24px] border border-blue-50 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-xl">🧘‍♂️</div>
          <div className="flex-1">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">牛散寄语</p>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              不要预测市场，要应对市场。你的任务不是赚钱，而是执行计划，盈利只是正确执行的副产品。
            </p>
          </div>
          {!isAiConfigured && (
            <button 
              onClick={handleConnectAi}
              className="text-[10px] bg-pink-50 text-pink-400 px-3 py-1 rounded-full font-black hover:bg-pink-100 transition-colors"
            >
              连接 AI
            </button>
          )}
        </div>

        {/* Active Trades */}
        <section className="pt-4">
          <h2 className="text-xl font-black text-gray-800 tracking-tight mb-6 px-2 flex items-center gap-2">
            进行中的单子
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md">
              {plans.filter(p => p.status !== TradeStatus.CLOSED).length}
            </span>
          </h2>
          
          <div className="space-y-4">
            {plans.filter(p => p.status !== TradeStatus.CLOSED).length === 0 && (
              <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-pink-100 flex flex-col items-center gap-6">
                <div className="text-6xl animate-bounce">🌱</div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-gray-700">现在是空仓时刻</p>
                  <p className="text-xs text-gray-400">耐心是投资中最高级的智慧。</p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-500 text-white px-8 py-3 rounded-[18px] font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
                >
                  创建新计划
                </button>
              </div>
            )}
            {plans.filter(p => p.status !== TradeStatus.CLOSED).map(plan => {
              const { rr, rewardPct } = calculateRR(plan);
              return (
                <div key={plan.id} className="bg-white p-6 rounded-[32px] cute-shadow border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-pink-50/20 transition-all border-l-[12px] border-l-pink-400">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${plan.side === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {plan.side === 'BUY' ? 'BUY' : 'SELL'}
                      </span>
                      <h3 className="font-black text-xl text-gray-800">{plan.symbol}</h3>
                      <div className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg font-black">
                        1:{rr} 赔率
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-gray-400">
                      <span>入场: <b className="text-gray-700">{plan.entryPrice}</b></span>
                      <span>止损: <b className="text-red-400">{plan.stopLoss}</b></span>
                      <span>目标: <b className="text-green-500">{plan.targetPrice}</b></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReviewingPlan(plan)}
                    className="w-full sm:w-auto bg-blue-500 text-white px-8 py-3 rounded-[18px] text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95"
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
          <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 px-2">
            <span>修行记录</span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </h2>
          <div className="space-y-6">
            {closedPlans.map(plan => {
              const profitValue = plan.profitAndLoss || 0;
              const isWin = profitValue >= 0;
              return (
                <div key={plan.id} className="bg-white p-8 rounded-[40px] border border-gray-50 cute-shadow/30 relative group transition-all hover:border-pink-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(plan.createdAt).toLocaleDateString()}</p>
                      <h3 className="font-black text-2xl text-gray-800 mt-1">{plan.symbol}</h3>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${ isWin ? 'text-green-500' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}¥{profitValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-gray-50 rounded-[28px] border border-gray-100 mb-6 group-hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs">🤖</span>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">导师点评</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      {plan.aiAnalysis || "点击详情查看点评..."}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[8px] text-gray-400 uppercase font-black">Entry</p>
                        <p className="text-xs font-bold">{plan.entryPrice}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-gray-400 uppercase font-black">Exit</p>
                        <p className="text-xs font-bold">{plan.exitPrice}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewingHistoryPlan(plan)}
                      className="text-blue-500 hover:text-pink-500 transition-colors text-xs font-black underline underline-offset-4"
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
