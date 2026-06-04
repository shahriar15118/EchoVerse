import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Sparkles, Terminal, FileText, Check, AlertCircle, RefreshCw, PenTool, Key } from 'lucide-react';
import { RoomCategory, RoomDifficulty } from '../types';

interface CreatorPanelProps {
  onRoomCreated: () => void;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({ onRoomCreated }) => {
  const { user, addCoins, addXp } = useAuth();
  
  // Design modes
  const [designMode, setDesignMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Core Form builder parameters (editable, filled automatically by Gemini)
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<RoomCategory>(RoomCategory.MYSTERY);
  const [difficulty, setDifficulty] = useState<RoomDifficulty>(RoomDifficulty.MEDIUM);
  const [story, setStory] = useState('');
  const [puzzleObjective, setPuzzleObjective] = useState('');
  const [puzzleSolution, setPuzzleSolution] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  // Custom objects within room
  const [roomObjects, setRoomObjects] = useState<{ id: string; name: string; description: string; isKey: boolean }[]>([
    { id: 'desk', name: 'Cedar Wood Desk', description: 'Atop the dusty desk rests a glowing, locked safe cylinder and some torn journals.', isKey: false },
    { id: 'cylinder', name: 'Safe Cylinder', description: 'The mechanical safe mechanism. Entering the correct sequence will reveal the level-exit trigger.', isKey: true }
  ]);

  const [hints, setHints] = useState<string[]>([
    "Review the journal writings carefully.",
    "Look underneath the desk drawer."
  ]);

  const [hiddenLore, setHiddenLore] = useState<string[]>([
    "The doctor was secretly hiding atomic formulas."
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // TRIGGER DUNGEON MASTER FORGE (SERVER-SIDE GEMINI ENCOUNTER)
  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    setAiGenerating(true);
    setAiError('');
    setSubmissionSuccess(false);

    try {
      const response = await fetch('/api/gemini/generate-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          difficulty: difficulty,
          category: category
        })
      });

      const parsed = await response.json();
      
      if (parsed.error && !parsed.title) {
        throw new Error(parsed.error);
      }

      // Populate form fields with the Gemini crafted blueprint
      setTitle(parsed.title || '');
      setDesc(parsed.description || '');
      setCategory(parsed.category || RoomCategory.MYSTERY);
      setDifficulty(parsed.difficulty || RoomDifficulty.MEDIUM);
      setStory(parsed.story || '');
      if (parsed.puzzle) {
        setPuzzleObjective(parsed.puzzle.description || '');
        setPuzzleSolution(parsed.puzzle.solution || '');
        if (parsed.puzzle.objects && parsed.puzzle.objects.length > 0) {
          setRoomObjects(parsed.puzzle.objects);
        }
        if (parsed.puzzle.hints && parsed.puzzle.hints.length > 0) {
          setHints(parsed.puzzle.hints);
        }
      }
      if (parsed.hiddenLore && parsed.hiddenLore.length > 0) {
        setHiddenLore(parsed.hiddenLore);
      }

      // Automatically pivot view to manual configuration so user can inspect and details edit
      setDesignMode('manual');
      if (parsed.error) {
        setAiError(parsed.error); // Warn user but allow editing Fallbacks!
      }
    } catch (err: any) {
      console.error("Gemini DM Forge error:", err);
      setAiError("Dungeon Master Forge timed out. Please retry or build manually.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !story || !puzzleObjective || !puzzleSolution) {
      alert("Please complete the required room coordinates before storing.");
      return;
    }

    setSubmitting(true);
    try {
      const roomId = 'room_' + Math.random().toString(36).substring(2, 11);
      
      const payload = {
        roomId,
        title,
        description: desc,
        category,
        creatorId: user?.uid || 'anonymous',
        creatorName: user?.username || 'Archivist',
        difficulty,
        status: 'active',
        thumbnail: 'dark_cabin',
        totalPlayers: 0,
        totalVisits: 0,
        premium: isPremium,
        aiGenerated: designMode === 'manual' && aiPrompt ? true : false,
        story,
        puzzle: {
          description: puzzleObjective,
          solution: puzzleSolution,
          objects: roomObjects,
          hints: hints
        },
        hiddenLore,
        evolvedLore: [],
        createdAt: new Date().toISOString()
      };

      // Add to Firestore database rooms collection using the generated roomId as the document ID
      await setDoc(doc(db, 'rooms', roomId), payload);

      // Award XP & Coins to the room builder!
      if (addCoins && addXp) {
        await addCoins(100);
        await addXp(250);
      }

      setSubmissionSuccess(true);
      // Reset builder form states
      setTitle('');
      setDesc('');
      setStory('');
      setPuzzleObjective('');
      setPuzzleSolution('');
      setAiPrompt('');
      onRoomCreated();
    } catch (err) {
      console.error("Room construction failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const addSandboxObject = () => {
    const novelId = 'obj_' + Math.random().toString(36).substring(2, 6);
    setRoomObjects([...roomObjects, { id: novelId, name: 'Shattered item', description: 'A suspicious relic.', isKey: false }]);
  };

  const updateSandboxObject = (index: number, key: string, val: any) => {
    const list = [...roomObjects];
    list[index] = { ...list[index], [key]: val };
    setRoomObjects(list);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 text-left animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-5 mb-6 gap-3">
        <div>
          <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">The Celestial Loom</span>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-tight">Dungeon Master Forge</h1>
          <p className="text-xs text-slate-500 font-mono">Construct sustainable, persistent puzzle coordinates. The community solves. Every action is remembered.</p>
        </div>

        {/* Builder Mode selection */}
        <div className="flex border border-white/5 p-0.5 rounded bg-[#121216]/50 text-xs font-mono">
          <button
            onClick={() => setDesignMode('ai')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded transition uppercase ${
              designMode === 'ai' ? 'text-teal-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI DM Forge (Gemini)
          </button>
          <button
            onClick={() => setDesignMode('manual')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded transition uppercase ${
              designMode === 'manual' ? 'text-teal-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Blueprint Draftsman
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER OVERLAY */}
      {submissionSuccess && (
        <div id="forge-toast-success" className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400 text-xs flex items-start gap-3 mb-6 relative">
          <Check className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold font-mono">CHAMBER SYNCHRONY COMMITTED!</h4>
            <p className="opacity-90 mt-1">Your created room has been loaded into the global EchoVerse grid. You have been rewarded <strong className="text-neutral-100 font-bold">+100 coins</strong> & <strong className="text-neutral-100 font-bold">+250 XP</strong> for your creator architecture.</p>
          </div>
        </div>
      )}

      {/* DESIGN MODE 1: SERVER-SIDE GEMINI FORGING */}
      {designMode === 'ai' && (
        <div id="ai-creator-module" className="bg-[#121216] border border-white/5 rounded-xl p-6 shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Breathe Room via Dungeon Master</h3>
              <p className="text-xs text-slate-400">Describe the atmosphere, scenario, history, and target codes. Gemini generates stories, objects, mechanisms, and answers instantly.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Prompt box */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-teal-400 font-mono uppercase tracking-widest block font-semibold">AI Creator Prompt</label>
              <textarea
                id="ai-prompt-input"
                rows={4}
                placeholder="e.g. 'A locked underground banker safety vault. After a global economic collapse, player notes reveal how the bankers fled. The core puzzle solution matches access codes written inside ledgers.'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-white/10 focus:border-teal-500/50 p-3 text-xs tracking-wide text-neutral-200 font-sans focus:outline-none rounded resize-none"
              ></textarea>
            </div>

            {/* Target Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Core Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0A0A0C] border border-white/10 p-2 text-xs font-mono text-neutral-200 outline-none rounded"
                >
                  {Object.values(RoomCategory).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Complexity Index</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#0A0A0C] border border-white/10 p-2 text-xs font-mono text-neutral-200 outline-none rounded"
                >
                  {Object.values(RoomDifficulty).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {aiError && (
              <p id="ai-composer-error" className="text-[11px] text-amber-500 font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {aiError}
              </p>
            )}

            <div className="pt-2 text-left">
              <button
                id="ai-forge-btn"
                disabled={aiGenerating || !aiPrompt}
                onClick={handleAIGenerate}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-450 text-black px-6 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-40 select-none active:scale-[0.98] transition"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Forging Narrative Arc... (Gemini Active)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Forge Room Coordinates (Costs 10 Credits)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESIGN MODE 2: MANUAL BLUEPRINT DRAFTSMAN AND INSPECTOR */}
      {designMode === 'manual' && (
        <form id="blueprint-builder-form" onSubmit={handleCreateRoom} className="space-y-6 animate-fade-in bg-[#121216] border border-white/5 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Coordinate Inspector Block
            </h3>
            <span className="text-[10px] text-slate-500 font-mono italic">Editable generated schema</span>
          </div>

          {/* Form grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Card Title</label>
              <input
                id="builder-title-input"
                type="text"
                placeholder="The Whispers of Laboratory C"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-white/10 p-2.5 text-xs text-neutral-200 outline-none focus:border-teal-500/50 rounded"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Visual Description Pitch</label>
              <input
                type="text"
                placeholder="A high-tech research incubator hidden inside a frozen tunnel."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-white/10 p-2.5 text-xs text-neutral-200 outline-none focus:border-teal-500/50 rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Category layer</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0A0A0C] border border-white/10 p-2 text-xs text-neutral-300 font-mono outline-none rounded"
              >
                {Object.values(RoomCategory).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Difficulty index</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-[#0A0A0C] border border-white/10 p-2 text-xs text-neutral-300 font-mono outline-none rounded"
              >
                {Object.values(RoomDifficulty).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end pb-1.5 text-left">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="rounded bg-[#0A0A0C] border-white/10 accent-amber-500"
                />
                Premium listing ($2.99)
              </label>
            </div>
          </div>

          {/* Backstory */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Chamber Backstory Story (3 spacious paragraphs)</label>
            <textarea
              rows={5}
              placeholder="Inject atmosphere backstory layers..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full bg-[#0A0A0C] border border-white/10 p-3 text-xs text-neutral-300 font-sans focus:outline-none focus:border-teal-500/50 rounded"
              required
            ></textarea>
          </div>

          {/* Puzzle Detail */}
          <div className="p-4 border border-white/5 rounded-lg bg-[#0D0D10] space-y-4">
            <h4 className="text-[11px] font-mono text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2 text-left">Core Puzzle mechanism</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Objective (What to solve)</label>
                <input
                  type="text"
                  placeholder="e.g. Decode safe passcode on cedar cylinder."
                  value={puzzleObjective}
                  onChange={(e) => setPuzzleObjective(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 p-2 text-xs text-neutral-200 outline-none rounded"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Definitive Solution Key (Answer String)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. N-Cu-O"
                    value={puzzleSolution}
                    onChange={(e) => setPuzzleSolution(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 p-2 pl-8 text-xs text-neutral-200 outline-none font-mono rounded"
                    required
                  />
                  <Key className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Config Objects list */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-teal-400 font-mono uppercase block font-semibold">Interactive virtual Objects ({roomObjects.length})</label>
                <button
                  type="button"
                  onClick={addSandboxObject}
                  className="text-[9px] text-teal-400 hover:text-teal-200 font-mono uppercase cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2.5">
                {roomObjects.map((obj, idx) => (
                  <div key={obj.id || idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#0A0A0C] p-2.5 rounded border border-white/5">
                    <input
                      type="text"
                      className="bg-[#121216] border border-white/10 p-1 text-[11px] text-neutral-300 rounded font-mono"
                      placeholder="Title Name"
                      value={obj.name}
                      onChange={(e) => updateSandboxObject(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-[#121216] border border-white/10 p-1 text-[11px] text-neutral-300 rounded sm:col-span-2"
                      placeholder="Interaction summary description"
                      value={obj.description}
                      onChange={(e) => updateSandboxObject(idx, 'description', e.target.value)}
                    />
                    <div className="flex items-center justify-end">
                      <label className="text-[10px] font-mono text-slate-500 select-none flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={obj.isKey}
                          onChange={(e) => updateSandboxObject(idx, 'isKey', e.target.checked)}
                          className="accent-amber-500 border-white/10"
                        />
                        Unlock Target
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submittals actions */}
          <div className="pt-3 border-t border-white/5 flex justify-end gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setDesignMode('ai')}
              className="px-4 py-2 bg-transparent text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              id="submit-room-forge-btn"
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 disabled:opacity-45 text-black px-6 py-2 rounded font-bold uppercase tracking-widest font-mono shadow-md transition"
            >
              {submitting ? 'Calibrating frequency...' : 'Commit Coordinates'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
