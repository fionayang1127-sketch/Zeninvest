
import React, { useState, useEffect, useMemo } from 'react';
import { InvestmentPlan, TradeStatus, User } from './types';
import PlanForm from './components/PlanForm';
import ReviewModal from './components/ReviewModal';
import HistoryDetailsModal from './components/HistoryDetailsModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ZEN_QUOTES = [
  "交易不是为了击败市场，而是为了在市场中生存并认识自己。",
  "止损是投资者的护命符，没有止损的交易如同在悬崖边蒙眼奔跑。",
  "耐心是最高级的纪律，等待合适的入场机会比匆忙进场更重要。",
  "不要因为一次盈利而骄傲，也不要因为一次亏损而气馁，执行力才是唯一的标准。",
  "仓位管理是牛散的护城河，永远不要让单笔交易决定你的生死。",
  "复盘是投资修行中最枯燥但也最有价值的部分，它能帮你剔除习惯性的错误。",
  "市场不会同情弱者，它只奖赏那些能够控制自己情绪的冷静观察者。",
  "在贪婪时保持警惕，在恐惧时寻找价值，这是逆向思维的精髓。",
  "规则的制定是为了执行，如果总是打破规则，那么规则只是摆设。",
  "成功的投资者不是那些从不犯错的人，而是那些犯错后能迅速修正并学习的人。"
];

