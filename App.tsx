
import React, { useState, useMemo } from 'react';
import { Stage, TrialConfig, Product, ParticipantInfo, TrialResult } from './types';
import { TRIALS } from './data';

/**
 * 外部定义 LikertScale 组件
 */
interface LikertProps {
  label: string;
  value: number | null;
  onChange: (val: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

const LikertScale: React.FC<LikertProps> = ({ label, value, onChange, minLabel = "非常低/不满意", maxLabel = "非常高/满意" }) => (
  <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
    <label className="block text-sm font-black text-slate-800 leading-tight">{label}</label>
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-1 py-4 rounded-xl border-2 font-black text-lg transition-all duration-200 ${
              value === num 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const shuffledTrials = useMemo(() => [...TRIALS].sort(() => Math.random() - 0.5), []);
  
  const [trialIndex, setTrialIndex] = useState(0);
  const [stage, setStage] = useState<Stage>(Stage.PARTICIPANT_INFO);
  
  const currentTrial: TrialConfig = shuffledTrials[trialIndex];
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [finalChoice, setFinalChoice] = useState<Product | null>(null);
  const [viewedProductIds, setViewedProductIds] = useState<string[]>([]);

  const [participant, setParticipant] = useState<ParticipantInfo>({
    id: '', runNumber: '', gender: '', age: ''
  });

  const [startTime, setStartTime] = useState<number>(0);
  const [backtrackCount, setBacktrackCount] = useState<number>(0);
  const [filterClicks, setFilterClicks] = useState<number>(0);
  const [allResults, setAllResults] = useState<TrialResult[]>([]);

  const [survey, setSurvey] = useState<{
    importance: number | null;
    skillLevel: number | null;
    satisfaction: number | null;
    efficiency: number | null;
    trust: number | null;
    timeSpent: string;
  }>({
    importance: null, skillLevel: null, satisfaction: null, efficiency: null, trust: null, timeSpent: ''
  });

  const handleNumericInput = (field: string, value: string, isParticipant: boolean = true) => {
    const sanitized = value.replace(/[^\d]/g, ''); 
    if (isParticipant) {
      setParticipant(prev => ({ ...prev, [field]: sanitized }));
    } else {
      setSurvey(prev => ({ ...prev, [field]: sanitized }));
    }
  };

  const startExperiment = () => {
    if (participant.id && participant.runNumber && participant.gender && participant.age) {
      setStage(Stage.INTRO);
    }
  };

  const startTrial = () => {
    setStartTime(Date.now());
    setViewedProductIds([]);
    setBacktrackCount(0);
    setFilterClicks(0);
    setStage(Stage.LEVEL1);
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    if (!viewedProductIds.includes(p.id)) {
      setViewedProductIds(prev => [...prev, p.id]);
    }
    setStage(Stage.LEVEL2);
  };

  const backToLevel1 = () => {
    setBacktrackCount(prev => prev + 1);
    setStage(Stage.LEVEL1);
  };

  const confirmChoice = (p: Product) => {
    if (viewedProductIds.length === currentTrial.products.length) {
      setFinalChoice(p);
      setStage(Stage.FINISH);
    }
  };

  const nextTrial = () => {
    const now = Date.now();
    const result: TrialResult = {
      Participant_ID: participant.id,
      Run_Number: participant.runNumber,
      Gender: participant.gender,
      Age: participant.age,
      Trial_ID: currentTrial.id,
      Trial_Type: currentTrial.type,
      Condition_N: currentTrial.objectCount,
      Condition_D: currentTrial.dimensionCount,
      Choice_Name: finalChoice?.name || '',
      Duration_Seconds: (now - startTime) / 1000,
      Backtrack_Count: backtrackCount,
      Filter_Clicks: filterClicks,
      Importance: survey.importance || 0,
      Skill_Level: survey.skillLevel || 0,
      Satisfaction: survey.satisfaction || 0,
      Efficiency: survey.efficiency || 0,
      Trust: survey.trust || 0,
      Daily_Time_Spent: survey.timeSpent
    };
    
    const newResults = [...allResults, result];
    setAllResults(newResults);

    if (trialIndex < shuffledTrials.length - 1) {
      setTrialIndex(trialIndex + 1);
      setStage(Stage.INTRO);
      setFinalChoice(null);
      setSelectedProduct(null);
      setViewedProductIds([]);
      setSurvey({ importance: null, skillLevel: null, satisfaction: null, efficiency: null, trust: null, timeSpent: '' });
    } else {
      setStage(Stage.EXPERIMENT_COMPLETE);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Participant_ID', 'Run_Number', 'Gender', 'Age', 'Trial_ID', 'Trial_Type', 
      'Condition_N', 'Condition_D', 'Choice_Name', 'Duration_Seconds', 
      'Backtrack_Count', 'Filter_Clicks', 'Importance', 'Skill_Level', 
      'Satisfaction', 'Efficiency', 'Trust', 'Daily_Time_Spent'
    ];

    const rows = allResults.map(r => [
      r.Participant_ID, r.Run_Number, r.Gender, r.Age, r.Trial_ID, r.Trial_Type,
      `"${r.Choice_Name}"`, r.Condition_N, r.Condition_D, r.Duration_Seconds.toFixed(2),
      r.Backtrack_Count, r.Filter_Clicks, r.Importance, r.Skill_Level,
      r.Satisfaction, r.Efficiency, r.Trust, r.Daily_Time_Spent
    ]);

    let csvContent = "\uFEFF"; 
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => { csvContent += row.join(",") + "\n"; });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_${participant.id}_Run${participant.runNumber}.csv`;
    link.click();
  };

  if (stage === Stage.PARTICIPANT_INFO) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white space-y-8 animate-in">
          <div className="text-center">
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">实验登记</h1>
             <p className="text-slate-400 text-sm mt-1 font-bold">请确保信息填写正确</p>
          </div>
          <div className="space-y-5">
            <input 
              type="text" placeholder="被试 ID (如 P01)" 
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
              value={participant.id} onChange={e => setParticipant({...participant, id: e.target.value})} 
            />
            <input 
              type="text" inputMode="numeric" placeholder="RUN 次数 (如 1)" 
              className="w-full border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
              value={participant.runNumber} onChange={e => handleNumericInput('runNumber', e.target.value)} 
            />
            <div className="grid grid-cols-2 gap-4">
              <select className="border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-700 appearance-none" value={participant.gender} onChange={e => setParticipant({...participant, gender: e.target.value as any})}>
                <option value="">性别</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
              <input 
                type="text" inputMode="numeric" placeholder="年龄" 
                className="border-2 border-slate-50 bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all" 
                value={participant.age} onChange={e => handleNumericInput('age', e.target.value)} 
              />
            </div>
          </div>
          <button onClick={startExperiment} disabled={!participant.id || !participant.runNumber || !participant.gender || !participant.age} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-100 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95">进入实验</button>
        </div>
      </div>
    );
  }

  if (stage === Stage.INTRO) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-10 space-y-8 animate-in">
          <div className="text-center space-y-3">
             <h2 className="text-2xl font-black text-slate-900">决策任务 ({trialIndex + 1}/{shuffledTrials.length})</h2>
             <div className="h-1.5 w-16 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <p className="text-sm font-black opacity-80 mb-2 flex items-center gap-2 uppercase tracking-widest">情境描述 (Scenario)</p>
              <p className="text-xl font-bold leading-relaxed italic">"{currentTrial.instruction}"</p>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white border-4 border-blue-500/30 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl shrink-0 flex items-center justify-center text-2xl shadow-lg">💡</div>
              <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">重要提醒 / KEY REMINDER</p>
                <p className="text-base font-bold text-slate-100 leading-relaxed">
                  请<span className="text-blue-400">尽可能代入真实生活</span>：根据上述条件，做出最<span className="underline underline-offset-4 decoration-blue-500">符合您日常生活习惯</span>的选择。
                </p>
              </div>
            </div>
          </div>

          <button onClick={startTrial} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all hover:bg-slate-800">准备好了，开始挑选</button>
        </div>
      </div>
    );
  }

  if (stage === Stage.LEVEL1) {
    return (
      <div className="min-h-screen bg-white p-6 pb-24 max-w-2xl mx-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 pb-4 border-b mb-8 pt-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">备选商品清单</h2>
            <span className="text-[11px] bg-blue-600 text-white px-3 py-1.5 rounded-full font-black shadow-lg shadow-blue-100">PROGRESS: {viewedProductIds.length}/{currentTrial.products.length}</span>
          </div>
          <div className="bg-orange-50 border-2 border-orange-100 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.2em] mb-1">Target Memo</p>
            <p className="text-base font-bold text-orange-900 leading-snug">{currentTrial.reminder}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5">
          {currentTrial.products.map(p => {
            const viewed = viewedProductIds.includes(p.id);
            return (
              <div key={p.id} onClick={() => selectProduct(p)} className={`group flex gap-5 border-2 rounded-3xl p-5 transition-all cursor-pointer relative ${viewed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1'}`}>
                {viewed && <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">VIEWED</div>}
                <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                   <img src={p.imageUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-1">{p.summary}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-red-500 font-black text-2xl">¥{p.price}</span>
                    <span className="text-blue-600 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">Details</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (stage === Stage.LEVEL2 && selectedProduct) {
    const isAllViewed = viewedProductIds.length === currentTrial.products.length;
    return (
      <div className="min-h-screen bg-white flex flex-col animate-in">
        <header className="p-6 border-b flex items-center gap-5 sticky top-0 bg-white/90 backdrop-blur-xl z-50">
          <button onClick={backToLevel1} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h2 className="font-black text-xl text-slate-900 leading-none">{selectedProduct.name}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Product Specifications</p>
          </div>
        </header>
        <div className="bg-orange-600 p-6 text-white shadow-inner">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Decision Goal</p>
           <p className="text-lg font-bold leading-tight">{currentTrial.reminder}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40">
           <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4">
              <h3 className="font-black text-xs text-blue-600 uppercase tracking-[0.3em]">Technical Specs</h3>
              <div className="space-y-4">
                {selectedProduct.attributes.map((attr, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                    <span className="text-slate-500 font-bold">{attr.label}</span>
                    <span className="font-black text-slate-900">{attr.value}</span>
                  </div>
                ))}
              </div>
           </div>
           <div className="px-4">
              <h3 className="font-black text-xs text-blue-600 uppercase tracking-[0.3em] mb-4">Description</h3>
              <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-6 text-base">"{selectedProduct.summary}"</p>
           </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-12 bg-white/80 backdrop-blur-md z-[60]">
           <div className="max-w-md mx-auto space-y-3">
              {!isAllViewed && (
                <p className="text-center text-[11px] text-orange-600 font-black uppercase tracking-widest animate-pulse">
                  ※ 查看所有选项详情后即可解锁购买按钮
                </p>
              )}
              <button 
                onClick={() => confirmChoice(selectedProduct)} 
                disabled={!isAllViewed}
                className={`w-full py-6 rounded-[2rem] font-black text-2xl transition-all shadow-2xl ${isAllViewed ? 'bg-red-600 text-white shadow-red-100 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
              >
                {isAllViewed ? `确认决策 (¥${selectedProduct.price})` : `请继续浏览其余产品`}
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (stage === Stage.FINISH) {
    const isComplete = survey.importance !== null && survey.skillLevel !== null && survey.satisfaction !== null && survey.efficiency !== null && survey.trust !== null && survey.timeSpent.trim() !== '';
    return (
      <div className="min-h-screen bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-xl mx-auto space-y-8 pb-20 pt-8">
          <div className="text-center bg-white p-10 rounded-[3rem] shadow-xl border border-white">
            <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">任务阶段完成</h2>
            <p className="text-slate-400 font-bold mt-2">最终决策：<span className="text-blue-600">"{finalChoice?.name}"</span></p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white space-y-10">
            <LikertScale label="1. 您认为刚才这项决策任务对您来说有多重要？" value={survey.importance} onChange={val => setSurvey({...survey, importance: val})} />
            <LikertScale label="2. 您认为自己进行此类决策的熟练度如何？" value={survey.skillLevel} onChange={val => setSurvey({...survey, skillLevel: val})} />
            <LikertScale label="3. 您对刚才做出的最终选择感到满意吗？" value={survey.satisfaction} onChange={val => setSurvey({...survey, satisfaction: val})} />
            <LikertScale label="4. 您觉得刚才的对比/决策过程是否高效？" value={survey.efficiency} onChange={val => setSurvey({...survey, efficiency: val})} />
            <LikertScale label="5. 您对本次实验提供的信息信赖程度如何？" value={survey.trust} onChange={val => setSurvey({...survey, trust: val})} />

            <div className="space-y-4 pt-4 border-t-2 border-slate-50">
              <label className="block text-sm font-black text-slate-800 uppercase tracking-wider">6. 日常生活中，做这类决定您通常耗时：</label>
              <div className="relative">
                <input 
                  type="text" inputMode="numeric"
                  className="w-full bg-slate-50 border-4 border-slate-50 rounded-3xl py-6 px-8 text-3xl font-black text-blue-600 focus:bg-white focus:border-blue-500 outline-none transition-all" 
                  placeholder="0" 
                  value={survey.timeSpent} 
                  onChange={e => handleNumericInput('timeSpent', e.target.value, false)} 
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">分钟</span>
              </div>
            </div>

            <button 
              onClick={nextTrial} 
              disabled={!isComplete} 
              className={`w-full py-7 rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl ${isComplete ? 'bg-blue-600 text-white shadow-blue-200 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
            >
              {trialIndex < shuffledTrials.length - 1 ? "保存并进入下一试次" : "完成实验并提交数据"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === Stage.EXPERIMENT_COMPLETE) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-32 h-32 bg-blue-600 rounded-[3rem] flex items-center justify-center mb-10 shadow-3xl shadow-blue-500/20 animate-pulse text-6xl">🎉</div>
        <h1 className="text-5xl font-black mb-6 tracking-tighter italic">EXPERIMENT COMPLETE</h1>
        <div className="bg-slate-800/50 backdrop-blur-md p-10 rounded-[3rem] border border-slate-700/50 mb-12 w-full max-w-lg text-left space-y-4">
          <p className="text-[10px] text-blue-400 uppercase font-black tracking-[0.5em] border-b border-slate-700 pb-4 mb-4">Participant Dossier</p>
          <div className="flex justify-between text-lg font-bold"><span>ID:</span><span className="text-blue-400 font-mono uppercase">{participant.id}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>RUN:</span><span className="text-blue-400 font-mono">{participant.runNumber}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>PROFILE:</span><span className="text-blue-400">{participant.gender} / {participant.age} AGE</span></div>
        </div>
        <button onClick={exportToCSV} className="bg-white text-slate-900 px-16 py-7 rounded-[3rem] font-black text-2xl shadow-3xl shadow-white/10 transition-all active:scale-[0.95] flex items-center gap-4 hover:bg-blue-50">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          EXPORT CSV DATA
        </button>
      </div>
    );
  }

  return null;
};

export default App;
