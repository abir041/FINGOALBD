import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  ArrowUpRight, 
  Wallet,
  Settings2,
  Calculator,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  TableProperties,
  Sparkles,
  ArrowRightCircle,
  BrainCircuit,
  Lightbulb,
  AlertCircle,
  Loader2,
  CalendarDays,
  Info
} from 'lucide-react';

const apiKey = ""; // Environment provides this at runtime

/**
 * FORMATTER UTILITY
 * Handles BDT/Indian numbering system (e.g., 10,00,000)
 */
const formatBDT = (num) => {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
};

/**
 * CUSTOM INPUT COMPONENT
 * Enhanced with better UX for currency formatting and focus states.
 */
const InputField = ({ label, value, onChange, prefix, suffix, tooltip }) => {
  const inputRef = useRef(null);
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (inputRef.current && value !== lastExternalValue.current) {
      if (document.activeElement !== inputRef.current) {
        inputRef.current.value = value === 0 ? "" : formatBDT(value);
      }
      lastExternalValue.current = value;
    }
  }, [value]);

  const handleInput = (e) => {
    let rawVal = e.target.value;
    let cleaned = rawVal.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    const parsed = parseFloat(cleaned);
    const newValue = isNaN(parsed) ? 0 : parsed;
    
    if (!cleaned.endsWith('.')) {
      e.target.value = cleaned === "" ? "" : formatBDT(newValue);
    }
    lastExternalValue.current = newValue;
    onChange(newValue);
  };

  return (
    <div className="group space-y-1.5 w-full">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-emerald-500 transition-colors">
          {label}
        </label>
        {tooltip && (
          <div className="relative group/tooltip">
            <Info className="w-3 h-3 text-slate-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">{prefix}</span>}
        <input 
          ref={inputRef}
          type="text"
          inputMode="decimal"
          defaultValue={value === 0 ? "" : formatBDT(value)}
          onInput={handleInput}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dps'); 
  const [showLoanTable, setShowLoanTable] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState(null);
  const currency = '৳';
  
  const [dpsInputs, setDpsInputs] = useState({ monthly: 10000, initial: 50000, rate: 8.5, years: 5, tax: 15 });
  const [goalInputs, setGoalInputs] = useState({ target: 5000000, initial: 200000, rate: 10, years: 10 });
  const [loanInputs, setLoanInputs] = useState({ amount: 1500000, rate: 11, years: 15, extra: 0 });

  // --- Calculations ---
  const dpsResults = useMemo(() => {
    const r = (Number(dpsInputs.rate) || 0) / 100 / 12;
    const n = (Number(dpsInputs.years) || 0) * 12;
    const p = Number(dpsInputs.monthly) || 0;
    let balance = Number(dpsInputs.initial) || 0;
    const data = [];
    
    for (let i = 1; i <= n; i++) {
      balance = (balance + p) * (1 + r);
      if (i % 6 === 0 || i === n) {
        data.push({ 
          label: i === n ? `Year ${i/12}` : `${i}m`, 
          balance: Math.round(balance),
          invested: (Number(dpsInputs.initial) || 0) + (p * i)
        });
      }
    }
    const totalInvested = (Number(dpsInputs.initial) || 0) + (p * n);
    const profit = balance - totalInvested;
    const net = balance - (profit * ((Number(dpsInputs.tax) || 0) / 100));
    return { balance, totalInvested, net, data };
  }, [dpsInputs]);

  const goalResults = useMemo(() => {
    const target = Number(goalInputs.target) || 0;
    const initial = Number(goalInputs.initial) || 0;
    const r = (Number(goalInputs.rate) || 0) / 100 / 12;
    const n = (Number(goalInputs.years) || 0) * 12;
    
    const futureValueInitial = initial * Math.pow(1 + r, n);
    const amountToCoverByMonthly = target - futureValueInitial;
    
    let requiredMonthly = 0;
    if (amountToCoverByMonthly > 0) {
      const annuityFactor = r === 0 ? n : (Math.pow(1 + r, n) - 1) / r;
      requiredMonthly = amountToCoverByMonthly / annuityFactor;
    }
    
    const chartData = [];
    let currentBalance = initial;
    for (let i = 1; i <= n; i++) {
      currentBalance = (currentBalance + requiredMonthly) * (1 + r);
      if (i % 12 === 0 || i === n) chartData.push({ year: i/12, balance: Math.round(currentBalance) });
    }
    
    return { 
      requiredMonthly, 
      totalContribution: initial + (requiredMonthly * n), 
      totalEarnings: target - (initial + (requiredMonthly * n)), 
      chartData 
    };
  }, [goalInputs]);

  const loanResults = useMemo(() => {
    const P = Number(loanInputs.amount) || 0;
    const r = ((Number(loanInputs.rate) || 0) / 100) / 12;
    const n_original = (Number(loanInputs.years) || 0) * 12;
    const extra = Number(loanInputs.extra) || 0;

    const standardEmi = (P > 0 && n_original > 0) ? 
      (r === 0 ? P/n_original : P * r * Math.pow(1 + r, n_original) / (Math.pow(1 + r, n_original) - 1)) : 0;
    
    const totalCostWithoutExtra = standardEmi * n_original;
    const totalInterestWithoutExtra = totalCostWithoutExtra - P;

    let balance = P;
    let totalInterestWithExtra = 0;
    let monthsElapsed = 0;
    const schedule = [];
    
    for (let i = 1; i <= 600 && balance > 0.01; i++) {
      const interest = balance * r;
      const payment = Math.min(balance + interest, standardEmi + extra);
      const appliedPrincipal = payment - interest;
      
      const openingBalance = balance;
      balance = Math.max(0, balance - appliedPrincipal);
      totalInterestWithExtra += interest;
      monthsElapsed = i;

      if (i % 6 === 0 || balance <= 0) {
        schedule.push({ 
          month: i, 
          opening: openingBalance, 
          emi: payment, 
          principal: appliedPrincipal, 
          interest: interest, 
          closing: balance 
        });
      }
      if (balance <= 0) break;
    }

    return { 
        emi: standardEmi, 
        totalInterest: totalInterestWithExtra, 
        totalPayout: P + totalInterestWithExtra, 
        actualYears: monthsElapsed / 12, 
        schedule,
        interestSaved: Math.max(0, totalInterestWithoutExtra - totalInterestWithExtra),
        yearsSaved: Math.max(0, (n_original - monthsElapsed) / 12)
    };
  }, [loanInputs]);

  // --- AI Strategy Generator (Gemini 2.5 Flash) ---
  const generateAiInsight = async () => {
    setLoadingAi(true);
    setError(null);
    let prompt = "";
    
    if (activeTab === 'dps') {
      prompt = `Analyze this DPS plan for a user in Bangladesh: Monthly savings ৳${dpsInputs.monthly}, Initial ৳${dpsInputs.initial}, Rate ${dpsInputs.rate}%, for ${dpsInputs.years} years. Tax is ${dpsInputs.tax}%. Provide 3 actionable expert tips for wealth maximization, tax efficiency (mention Sanchayapatra or specific bank products like DBBL/City Bank if relevant), and inflation protection. Use bullet points.`;
    } else if (activeTab === 'goal') {
      prompt = `A user wants to reach ৳${goalInputs.target} in ${goalInputs.years} years with ৳${goalInputs.initial} start. They need ৳${Math.round(goalResults.requiredMonthly)} monthly at ${goalInputs.rate}% return. Is this realistic in Bangladesh? Suggest asset allocation between DPS, Shariah-compliant funds, and Capital Market. Explain the 'Rule of 72' briefly for their target.`;
    } else {
      prompt = `Loan Analysis: ৳${loanInputs.amount} at ${loanInputs.rate}% for ${loanInputs.years} years. Extra monthly ৳${loanInputs.extra}. The system shows they save ${loanResults.yearsSaved.toFixed(1)} years. Should they pay extra or invest that ৳${loanInputs.extra} in a 9% return DPS instead? Give a clear "Verdict" based on the interest saved vs potential investment gains.`;
    }

    try {
      const getAiResponse = async (retryCount = 0) => {
        const delays = [1000, 2000, 4000, 8000, 16000];
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: "You are 'FinGoal Strategist', an elite Bangladeshi Financial Advisor. Provide deep, data-driven insights. Mention BDT context (Bangladesh Bank rules, local tax, inflation). Use bold text for numbers." }] }
            })
          });
          const result = await response.json();
          return result.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (err) {
          if (retryCount < 5) {
            await new Promise(res => setTimeout(res, delays[retryCount]));
            return getAiResponse(retryCount + 1);
          }
          throw err;
        }
      };

      const text = await getAiResponse();
      setAiInsight(text || "Strategy Engine returned no data.");
    } catch (err) {
      setError("AI Strategy service is briefly busy. Please try again in a moment.");
    } finally {
      setLoadingAi(false);
    }
  };

  const StatCard = ({ label, value, color, icon: Icon, subtext, trend }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-2xl ${color} bg-opacity-10 text-current`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
          {value}
        </h3>
        {subtext && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter leading-none text-slate-900">
                FINGOAL <span className="text-emerald-500">BDT</span>
              </h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mt-1">
                Advanced Wealth Intelligence
              </span>
            </div>
          </div>

          <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 items-center border border-slate-200 shadow-inner">
            {['dps', 'goal', 'loan'].map(id => (
              <button 
                key={id} 
                onClick={() => { setActiveTab(id); setAiInsight(""); setError(null); }}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap ${activeTab === id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {id === 'dps' ? 'DPS Optimizer' : id === 'goal' ? 'Goal Planner' : 'Debt Shredder'}
              </button>
            ))}
          </div>

          <button 
            onClick={generateAiInsight}
            disabled={loadingAi}
            className="group relative flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase overflow-hidden hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-white/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-emerald-400" />}
            Get Smart Strategy
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[11px] font-black uppercase flex items-center gap-2 text-slate-900 tracking-widest">
                <Settings2 className="w-4 h-4 text-emerald-500" /> Plan parameters
              </h2>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            <div className="space-y-6">
              {activeTab === 'dps' && (
                <>
                  <InputField label="Initial Principal" value={dpsInputs.initial} onChange={v => setDpsInputs(p=>({...p, initial: v}))} prefix={currency} tooltip="Lump sum amount you start with today." />
                  <InputField label="Monthly Contribution" value={dpsInputs.monthly} onChange={v => setDpsInputs(p=>({...p, monthly: v}))} prefix={currency} tooltip="Regular savings amount per month." />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Tenure" value={dpsInputs.years} onChange={v => setDpsInputs(p=>({...p, years: v}))} suffix="Years" />
                    <InputField label="Yearly Rate" value={dpsInputs.rate} onChange={v => setDpsInputs(p=>({...p, rate: v}))} suffix="%" />
                  </div>
                  <InputField label="AIT / Tax on Profit" value={dpsInputs.tax} onChange={v => setDpsInputs(p=>({...p, tax: v}))} suffix="%" tooltip="Govt Tax on bank interest (10% with TIN, 15% without)." />
                </>
              )}
              {activeTab === 'goal' && (
                <>
                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-4">
                    <InputField label="Your Financial Target" value={goalInputs.target} onChange={v => setGoalInputs(p=>({...p, target: v}))} prefix={currency} />
                  </div>
                  <InputField label="Current Savings" value={goalInputs.initial} onChange={v => setGoalInputs(p=>({...p, initial: v}))} prefix={currency} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Time Horizon" value={goalInputs.years} onChange={v => setGoalInputs(p=>({...p, years: v}))} suffix="Years" />
                    <InputField label="Target Return" value={goalInputs.rate} onChange={v => setGoalInputs(p=>({...p, rate: v}))} suffix="%" />
                  </div>
                </>
              )}
              {activeTab === 'loan' && (
                <>
                  <InputField label="Loan Principal" value={loanInputs.amount} onChange={v => setLoanInputs(p=>({...p, amount: v}))} prefix={currency} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Interest Rate" value={loanInputs.rate} onChange={v => setLoanInputs(p=>({...p, rate: v}))} suffix="%" />
                    <InputField label="Original Term" value={loanInputs.years} onChange={v => setLoanInputs(p=>({...p, years: v}))} suffix="Years" />
                  </div>
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <InputField label="Prepayment (Monthly Extra)" value={loanInputs.extra} onChange={v => setLoanInputs(p=>({...p, extra: v}))} prefix={currency} tooltip="Additional payment to reduce principal faster." />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Strategy Box */}
          {(aiInsight || error) && (
            <div className={`p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 ${error ? 'bg-rose-50 border border-rose-100 text-rose-900' : 'bg-slate-900 text-white'}`}>
              {!error && <div className="absolute top-0 right-0 p-6 opacity-10"><BrainCircuit className="w-20 h-20" /></div>}
              
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${error ? 'text-rose-600' : 'text-emerald-400'}`}>
                {error ? <AlertCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {error ? "System Error" : "FinGoal Strategist Insight"}
              </h3>
              
              <div className={`text-[13px] leading-relaxed font-medium whitespace-pre-line ${error ? '' : 'text-slate-300'}`}>
                {error || aiInsight}
              </div>
            </div>
          )}
        </div>

        {/* Dashboards */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'dps' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Maturity Value" value={`${currency}${formatBDT(dpsResults.balance)}`} color="text-emerald-500" icon={TrendingUp} subtext="Total before tax" />
                <StatCard label="Take Home (Net)" value={`${currency}${formatBDT(dpsResults.net)}`} color="text-indigo-500" icon={ShieldCheck} subtext="Post tax maturity" />
                <StatCard label="Savings Pool" value={`${currency}${formatBDT(dpsResults.totalInvested)}`} color="text-slate-800" icon={Wallet} subtext="Total capital put in" />
              </div>
              
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm group">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Wealth accumulation</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Growth trajectory vs invested capital</p>
                  </div>
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Value</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Capital</div>
                  </div>
                </div>
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dpsResults.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} tickFormatter={v => formatBDT(v)} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-2xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.label}</p>
                                <div className="space-y-1">
                                  <p className="text-xs flex justify-between gap-4"><span>Value:</span> <span className="font-bold text-emerald-400">{currency}{formatBDT(payload[0].value)}</span></p>
                                  <p className="text-xs flex justify-between gap-4"><span>Capital:</span> <span className="font-bold text-slate-300">{currency}{formatBDT(payload[1].value)}</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={4} fill="url(#colorBalance)" animationDuration={1500} />
                      <Area type="monotone" dataKey="invested" stroke="#E2E8F0" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'goal' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <StatCard label="Monthly Needed" value={`${currency}${formatBDT(goalResults.requiredMonthly)}`} color="text-emerald-600" icon={Sparkles} subtext="Auto-calculated" />
                </div>
                <StatCard label="Principal Contribution" value={`${currency}${formatBDT(goalResults.totalContribution)}`} color="text-slate-800" icon={Wallet} subtext="Total deposit" />
                <StatCard label="Market Gains" value={`${currency}${formatBDT(goalResults.totalEarnings)}`} color="text-amber-500" icon={ArrowUpRight} subtext="Compounded interest" />
              </div>
              
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 text-center space-y-6">
                <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-2">
                  <Target className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Goal is Within Reach</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                  By investing <span className="font-bold text-slate-900">{currency}{formatBDT(goalResults.requiredMonthly)}</span> every month at <span className="font-bold text-emerald-600">{goalInputs.rate}%</span>, 
                  you will successfully hit your <span className="font-bold text-slate-900">{currency}{formatBDT(goalInputs.target)}</span> target in {goalInputs.years} years.
                </p>
                <div className="pt-6 h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={goalResults.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="year" hide />
                      <Tooltip cursor={{fill: '#F8FAFC'}} content={({active, payload}) => {
                        if (active && payload) return <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-bold">{currency}{formatBDT(payload[0].value)}</div>
                        return null;
                      }}/>
                      <Bar dataKey="balance" radius={[10, 10, 0, 0]}>
                        {goalResults.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === goalResults.chartData.length - 1 ? '#10b981' : '#E2E8F0'} />
                        ))}
                      </Bar>
                    </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'loan' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Monthly EMI" value={`${currency}${formatBDT(loanResults.emi)}`} color="text-rose-500" icon={Calculator} subtext="Standard repayment" />
                <StatCard label="Total Interest" value={`${currency}${formatBDT(loanResults.totalInterest)}`} color="text-amber-500" icon={ArrowUpRight} subtext="Cost of borrowing" />
                <StatCard label="Years to Freedom" value={`${loanResults.actualYears.toFixed(1)} Yrs`} color="text-indigo-600" icon={Clock} subtext="Repayment horizon" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Composition */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Loan composition</h4>
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between text-[11px] font-black uppercase mb-3">
                        <span className="text-slate-500">Principal</span>
                        <span>{currency}{formatBDT(loanInputs.amount)}</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${(loanInputs.amount/loanResults.totalPayout)*100}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-black uppercase mb-3">
                        <span className="text-slate-500">Interest Cost</span>
                        <span>{currency}{formatBDT(loanResults.totalInterest)}</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{width: `${(loanResults.totalInterest/loanResults.totalPayout)*100}%`}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Payout</span>
                    <span className="text-lg font-black text-slate-900">{currency}{formatBDT(loanResults.totalPayout)}</span>
                  </div>
                </div>

                {/* Prepayment Magic */}
                <div className={`p-8 rounded-[2.5rem] border transition-all duration-700 overflow-hidden relative ${loanInputs.extra > 0 ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'bg-white border-slate-200 text-slate-900'}`}>
                  {loanInputs.extra > 0 && <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><ShieldCheck className="w-40 h-40" /></div>}
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2.5 rounded-xl ${loanInputs.extra > 0 ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Accelerated Debt-Exit</span>
                  </div>
                  
                  {loanInputs.extra > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-medium text-emerald-100 mb-1">Total Interest Saved</p>
                        <h4 className="text-4xl font-black tracking-tighter">{currency}{formatBDT(loanResults.interestSaved)}</h4>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase mb-1 text-emerald-200">Time Saved</p>
                        <p className="text-lg font-black">{loanResults.yearsSaved.toFixed(1)} Years Earlier</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center py-6 text-center space-y-4">
                        <p className="text-sm font-bold text-slate-400 italic">
                          "Try adding an extra monthly payment to see how much interest and time you can save."
                        </p>
                        <div className="w-12 h-1 px-1 bg-slate-100 mx-auto rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Repayment Table */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowLoanTable(!showLoanTable)}
                  className="w-full px-10 py-8 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white">
                      <TableProperties className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-black text-sm uppercase tracking-widest block">Detailed Amortization</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Repayment Month-by-month Schedule</span>
                    </div>
                  </div>
                  {showLoanTable ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
                </button>
                
                {showLoanTable && (
                  <div className="overflow-x-auto max-h-[500px] border-t border-slate-100 scrollbar-hide">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-900 text-white z-10">
                        <tr>
                          <th className="px-10 py-5 font-black uppercase tracking-widest">Month</th>
                          <th className="px-10 py-5 font-black uppercase tracking-widest">Principal</th>
                          <th className="px-10 py-5 font-black uppercase tracking-widest">Interest</th>
                          <th className="px-10 py-5 font-black uppercase tracking-widest text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loanResults.schedule.map((row) => (
                          <tr key={row.month} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="px-10 py-4 font-black text-slate-400">M-{row.month}</td>
                            <td className="px-10 py-4 font-black text-emerald-600">{currency}{formatBDT(row.principal)}</td>
                            <td className="px-10 py-4 font-black text-amber-500">{currency}{formatBDT(row.interest)}</td>
                            <td className="px-10 py-4 font-black text-slate-900 text-right">{currency}{formatBDT(row.closing)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-10 py-16 flex flex-col items-center gap-8 border-t border-slate-200 mt-10">
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div><span className="text-[10px] font-black uppercase tracking-widest">BDT Compliant</span></div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Gemini 2.5 Strategy</span></div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Compound Logic v4.0</span></div>
        </div>
        <div className="text-center space-y-2">
          <p className="opacity-30 text-[10px] font-black uppercase tracking-[0.6em]">
            FinGoal Intelligence Engine • South Asia Edition
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Values provided for projection only. Verify with your bank for final rates.</p>
        </div>
      </footer>
    </div>
  );
}
