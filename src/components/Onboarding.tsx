import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookOpen, Shield, Ghost, Compass, Shuffle, Sparkles, Check, AlertCircle } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { onboardUser } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  // Avatar Options
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;

  // Pre-seed interest categories
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const interestCategories = [
    { name: 'Mystery', desc: 'Classic detective riddles & crime files', icon: Compass },
    { name: 'Horror', desc: 'Sinister secrets, dark corridors & ghosts', icon: Ghost },
    { name: 'Treasure Hunt', desc: 'Historical relics & long-forgotten gold', icon: Sparkles },
    { name: 'Conspiracy', desc: 'Classified archives & state leaks', icon: Shield },
    { name: 'Historical', desc: 'Diving deep into ancient scrolls & logs', icon: BookOpen }
  ];

  // Validate username is unique in database
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameValid(false);
      setUsernameError('Investigator code must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setIsUsernameValid(false);
      setUsernameError('Alpha-numeric characters and underscores only.');
      return;
    }

    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsUsernameValid(false);
          setUsernameError('Frequency code already claimed by another investigator.');
        } else {
          setIsUsernameValid(true);
          setUsernameError('');
        }
      } catch (err) {
        console.error("Collision check failed:", err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const handler = setTimeout(() => {
      checkAvailability();
    }, 400);

    return () => clearTimeout(handler);
  }, [username]);

  const handleToggleInterest = (category: string) => {
    if (selectedInterests.includes(category)) {
      setSelectedInterests(selectedInterests.filter(i => i !== category));
    } else {
      setSelectedInterests([...selectedInterests, category]);
    }
  };

  const randomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleOnboardComplete = async () => {
    try {
      await onboardUser(username, avatarUrl, selectedInterests);
    } catch (error) {
      console.error("Failed completing onboarding setup:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-neutral-105 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-neutral-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main card */}
      <div id="onboarding-module" className="relative w-full max-w-lg bg-[#121216] border border-white/5 rounded-xl shadow-2xl p-8 backdrop-blur-sm">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`h-1 rounded transition-all duration-300 ${
                i === step ? 'w-8 bg-amber-500' : i < step ? 'w-4 bg-teal-600' : 'w-4 bg-white/5'
              }`}
            ></div>
          ))}
        </div>

        {/* STEP 1: CHOOSE USERNAME */}
        {step === 1 && (
          <div id="step-username" className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">Investigator Registry</h2>
              <p className="text-xs text-neutral-400 mt-1">Claim your custom frequency code across the EchoVerse database.</p>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider block">Frequency Identifier (Username)</label>
              <div className="relative">
                <input
                  id="username-onboard-input"
                  type="text"
                  placeholder="e.g. shadow_clue_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                  className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/50 rounded p-3 text-sm text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition text-center"
                />
                <div className="absolute right-3 top-3.5">
                  {checkingUsername ? (
                    <div className="w-4 h-4 border-2 border-t-amber-500 border-white/10 rounded-full animate-spin"></div>
                  ) : username.length >= 3 && isUsernameValid ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : username.length >= 3 ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : null}
                </div>
              </div>

              {usernameError && (
                <p id="username-onboard-err" className="text-[11px] text-amber-500 font-mono text-center pt-1 flex items-center justify-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  {usernameError}
                </p>
              )}
            </div>

            <button
              id="username-next-btn"
              disabled={!isUsernameValid || checkingUsername}
              onClick={() => setStep(2)}
              className="w-full py-3 bg-white/5 hover:bg-teal-500/10 border border-white/10 disabled:opacity-40 rounded font-mono text-xs uppercase tracking-widest text-teal-400 hover:text-white mt-6 transition duration-300 pointer-events-auto"
            >
              Verify Frequency Code
            </button>
          </div>
        )}

        {/* STEP 2: SELECT PIXEL AVATAR */}
        {step === 2 && (
          <div id="step-avatar" className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">Archive Avatar Sync</h2>
              <p className="text-xs text-neutral-400 mt-1">Calibrate your holographic presence vector.</p>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-500/10 rounded-xl blur-lg group-hover:scale-110 transition duration-300"></div>
                <img 
                  id="avatar-onboard-preview"
                  src={avatarUrl} 
                  alt="Holographic Vector" 
                  className="relative w-32 h-32 rounded-xl bg-[#0D0D10] border border-white/10 p-1"
                />
              </div>

              <button
                id="avatar-randomize-btn"
                onClick={randomizeAvatar}
                className="flex items-center gap-2 py-1.5 px-3 bg-white/5 border border-white/10 rounded text-xs font-mono text-neutral-400 hover:text-amber-405 hover:border-amber-500/40 hover:text-amber-450 transition"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Randomize Core
              </button>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-white/5 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-teal-400 hover:text-white transition"
              >
                Proceed Avatar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT INTERESTS */}
        {step === 3 && (
          <div id="step-interests" className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">Specialized Frequencies</h2>
              <p className="text-xs text-neutral-400 mt-1">Select archive layers matching your detective expertise.</p>
            </div>

            <div className="space-y-2.5 pt-2 max-h-72 overflow-y-auto pr-1">
              {interestCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedInterests.includes(cat.name);
                return (
                  <div
                    key={cat.name}
                    onClick={() => handleToggleInterest(cat.name)}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                      isSelected 
                        ? 'bg-amber-500/5 border-amber-500/40 text-amber-400' 
                        : 'bg-[#0A0A0C] border-white/5 text-neutral-400 hover:border-white/15'
                    }`}
                  >
                    <div className="mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono">{cat.name}</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{cat.desc}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 bg-white/5 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                disabled={selectedInterests.length === 0}
                onClick={() => setStep(4)}
                className="w-2/3 py-3 bg-white/5 hover:bg-teal-500/10 border border-white/10 disabled:opacity-45 rounded font-mono text-xs uppercase tracking-widest text-teal-400 hover:text-white transition"
              >
                Proceed Expertise ({selectedInterests.length})
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GUIDED WALKTHROUGH TUTORIAL */}
        {step === 4 && (
          <div id="step-walkthrough" className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">The Investigator Creed</h2>
              <p className="text-xs text-amber-500 mt-1 uppercase font-mono tracking-widest">Every room remembers</p>
            </div>

            <div className="bg-[#0A0A0C] border border-white/5 rounded p-4 text-xs tracking-wide text-slate-400 space-y-3 font-sans text-left">
              <p>
                Welcome to <strong className="text-neutral-100 font-mono">EchoVerse</strong>. You have unlocked a realm of asynchronous mystery. 
              </p>
              <p>
                Unlike traditional escapades, these rooms <strong className="text-amber-400">never reset</strong>. Every action, clue, and breakthrough remains etched into the environment. 
              </p>
              <p>
                You will browse room files, solve puzzles, and review the <strong className="text-teal-400">clue echoes</strong> of prior investigators. When you make a discovery, you may leave your own text observations, paint drawing maps, or log voice signals.
              </p>
              <p>
                Provide helpful notes to increase your <strong className="text-amber-500">Credibility Index</strong>, gain tokens, unlock creator blueprints, and evolve living secrets.
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(3)}
                className="w-1/3 py-3 bg-white/5 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleOnboardComplete}
                className="w-2/3 py-3 bg-gradient-to-r from-amber-500/80 to-teal-500/80 text-black font-semibold rounded font-mono text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition"
              >
                Enter the EchoVerse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
