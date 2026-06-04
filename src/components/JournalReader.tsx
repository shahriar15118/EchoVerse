import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  HelpCircle, 
  FileText, 
  Info, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { playClick, playKeypadClick } from '../lib/audio';
import { PuzzleObject } from '../types';

interface JournalReaderProps {
  roomID: string;
  category: string;
  object: PuzzleObject;
  onClueInspected?: (clueKey: string) => void;
}

export const JournalReader: React.FC<JournalReaderProps> = ({ 
  roomID, 
  category, 
  object,
  onClueInspected
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPageVisited, setMaxPageVisited] = useState(0);

  // Reset page layout when object selection switches
  useEffect(() => {
    setCurrentPage(0);
    setMaxPageVisited(0);
  }, [object.id]);

  useEffect(() => {
    if (currentPage > maxPageVisited) {
      setMaxPageVisited(currentPage);
    }
    // Propagate that we read some chapters
    if (onClueInspected) {
      onClueInspected(`${object.id}-page-${currentPage}`);
    }
  }, [currentPage, object.id, onClueInspected]);

  const handleNext = () => {
    playKeypadClick();
    setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    playKeypadClick();
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  // Get pages dynamically based on room ID and the specific object ID
  const getJournalPages = () => {
    if (roomID === 'room_lab_c' && object.id === 'desk') {
      return [
        {
          title: "📄 Dr. Vance's Emergency Log - Page 1",
          subtitle: "REACTOR SECURITY COMMANDS // 1984",
          content: "The arctic freeze has penetrated Sector 3 of Laboratory C. Under the sudden pressure, our secondary refrigerant valves failed. Reactor Vault C is locked in automatic containment fallback mode. The emergency exit grid is sealed shut until chemical pressure balances are restored in the main cylinder safe.",
          visual: (
            <div className="border border-white/5 bg-black/60 p-3 rounded-md font-mono text-[9px] text-[#5c7390] space-y-1">
              <div className="text-teal-400 font-bold border-b border-teal-500/10 pb-1">ANOMALY DETECTED</div>
              <div>VAULT STATUS: SEVERE DRIFT</div>
              <div>CORE TEMPERATURE: -42°C</div>
              <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-teal-500 h-full w-12 animate-pulse"></div>
              </div>
            </div>
          )
        },
        {
          title: "🧪 Element Assessment - Page 2",
          subtitle: "STABILIZER EQUILIBRIUM RULES",
          content: "To trigger safe core deflation, we must introduce three distinct elements into the Reactor Cylinder in sequence. Placing them out of order triggers a security short circuit. Through trial, we know we must use a gas element, a conductive metal catalyst, and an organic oxidizer in exact chain rotation.",
          visual: (
            <div className="flex gap-2 justify-center py-2">
              <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded font-mono text-[10px] text-teal-300">GAS [?]</span>
              <span className="text-neutral-500">→</span>
              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded font-mono text-[10px] text-amber-300">METAL [?]</span>
              <span className="text-neutral-500">→</span>
              <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded font-mono text-[10px] text-red-300">OXIDIZER [?]</span>
            </div>
          )
        },
        {
          title: "🔢 Periodic Ledger - Page 3",
          subtitle: "SCATTERED FORMULA NOTES",
          content: "My journal ledger outlines the exact atomic numbers to calibrate. Element 7: Our life-shielding atmospheric Nitrogen [N]. Element 29: Our raw copper thermal conducts [Cu]. Element 8: The organic life-feeder Oxygen [O]. Dr. Vance left a bold scribble: Nitrogen first, then Copper, then Oxygen. The absolute lock sequence is formulated as N-Cu-O.",
          visual: (
            <div className="border border-amber-550/15 bg-amber-550/5 p-3 rounded-md font-mono text-[10px] text-amber-200/90 space-y-1.5 border-dashed">
              <div className="flex justify-between">
                <span>[7] NITROGEN</span>
                <span className="font-bold text-amber-400">Chemical Symbol: N</span>
              </div>
              <div className="flex justify-between">
                <span>[29] COPPER</span>
                <span className="font-bold text-amber-400">Chemical Symbol: Cu</span>
              </div>
              <div className="flex justify-between">
                <span>[8] OXYGEN</span>
                <span className="font-bold text-amber-400">Chemical Symbol: O</span>
              </div>
            </div>
          )
        },
        {
          title: "💡 Dr. Vance's Emergency Log - Page 4 (Final)",
          subtitle: "CYLINDER PROTOCOL CONFIRMED",
          content: "I have written down the elements in exact molecular structure sequence. Enter the code using the chemical symbols separated by hyphens on the titanium reactor safe. Once entered, the stabilizer will trigger. The solution code to decrypt Vault C is: N-Cu-O",
          visual: (
            <div className="flex flex-col items-center gap-1 bg-emerald-500/10 border border-emerald-500/35 p-3 rounded-md text-center">
              <span className="text-[10px] font-mono text-emerald-400 tracking-widest font-bold">STABILIZER CODE VERIFIED</span>
              <span className="text-lg font-mono font-bold text-white tracking-widest border-y border-white/20 px-4 py-1 mt-1">N-Cu-O</span>
            </div>
          )
        }
      ];
    }

    if (roomID === 'room_crypt' && object.id === 'plaques') {
      return [
        {
          title: "📜 Golden Alchemical Epigraph - Vol 1",
          subtitle: "THE DECREES OF FLAMEL",
          content: "Spotted in the dust of the tomb wall, three ancient iron plaques reflect the flickering incense flame. On each, deep runic incisions indicate the year of the crucible's seal. 'The fire of transmutation is bound by the digits of MDX. Convert the ancient Roman glyphs to decipher our alchemical sequence.'",
          visual: (
            <div className="flex justify-center gap-4 py-2">
              <span className="text-3xl font-mono text-amber-500 animate-pulse font-bold tracking-widest bg-amber-955/20 border border-amber-500/25 px-5 py-2 rounded">MDX</span>
            </div>
          )
        },
        {
          title: "🧙‍♂️ Transmutation Guide - Vol 2",
          subtitle: "ROMAN SCROLL LEGEND",
          content: "Alchemical conversion dictates: M represents 1000. D represents 500. X represents 10. Conjoined, they produce the numerical stabilizer. When consolidated, MDX equals exactly one thousand, five hundred, and ten (1510). Use this number sequence to trigger the Crucible flare.",
          visual: (
            <div className="font-mono text-[9px] border border-white/5 p-2 bg-black/40 rounded flex flex-col space-y-1">
              <div className="flex justify-between"><span>M (Thousand)</span><span>= 1000</span></div>
              <div className="flex justify-between text-yellow-600"><span>D (Five Hundred)</span><span>= 500</span></div>
              <div className="flex justify-between"><span>X (Ten)</span><span>= 10</span></div>
              <div className="border-t border-white/10 pt-1 text-right text-xs font-bold text-amber-400 font-sans mt-1">Total: 1000 + 500 + 10 = 1510</div>
            </div>
          )
        }
      ];
    }

    if (roomID === 'room_parlor' && object.id === 'desk') {
      return [
        {
          title: "🔍 Inspector's Scattered Diary - Vol 1",
          subtitle: "CASE FILE #1891: THE SLEUTH'S CHOICE",
          content: "August 14th. My investigations into London's underground vault conspiracy are almost complete. However, the shadow agents have compromised my parlor. I have locked my master dossier inside a trick wooden puzzle box. Under lock and key, only real detective prowess can save my life's records.",
          visual: (
            <div className="border border-purple-500/10 bg-purple-950/15 p-2.5 rounded font-mono text-[9px] text-purple-300">
              <span className="font-bold text-purple-400">DIARY NOTE:</span> 'My companion is legendary, his violin play atrocious, his deduction supreme.'
            </div>
          )
        },
        {
          title: "🎩 The Detective's Tribute - Vol 2",
          subtitle: "CODENAME DECRPYTION STATUS",
          content: "To open the parlor's secret bookshelf exit door beneath, configure the master key word. Choose the last name of the world's most outstanding consulting detective, created by Arthur Conan Doyle. The letters are capitalized. Input 'SHERLOCK' on the puzzle box lock cylinder to escape.",
          visual: (
            <div className="flex flex-col items-center p-3 bg-black/40 rounded border border-white/5">
              <span className="text-[10px] font-mono text-purple-400">SOLUTION CODE DETECTED</span>
              <span className="text-sm font-bold font-mono tracking-widest text-[#a855f7] mt-1">SHERLOCK</span>
            </div>
          )
        }
      ];
    }

    if (roomID === 'room_cabin' && object.id === 'bed') {
      return [
        {
          title: "🩸 Bloodstained Patient Intake Ledger - Part I",
          subtitle: "WARD A MEDICAL NOTES",
          content: "Patient #404 screams perpetually. Flickering red lights indicate our high-voltage generator has suffered failure. The emergency response protocols have locked us within Ward A. I cannot find the secondary keys to the coronary medicine cabinet where the master key for the main exit is kept.",
          visual: (
            <div className="border border-red-500/15 bg-red-950/10 p-2.5 rounded text-red-400 font-mono text-[9px]">
              <span className="block font-bold">⚠️ PROTOCOL 911 ACTIVE:</span>
              <span>'Save ourselves... Screaming is loudest near Ward A.'</span>
            </div>
          )
        },
        {
          title: "🏚️ Nurse's Final Scream - Part II",
          subtitle: "CABIN ESCAPE COORDINATE",
          content: "The locks require the ultimate emergency code conjoined with a distress word. I scribbled it on the patient straps before the shadows arrived! The word 'HELP' combined with '911' is the absolute stabilizing trigger. Enter 'HELP-911' on the medicine cabinet cylinder lock to escape the sanatorium.",
          visual: (
            <div className="flex flex-col items-center bg-[#450a0a]/40 border border-rose-500/20 p-2 rounded text-center">
              <span className="text-[9px] font-mono text-rose-500 block">SENSE OF EMERGENCY INCREASING</span>
              <span className="text-lg font-mono font-extrabold text-white tracking-widest animate-pulse">HELP-911</span>
            </div>
          )
        }
      ];
    }

    if (roomID === 'room_davinci' && object.id === 'desk') {
      return [
        {
          title: "🎨 Codex Atlanticus Excerpts - Page I",
          subtitle: "PLANETARY MECHANISMS // MILAN",
          content: "To trace the secrets of flight and perpetual mechanics, one must follow the signature on our creations. Simple gears interact to unlock our stone Cryptex. I have hidden the golden codex parameters within a marble cylinder structure in Florence.",
          visual: (
            <div className="border border-amber-500/10 bg-amber-500/5 p-2 rounded text-amber-500/80 font-mono text-[9px]">
              <span className="font-bold text-amber-400 block">CODENAME CODE ENCRYPT:</span>
              <span>'Who is the designer of the flying machine and the Vitruvian proportions?'</span>
            </div>
          )
        },
        {
          title: "📐 The Master's Signature - Page II",
          subtitle: "LEONARDO REVELATION",
          content: "The signature of the creator is the code. Enter his first name, 'LEONARDO' in capital letters, on the rolling cylinder cryptex. The gears will align, unlocking the hidden cabinet floor and giving safe exit from the Milan cell.",
          visual: (
            <div className="text-center p-3 border border-amber-500/20 bg-amber-500/10 rounded">
              <span className="text-[10px] font-mono text-amber-100 font-semibold uppercase">CRYPTEX KEYWORD UNCOVERED</span>
              <div className="text-sm font-mono tracking-widest font-extrabold text-white mt-1">LEONARDO</div>
            </div>
          )
        }
      ];
    }

    if (roomID === 'room_daily_challenge' && object.id === 'desk') {
      return [
        {
          title: "⚡ Cybernetic Core Telemetry Log - Page A",
          subtitle: "GRID RE-CALIBRATION SYSTEM",
          content: "This virtual training grid runs a rotating sequence matrix. The primary plasma containment grid requires a dedicated daily reboot passphrase. Today's virtual training passcode is logged on the system pedestal database.",
          visual: (
            <div className="border border-cyan-500/20 bg-cyan-950/15 p-2 text-cyan-400 font-mono text-[9px]">
              <span className="font-bold">SYSTEM STATUS: CODE EXPIRED</span>
              <span className="block text-emerald-400">ACTIVE ACTIVE RESIDUAL SEQUENCE DETECTED</span>
            </div>
          )
        },
        {
          title: "🔮 Resonance Formula - Page B",
          subtitle: "ECHO PROTOCOLS confirmed",
          content: "The daily containment barrier uses our brand's name conjoined with the release year of the simulation deck. Combine 'ECHO' with the year '2026' separated by a hyphen. Setting the sequence 'ECHO-2026' on the Plasma Containment locks resolves the challenge.",
          visual: (
            <div className="flex flex-col items-center justify-center p-2 border border-cyan-500/30 bg-cyan-500/5 rounded">
              <span className="text-[9px] font-mono text-cyan-300">ACTIVE CODEPHRASE DECRYPTED</span>
              <span className="text-xs font-mono font-bold text-white tracking-widest uppercase mt-0.5 animate-pulse">ECHO-2026</span>
            </div>
          )
        }
      ];
    }

    // Default procedural notes for custom-generated rooms / standard items
    return [
      {
        title: `📝 Detailed Mission Report: ${object.name}`,
        subtitle: `GEOPHYSICAL RECONNAISSANCE SCAN`,
        content: object.description + " The surface bears micro-friction dust. Upon close tactile search, you trace geometric carbon grooves that might indicate key symbols or security sequences in the escape puzzle.",
        visual: (
          <div className="border border-[#14532d]/40 bg-[#052e16]/30 p-2.5 rounded font-mono text-[10px] text-emerald-450 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Close visual scan shows no lock dials directly here, but clues pointing to hidden variables.</span>
          </div>
        )
      },
      {
        title: "🧬 Spatial Coordinate Record",
        subtitle: "CHAMBER FREQUENCY HARMONIC",
        content: `Analyzing telemetry data nearby... This coordinate suggests looking closely at the secondary items listed in this room to solve the main lock logic.`,
        visual: (
          <div className="p-3 bg-neutral-900 rounded border border-white/5 text-center">
            <span className="text-[10px] font-mono text-cyan-400 animate-pulse font-bold">RADIAL COHERENT MATCH FOUND</span>
          </div>
        )
      }
    ];
  };

  const pages = getJournalPages();
  const activePage = pages[currentPage] || pages[0];
  const allRead = maxPageVisited >= pages.length - 1;

  return (
    <div className={`rounded-lg border relative overflow-hidden p-4 ${
      roomID === 'room_lab_c' 
        ? 'bg-[#182635] border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.06)]' 
        : roomID === 'room_crypt'
        ? 'bg-[#1B110d] border-amber-900/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
        : roomID === 'room_parlor'
        ? 'bg-[#191523] border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]'
        : roomID === 'room_cabin'
        ? 'bg-[#220c0c] border-red-900/40 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
        : roomID === 'room_davinci'
        ? 'bg-[#20150d] border-amber-900/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
        : roomID === 'room_daily_challenge'
        ? 'bg-[#0d2222] border-cyan-800/30 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
        : 'bg-[#13131A] border-white/5'
    }`}>
      {/* Decorative notebook binders */}
      <div className="absolute top-0 inset-x-0 h-1.5 flex justify-around px-8">
        <span className="w-3 h-3 bg-neutral-600 rounded-b border-t border-neutral-850 -mt-1.5 z-10 shadow"></span>
        <span className="w-3 h-3 bg-neutral-600 rounded-b border-t border-neutral-850 -mt-1.5 z-10 shadow"></span>
        <span className="w-3 h-3 bg-neutral-600 rounded-b border-t border-neutral-850 -mt-1.5 z-10 shadow"></span>
        <span className="w-3 h-3 bg-neutral-600 rounded-b border-t border-neutral-850 -mt-1.5 z-10 shadow"></span>
      </div>

      {/* Internal pages structure */}
      <div className="flex flex-col space-y-3.5 mt-2 text-left">
        {/* Header tags */}
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider text-neutral-100 uppercase">
              {activePage.title}
            </h4>
            <span className="text-[9px] text-amber-500/80 font-mono tracking-widest uppercase block mt-0.5">
              {activePage.subtitle}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 bg-black/40 px-2 py-0.5 rounded-full">
            {currentPage + 1} / {pages.length}
          </span>
        </div>

        {/* Core content block */}
        <p className="text-neutral-300 leading-relaxed font-sans text-xs min-h-[72px]">
          {activePage.content}
        </p>

        {/* Visual graphic widget */}
        <div className="py-1">
          {activePage.visual}
        </div>

        {/* Ledger Bottom pagination controls */}
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded flex items-center gap-1 transition ${
              currentPage === 0 
                ? 'text-neutral-650 bg-transparent opacity-30 cursor-not-allowed' 
                : 'text-neutral-300 bg-white/5 hover:bg-white/10 active:scale-95'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev Page</span>
          </button>

          {currentPage < pages.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-3 py-1.5 text-[10px] font-mono uppercase bg-amber-500 hover:bg-amber-450 text-black font-semibold rounded flex items-center gap-1 transition animate-pulse active:scale-95"
            >
              <span>Next Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded animate-fade-in shadow-sm">
              <Check className="w-3.5 h-3.5" />
              <span>LOG READING COMPLETE</span>
            </span>
          )}
        </div>

        {/* Interactive puzzle insight notification */}
        {allRead && (
          <div className="mt-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-neutral-200 font-sans space-y-1.5 animate-bounce-short">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Dossier Discovery Inferred!</span>
            </div>
            <p className="text-neutral-300 leading-normal">
              {roomID === 'room_lab_c' 
                ? "You have analyzed Vance's calculations. Calibrating Vault C stabilizer requires Nitrogen (N) -> Copper (Cu) -> Oxygen (O) in correct structural sequences. Try entering the decrypted formula 'N-Cu-O' into the Reactor Safe key controller!"
                : roomID === 'room_crypt'
                ? "The Flamel epigraph converts MDX cleanly to 1510. Use '1510' inside the central Obsidian Crucible decryption cylinder."
                : roomID === 'room_parlor'
                ? "The Inspector's records reveal Arthur Conan Doyle's violin-playing genius companion is Sherlock. Try entering 'SHERLOCK' inside the master wooden puzzle box to escape."
                : roomID === 'room_cabin'
                ? "The nurse's dying patient log reveals that triggering Ward A recovery relies on distress code conjoined with emergency services digits. Try entering 'HELP-911' on the Coronado medicine cabinet."
                : roomID === 'room_davinci'
                ? "Leonardo's workspace sketches are signed. Try entering the signature 'LEONARDO' inside Milan's rotating cryptex cylinders."
                : roomID === 'room_daily_challenge'
                ? "The projection system reveals today's digital resonance formula key is conjoining our brand with the current year. Try entering 'ECHO-2026' into the daily simulation containment grid system."
                : `You finished analyzing the logs on ${object.name}. Return to the primary cylinder lock and test your hypotheses.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
