import React from 'react';
import { Room } from '../types';
import { Users, Eye, Sparkles, Lock, ShieldCheck, Gamepad2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onSelect: () => void;
  isUnlocked: boolean; // Is it free, or purchased, or user has premium sub
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect, isUnlocked }) => {
  const complexityColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 border-emerald-950 bg-emerald-950/25';
      case 'Medium': return 'text-amber-400 border-amber-950 bg-amber-950/25';
      case 'Hard': return 'text-rose-400 border-rose-950 bg-rose-950/25';
      case 'Expert': 
      default:
        return 'text-purple-400 border-purple-950 bg-purple-950/25';
    }
  };

  const formattedVisits = room.totalVisits || 0;
  const solverRate = room.totalPlayers && room.totalPlayers > 0
    ? Math.min(100, Math.floor((formattedVisits / room.totalPlayers) * 50))
    : 45; // average fallbacks rate

  return (
    <div 
      id={`roomcard-${room.roomId}`}
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden bg-[#121216] border transition-all duration-300 flex flex-col group cursor-pointer ${
        room.premium ? 'border-amber-500/30' : 'border-white/5 hover:border-white/15'
      } hover:-translate-y-1`}
    >
      {/* Thumbnail backdrop scene */}
      <div className="relative h-44 bg-[#0D0D10] overflow-hidden flex items-center justify-center">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-transparent opacity-60"></div>
        
        {/* Custom Visual backdrops based on category */}
        {room.category === 'Horror' && (
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/20 to-black pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1)_0%,transparent_70%)] animate-pulse"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border border-rose-500/10 bg-rose-500/5 animate-ping opacity-30"></div>
          </div>
        )}
        {room.category === 'Conspiracy' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Radar scanner */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-teal-500/25 bg-teal-500/5 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full border border-teal-500/20"></div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(20,184,166,0.04)_25%,rgba(20,184,166,0.04)_26%,transparent_27%,transparent_74%,rgba(20,184,166,0.04)_75%,rgba(20,184,166,0.04)_76%,transparent_77%)] bg-[size:16px_16px] animate-scanline"></div>
          </div>
        )}
        {room.category === 'Historical' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/10 to-transparent pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-8 h-8 rounded-full border border-amber-500/15 animate-spin" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-16 h-16 rounded-full border border-amber-400/10 animate-spin" style={{ animationDuration: '12s' }}></div>
          </div>
        )}
        {room.category === 'Treasure Hunt' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] to-indigo-950/30 pointer-events-none">
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-cyan-500/10 to-transparent skew-y-3 transform scale-y-125"></div>
            <div className="absolute top-10 right-14 w-2 h-2 rounded-full bg-yellow-400 opacity-60 animate-bounce"></div>
          </div>
        )}
        {room.category === 'Mystery' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/25 to-black pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_80%)] animate-pulse"></div>
          </div>
        )}
        
        {/* Image generation fallback representation vector artwork */}
        <div className="flex flex-col items-center justify-center p-6 text-center z-10">
          <span className="text-4xl filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition duration-500">
            {room.category === 'Mystery' && '🕵️‍♂️'}
            {room.category === 'Horror' && '🏚️'}
            {room.category === 'Treasure Hunt' && '🏴‍☠️'}
            {room.category === 'Conspiracy' && '👽'}
            {room.category === 'Historical' && '🏛️'}
            {room.category === 'Daily' && '⏳'}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mt-3">
            {room.category} LAYER
          </span>
        </div>

        {/* Top Floating Badge bar */}
        <div className="absolute top-3 inset-x-3 flex justify-between items-center z-25">
          <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase tracking-wider font-semibold ${complexityColor(room.difficulty)}`}>
            {room.difficulty}
          </span>

          <div className="flex gap-1">
            {room.aiGenerated && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/5 bg-teal-500/10 text-[9px] font-mono text-teal-405 font-medium uppercase text-teal-400">
                <Sparkles className="w-2.5 h-2.5" />
                AI Breathed
              </span>
            )}
            {room.premium && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-[9px] font-mono text-amber-500 font-medium uppercase tracking-wider">
                {isUnlocked ? <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> : <Lock className="w-2.5 h-2.5" />}
                Premium Code
              </span>
            )}
          </div>
        </div>

        {/* Premium Lock overlay */}
        {room.premium && !isUnlocked && (
          <div className="absolute inset-0 bg-black/60 z-20 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-amber-500 font-mono uppercase font-semibold tracking-widest bg-black/50 px-2 py-0.5 rounded border border-amber-500/20">
              Unlock Listing
            </span>
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="font-sans font-bold text-sm text-white group-hover:text-teal-400 transition-colors tracking-tight line-clamp-1">
            {room.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
            {room.description}
          </p>
        </div>

        {/* Action and Visitor specs row */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5" title="Total Visited Runs">
              <Eye className="w-3.5 h-3.5" />
              <span>{formattedVisits} runs</span>
            </span>
            <span className="flex items-center gap-1.5" title="Solver Percentage">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>{solverRate}% solved</span>
            </span>
          </div>

          <span className="text-teal-400 text-[11px] font-bold">
            {room.premium ? (isUnlocked ? 'UNLOCKED' : '$2.99 / FREE SUB') : 'PLAY FREE'}
          </span>
        </div>
      </div>
    </div>
  );
};