const ZEN_SUBTITLES = [
  "不以物喜，不以己悲",
  "守正出奇，静待时机",
  "克服人性，尊重市场",
  "专注复利，拥抱时间",
  "简单交易，极致纪律",
  "洞察本质，远离喧嚣",
  "心如止水，手如磐石",
  "规则至上，概率为王",
  "独立思考，知行合一",
  "宁静致远，稳健前行"
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reviewingPlan, setReviewingPlan] = useState<InvestmentPlan | null>(null);
  const [viewingHistoryPlan, setViewingHistoryPlan] = useState<InvestmentPlan | null>(null);

  // 随机心法与描述
  const { currentQuote, currentSubtitle } = useMemo(() => {
    const quoteIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
    const subtitleIndex = Math.floor(Math.random() * ZEN_SUBTITLES.length);
    return {
      currentQuote: ZEN_QUOTES[quoteIndex],
      currentSubtitle: ZEN_SUBTITLES[subtitleIndex]
    };
  }, [currentUser]); // 用户切换时也刷新一下心情

  // 1. 处理登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    
    const usersJson = localStorage.getItem('zen_invest_users') || '[]';
    const users: User[] = JSON.parse(usersJson);
    let user = users.find(u => u.name === usernameInput.trim());
    
    if (!user) {
      user = { id: Date.now().toString(), name: usernameInput.trim(), lastLogin: Date.now() };
      users.push(user);
    } else {
      user.lastLogin = Date.now();
    }
    
    localStorage.setItem('zen_invest_users', JSON.stringify(users));
    setCurrentUser(user);
    localStorage.setItem('zen_invest_last_user', user.id);
  };

  // 2. 自动恢复上次登录状态
  useEffect(() => {
    const lastUserId = localStorage.getItem('zen_invest_last_user');
    if (lastUserId) {
      const users: User[] = JSON.parse(localStorage.getItem('zen_invest_users') || '[]');
      const user = users.find(u => u.id === lastUserId);
      if (user) setCurrentUser(user);
    }
  }, []);

  // 3. 根据当前用户加载数据
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`zen_invest_plans_${currentUser.id}`);
      if (saved) {
        setPlans(JSON.parse(saved));
      } else {
        setPlans([]); // 新用户初始化为空
      }
    }
  }, [currentUser]);

  // 4. 数据保存（用户维度隔离）
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`zen_invest_plans_${currentUser.id}`, JSON.stringify(plans));
    }
  }, [plans, currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zen_invest_last_user');
    setPlans([]);
  };

  const addPlan = (plan: InvestmentPlan) => {
    setPlans([plan, ...plans]);
    setShowForm(false);
  };

  const updatePlan = (updatedPlan: InvestmentPlan) => {
    setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setReviewingPlan(null);
  };

  const deletePlan = (id: string) => {
    if (window.confirm('确定要删除这笔修行记录吗？数据删除后无法恢复哦。')) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const closedPlans = plans.filter(p => p.status === TradeStatus.CLOSED);
  
  const chartData = useMemo(() => {
    let cumulative = 0;
    const sorted = [...closedPlans].sort((a, b) => a.createdAt - b.createdAt);
    const data = [{ displayDate: '起点', cumulative: 0 }];
    sorted.forEach(p => {
      cumulative += (p.profitAndLoss || 0);
      data.push({
        displayDate: new Date(p.createdAt).toLocaleDateString(),
        cumulative: Number(cumulative.toFixed(2))
      });
    });
    return data;
  }, [closedPlans]);

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
    return { rr };
  };

  // 未登录状态展示“修行门扉”
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDF8FB] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[48px] cute-shadow text-center space-y-8 animate-in zoom-in duration-500">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl shadow-xl shadow-pink-100">🌸</div>
            <h1 className="text-3xl font-black text-pink-500 tracking-tighter pt-4">ZenInvest</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">开启你的投资修行之路</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-black text-gray-400 uppercase ml-2 mb-2 block">修行者代号</label>
              <input 
                autoFocus
                type="text"
                placeholder="请输入你的代号 (如: 牛散小白)"
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-pink-300 focus:bg-white rounded-2xl outline-none transition-all font-bold text-center"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-pink-400 hover:bg-pink-500 text-white font-black rounded-2xl shadow-lg shadow-pink-100 transition-all transform active:scale-95"
            >
              进入禅定状态 🚀
            </button>
          </form>
          
          <p className="text-[10px] text-gray-300 leading-relaxed italic">
            "每一个伟大的交易者，最初都只是一名守纪律的修行者。"
          </p>
        </div>
      </div>
    );
  }

  // 已登录状态展示主界面
  return (
    <div className="min-h-screen bg-[#FDF8FB] pb-24 font-sans text-gray-700 selection:bg-pink-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-pink-100">🌸</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-pink-500 tracking-tight">ZenInvest</h1>
              <span className="text-[10px] bg-blue-50 text-blue-400 px-2 py-0.5 rounded-full font-black">@{currentUser.name}</span>
            </div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{currentSubtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-gray-400 font-black uppercase">本期胜率</p>
            <p className="font-black text-pink-500 text-lg leading-none mt-1">{winRate}%</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-pink-200 hover:scale-110 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-all active:scale-95"
            title="退出修行"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-pink-300 p-8 rounded-[40px] text-white shadow-2xl shadow-pink-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl font-black rotate-12 transition-transform group-hover:rotate-0 select-none">ZEN</div>
            <p className="opacity-80 text-[10px] font-black uppercase tracking-widest">累计修行收益 (P&L)</p>
            <h3 className="text-5xl font-black mt-2 tracking-tighter">¥ {stats.totalPL.toFixed(2)}</h3>
          </div>
          
          <div className="bg-white p-4 rounded-[40px] cute-shadow flex flex-col justify-center border border-pink-50/50 min-h-[160px]">
            {chartData.length > 1 ? (
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#AEC6CF" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#AEC6CF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="displayDate" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                      labelStyle={{ color: '#999', marginBottom: '4px' }}
                      formatter={(value: number) => [`¥${value}`, '累计盈亏']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#AEC6CF" 
                      fillOpacity={1} 
                      fill="url(#colorCum)" 
                      strokeWidth={3} 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300 h-full">
                <span className="text-3xl mb-1">📈</span>
                <p className="text-[10px] font-black uppercase tracking-widest">权益曲线加载中</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Rule Quote */}
        <div className="bg-white p-6 rounded-[32px] border border-blue-50 shadow-sm flex items-start gap-4 hover:border-pink-100 transition-all group">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform shadow-inner">💡</div>
          <div className="flex-1">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">牛散修行心法</p>
            <p className="text-sm text-gray-500 leading-relaxed font-medium italic">
              “{currentQuote}”
            </p>
          </div>
        </div>

        {/* Active Trades */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-black text-gray-800">当前修行</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase">{plans.filter(p => p.status !== TradeStatus.CLOSED).length} Active</span>
          </div>
          
          <div className="space-y-4">
            {plans.filter(p => p.status !== TradeStatus.CLOSED).length === 0 && (
              <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-pink-50 flex flex-col items-center gap-4">
                <span className="text-5xl grayscale opacity-30">🍵</span>
                <p className="text-sm text-gray-300 font-bold">现在是空仓观察期，保持平和。</p>
              </div>
            )}
            {plans.filter(p => p.status !== TradeStatus.CLOSED).map(plan => {
              const { rr } = calculateRR(plan);
              return (
                <div key={plan.id} className="bg-white p-6 rounded-[32px] cute-shadow border border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 border-l-[12px] border-l-blue-200 hover:scale-[1.01] transition-transform relative group">
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${plan.side === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {plan.side === 'BUY' ? '做多' : '做空'}
                      </span>
                      <h3 className="font-black text-xl text-gray-800 tracking-tight">{plan.symbol}</h3>
                    </div>
                    <div className="flex justify-center sm:justify-start gap-4 text-xs font-black text-gray-400 uppercase tracking-tighter">
                      <span>入场: <b className="text-gray-700">{plan.entryPrice}</b></span>
                      <span>仓位: <b className="text-blue-500">{plan.positionSize}</b></span>
                      <span>盈亏比: <b className="text-pink-400">1:{rr}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setReviewingPlan(plan)}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-blue-400 to-blue-500 text-white px-10 py-3 rounded-2xl text-sm font-black hover:shadow-lg hover:shadow-blue-100 transition-all active:scale-95"
                    >
                      结单复盘
                    </button>
                    <button 
                      onClick={() => deletePlan(plan.id)}
                      className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      title="取消计划"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className="pt-8">
           <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black text-gray-800">修行成果 (历史)</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4"></div>
          </div>
          <div className="space-y-6">
            {closedPlans.map(plan => {
              const profitValue = plan.profitAndLoss || 0;
              const isWin = profitValue >= 0;
              return (
                <div key={plan.id} className="bg-white p-8 rounded-[40px] border border-gray-50 cute-shadow/20 relative group transition-all hover:bg-pink-50/10">
                  <button 
                    onClick={() => deletePlan(plan.id)}
                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="flex justify-between items-start mb-6 pr-8">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(plan.createdAt).toLocaleDateString()}</p>
                      <h3 className="font-black text-2xl text-gray-800 mt-1">{plan.symbol}</h3>
                    </div>
                    <div className={`text-3xl font-black ${ isWin ? 'text-green-500' : 'text-red-400'}`}>
                      {isWin ? '+' : ''}¥{profitValue.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 mb-6 group-hover:bg-white transition-colors text-sm text-gray-600 italic font-medium">
                     {plan.reviewNotes || "未留下复盘感悟。"}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex gap-4 font-black uppercase text-gray-400">
                       <span className="bg-blue-50 text-blue-400 px-2 py-0.5 rounded-md">{plan.strategy}</span>
                       <span className={`px-2 py-0.5 rounded-md ${plan.side === 'BUY' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                         {plan.side === 'BUY' ? '做多' : '做空'}
                       </span>
                    </div>
                    <button 
                      onClick={() => setViewingHistoryPlan(plan)}
                      className="text-pink-400 hover:text-pink-600 font-black underline underline-offset-4 decoration-2"
                    >
                      详情
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modals */}
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
