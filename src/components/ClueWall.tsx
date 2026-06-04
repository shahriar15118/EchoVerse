import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, increment, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Clue, User } from '../types';
import { ThumbsUp, Heart, Laugh, Compass, AlertTriangle, Play, HelpCircle, Archive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ClueWallProps {
  roomId: string;
}

export const ClueWall: React.FC<ClueWallProps> = ({ roomId }) => {
  const { user } = useAuth();
  const [clues, setClues] = useState<Clue[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'top' | 'historic'>('top');

  // Monitor real-time clues for this specific room
  useEffect(() => {
    const q = query(collection(db, 'clues'), where('roomId', '==', roomId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Clue[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Clue);
      });
      setClues(list);
    }, (error) => {
      console.error("Clues wall subscription lost:", error);
    });
    return unsubscribe;
  }, [roomId]);

  // Sorting and filtering logic
  const getSortedClues = () => {
    const temp = [...clues];
    switch (activeTab) {
      case 'recent':
        return temp.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'historic':
        return temp.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'top':
      default:
        return temp.sort((a,b) => b.netCredibility - a.netCredibility);
    }
  };

  const filteredClues = getSortedClues();

  // Handle vote allocation
  const handleVote = async (clue: Clue, voteType: 'helpful' | 'genius' | 'misleading' | 'funny') => {
    if (!user) return;
    if (clue.userId === user.uid) return; // Disallow voting on one's own clues

    const clueId = clue.clueId;
    let xpAwarded = 0;
    let coinsAwarded = 0;
    
    // Vote metrics changes
    let scoreChange = 0;
    const updateObj: Record<string, any> = {};

    switch (voteType) {
      case 'helpful':
        scoreChange = 2;
        updateObj.helpfulVotes = increment(1);
        break;
      case 'genius':
        scoreChange = 5;
        updateObj.geniusVotes = increment(1);
        break;
      case 'misleading':
        scoreChange = -3;
        updateObj.misleadingVotes = increment(1);
        break;
      case 'funny':
        scoreChange = 1;
        updateObj.funnyVotes = increment(1);
        break;
    }

    // Update the netCredibility of the clue
    updateObj.netCredibility = increment(scoreChange);

    try {
      // 1. Mutate Clue records
      // Look up clue document to find Firestore ID
      const q = query(collection(db, 'clues'), where('clueId', '==', clueId));
      const res = await getDoc(doc(db, 'clues', clueId)); // wait, the document id might not be equal to clueId if created with addDoc
    } catch (e) {
      console.warn("Direct lookup fail, sweeping via queries:", e);
    }

    try {
      // Find and update clue
      const qr = query(collection(db, 'clues'), where('clueId', '==', clueId));
      const snap = await getDocs(query(collection(db, 'clues'), where('clueId', '==', clueId)));
      
      let refDoc: any = null;
      snap.forEach((d) => {
        refDoc = d;
      });

      if (refDoc) {
        await updateDoc(doc(db, 'clues', refDoc.id), updateObj);

        // 2. Increase or decrease author's credibility score & rank
        // Query to find author profile
        const userQ = query(collection(db, 'users'), where('uid', '==', clue.userId));
        const userSnap = await getDocs(userQ);
        let userDocId: any = null;
        let authorData: any = null;
        userSnap.forEach((d) => {
          userDocId = d.id;
          authorData = d.data();
        });

        if (userDocId && authorData) {
          const newCred = Math.max(0, Math.min(9999, (authorData.credibilityScore || 100) + scoreChange));
          await updateDoc(doc(db, 'users', userDocId), { credibilityScore: newCred });
          
          // 3. Trigger push logs alert (in-app notifications) to the author about the review
          const alertId = 'notif_' + Math.random().toString(36).substring(2, 11);
          await addDoc(collection(db, 'notifications'), {
            notificationId: alertId,
            userId: clue.userId,
            title: 'Trace Review Recipient',
            body: `@${user.username} voted "${voteType.toUpperCase()}" on your clue inside the chamber! Credibility altered: ${scoreChange >= 0 ? '+' : ''}${scoreChange}`,
            type: 'vote',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Voter pipeline mismatch:", err);
    }
  };

  return (
    <div id="cluelist-wall" className="flex flex-col bg-[#08080A] border border-white/5 rounded-xl overflow-hidden mt-6">
      {/* Search Header */}
      <div className="bg-[#0D0D10]/50 px-6 py-4 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-teal-405 font-mono uppercase tracking-widest block text-teal-400 font-medium">Memory Trace Files</span>
          <h2 className="text-sm font-bold font-mono text-white flex items-center gap-1.5 uppercase">
            Active Clue Chambers ({clues.length})
          </h2>
        </div>

        {/* Filters */}
        <div className="flex border border-white/5 rounded p-0.5 bg-[#121216]/50 text-xs font-mono">
          {[
            { id: 'top', label: 'Recommended', icon: Heart },
            { id: 'recent', label: 'Recent Logs', icon: Compass },
            { id: 'historic', label: 'Historic Archive', icon: Archive }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-1 px-3.5 rounded transition ${
                  isSel ? 'text-teal-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clues layout stream list */}
      <div id="clues-stack" className="p-5 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar">
        {filteredClues.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center space-y-2">
            <HelpCircle className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Silence in the static</h4>
            <p className="text-[11px] text-slate-500 max-w-xs">No traces of prior detectives detected. Solve the room to transmit the first whisper of historical memory!</p>
          </div>
        ) : (
          filteredClues.map((clue) => {
            const isOwnClue = clue.userId === user?.uid;
            return (
              <div 
                id={`cluecard-${clue.clueId}`}
                key={clue.clueId}
                className="p-4 rounded-lg bg-[#121216] border border-white/5 hover:border-white/10 transition flex flex-col justify-between gap-3 relative group text-left"
              >
                {/* Author Card detail */}
                <div className="flex items-center justify-between">
                  {/* Account Name */}
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${clue.username}`} 
                      alt={clue.username} 
                      className="w-7 h-7 rounded bg-[#0D0D10] border border-white/5 py-0.5"
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">@{clue.username}</span>
                        {clue.netCredibility >= 25 && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.2 rounded font-mono uppercase tracking-wider">
                            Verified Detective
                          </span>
                        )}
                        {isOwnClue && (
                          <span className="text-[8px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1 py-0.2 rounded font-mono uppercase tracking-wider text-teal-400">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Credibility score: {clue.netCredibility * 5 + 100} IQ
                      </span>
                    </div>
                  </div>

                  {/* Relative timestamp */}
                  <span className="text-[9px] text-slate-500 font-mono uppercase">
                    {new Date(clue.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Core Echo Body */}
                <div id="cluecard-body" className="text-xs text-slate-300 leading-relaxed font-sans select-all selection:bg-teal-500/10 selection:text-teal-400">
                  {clue.clueType === 'text' && (
                    <p className="whitespace-pre-wrap italic">"{clue.content}"</p>
                  )}

                  {clue.clueType === 'voice' && (
                    <div id="inline-audio-player" className="flex items-center gap-3 p-2 rounded bg-black/40 max-w-sm border border-white/5">
                      <button 
                        onClick={() => {
                          const sound = new Audio(clue.content);
                          sound.play().catch(e => console.warn("Failed sound play, demo data format: ", e));
                        }}
                        className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-teal-400 ml-0.5" />
                      </button>
                      <div className="flex-1 text-left">
                        <span className="text-[9px] text-teal-400 font-mono uppercase block">Audio Transmission</span>
                        {/* Fake animated audio wave indicator */}
                        <div className="flex gap-0.5 h-3.5 items-end mt-0.5">
                          {[2, 4, 3, 5, 2, 6, 2, 4, 3, 5, 1, 3, 2].map((h, i) => (
                            <div 
                              key={i} 
                              style={{ height: `${h * 2}px` }} 
                              className="w-0.5 bg-teal-500/70 rounded-full"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {clue.clueType === 'drawing' && (
                    <div id="inline-drawing" className="max-w-md bg-black/40 p-2 rounded border border-white/5 overflow-hidden">
                      <span className="text-[9px] text-amber-500 font-mono uppercase block mb-1">Investigation Sketchbook</span>
                      <img 
                        src={clue.content} 
                        alt="Detective painting" 
                        className="max-h-52 w-auto object-contain rounded border border-white/5 bg-[#0A0A0C]"
                      />
                    </div>
                  )}
                </div>

                {/* Vote allocation buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <span className="text-[9px] text-slate-500 font-mono mr-1">VOTE INFLUENCE:</span>
                  
                  {[
                    { type: 'helpful', label: 'Helpful (+2)', icon: ThumbsUp, color: 'hover:text-emerald-400', count: clue.helpfulVotes || 0 },
                    { type: 'genius', label: 'Genius (+5)', icon: Heart, color: 'hover:text-red-400', count: clue.geniusVotes || 0 },
                    { type: 'funny', label: 'Funny (+1)', icon: Laugh, color: 'hover:text-amber-400', count: clue.funnyVotes || 0 },
                    { type: 'misleading', label: 'Misleading (-3)', icon: AlertTriangle, color: 'hover:text-rose-400', count: clue.misleadingVotes || 0 }
                  ].map((vote) => {
                    const Icon = vote.icon;
                    return (
                      <button
                        key={vote.type}
                        disabled={isOwnClue}
                        onClick={() => handleVote(clue, vote.type as any)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded bg-[#0A0A0C] border border-white/5 text-[10px] font-mono text-slate-400 transition-all ${
                          isOwnClue ? 'opacity-40 cursor-not-allowed' : `${vote.color} hover:bg-white/5 hover:border-white/10`
                        }`}
                        title={vote.label}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{vote.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Internal query package resolution helpers
async function getDocs(q: any) {
  // Simple fetch simulation on Firestore SDK
  const result: any[] = [];
  try {
    const snap = await fetchDocs(q);
    return snap;
  } catch (error) {
    return { empty: true, forEach: () => {} };
  }
}

async function fetchDocs(q: any) {
  // Standard getDoc fallback support
  const { getDocs: fireGetDocs } = await import('firebase/firestore');
  return await fireGetDocs(q);
}
