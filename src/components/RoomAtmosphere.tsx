import React, { useState, useEffect } from 'react';
import { Room, PuzzleObject, RoomCategory } from '../types';
import { 
  Volume2, 
  VolumeX, 
  Thermometer, 
  Flame, 
  AlertCircle, 
  Compass, 
  Cpu, 
  Grid,
  Zap, 
  Eye, 
  Search,
  Activity,
  Award,
  Key,
  Shield,
  Coins,
  Radio,
  BookOpen
} from 'lucide-react';
import { 
  playClick, 
  startAmbientAtmosphere, 
  toggleMute, 
  isMuted 
} from '../lib/audio';

interface RoomAtmosphereProps {
  room: Room;
  selectedObjectId: string | null;
  onSelectObject: (obj: PuzzleObject) => void;
}

export const RoomAtmosphere: React.FC<RoomAtmosphereProps> = ({ 
  room, 
  selectedObjectId, 
  onSelectObject 
}) => {
  const [muted, setMuted] = useState(isMuted());
  const [radarRotation, setRadarRotation] = useState(0);
  const [flickerState, setFlickerState] = useState(true);
  
  // Custom states for procedural particle effects
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; delay: number; duration: number }[]>([]);

  // Regeneration of procedural themed particles whenever the room or category changes
  useEffect(() => {
    // Generate specialized coordinates for ambient particles depending on room theme
    const count = room.category === RoomCategory.HORROR ? 12 : 20;
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 92 + 4, // keep inside box limits
      top: Math.random() * 80 + 10,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3
    }));
    setParticles(generated);
  }, [room.roomId, room.category]);

  // Audio stream activation
  useEffect(() => {
    const stream = startAmbientAtmosphere(room.category);
    return () => {
      stream.stop();
    };
  }, [room.roomId, room.category, muted]);

  // General animation loops for radars and flickering lights
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarRotation((prev) => (prev + 2.5) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fInterval = setInterval(() => {
      setFlickerState(Math.random() > 0.18);
    }, 180);
    return () => clearInterval(fInterval);
  }, []);

  const handleMuteToggle = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
    playClick();
  };

  const selectNode = (obj: PuzzleObject) => {
    playClick();
    onSelectObject(obj);
  };

  // Determine category-specific HUD text and UI theme colors
  const getThemeConfig = () => {
    switch (room.category) {
      case RoomCategory.MYSTERY:
        return {
          header: "DETECTIVE INVESTIGATION LOGS",
          status: "EVIDENCE LINK ACQUIRED",
          colorClass: "text-amber-400",
          borderColorClass: "border-amber-500/20",
          bgColor: "bg-amber-500/5",
          icon: <BookOpen className="w-4 h-4 text-amber-400" />
        };
      case RoomCategory.HORROR:
        return {
          header: "SANATORIUM STABILIZATION METRIC",
          status: "VITAL PRESSURE SIGNS SPIKING",
          colorClass: "text-red-500",
          borderColorClass: "border-red-500/20",
          bgColor: "bg-red-500/5",
          icon: <Activity className="w-4 h-4 text-red-500 animate-pulse" />
        };
      case RoomCategory.TREASURE_HUNT:
        return {
          header: "SACRED TOMB ALIGNMENTS",
          status: "CURSED DEPOSITS STABLE",
          colorClass: "text-cyan-400",
          borderColorClass: "border-cyan-500/20",
          bgColor: "bg-cyan-500/5",
          icon: <Coins className="w-4 h-4 text-cyan-400 animate-bounce" />
        };
      case RoomCategory.CONSPIRACY:
        return {
          header: "HAZARDOUS INCIDENT CONTAINMENT",
          status: "GRAVITY COEFFICIENT ALERT",
          colorClass: "text-[#10b981]",
          borderColorClass: "border-emerald-500/20",
          bgColor: "bg-emerald-500/5",
          icon: <Radio className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
        };
      case RoomCategory.HISTORICAL:
        return {
          header: "CHRONOLOGY SPECTRUM GRAPHICS",
          status: "TEMPORAL FLUX DEVIATION 0.00%",
          colorClass: "text-orange-400",
          borderColorClass: "border-orange-500/20",
          bgColor: "bg-orange-500/5",
          icon: <Shield className="w-4 h-4 text-orange-400" />
        };
      case RoomCategory.DAILY:
      default:
        return {
          header: "CYBER MAINFRAME BACKPLANE GRID",
          status: "FIREWALL DECRYPTION ONLINE",
          colorClass: "text-teal-400",
          borderColorClass: "border-teal-500/20",
          bgColor: "bg-teal-500/5",
          icon: <Cpu className="w-4 h-4 text-teal-400 animate-pulse" />
        };
    }
  };

  const config = getThemeConfig();

  return (
    <div className="bg-[#121216] border border-white/5 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col space-y-4">
      
      {/* HIGH IMPACT GRAPHICAL STYLES SHEET */}
      <style>{`
        @keyframes floatDust {
          0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-80px) translateX(10px) scale(1.1); opacity: 0; }
        }
        @keyframes dripBlood {
          0% { transform: translateY(-30px); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(180px); opacity: 0; }
        }
        @keyframes riseGold {
          0% { transform: translateY(40px) scale(0.6); opacity: 0; }
          30% { opacity: 0.8; }
          70% { opacity: 0.8; }
          100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }
        @keyframes fallBinary {
          0% { transform: translateY(-20px); opacity: 0; }
          15% { opacity: 0.75; }
          85% { opacity: 0.75; }
          100% { transform: translateY(160px); opacity: 0; }
        }
        @keyframes scanlineAnim {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        @keyframes heartPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .animate-float-dust { animation: floatDust ease-in-out infinite; }
        .animate-drip-blood { animation: dripBlood ease-in infinite; }
        .animate-rise-gold { animation: riseGold ease-in-out infinite; }
        .animate-fall-binary { animation: fallBinary linear infinite; }
        .anim-scanline { animation: scanlineAnim 8s linear infinite; }
        .animate-heart-pulse { animation: heartPulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Scanline overlay effect for vintage CRT feeling */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,22,0)_96%,rgba(20,80,90,0.06)_98%,rgba(20,80,90,0.1)_100%)] bg-[size:100%_18px] pointer-events-none z-10 anim-scanline"></div>
      
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <h3 className="text-xs font-bold font-mono text-white tracking-widest uppercase">
              {config.header}
            </h3>
            <span className={`text-[9px] ${config.colorClass} font-mono uppercase tracking-wider block`}>
              {config.status} • {room.difficulty.toUpperCase()} LEVEL
            </span>
          </div>
        </div>

        {/* Audio switch node */}
        <button
          onClick={handleMuteToggle}
          className={`p-2 rounded border transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase ${
            muted 
              ? 'border-white/5 text-neutral-500 hover:text-neutral-300' 
              : `border-teal-500/25 ${config.bgColor} ${config.colorClass} hover:brightness-110`
          }`}
          title={muted ? "Unmute Ambient Synthesizer" : "Mute Soundscapes"}
        >
          {muted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Synth Off</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>Synth Live</span>
            </>
          )}
        </button>
      </div>

      {/* CORE GRAPHICAL SIMULATION CANVAS */}
      <div className="relative h-64 bg-[#09090b] border border-white/5 rounded-lg overflow-hidden flex items-center justify-center">
        
        {/* ========================================================
            CATEGORY 1: MYSTERY (SEPIA COZY DETECTIVE STUDIO BACKDROP)
            ======================================================== */}
        {room.category === RoomCategory.MYSTERY && (
          <div className="absolute inset-0 bg-[#0E0B08] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Elegant wood patterns / study overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.06),transparent_70%)]"></div>
            
            {/* Floating dust-mote particles representation */}
            {particles.map((pt) => (
              <span
                key={pt.id}
                className="absolute bg-amber-500/25 rounded-full animate-float-dust"
                style={{
                  left: `${pt.left}%`,
                  bottom: `${pt.top}%`,
                  width: `${pt.size + 1.5}px`,
                  height: `${pt.size + 1.5}px`,
                  animationDelay: `${pt.delay}s`,
                  animationDuration: `${pt.duration + 2}s`
                }}
              />
            ))}

            {/* Vintage layout compass frame in background center */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Compass className="w-56 h-56 text-amber-500 uppercase spin-slow" />
            </div>

            {/* Humanized clues locator overlay */}
            <div className="absolute inset-x-4 top-2 flex justify-between font-mono text-[8px] text-amber-600/60 uppercase">
              <span>LEDGER STACKS: ONLINE</span>
              <span>STUDY ILLUMINANCE: METERED</span>
            </div>

            {/* Custom visual elements: Drawer desk sketch */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 border-b border-amber-600/20 flex flex-col justify-end items-center opacity-60">
              <div className="w-16 h-8 bg-amber-950/20 border border-amber-900/30 rounded-t flex flex-col justify-center gap-1.5 p-1">
                <div className="w-full h-1 bg-amber-900/40 rounded-sm"></div>
                <div className="w-full h-1.5 bg-black/40 rounded-sm flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-amber-500/50"></div>
                </div>
              </div>
            </div>

            {/* Dynamic themed hot-spots for the Mystery puzzle objects */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length + (i * 30);
                  const radius = 60;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-amber-500/85 border-amber-400 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                            : 'bg-amber-950/40 border-amber-800/60 group-hover:bg-amber-500/30 group-hover:border-amber-400'
                        }`}>
                          <BookOpen className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border border-dashed border-amber-500/35 rounded-lg animate-spin" style={{ animationDuration: '10s' }} />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-amber-500/80 block uppercase tracking-wider bg-black/80 px-1 py-0.5 rounded border border-amber-900/30 whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-amber-700/60 uppercase">
              <span>SCAN GRID: SEPIA LENS</span>
              <span>STABILITY: SECURE</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CATEGORY 2: HORROR (CRIMSON FLICKERING SANATORIUM APARTMENT)
            ======================================================== */}
        {room.category === RoomCategory.HORROR && (
          <div className="absolute inset-0 bg-[#0B0303] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Dark heavy vignette with flatline heartbeat */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.06),transparent_80%)]"></div>

            {/* Heartbeat EKG Pulse Grid Drawing */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 300 150">
              <path 
                d="M 0 75 L 80 75 L 90 40 L 100 110 L 110 75 L 120 75 L 125 65 L 130 85 L 135 75 L 300 75" 
                fill="none" 
                stroke="red" 
                strokeWidth="2" 
                strokeDasharray="600"
                className="animate-heart-pulse"
              />
            </svg>

            {/* Dripping blood red particles representation */}
            {particles.map((pt) => (
              <span
                key={pt.id}
                className="absolute bg-red-600 rounded-full animate-drip-blood"
                style={{
                  left: `${pt.left}%`,
                  top: `0px`,
                  width: `${pt.size + 1.2}px`,
                  height: `${pt.size + 4}px`, // tear shaped
                  animationDelay: `${pt.delay}s`,
                  animationDuration: `${pt.duration - 0.5}s`
                }}
              />
            ))}

            {/* Custom scary surgical cot blueprint in center if not room_cabin */}
            {room.roomId !== 'room_cabin' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 flex items-center justify-center opacity-30">
                <div className="w-16 h-4 border border-red-500/20 bg-red-950/10 rounded flex items-center justify-center">
                  <div className="w-12 h-0.5 bg-red-500/40"></div>
                </div>
              </div>
            )}

            {/* Interactive objects for Horror (e.g. key icons, creep skulls) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length - (i * 15);
                  const radius = 64;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-red-600/90 border-red-400 scale-115 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-none' 
                            : 'bg-red-950/50 border-red-900/60 group-hover:bg-red-700/30 group-hover:border-red-500'
                        }`}>
                          <AlertCircle className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-red-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border.5 border-dashed border-red-500 rounded-full animate-ping" />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-red-500 block uppercase tracking-tight bg-black border border-red-950 px-1 py-0.5 rounded whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-red-700/60 uppercase">
              <span>BIOSYSTEM LINKED</span>
              <span className="text-red-500 animate-pulse">● VITAL THREAT SPIKE</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CATEGORY 3: TREASURE_HUNT (GOLDEN SANDSTONE ALCHEMY APARTMENT)
            ======================================================== */}
        {room.category === RoomCategory.TREASURE_HUNT && (
          <div className="absolute inset-0 bg-[#080B0C] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Deep aquamarine gold ambient radial shadow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06),transparent_80%)]"></div>

            {/* Transmutation gold dust sparks upward */}
            {particles.map((pt) => (
              <span
                key={pt.id}
                className="absolute bg-cyan-400 rounded-full animate-rise-gold"
                style={{
                  left: `${pt.left}%`,
                  bottom: `10px`,
                  width: `${pt.size + 1.5}px`,
                  height: `${pt.size + 1.5}px`,
                  animationDelay: `${pt.delay}s`,
                  animationDuration: `${pt.duration + 1}s`
                }}
              />
            ))}

            {/* Custom Egyptian sarcophagus shape inside background of Treasure Hunt */}
            {room.roomId !== 'room_crypt' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-10 border-b border-cyan-500/10 flex justify-center items-end opacity-40">
                <div className="w-10 h-10 border border-double border-cyan-500/20 bg-cyan-950/10 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-cyan-400">☉</span>
                </div>
              </div>
            )}

            {/* Interactive objects for Treasure Hunt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length + (i * 20);
                  const radius = 64;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-cyan-500/80 border-cyan-400 scale-110 shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
                            : 'bg-cyan-950/40 border-cyan-900/60 group-hover:bg-cyan-500/30 group-hover:border-cyan-450'
                        }`}>
                          <Key className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-cyan-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border border-solid border-cyan-500/30 rounded-lg animate-spin" />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-cyan-400 block uppercase tracking-wider bg-black border border-cyan-950 px-1 py-0.5 rounded whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-cyan-700/60 uppercase">
              <span>SCANNER FIELD: AQUA GOLD</span>
              <span>RESONANCE: CALIBRATED</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CATEGORY 4: CONSPIRACY (EMERALD CYBER DEFENSE HANGAR)
            ======================================================== */}
        {room.category === RoomCategory.CONSPIRACY && (
          <div className="absolute inset-0 bg-[#030B07] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Blinking hazardous glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_80%)]"></div>

            {/* Arctic blizzard snowfall representation */}
            {particles.map((pt) => (
              <span
                key={pt.id}
                className="absolute bg-white/70 rounded-full animate-snow"
                style={{
                  left: `${pt.left}%`,
                  top: `0px`,
                  width: `${pt.size}px`,
                  height: `${pt.size}px`,
                  animationDelay: `${pt.delay}s`,
                  animationDuration: `${pt.duration}s`
                }}
              />
            ))}

            {/* Concentric spinning scanning lines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div 
                className="w-48 h-48 border border-dashed border-emerald-500 rounded-full animate-spin"
                style={{ animationDuration: '20s' }}
              ></div>
              <div 
                className="absolute w-32 h-32 border border-dashed border-emerald-400 rounded-full animate-spin"
                style={{ animationDuration: '10s', animationDirection: 'reverse' }}
              ></div>
            </div>

            {/* Dynamic themed hot-spots for Conspiracy */}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length - (i * 25);
                  const radius = 64;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-400 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
                            : 'bg-emerald-950/40 border-emerald-900/60 group-hover:bg-emerald-600/30'
                        }`}>
                          <Radio className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-emerald-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border border-dashed border-emerald-500 rounded-full animate-spin" />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-emerald-400 block uppercase tracking-wider bg-black border border-emerald-950 px-1 py-0.5 rounded whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-emerald-700/60 uppercase">
              <span>RADIATION RADAR: ACTIVE</span>
              <span>BIO-STABILIZER CODES: ACTIVE</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CATEGORY 5: HISTORICAL (AGED PARCHMENT FLORENCE SKETCHBOOK)
            ======================================================== */}
        {room.category === RoomCategory.HISTORICAL && (
          <div className="absolute inset-0 bg-[#0E0A08] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Elegant glowing Vitruvian model */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.05),transparent_80%)]"></div>

            {/* Bronze rising forge embers */}
            {particles.map((pt) => (
              <span
                key={pt.id}
                className="absolute bg-orange-400 rounded-full animate-rise-gold"
                style={{
                  left: `${pt.left}%`,
                  bottom: `10px`,
                  width: `${pt.size}px`,
                  height: `${pt.size}px`,
                  animationDelay: `${pt.delay}s`,
                  animationDuration: `${pt.duration + 2}s`
                }}
              />
            ))}

            {/* Large compass gear design overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <div className="w-40 h-40 border border-orange-500 rounded-full animate-spin" style={{ animationDuration: '35s' }}></div>
            </div>

            {/* Interactive objects for Historical (shields/stamps) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length;
                  const radius = 64;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-orange-600 border-orange-400 scale-110 shadow-[0_0_12px_rgba(249,115,22,0.6)]' 
                            : 'bg-orange-950/40 border-orange-900/60 group-hover:bg-orange-600/30'
                        }`}>
                          <Shield className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-orange-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border border-solid border-orange-500/40 rounded-lg animate-spin" />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-orange-400 block uppercase tracking-wider bg-black border border-orange-950 px-1 py-0.5 rounded whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-orange-700/60 uppercase">
              <span>ERA FIELD: BRONZE CORE</span>
              <span>CALENDAR DRIFT: 0.00%</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CATEGORY 6: DAILY / OTHER (CYBERPUNK NEON GLITCH SPACE)
            ======================================================== */}
        {(room.category === RoomCategory.DAILY || !Object.values(RoomCategory).includes(room.category)) && (
          <div className="absolute inset-0 bg-[#020909] select-none flex flex-col justify-between p-4 overflow-hidden">
            {/* Cyber core scanlines grids */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-[0.04] pointer-events-none">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-teal-500"></div>
              ))}
            </div>

            {/* Falling cyber circuit binary matrix particles */}
            {particles.map((pt) => {
              const num = pt.id % 2 === 0 ? "1" : "0";
              return (
                <span
                  key={pt.id}
                  className="absolute text-teal-500/65 font-mono text-[9px] animate-fall-binary"
                  style={{
                    left: `${pt.left}%`,
                    top: `-10px`,
                    animationDelay: `${pt.delay}s`,
                    animationDuration: `${pt.duration - 1}s`
                  }}
                >
                  {num}
                </span>
              );
            })}

            {/* Dual sweep vectors */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 border border-teal-500/15 rounded-full flex items-center justify-center">
                <div 
                  className="absolute inset-0 border-r border-[#00f7ff]/20 rounded-full"
                  style={{ transform: `rotate(${radarRotation}deg)`, transformOrigin: 'center' }}
                ></div>
                <div 
                  className="absolute w-32 h-32 border border-dotted border-teal-500/10 rounded-full"
                ></div>
                <Compass className="w-5 h-5 text-teal-800 animate-pulse" />
              </div>
            </div>

            {/* Interactive objects for Cyberpunk Mainframe / Daily */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {room.puzzle.objects.map((obj, i) => {
                  const isSelected = selectedObjectId === obj.id;
                  const angle = (i * 360) / room.puzzle.objects.length;
                  const radius = 64;
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.round(radius * Math.cos(radians));
                  const y = Math.round(radius * Math.sin(radians));

                  return (
                    <button
                      key={obj.id}
                      onClick={() => selectNode(obj)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-teal-500 border-teal-400 scale-110 shadow-[0_0_12px_rgba(20,184,166,0.6)]' 
                            : 'bg-teal-950/40 border-teal-900/60 group-hover:bg-teal-600/30'
                        }`}>
                          <Cpu className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-teal-400'}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -inset-1 border border-solid border-teal-500/40 rounded-full animate-bounce" />
                        )}
                        <span className="mt-1 text-[8px] font-mono text-teal-400 block uppercase tracking-wider bg-black border border-teal-950 px-1 py-0.5 rounded whitespace-nowrap">
                          {obj.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-[#5c7390]/60 uppercase">
              <span>NETWORK SWEEPER: TUNNELING</span>
              <span className="text-teal-500 animate-pulse">● FEED SIG COHERENT</span>
            </div>
          </div>
        )}

      </div>

      {/* FOOT NOTE */}
      <p className="text-[10px] font-sans text-neutral-500 text-center italic mt-1">
        💡 Use headphones or speakers! Synthesizer loops shift dynamic frequencies based on each category scenario.
      </p>
    </div>
  );
};
