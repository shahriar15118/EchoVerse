// SYNTHESIZED ATMOSPHERIC AUDIO CONTROLLER (Web Audio API)
// 100% Client-side synthesized sounds. Zero external network assets required.

let audioCtx: AudioContext | null = null;
let activeAmbientNode: { stop: () => void } | null = null;
let isMutedGlobal = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleMute = (): boolean => {
  isMutedGlobal = !isMutedGlobal;
  if (isMutedGlobal && activeAmbientNode) {
    activeAmbientNode.stop();
    activeAmbientNode = null;
  }
  return isMutedGlobal;
};

export const isMuted = () => isMutedGlobal;

// Play brief digital chime click
export const playClick = () => {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Pitch A5
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

// Play heavy mechanical keypress click
export const playKeypadClick = () => {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, ctx.currentTime); // Pitch E4
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

// Play error access-rejected warning tone
export const playErrorTone = () => {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    // Low double-pulse buzz
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(95, ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(98, ctx.currentTime); // dissonant beat-freq

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

// Play successful code-solved melody arpeggio
export const playSuccessMelody = () => {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major Arpeggio chime
    const duration = 0.12;
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.075;
      const playTime = ctx.currentTime + delay;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, playTime + duration);

      gain.gain.setValueAtTime(0.06, playTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, playTime + duration + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(playTime);
      osc.stop(playTime + duration + 0.1);
    });
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

// Play ambient atmosphere sounds depending on the category of room
export const startAmbientAtmosphere = (category: string) => {
  if (isMutedGlobal) return { stop: () => {} };
  
  // Stop existing ambient stream
  if (activeAmbientNode) {
    activeAmbientNode.stop();
  }

  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    // Normalise category strings to prevent casing issues
    const cat = category.trim().toLowerCase();

    if (cat === 'conspiracy' || cat === 'room_lab_c') {
      // --- CONSPIRACY / COLD WAR ARCTIC WIND & RADIO RADIATION HUM ---
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const biquad = ctx.createBiquadFilter();
      biquad.type = 'bandpass';
      biquad.Q.setValueAtTime(8.0, time);
      biquad.frequency.setValueAtTime(450, time);

      // LFO for wind howling oscillation
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, time); // 0.1 Hz slow howl
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(200, time);

      const baseHum = ctx.createOscillator();
      baseHum.type = 'sine';
      baseHum.frequency.setValueAtTime(73.4, time); // low D

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.015, time);

      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.025, time);

      // Add a periodic sonar radar beep (computerized ping)
      const pingOsc = ctx.createOscillator();
      pingOsc.type = 'sine';
      pingOsc.frequency.setValueAtTime(980, time);
      
      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(0, time);

      // sonorous radar ping loop
      const pingInterval = setInterval(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        pingGain.gain.setValueAtTime(0.01, now);
        pingGain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);
      }, 4000);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, time);
      masterGain.gain.linearRampToValueAtTime(0.8, time + 2.0);

      lfo.connect(lfoGain);
      lfoGain.connect(biquad.frequency);
      noise.connect(biquad).connect(noiseGain).connect(masterGain);
      baseHum.connect(humGain).connect(masterGain);
      pingOsc.connect(pingGain).connect(masterGain);

      masterGain.connect(ctx.destination);

      lfo.start();
      noise.start();
      baseHum.start();
      pingOsc.start();

      const stop = () => {
        clearInterval(pingInterval);
        try {
          lfo.stop();
          noise.stop();
          baseHum.stop();
          pingOsc.stop();
          masterGain.disconnect();
        } catch (_) {}
      };

      activeAmbientNode = { stop };
      return activeAmbientNode;

    } else if (cat === 'horror' || cat === 'room_cabin') {
      // --- HORROR / DISSONANT METALLIC SCRAPING & HEARTBEAT SYSTEM ---
      // Detuned screeching drones
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, time); // detuned low A
      gain1.gain.setValueAtTime(0.01, time);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(113, time); // dissonant beat freq
      gain2.gain.setValueAtTime(0.01, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, time);

      // Scary high-frequency metallic scraping sound played periodically
      const screecher = ctx.createOscillator();
      screecher.type = 'sawtooth';
      screecher.frequency.setValueAtTime(1600, time);
      const screechGain = ctx.createGain();
      screechGain.gain.setValueAtTime(0, time);

      const screechFilter = ctx.createBiquadFilter();
      screechFilter.type = 'bandpass';
      screechFilter.frequency.setValueAtTime(1200, time);
      screechFilter.Q.setValueAtTime(4, time);

      // Heartbeat pulse simulation
      const heartOsc = ctx.createOscillator();
      heartOsc.type = 'sine';
      heartOsc.frequency.setValueAtTime(55, time); // heavy blood thumb sound
      const heartGain = ctx.createGain();
      heartGain.gain.setValueAtTime(0, time);

      const heartTimer = setInterval(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        // bump 1
        heartGain.gain.setValueAtTime(0.08, now);
        heartGain.gain.linearRampToValueAtTime(0, now + 0.15);
        // bump 2 (double beat)
        heartGain.gain.setValueAtTime(0.07, now + 0.25);
        heartGain.gain.linearRampToValueAtTime(0, now + 0.45);
      }, 1400);

      const randomScrapeTimer = setInterval(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        screecher.frequency.setValueAtTime(1000 + Math.random() * 800, now);
        screechGain.gain.setValueAtTime(0.005, now);
        screechGain.gain.exponentialRampToValueAtTime(0.00001, now + 1.5);
      }, 7000);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, time);
      masterGain.gain.linearRampToValueAtTime(0.9, time + 2.0);

      osc1.connect(gain1).connect(filter);
      osc2.connect(gain2).connect(filter);
      filter.connect(masterGain);

      screecher.connect(screechFilter).connect(screechGain).connect(masterGain);
      heartOsc.connect(heartGain).connect(masterGain);

      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      screecher.start();
      heartOsc.start();

      const stop = () => {
        clearInterval(heartTimer);
        clearInterval(randomScrapeTimer);
        try {
          osc1.stop();
          osc2.stop();
          screecher.stop();
          heartOsc.stop();
          masterGain.disconnect();
        } catch (_) {}
      };

      activeAmbientNode = { stop };
      return activeAmbientNode;

    } else if (cat === 'mystery' || cat === 'historical') {
      // --- MYSTERY & HISTORICAL / SOPHISTICATED INVESTIGATIVE VIBRACHIME & CATHEDRAL DRONE ---
      const baseHum = ctx.createOscillator();
      baseHum.type = 'sine';
      baseHum.frequency.setValueAtTime(110, time); // A2 pure grounding drone
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.02, time);

      // Periodically trigger cozy, resonant vibraphone sounding tones
      const chimeOsc = ctx.createOscillator();
      chimeOsc.type = 'sine';
      
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, time);
      
      const notes = [220.00, 277.18, 329.63, 440.00, 554.37]; // Cozy A Major sleuth chords
      let noteIdx = 0;

      const mysteryNotesTimer = setInterval(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        const freq = notes[noteIdx % notes.length];
        noteIdx++;

        chimeOsc.frequency.setValueAtTime(freq, now);
        chimeGain.gain.setValueAtTime(0.05, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.00001, now + 3.0);
      }, 5000);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, time);
      masterGain.gain.linearRampToValueAtTime(0.85, time + 2.0);

      baseHum.connect(filter).connect(droneGain).connect(masterGain);
      chimeOsc.connect(chimeGain).connect(masterGain);
      masterGain.connect(ctx.destination);

      baseHum.start();
      chimeOsc.start();

      const stop = () => {
        clearInterval(mysteryNotesTimer);
        try {
          baseHum.stop();
          chimeOsc.stop();
          masterGain.disconnect();
        } catch (_) {}
      };

      activeAmbientNode = { stop };
      return activeAmbientNode;

    } else if (cat === 'treasure hunt' || cat === 'room_crypt') {
      // --- TREASURE HUNT / ANCIENT ALCHEMY PYRAMID DRIFT CHORD ---
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();
      const masterGain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(73.42, time); // D2
      gain1.gain.setValueAtTime(0.03, time);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110.00, time); // A2 (fifth)
      gain2.gain.setValueAtTime(0.035, time);

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(138.59, time); // C#3 (mystical chord note)
      gain3.gain.setValueAtTime(0.025, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, time);

      // Low LFO filter modulator to simulate candle wind flickering
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, time);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(45, time);

      masterGain.gain.setValueAtTime(0.0, time);
      masterGain.gain.linearRampToValueAtTime(0.9, time + 2.5);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc1.connect(gain1).connect(filter);
      osc2.connect(gain2).connect(filter);
      osc3.connect(gain3).connect(filter);

      filter.connect(masterGain).connect(ctx.destination);
      
      lfo.start();
      osc1.start();
      osc2.start();
      osc3.start();

      const stop = () => {
        try {
          lfo.stop();
          osc1.stop();
          osc2.stop();
          osc3.stop();
          masterGain.disconnect();
        } catch (_) {}
      };

      activeAmbientNode = { stop };
      return activeAmbientNode;

    } else {
      // --- DAILY & GENERIC / RETRO FUTURISTIC MAIN FRAME SYNTHTRACK ---
      const baseHum = ctx.createOscillator();
      baseHum.type = 'sine';
      baseHum.frequency.setValueAtTime(65.41, time); // C2 mainframe hum

      const synthLine = ctx.createOscillator();
      synthLine.type = 'triangle';
      
      const synthGain = ctx.createGain();
      synthGain.gain.setValueAtTime(0, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);

      // arpeggio pattern representing mainframe calculation processing
      const arpNotes = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00]; // C Major Arp
      let arpIndex = 0;

      const arpTimer = setInterval(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        const noteFreq = arpNotes[arpIndex % arpNotes.length];
        arpIndex++;

        synthLine.frequency.setValueAtTime(noteFreq, now);
        synthGain.gain.setValueAtTime(0.03, now);
        synthGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.45);
      }, 600);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, time);
      masterGain.gain.linearRampToValueAtTime(0.8, time + 2.0);

      baseHum.connect(filter).connect(masterGain);
      synthLine.connect(synthGain).connect(filter).connect(masterGain);
      
      masterGain.connect(ctx.destination);

      baseHum.start();
      synthLine.start();

      const stop = () => {
        clearInterval(arpTimer);
        try {
          baseHum.stop();
          synthLine.stop();
          masterGain.disconnect();
        } catch (_) {}
      };

      activeAmbientNode = { stop };
      return activeAmbientNode;
    }
  } catch (e) {
    console.warn("Audio Context blocked:", e);
    return { stop: () => {} };
  }
};

export const stopAmbientAtmosphere = () => {
  if (activeAmbientNode) {
    activeAmbientNode.stop();
    activeAmbientNode = null;
  }
};
