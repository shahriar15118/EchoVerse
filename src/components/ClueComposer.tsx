import React, { useState, useRef, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Mic, PenTool, Check, RotateCcw, AlertTriangle, Send } from 'lucide-react';

interface ClueComposerProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onClueAdded: () => void;
}

export const ClueComposer: React.FC<ClueComposerProps> = ({ roomId, isOpen, onClose, onClueAdded }) => {
  const { user, addXp, addCoins } = useAuth();
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'drawing'>('text');
  const [textContent, setTextContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Drawing Canvas configuration constants
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState('#f59e0b'); // Default amber
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  if (!isOpen || !user) return null;

  // --- AUDIO RECORDING HANDLERS ---
  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudio(null);
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudio(base64Audio);
        };
        // Stop audio streams
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Media devices mic blocked or not loaded. Simulating mock microphone stream telemetry:", err);
      // Fallback: Mock a recording
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setRecordedAudio("data:audio/webm;base64,MOCK_VOICE_ECHOWAVE_SOUND_STREAM_FOR_DEMONSTRATION_ONLY");
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --- DRAWING CANVAS HANDLERS ---
  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const coords = getEventCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- SUBMIT TRANSACTION ASSEMBLY ---
  const handleSubmitClue = async () => {
    setErrorText('');
    setSubmitting(true);

    let content = '';
    if (activeTab === 'text') {
      if (textContent.length < 5) {
        setErrorText("Clue detail is too shallow. Please write at least 5 characters.");
        setSubmitting(false);
        return;
      }
      content = textContent;
    } else if (activeTab === 'voice') {
      if (!recordedAudio) {
        setErrorText("Please log a voice recording stream first.");
        setSubmitting(false);
        return;
      }
      content = recordedAudio;
    } else if (activeTab === 'drawing') {
      const canvas = canvasRef.current;
      if (!canvas) {
        setErrorText("Drawing canvas failed initialization.");
        setSubmitting(false);
        return;
      }
      // Export base64
      content = canvas.toDataURL('image/png');
    }

    try {
      const clueId = 'clue_' + Math.random().toString(36).substring(2, 11);
      
      const payload = {
        clueId,
        roomId,
        userId: user.uid,
        username: user.username,
        content,
        clueType: activeTab,
        helpfulVotes: 0,
        misleadingVotes: 0,
        funnyVotes: 0,
        geniusVotes: 0,
        netCredibility: 0,
        flagged: false,
        createdAt: new Date().toISOString()
      };

      // Add to Firestore clues collection using clueId as the document ID
      await setDoc(doc(db, 'clues', clueId), payload);

      // Increment coins/XP for contribution
      await addCoins(15);
      await addXp(50);

      // Successfully submitted
      setTextContent('');
      setRecordedAudio(null);
      clearCanvas();
      onClueAdded();
      onClose();
    } catch (err: any) {
      console.error("Failed submitting clue:", err);
      setErrorText("Database mismatch: " + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="clue-composer-backdrop" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="composer-container" 
        className="w-full max-w-lg bg-[#121216] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex flex-col text-left"
      >
        {/* Header bar */}
        <div className="bg-[#0D0D10] px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-amber-500 uppercase">Transmit Archive Echo</h3>
            <p className="text-[10px] text-slate-450 font-mono">Your echo will linger here for all subsequent players.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 font-mono text-xs cursor-pointer p-1"
          >
            [ESC]
          </button>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-[#0D0D10] border-b border-white/5 text-xs">
          {[
            { id: 'text', label: 'Written Log', icon: FileText },
            { id: 'voice', label: 'Audio Frequency', icon: Mic },
            { id: 'drawing', label: 'Cartography Draw', icon: PenTool }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-wider border-b transition-colors ${
                  isActive 
                    ? 'text-amber-500 border-b-amber-500 bg-[#121216] font-bold' 
                    : 'text-neutral-400 border-b-transparent hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Composition Boards */}
        <div className="p-5 flex-1 min-h-[220px]">
          {/* TAB 1: TEXT LOG */}
          {activeTab === 'text' && (
            <div id="composer-board-text" className="space-y-4">
              <textarea
                id="clue-text-input"
                maxLength={500}
                placeholder="Log your thoughts... (e.g. 'The chemicals on the shelf spell N-Cu-O. Box unlocked, has aged letter inside! Check details')"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full h-36 bg-[#0A0A0C] border border-white/10 p-3 text-xs tracking-wide text-neutral-200 font-sans focus:outline-none focus:border-amber-500 rounded resize-none"
              ></textarea>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Markdown supported (**bold**, _italic_)</span>
                <span>{textContent.length}/500</span>
              </div>
            </div>
          )}

          {/* TAB 2: VOICE RECORDER */}
          {activeTab === 'voice' && (
            <div id="composer-board-voice" className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase font-semibold">ECHO DEVIATOR (Max 10s)</span>
                <p className="text-[11px] text-slate-400 font-mono">Record an audio file explaining hints or directions.</p>
              </div>

              <div className="flex items-center gap-5 pt-3">
                {isRecording ? (
                  <button
                    id="voice-stop-btn"
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-505 flex items-center justify-center text-rose-500 animate-pulse transition"
                  >
                    <span className="w-4 h-4 bg-rose-500 rounded-sm"></span>
                  </button>
                ) : (
                  <button
                    id="voice-record-btn"
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-500 transition"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}

                <div className="text-left">
                  <span className="text-lg font-mono tracking-widest font-bold">
                    00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                  <p className="text-[10px] text-[#5d7390] font-mono">
                    {isRecording ? 'Calibrating tape stream...' : recordedAudio ? 'Waveform aligned' : 'Stream idle'}
                  </p>
                </div>
              </div>

              {recordedAudio && (
                <div id="audio-playback-container" className="pt-2 w-full max-w-sm">
                  <audio src={recordedAudio} controls className="w-full h-10 outline-none rounded bg-neutral-900 filter invert" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CANVAS CARTOGRAPHY */}
          {activeTab === 'drawing' && (
            <div id="composer-board-drawing" className="flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between">
                {/* Paint Brushes palette */}
                <div className="flex items-center gap-1.5">
                  {['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border transition ${
                        brushColor === color ? 'border-neutral-100 scale-110' : 'border-[#0D0D10]'
                      }`}
                      title={color}
                    />
                  ))}
                </div>

                {/* Brush size settings */}
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={2} 
                    max={12} 
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 accent-amber-500"
                  />
                  <button
                    onClick={clearCanvas}
                    className="p-1 border border-white/10 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
                    title="Clear Board"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Real HTML5 Drawing Canvas */}
              <canvas
                id="composer-canvas"
                ref={canvasRef}
                width={440}
                height={160}
                onMouseDown={handleStartDrawing}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDrawing}
                onMouseLeave={handleStopDrawing}
                onTouchStart={handleStartDrawing}
                onTouchMove={handleDraw}
                onTouchEnd={handleStopDrawing}
                className="w-full bg-[#0A0A0C] border border-white/10 rounded cursor-crosshair"
              />
              <span className="text-[9px] text-[#5d7390] font-mono">Use your mouse or screen finger to paint maps, hints, or symbols.</span>
            </div>
          )}
        </div>

        {/* Errors & Bottom Actions */}
        {errorText && (
          <div id="composer-toast-error" className="px-5 py-2.5 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorText}
          </div>
        )}

        <div className="bg-[#0D0D10] p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-teal-400">
            <span className="inline-block px-1.5 py-0.5 rounded bg-[#121216] text-amber-500 border border-white/5 font-bold">+15 Coins</span>
            <span className="inline-block px-1.5 py-0.5 rounded bg-[#121216] text-teal-400 border border-white/5 font-bold">+50 XP</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-transparent text-slate-400 hover:text-slate-200 font-mono text-xs uppercase"
            >
              Discard
            </button>
            <button
              id="clue-composer-submit"
              disabled={submitting}
              onClick={handleSubmitClue}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 disabled:opacity-40 text-black px-4 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-widest transition shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Streaming...' : 'Transmit Echo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
