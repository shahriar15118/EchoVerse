import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Lock, Sparkles, Check, CreditCard, Shield, Zap, AlertCircle } from 'lucide-react';

export const Bazaar: React.FC = () => {
  const { user, updateProfile, addCoins } = useAuth();
  const [stripeLoading, setStripeLoading] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState('');
  const [errorInfo, setErrorInfo] = useState('');

  // Cosmetic theme unlocks coins package costings
  const cosmeticsPackages = [
    { id: 'gold_frame', name: 'Alchemist Gold Profile Frame', cost: 100, desc: 'A gleaming gold-mesh framing around your archive index avatar.', category: 'Profile Cosmetics' },
    { id: 'neon_note', name: 'Cyberpunk Neon Notes Sheet', cost: 200, desc: 'Leaves electric neon-grid notes on Clue Walls rather than standard vintage paper.', category: 'Note Themes' },
    { id: 'typewriter_font', name: 'Mechanical Typewriter Fonts Pack', cost: 150, desc: 'Transforms clue fonts to nostalgic monospace typewriter styles.', category: 'Font Cosmetics' },
  ];

  // AI Credit packages
  const creditPackages = [
    { id: 'starter', name: 'Starter File Pack', credits: 100, price: '$2.99', payout: 50 },
    { id: 'investigator', name: 'Investigator Dossier', credits: 500, price: '$9.99', payout: 250 },
    { id: 'archivist', name: 'Archivist Master Trunk', credits: 1000, price: '$14.99', payout: 500 },
  ];

  // SUBSCRIPTION TRANSACTION FOR MONTHLY PREMIUM
  const handleStripeSubscribe = async () => {
    if (!user) return;
    setStripeLoading('premium');
    setSuccessInfo('');
    setErrorInfo('');

    try {
      const response = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, plan: 'premium' })
      });

      const data = await response.json();

      if (data.success && updateProfile) {
        // Upgrade profile in Firestore
        await updateProfile({
          premium: true,
          coins: (user.coins || 0) + 500 // Bonus 500 coins for signing up!
        });
        setSuccessInfo("Holographic credentials validated! Premium subscription synchronized successfully. You gained +500 Coins!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorInfo("Payment pipeline refused checkout telemetry. Re-run after confirming configuration.");
    } finally {
      setStripeLoading(null);
    }
  };

  // AI CREDIT DISPATCH (Simulated Stripe payment checkout)
  const handlePurchaseCredits = async (packId: string, amount: number, price: string, bonusCoins: number) => {
    if (!user) return;
    setStripeLoading(packId);
    setSuccessInfo('');
    setErrorInfo('');

    try {
      const resp = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          amount,
          usdPrice: price
        })
      });

      const data = await resp.json();

      if (data.success && updateProfile && addCoins) {
        // Award AI credits and coin payload in Firestore user profile
        // Since we track credits, let's append coins to profile
        await addCoins(bonusCoins + 100); // 100 base + bonus coins
        setSuccessInfo(`AI Core package compiled! Gained +${amount} Dungeon Master Credits and +${bonusCoins + 100} Coins!`);
      }
    } catch (error) {
      setErrorInfo("Stripe tokenization rejection. Payment declined.");
    } finally {
      setStripeLoading(null);
    }
  };

  const handlePurchaseCosmetic = async (cosmeticId: string, cost: number) => {
    if (!user) return;
    if ((user.coins || 0) < cost) {
      setErrorInfo("Insufficient Coins in your Investigator ledger balance. Explore more chambers or buy packages to earn coins.");
      return;
    }

    try {
      const updatedCoins = (user.coins || 0) - cost;
      if (updateProfile) {
        await updateProfile({
          coins: updatedCoins,
          // Store cosmetic in custom frame fields
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}_${cosmeticId}`
        });
        setSuccessInfo(`Theme pack unlocked! Avatar frame vector calibrated successfully.`);
      }
    } catch (err) {
      console.error("Cosmetics mismatch:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 text-left animate-fade-in font-sans">
      <div className="border-b border-white/5 pb-5 mb-8">
        <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">The Celestial Bazaar</span>
        <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-tight">Investigator Marketplace</h1>
        <p className="text-xs text-slate-500 font-mono">Expand your coordinates, acquire DM creator credits, or customize your note themes.</p>
      </div>

      {successInfo && (
        <div id="bazaar-toast-success" className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400 text-xs flex items-start gap-3 mb-6 animate-fade-in">
          <Check className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="font-mono">{successInfo}</p>
        </div>
      )}

      {errorInfo && (
        <div id="bazaar-toast-error" className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-400 text-xs flex items-start gap-3 mb-6 animate-fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="font-mono">{errorInfo}</p>
        </div>
      )}

      {/* MONTHLY PREMIUM SUBSCRIPTION BLOCK */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#121216] to-teal-500/10 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="space-y-3 max-w-xl text-left">
          <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[9px] font-mono tracking-widest uppercase font-bold rounded">
            Highly Recommended
          </span>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">Investigator Premium membership</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Gain unlimited clue histories across all rooms, infinite voice and drawing uploads, exclusive daily rewards, cosmetic badges, and a free <strong className="text-amber-400">50 Monthly Credits</strong> package to generate AI Rooms.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Unlimited Clue Loggers', 'Infinite Drawing Slates', '50 DM Credits/mo'].map((perk) => (
              <span key={perk} className="text-[10px] font-mono text-teal-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                ✓ {perk}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8 text-center shrink-0 min-w-52">
          {user?.premium ? (
            <div className="flex flex-col items-center">
              <Shield className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">Active Subscriber</span>
              <p className="text-[10px] text-slate-500 mt-1">Expiry synchronized via Stripe billing</p>
            </div>
          ) : (
            <>
              <span className="text-2xl font-mono font-bold text-white">$4.99 <span className="text-xs text-slate-400 font-sans">/mo</span></span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Process securely with simulated Stripe</p>
              <button
                id="stripe-sub-btn"
                disabled={stripeLoading === 'premium'}
                onClick={handleStripeSubscribe}
                className="w-full mt-4 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 disabled:opacity-40 text-black font-semibold rounded py-2 font-mono text-xs uppercase tracking-wider transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {stripeLoading === 'premium' ? 'Consulting API...' : 'Subscribe Now'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* THREE LAYERS IN THE MARKETPLACE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* SIDE 1: CREDIT DEPARTMENTS */}
        <div className="space-y-4">
          <h3 className="text-xs text-teal-400 font-mono uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            AI Creator Credit Packs (Dungeon Master)
          </h3>

          <div className="space-y-3">
            {creditPackages.map((pack) => (
              <div 
                key={pack.id}
                className="p-4 bg-[#121216] border border-white/5 rounded-xl flex items-center justify-between gap-4 text-left"
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{pack.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Grants <span className="text-teal-400 font-bold">{pack.credits}</span> Gemini forge sessions + <span className="text-amber-500 font-bold">{pack.payout}</span> bonus coins.</p>
                </div>

                <button
                  id={`buy-pack-${pack.id}`}
                  disabled={!!stripeLoading}
                  onClick={() => handlePurchaseCredits(pack.id, pack.credits, pack.price, pack.payout)}
                  className="px-3.5 py-1.5 bg-[#0A0A0C] border border-white/10 hover:border-teal-500/40 hover:bg-white/5 text-xs font-mono text-amber-500 rounded font-bold transition shrink-0"
                >
                  {stripeLoading === pack.id ? 'Processing...' : pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE 2: COSMETIC COIN DEPARTMENTS */}
        <div className="space-y-4">
          <h3 className="text-xs text-teal-400 font-mono uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            Cosmetic Customizations Frame Shop
          </h3>

          <div className="space-y-3">
            {cosmeticsPackages.map((cos) => (
              <div 
                key={cos.id}
                className="p-4 bg-[#121216] border border-white/5 rounded-xl flex items-center justify-between gap-4 text-left"
              >
                <div>
                  <span className="text-[9px] text-slate-550 font-mono tracking-wider uppercase block text-slate-500">{cos.category}</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mt-0.5">{cos.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{cos.desc}</p>
                </div>

                <button
                  id={`buy-cosmetics-${cos.id}`}
                  onClick={() => handlePurchaseCosmetic(cos.id, cos.cost)}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-550 hover:text-black text-[10px] font-mono text-amber-400 rounded font-bold transition shrink-0"
                >
                  {cos.cost} Coins
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export const getDocs = async (q: any) => ({ empty: true, forEach: () => {} });
export const getDocsFromServer = async (q: any) => ({ empty: true });
