import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, limit, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { Trophy, Medal, Compass, Star, HelpCircle, ShieldAlert } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [rankedUsers, setRankedUsers] = useState<User[]>([]);
  const [activeMetric, setActiveMetric] = useState<'credibility' | 'xp' | 'coins'>('credibility');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Real-time listener on absolute top users
    const q = query(
      collection(db, 'users'), 
      orderBy(activeMetric === 'credibility' ? 'credibilityScore' : activeMetric, 'desc'), 
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: User[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as User);
      });
      setRankedUsers(list);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard subscription mistake:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [activeMetric]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 text-left animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-5 mb-8 gap-3">
        <div>
          <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">The Sovereign ledger</span>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-tight">Investigators Ledger</h1>
          <p className="text-xs text-slate-500 font-mono">Honoring those matching supreme intelligence indices and archive calibrations.</p>
        </div>

        {/* Scoring filters */}
        <div className="flex border border-white/5 p-0.5 rounded bg-[#121216]/50 text-xs font-mono">
          {[
            { id: 'credibility', label: 'Reputation index', icon: Star },
            { id: 'xp', label: 'Lore Archivists (XP)', icon: Trophy },
            { id: 'coins', label: 'Bazaar Balances', icon: Medal }
          ].map((metric) => {
            const Icon = metric.icon;
            const isSel = activeMetric === metric.id;
            return (
              <button
                key={metric.id}
                onClick={() => setActiveMetric(metric.id as any)}
                className={`flex items-center gap-1.5 py-1.5 px-4 rounded transition uppercase ${
                  isSel ? 'text-teal-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-teal-500 border-white/5 rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Consulting Ledgers...</span>
        </div>
      ) : rankedUsers.length === 0 ? (
        <div className="py-24 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-2">
          <ShieldAlert className="w-10 h-10 text-slate-700" />
          <h3 className="text-sm font-bold font-mono text-slate-400 uppercase">Archive Ledger Vacant</h3>
          <p className="text-xs text-slate-500 max-w-sm">No investigator records are present in the Database yet. Solve a room or invite friends to register!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#121216] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D0D10]/50 border-b border-white/5 text-teal-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5 select-none w-16 text-center">Rank</th>
                <th className="py-3.5 px-5">Investigator</th>
                <th className="py-3.5 px-5">Expertise Level</th>
                <th className="py-3.5 px-5">Score Rank</th>
                <th className="py-3.5 px-5 text-right font-mono pr-8">
                  {activeMetric === 'credibility' ? 'Reputation Index (IQ)' : activeMetric === 'xp' ? 'XP Coordinates' : 'Coins Balance'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rankedUsers.map((item, idx) => {
                const isMe = user?.uid === item.uid;
                const pos = idx + 1;
                return (
                  <tr 
                    id={`leaderboard-row-${pos}`}
                    key={item.uid} 
                    className={`transition duration-150 ${
                      isMe ? 'bg-amber-500/5 text-amber-500 font-semibold' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {/* Rank Number */}
                    <td className="py-4 px-5 text-center font-mono">
                      {pos === 1 && <span className="text-lg">🥇</span>}
                      {pos === 2 && <span className="text-lg">🥈</span>}
                      {pos === 3 && <span className="text-lg">🥉</span>}
                      {pos > 3 && <span className="text-slate-500 font-normal">{pos}</span>}
                    </td>

                    {/* Investigator Profile */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.username}`} 
                          alt={item.username} 
                          className="w-8 h-8 rounded bg-[#0D0D10] border border-white/10 p-0.5"
                        />
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans font-bold text-white group-hover:text-teal-400">@{item.username}</span>
                            {item.premium && (
                              <span className="text-[7.5px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 rounded font-mono uppercase tracking-wider scale-95">
                                Premium
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{item.bio || 'EchoVerse exploration pioneer.'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-4 px-5 font-mono text-teal-400">
                      Level {item.level || 1}
                    </td>

                    {/* Badge */}
                    <td className="py-4 px-5 text-left">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-teal-400 border border-white/10 font-mono font-medium">
                        {item.rank || 'Explorer'}
                      </span>
                    </td>

                    {/* Scoring values */}
                    <td className="py-4 px-5 text-right font-mono pr-8 text-neutral-100">
                      {activeMetric === 'credibility' ? (
                        <span className="text-amber-500 font-bold">{(item.credibilityScore || 100) * 5 + 100} IQ</span>
                      ) : activeMetric === 'xp' ? (
                        <span>{(item.xp || 0).toLocaleString()} XP</span>
                      ) : (
                        <span className="text-teal-400 font-bold">{item.coins || 0} COINS</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
