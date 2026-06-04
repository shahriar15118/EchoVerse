import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, getDocs, addDoc, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Navigation } from './components/Navigation';
import { Onboarding } from './components/Onboarding';
import { RoomCard } from './components/RoomCard';
import { ClueComposer } from './components/ClueComposer';
import { ClueWall } from './components/ClueWall';
import { CreatorPanel } from './components/CreatorPanel';
import { Bazaar } from './components/Bazaar';
import { Leaderboard } from './components/Leaderboard';
import { Room, RoomCategory, RoomDifficulty } from './types';
import { RoomAtmosphere } from './components/RoomAtmosphere';
import { JournalReader } from './components/JournalReader';
import { playClick, playSuccessMelody, playErrorTone, playKeypadClick } from './lib/audio';
import { 
  Sparkles, 
  Terminal, 
  Search, 
  Filter, 
  MapPin, 
  Cpu, 
  CpuIcon, 
  Timer,
  Lock, 
  ShieldCheck, 
  Key, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  User as UserIcon,
  Flame,
  Type
} from 'lucide-react';

export default function App() {
  const { 
    user, 
    firebaseUser, 
    loading: authLoading, 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    addCoins, 
    addXp,
    updateProfile
  } = useAuth();

  // Page Routing State
  const [currentView, setView] = useState<'dashboard' | 'play' | 'create' | 'bazaar' | 'leaderboard' | 'settings'>('dashboard');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Rooms Directory States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  // Active Gameplay States
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeObject, setActiveObject] = useState<{ id: string; name: string; description: string; isKey: boolean } | null>(null);
  const [codeGuess, setCodeGuess] = useState('');
  const [solvingStatus, setSolvingStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minute solve window helper count
  const [gameState, setGameState] = useState<'intro' | 'exploring' | 'escaped'>('intro');

  // Custom cosmetics stats
  const [cosmeticColorTheme, setCosmeticColorTheme] = useState<'amber' | 'cyan' | 'emerald'>('amber');

  // SEED DEFAULT HIGH-FIDELITY ROOMS IF FIRESTORE COLLECTION MEMORIAL IS EMPTY
  useEffect(() => {
    const seedDefaultRooms = async () => {
      let snap;
      try {
        snap = await getDocs(collection(db, 'rooms'));
      } catch (err) {
        console.error("Failed querying rooms collection to check if empty:", err);
        handleFirestoreError(err, OperationType.GET, 'rooms');
      }

      if (snap) {
        console.log("Checking EchoVerse rooms database consistency...");
        const preSeeds = [
          // ================= MYSTERY =================
          {
            roomId: 'room_parlor',
            title: "The Victorian Parlor Riddle",
            description: "Step into an elegant 19th-century study of a disappeared master sleuth. Piece together his clock-dial and letter.",
            category: RoomCategory.MYSTERY,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'archivist_prime',
            creatorName: 'Sherlockian 88',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'parlor',
            totalPlayers: 72,
            totalVisits: 215,
            premium: false,
            story: "Deep mahogany wood panels, leather-bound books, and a faint aroma of pipe weed fill this Victorian Parlor. A sudden fire burned all correspondence, but a master sleuth's last journal remains intact.\n\nSitting on a Davenport Desk, the open diary holds notes on Sherlock Holmes. A locked decorative Wooden Puzzle Box sits on the table, housing the escape lock key.",
            puzzle: {
              description: "Configure Arthur Conan Doyle's detective first name companion code on the drawer puzzle box.",
              solution: "SHERLOCK",
              objects: [
                { id: 'desk', name: 'Davenport Desk', description: 'Inside the desk drawer lies an interactive case file journal describing London underbelly conspiracies.', isKey: false },
                { id: 'lockbox', name: 'Wooden Puzzle Box', description: 'A detailed gear-carved wooden container. Configure the key combination to release the room key.', isKey: true }
              ],
              hints: ["Read the scattered diary on the Davenport Desk.", "The secret word resembles SF's most legendary consulting master."]
            },
            hiddenLore: ["The master sleuth left behind plans for a mechanical calculating engine."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_museum_theft',
            title: "The Midnight Museum Heist",
            description: "An alarms-armed gallery inside the London Art Museum. Relics are secure, but a legendary crown is gone.",
            category: RoomCategory.MYSTERY,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'archivist_prime',
            creatorName: 'Museum Curator',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'museum',
            totalPlayers: 85,
            totalVisits: 312,
            premium: false,
            story: "The London Art Museum glows with cold crimson alarm floodlights. At the center of the exhibition hall, a velvet pedestal sits under shattered display glass.\n\nA laser security grid protects the main exit gates. On a terminal, a blinking query asks for the catalog code index of the stolen Royal Headdress: CROWN-77.",
            puzzle: {
              description: "Enter the catalog query identifier of the stolen royal headdress to unlock the exit gates.",
              solution: "CROWN-77",
              objects: [
                { id: 'pedestal', name: 'Velvet Pedestal', description: 'A crushed velvet stand that previously held the Royal Headdress. It is labeled Catalog #77.', isKey: false },
                { id: 'grid_panel', name: 'Laser Grid Panel', description: 'A security barrier terminal locking down the museum. It accepts alphanumeric overrides.', isKey: true }
              ],
              hints: ["Examine the velvet layout stand labeled pedestal.", "The passcode includes the word 'CROWN' and the catalog number."]
            },
            hiddenLore: ["The headdress held a microscopic storage circuit containing deep state plans."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_noir_office',
            title: "The Neon Noir Detective Office",
            description: "Rain lashes against window blinds. Solve an unsolved murder inside a smoky 1940s consulting room.",
            category: RoomCategory.MYSTERY,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'sherlockian_88',
            creatorName: 'Detective Jack',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'office',
            totalPlayers: 120,
            totalVisits: 410,
            premium: true,
            story: "The air is heavy with cigar smoke and rain. A neon sign outside casts blue and pink hues across the office blinds.\n\nA heavy steel combination safe sits bolted to the floor. In the typewriter's carriage, a fragmented ribbon holds red carbon imprints spelling COBALT, while a postmark envelope on the desk carries the stamp PST.",
            puzzle: {
              description: "Configure the combination safe with the case's secret dye marker code.",
              solution: "COBALT-PST",
              objects: [
                { id: 'typewriter', name: 'Vintage Typewriter', description: 'Under a dusty light lies an old typewriter. The carbon film ribbon has ink patterns.', isKey: false },
                { id: 'black_safe', name: 'Shadowed Safe', description: 'A heavy metal vault. Input the complete dye marker code to access the confidential files.', isKey: true }
              ],
              hints: ["Look closely at the typewriter ribbon text.", "Join the ribbon word with the postmark stamp 'PST' using a hyphen."]
            },
            hiddenLore: ["The detective was close to proving the existence of a secret shadow government."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_quantum_enigma',
            title: "The Time-Traveler's Paradox",
            description: "Warped gravity curves inside a clockwork room from the future. Stabilize the cosmic paradox clock.",
            category: RoomCategory.MYSTERY,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'archivist_prime',
            creatorName: 'Temporal Envoy',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'quantum',
            totalPlayers: 154,
            totalVisits: 620,
            premium: true,
            story: "Light bends in bizarre angles as temporal loops expand inside the chamber. On the copper console bank, high-tech holographic schematics reveal calculations about cosmic chronology.\n\nA brass Paradox Chronometer spins uncontrollably, drawing local electricity. To anchor this timeline, you must calibrate the absolute temporal coordinate index: CHRONOS-99.",
            puzzle: {
              description: "Enter the cosmic temporal coordinate index into the Paradox Chronometer to end the timeline collapse.",
              solution: "CHRONOS-99",
              objects: [
                { id: 'console', name: 'Brass Console', description: 'A console with blinking plasma circuits showing notes on time-space dilation metrics.', isKey: false },
                { id: 'chronometer', name: 'Paradox Chronometer', description: 'A beautiful mechanical ticking device. Input the anchoring index to seal the temporal fissure.', isKey: true }
              ],
              hints: ["Look at the calculations on the brass console.", "The index starts with 'CHRONOS' and ends with double nines."]
            },
            hiddenLore: ["The time traveler was trying to prevent the Arctic meteorite impact of 1984."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },

          // ================= HORROR =================
          {
            roomId: 'room_ghost_attic',
            title: "The Haunted Mansion Attic",
            description: "Flickering kerosene lanterns cast shadows on moving furniture. Calm the weeping spectral child.",
            category: RoomCategory.HORROR,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'nightmare_builder',
            creatorName: 'The Weeping Lady',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'attic',
            totalPlayers: 180,
            totalVisits: 550,
            premium: false,
            story: "Cold air sends shivers down your spine. A singular wooden rocking chair moves back and forth with a creepy creak. Sitting nearby, a bloodstained music box is sealed shut.\n\nScribbled inside a dusty diary is the entry: 'The child only rests when she hears her favorite MELODY.'",
            puzzle: {
              description: "Calm the attic ghost by unlocking the musical device with its favorite word.",
              solution: "MELODY",
              objects: [
                { id: 'chair', name: 'Rocking Chair', description: 'A wooden chair rocking on its own. It holds a child\'s diary with faded nursery songs.', isKey: false },
                { id: 'music_box', name: 'Creaky Music Box', description: 'A delicate box with blood traces. It provides access to the cellar key once unlocked.', isKey: true }
              ],
              hints: ["Check the rocking chair's diary.", "The spectral child seeks her favorite sweet sound sequence."]
            },
            hiddenLore: ["The mansion's former owners disappeared overnight during a full winter eclipse."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_abandoned_subway',
            title: "Subway Track 404",
            description: "Deep underground, where static railway radio signals squeal. Power-route the derailed train.",
            category: RoomCategory.HORROR,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'nightmare_builder',
            creatorName: 'Subway Operator',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'subway',
            totalPlayers: 142,
            totalVisits: 398,
            premium: false,
            story: "Water drips from leaky ceilings. The station has been abandoned for twenty years, yet a mechanical train's electrical engine is humming.\n\nA ticket booth console flashes red error lines: 'Connection derailed. Emergency override index is TRACK-404.' Set the rusty railway lever junction to this route index.",
            puzzle: {
              description: "Override train route locks on the rusty control panel using the station's warning terminal code.",
              solution: "TRACK-404",
              objects: [
                { id: 'booth', name: 'Ticket Console', description: 'A dusty control terminal displaying railway diagnostic logs and emergency system procedures.', isKey: false },
                { id: 'lever_box', name: 'Rusty Train Control', description: 'A metal lever junction box with old gears. Key in the override route path to switch lines.', isKey: true }
              ],
              hints: ["Look at the flashing terminal inside the Ticket Console.", "The code combines train route word TRACK with the standard web error index."]
            },
            hiddenLore: ["Train 404 left the station in 1966 and never arrived, returning empty decades later."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_cabin',
            title: "The Red Cabin Sanatorium",
            description: "A terrifying dilapidated asylum cell. Flickering red lights reveal dry blood on the surgical bed and locked cabinet.",
            category: RoomCategory.HORROR,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'nightmare_builder',
            creatorName: 'Nightmare Builder',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'asylum',
            totalPlayers: 95,
            totalVisits: 310,
            premium: true,
            story: "Cold metal tables are rusted. Padded isolation cell walls are written with scratches and dry dark crimson streaks. Flickering diagnostic lights reflect shadows off a Steel Surgical Bed.\n\nA metal Coronado Coronary Cabinet stands near the medical harness cords with an emergency cylinder passcode interface.",
            puzzle: {
              description: "Decrypt the emergency distress numeric combination on the medical cabinet's lock.",
              solution: "HELP-911",
              objects: [
                { id: 'bed', name: 'Surgical Bed', description: 'Blood splattered straps and patient report binders detailing Ward A escape procedures.', isKey: false },
                { id: 'cabinet', name: 'Coronary Medicine Cabinet', description: 'A sturdy metal medical drawer containing hazardous supplies. Crack the lock to grab the gate opener.', isKey: true }
              ],
              hints: ["The straps contain blood drawings of medical reports.", "Try a combination of word HELP joined with emergency dialing service numbers."]
            },
            hiddenLore: ["The sanatorium conducted unauthorized high-frequency electromagnetic mind trials."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_demonic_summoning',
            title: "The Cathedral of Whispers",
            description: "Dissonant humming echoes under Gothic arches. Halt the forbidden gateway summoning ritual.",
            category: RoomCategory.HORROR,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'nightmare_builder',
            creatorName: 'The Dark Cleric',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'cathedral',
            totalPlayers: 210,
            totalVisits: 752,
            premium: true,
            story: "Sulphur fills the air as black wax candles flicker with green fire. On a stone platform, a pentagram circles glowing blood runes.\n\nA heavy brass Grimoire on a central podium whisps with shadows. Ancient text states: 'To close the gate of claws and shadow, invoke the demonic warden of the abyss: LUCIFER-666.'",
            puzzle: {
              description: "Enter the warden's name code on the Grimoire's lock plate to banish the expanding shadow rift.",
              solution: "LUCIFER-666",
              objects: [
                { id: 'circle', name: 'Pentagram Circle', description: 'A dark ritual circle painted in crimson. Symbols indicate numeric alignment bounds.', isKey: false },
                { id: 'grimoire', name: 'Gateway Atlas', description: 'A massive iron-clasped tome of dark incantations. Input the warden code to seal the gateway.', isKey: true }
              ],
              hints: ["Read the fiery script floating above the Pentagram Circle.", "Combine the dark lord's common Latin name with the number of the beast."]
            },
            hiddenLore: ["The church was built over a tectonic rift emitting hallucinogenic natural gas."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },

          // ================= TREASURE HUNT =================
          {
            roomId: 'room_buried_chest',
            title: "The Buccaneer's Lost Shore",
            description: "Golden sands cover a sunken brigantine shipwreck. Dig up captain's locked metal chest.",
            category: RoomCategory.TREASURE_HUNT,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'elder_gold',
            creatorName: 'Captain Redbeard',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'beach',
            totalPlayers: 290,
            totalVisits: 840,
            premium: false,
            story: "Warm sea waves crash against skeletal wooden planks of a wrecked galleon. Half-buried in sand is a heavy iron chest.\n\nA wooden log nearby is carved with the captain's oath: 'Only true brethren of the sea can unlock these doubloons. The secret password of the brotherhood is simply PIRATE.'",
            puzzle: {
              description: "Open the rusty iron chest by providing the captain's brotherhood passcode.",
              solution: "PIRATE",
              objects: [
                { id: 'shipwreck', name: 'Wooden Shipwreck', description: 'Skeletal remains of the vessel. A rusty cutlass holds down a leather logbook.', isKey: false },
                { id: 'iron_chest', name: 'Rusty Iron Chest', description: 'A heavy metal box adorned with skull engravings. Enter the brotherhood code to pop the locks.', isKey: true }
              ],
              hints: ["Read the leather logbook on the Shipwreck.", "The brotherhood code is a 6-letter word for a sea raider."]
            },
            hiddenLore: ["The gold was stolen from a royal convoy transporting treasure from South America."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_egyptian_tomb',
            title: "The Tomb of Anubis",
            description: "Ancient sandstone bricks hold statues of jackals. Align the solar scarab gears to open the golden tomb.",
            category: RoomCategory.TREASURE_HUNT,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'elder_gold',
            creatorName: 'Anubis Warden',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'egypt',
            totalPlayers: 195,
            totalVisits: 580,
            premium: false,
            story: "Torches flicker, casting long shadows across sandstone walls engraved with Egyptian hieroglyphs. At the chamber's end, a golden sarcophagus lies sealed.\n\nOn the stone frame, a basalt scarab dial lock displays celestial glyph matrices. Hieroglyphics translate to: 'To enter the realm of eternal afterlife, invoke the celestial power of the GOLDEN-SUN.'",
            puzzle: {
              description: "Turn the basalt scarab dials to input the celestial sun code to open the sarcophagus.",
              solution: "GOLDEN-SUN",
              objects: [
                { id: 'sarcophagus', name: 'Pharaoh Sarcophagus', description: 'A gilded final resting place with dynamic golden panels showing stellar alignments.', isKey: false },
                { id: 'dial_lock', name: 'Scarab Dial Lock', description: 'A circular rotating dial of green scarab beetle carvings. Enter the celestial passcode.', isKey: true }
              ],
              hints: ["Look at the solar paintings on the gilded Sarcophagus.", "The solution combines the hue of gold and the daytime sky fire."]
            },
            hiddenLore: ["The Pharaoh's tomb was built directly over a natural radium deposit, causing the 'mummy's curse'."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_crypt',
            title: "The Alchemist's Crypt",
            description: "An ancient stone vault with glowing candle lines. Decipher secrets of turning ash into solar gold.",
            category: RoomCategory.TREASURE_HUNT,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'elder_gold',
            creatorName: 'Nicolas Flamel',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'crypt',
            totalPlayers: 29,
            totalVisits: 88,
            premium: true,
            story: "Centuries of charcoal soot and burning incense coat the moss-carved walls. This is the domain of Nicolas Flamel's rogue students. In the core center stands a massive Obsidian Crucible with dynamic charcoal runes of turning.\n\nAn iron plaque reads: 'Only the compound of life and ash yields the philosopher stone. The secret string code of solar gold is: SOL-88.'",
            puzzle: {
              description: "De-scramble the obsidian transmutation cylinder runes.",
              solution: "SOL-88",
              objects: [
                { id: 'plaques', name: 'Iron Plaque', description: 'Engraved with ancient runic translations mentioning solar compound weights.', isKey: false },
                { id: 'crucible', name: 'Obsidian Crucible', description: 'A massive crucible of transmutations. Set the solution compound code to ignite gold fuel locks.', isKey: true }
              ],
              hints: ["The secret formula ends with double eights.", "Refer to solar indices."]
            },
            hiddenLore: ["Nicholas Flamel's elixir was actually synthesized from meteoric isotopes."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_atlantis_sanctuary',
            title: "The Sunken Citadel of Atlantis",
            description: "Deep oceanic pressure surrounds a glowing bio-luminescent crystal temple. Command Poseidon's trident keys.",
            category: RoomCategory.TREASURE_HUNT,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'elder_gold',
            creatorName: 'Oceanus',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'atlantis',
            totalPlayers: 104,
            totalVisits: 412,
            premium: true,
            story: "Bioluminescent coral colonies cast a warm aquamarine glow across the submerged crystal walls. Giant stone guardians flank a monumental central platform.\n\nAt the chamber's core stands Poseidon's Trident Pedestal. Dynamic runic dials on the pedestal's hydraulic dialer require the absolute deep water stabilizer coordinate: CHRONO-AQUA.",
            puzzle: {
              description: "Input the hydro-pressure alignment sequence on the trident pedestal dials to open the high-tech ocean grid.",
              solution: "CHRONO-AQUA",
              objects: [
                { id: 'altar', name: 'Coral Altar', description: 'A sacred stone tablet with blue glowing water circuits detailing temporal-ocean currents.', isKey: false },
                { id: 'pedestal', name: 'Trident Pedestal', description: 'The mechanical nexus holding the legendary trident key. Spell the deep water sequence to unlock.', isKey: true }
              ],
              hints: ["Trace the glowing water circuits on the Coral Altar.", "The code indexes time 'CHRONO' conjoined with the color of deep seas 'AQUA'."]
            },
            hiddenLore: ["Atlantis was actually a futuristic thermal power grid submerged by an ancient dam breach."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },

          // ================= CONSPIRACY =================
          {
            roomId: 'room_black_hawk',
            title: "Hangar 51 Alien Debris",
            description: "A secure Area 51 military aircraft bunker. Analyze the humming metallic saucer wreckage.",
            category: RoomCategory.CONSPIRACY,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'archivist_prime',
            creatorName: 'Colonel Vance',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'hangar',
            totalPlayers: 215,
            totalVisits: 672,
            premium: false,
            story: "Bright fluorescent spotlights shine onto a damaged, oval alien spacecraft covered with green army tarps.\n\nA military field terminal flashes red alert signals: 'Unidentified debris energetic spillover detected. To isolate gravity reactors, input the crash incident year conjoined prefix: UFO-1947.'",
            puzzle: {
              description: "Decrypt the crashed vessel's coordinate code on the main alien console to disable the warning alarms.",
              solution: "UFO-1947",
              objects: [
                { id: 'desk', name: 'Tarpaulin Desk', description: 'A temporary workbench storing classified telemetry dossiers detailing Roswell crash files.', isKey: false },
                { id: 'console', name: 'Alien Wreckage', description: 'A crystalline interface humming with anti-gravity sparks. Set the crash key override here.', isKey: true }
              ],
              hints: ["Look at the Roswell file folder on the Tarpaulin Desk.", "The passcode incorporates standard extraterrestrial abbreviation paired with the crash year."]
            },
            hiddenLore: ["The spaceship was actually an experimental high-altitude surveillance drone build by Soviet engineers."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_lab_c',
            title: "The Whispers of Laboratory C",
            description: "A frozen laboratory inside an abandoned arctic ridge. Prior entries reveal formulas left behind.",
            category: RoomCategory.CONSPIRACY,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'archivist_prime',
            creatorName: 'Archivist Prime',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'dark_cabin',
            totalPlayers: 48,
            totalVisits: 142,
            premium: false,
            story: "The blizzard outside Laboratory C howls with demonic wrath, but inside, only frozen silence reigns. In 1984, research investigators abruptly fled this reactor layout, leaving active steam lines to freeze solid into dynamic ice crystals.\n\nAt the chamber's center stands a dust-crusted Cedar Wood Desk, and atop it rests a glowing titanium Safe Cylinder emitting digital frequency hums inside the dead space. Scattered ledger files denote a specific chemical equation code sequence: N-Cu-O is the absolute stabilizer formula.",
            puzzle: {
              description: "Calibrate the Chemical Stabilizer sequence on the glowing titanium cylinder.",
              solution: "N-Cu-O",
              objects: [
                { id: 'desk', name: 'Cedar Wood Desk', description: 'Atop the dusty desk rests a glowing, locked digital safe cylinder and some torn journals.', isKey: false },
                { id: 'cylinder', name: 'Safe Cylinder', description: 'The main mechanical locker cylinder. Entering the stabilizer formula will stabilize Reactor C and unlock the security exit grid.', isKey: true }
              ],
              hints: [
                "Examine the torn journals nearby.",
                "stabilizer equations require Nitrogen, Copper, and Oxygen in sequence."
              ]
            },
            hiddenLore: ["The facility was originally storing radioactive meteorites."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_bunker_control',
            title: "The Cold War Fallout Bunker",
            description: "Retro glowing CRT monitors flicker. Intercept the rogue launch sequence before the missiles fly.",
            category: RoomCategory.CONSPIRACY,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'archivist_prime',
            creatorName: 'General Petrov',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'bunker',
            totalPlayers: 110,
            totalVisits: 310,
            premium: true,
            story: "Green cathode ray monitors buzz, indicating active rocket silos. An automated firing system is locked in countdown phase.\n\nFiles inside a steel filing drawer denote emergency de-contamination and reactor cleanup index: DECON-RED. Key this absolute code in the Central Terminal keyboard.",
            puzzle: {
              description: "Avert an automated nuclear launch sequence by inputting the system's absolute cleanup command.",
              solution: "DECON-RED",
              objects: [
                { id: 'monitors', name: 'Console Bank', description: 'A row of glowing CRT terminals displaying tactical warheads map and command logs.', isKey: false },
                { id: 'terminal', name: 'Reactor Terminal', description: 'The main nuclear override interface panel. Type in the absolute cleanup code to abort.', isKey: true }
              ],
              hints: ["Check the filing files and logs inside the Console Bank.", "The override joins short-form 'DECON' with color of danger: 'RED' using a hyphen."]
            },
            hiddenLore: ["The missile system was triggered by a rogue AI agent escaping from Arctic Lab C."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_simulation_breach',
            title: "The Glitched Matrix Containment",
            description: "Reality is breaking. Green digital code grids turn red. Trigger the master administrative escape loop.",
            category: RoomCategory.CONSPIRACY,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'archivist_prime',
            creatorName: 'The Architect',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'matrix',
            totalPlayers: 130,
            totalVisits: 489,
            premium: true,
            story: "Streaming neon vectors of the virtual construct start to glitch and pixelate. Alarms inside the simulated mainframe indicate memory leak of level 10.\n\nOn a glowing holograph console, logs note the administrator-level backdoor escape string: 'To collapse the containment grid, apply administrative override: OVERRIDE-8f.'",
            puzzle: {
              description: "Input the administrative bypass string into the malfunctioning core system to terminate the simulation.",
              solution: "OVERRIDE-8f",
              objects: [
                { id: 'matrix_node', name: 'Matrix Node', description: 'A digital console showing simulation source-code strings and glitch logs.', isKey: false },
                { id: 'break_node', name: 'Break Node', description: 'The central security switchboard. Submit the administrator override string to terminate loop.', isKey: true }
              ],
              hints: ["Look at the source logs inside the Matrix Node console.", "The override string is 'OVERRIDE-8f'."]
            },
            hiddenLore: ["This simulated matrix is actually running inside a server aboard the lost spaceship."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },

          // ================= HISTORICAL =================
          {
            roomId: 'room_medieval_keep',
            title: "The Castellan's High Armory",
            description: "Plated steel shields line massive stone pillars. Unsheathe the glowing mythic stonesword.",
            category: RoomCategory.HISTORICAL,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'florentine_guild',
            creatorName: 'Sir Galahad',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'castle',
            totalPlayers: 340,
            totalVisits: 980,
            premium: false,
            story: "Warm light leaks from iron torches. Steel broadswords and banners of historic lineages hang from massive granite walls.\n\nAt the back of the armory, a magnificent blue sword is wedged into an iron anvil block. The runes carved on the stone frame state: 'Speak the name of the king\'s legendary sword code to draw the blade: EXCALIBUR.'",
            puzzle: {
              description: "Unsheathe the mythic blade by entering the king's legendary weapon name.",
              solution: "EXCALIBUR",
              objects: [
                { id: 'armor', name: 'Knight Armor', description: 'A full set of gleaming plate steel armor holding an old parchment with historical legends.', isKey: false },
                { id: 'sword_altar', name: 'Blade Anvil', description: 'A monumental iron stand pinning down the blue glowing broadsword. Enter its name here.', isKey: true }
              ],
              hints: ["Read the parchment held by the full suite of Knight Armor.", "The secret word is the name of King Arthur's mythical blade."]
            },
            hiddenLore: ["The sword was crafted from a nickel-iron alloy meteorite that crashed in ancient Britain."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_davinci',
            title: "The Da Vinci Workroom",
            description: "Florence, 1492. Inside Leonardo's private workspace, complex planetary brass gears and old manuscripts await your analysis.",
            category: RoomCategory.HISTORICAL,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'florentine_guild',
            creatorName: 'Leonardo Da Vinci',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'davinci',
            totalPlayers: 110,
            totalVisits: 322,
            premium: false,
            story: "The workspace is bathed in soft, warm Florentine sunlight filter. Dozens of prototype models of gliders and repeating crossbow gears hang from ancient wooden rafter lines.\n\nOn the main mechanical workbench, handwritten draft pages of the Codex Atlanticus rest next to a heavy brass planetary alignment model. A marble lock cryptex holds your ticket to safety.",
            puzzle: {
              description: "Configure Leonardo's Florentine first name signature onto the rotating gears of the marble cylinder cryptex.",
              solution: "LEONARDO",
              objects: [
                { id: 'desk', name: 'Manuscript Workbench', description: 'The workbench holds historical Leonardo sketching tools and notes on the Vitruvian Proportion ratios.', isKey: false },
                { id: 'cryptex', name: 'Marble Cryptex', description: 'A glorious marble lock cylindric scroll box. Turn the gears to spell of Florentine genius.', isKey: true }
              ],
              hints: ["Read the drafting paper logs on the Manuscript Workbench.", "The master signed his drawings with his first name."]
            },
            hiddenLore: ["Leonardo secretly calculated the trajectory of the 1984 Arctic meteorite centuries in advance."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_mayan_temple',
            title: "The Mayan Sun Observatory",
            description: "Deep in the jungle of Tikal. Align basalt calendar glyph wheels to welcome the solar solstice cycle.",
            category: RoomCategory.HISTORICAL,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'florentine_guild',
            creatorName: 'High Priest Pacal',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'mayan',
            totalPlayers: 65,
            totalVisits: 198,
            premium: true,
            story: "Roots and vines weave into granite walls. Sand falls through stone blocks. A magnificent jade altar is carved with Mayan glyphs.\n\nOn the temple gate stands a large circular basalt Sun calendar wheel. Inscription tablets note: 'The solar sky snake descends when the solstice spell is cast: QUETZAL.'",
            puzzle: {
              description: "Turn the rings of the calendar wheel to align the glyphs to spell of the feather serpent god.",
              solution: "QUETZAL",
              objects: [
                { id: 'altar', name: 'Jade Altar', description: 'A flat stone tablet carved with constellations and jaguar carvings.', isKey: false },
                { id: 'sun_wheel', name: 'Mesoamerican Sun Wheel', description: "A heavy stone wheel lock mechanism. Set the serpent god's name code to roll back the stone door.", isKey: true }
              ],
              hints: ["Look at the jade altar carvings for feather serpent symbols.", "The solution is the Aztec/Mayan feather serpent god beginning with Q."]
            },
            hiddenLore: ["The Mayan calendar's end date was actually a calibration loop error, not an apocalypse prophecy."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_tesla_wardenclyffe',
            title: "The Wardenclyffe High Volt Lab",
            description: "Harness wireless power inside Nikola Tesla's legendary New York generator lab. Match the cosmic electric resonance.",
            category: RoomCategory.HISTORICAL,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'florentine_guild',
            creatorName: 'Nikola Tesla',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'tesla',
            totalPlayers: 125,
            totalVisits: 450,
            premium: true,
            story: "Enormous copper lightning coils buzz with high-frequency electricity, producing blue lightning arcs across the ceiling.\n\nA heavy brass switchboard console is loaded with voltage meters. Notes in Tesla's laboratory logbook state: 'The key to infinite cosmic energy resonance lies in the absolute power frequency index: ECHO-ENERGY.'",
            puzzle: {
              description: "Calibrate the main resonance sphere controls using the electric frequency index code to secure the reactor.",
              solution: "ECHO-ENERGY",
              objects: [
                { id: 'switchboard', name: 'Tesla Switchboard', description: 'A brass switch panel with ticking meters recording laboratory voltage fluxes.', isKey: false },
                { id: 'resonance_sphere', name: 'Resonance Sphere', description: 'A glass plasma sphere glowing with wireless electrical streams. Key in the cosmic prefix.', isKey: true }
              ],
              hints: ["Examine the voltage notebook on the brass Switchboard.", "The solution is 'ECHO-ENERGY'."]
            },
            hiddenLore: ["Tesla's wireless project was shut down because he successfully intercepted alien signals from the Arctic meteorite."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },

          // ================= DAILY =================
          {
            roomId: 'room_daily_training',
            title: "Sleuth Holo Suite",
            description: "A standard digital simulation arena. Learn the basic decryption protocols of the EchoVerse.",
            category: RoomCategory.DAILY,
            difficulty: RoomDifficulty.EASY,
            creatorId: 'echo_mainframe',
            creatorName: 'AI Overseer',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'training',
            totalPlayers: 480,
            totalVisits: 1820,
            premium: false,
            story: "Clean grid matrices wrap around a basic simulation deck. Blue computer wireframes construct virtual assets on the fly.\n\nA hologram floating above the console prompts: 'Junior Inspector training suite initialization. To begin calibration, enter standard test deck code: TRAIN-01.'",
            puzzle: {
              description: "Initialize the virtual simulator suite by typing the training deck code on the terminal console.",
              solution: "TRAIN-01",
              objects: [
                { id: 'terminal', name: 'Holo Terminal', description: 'An interactive holographic terminal highlighting tutorial parameters and bypass instructions.', isKey: false },
                { id: 'core_console', name: 'Training Core', description: 'The simulation database anchor. Enter the tutorial code to boot the game grid.', isKey: true }
              ],
              hints: ["Read the floating instructions above the Holo Terminal console.", "The solution is the word TRAIN joined with number 01 by a hyphen."]
            },
            hiddenLore: ["This suite was modeled after historical training archives from the British Secret Intelligence Service."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_daily_hack',
            title: "The Neo-Tokyo Router Hub",
            description: "A fast cyber-hacking cyber-room. Infiltrate secure server racks to steal encryption nodes.",
            category: RoomCategory.DAILY,
            difficulty: RoomDifficulty.MEDIUM,
            creatorId: 'echo_mainframe',
            creatorName: 'Neo Hacker',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'tokyo',
            totalPlayers: 320,
            totalVisits: 1102,
            premium: false,
            story: "Liquid coolant hums inside copper tubes. Neon cables dangle from towering server arrays in a dark Tokyo alley data vault.\n\nA central router gate blocks your link to the database. Diagnostics flash on the network monitor: 'Traffic congestion. To tunnel through firewall, redirect routing gateway to channel: ROUTER-5G.'",
            puzzle: {
              description: "Crack the routing hub firewall by submitting the emergency backplane gateway channel.",
              solution: "ROUTER-5G",
              objects: [
                { id: 'cables', name: 'Optical Cables', description: 'Glowing bundle of high-speed servers fiber-optics encoding regional matrix flows.', isKey: false },
                { id: 'router_hub', name: 'Network Hub', description: 'A blinking network router module. Punch in the gateway override to download the matrix data.', isKey: true }
              ],
              hints: ["Observe the glowing patterns on the fiber-optic cables.", "Type in ROUTER conjoined with the fifth-generation mobile signal string '5G'."]
            },
            hiddenLore: ["The servers are hosting an underground carbon credit exchange market."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_daily_anomaly',
            title: "The Void Singularity Chamber",
            description: "A black hole simulator swirling in space. Gravity coordinates are out of sync.",
            category: RoomCategory.DAILY,
            difficulty: RoomDifficulty.HARD,
            creatorId: 'echo_mainframe',
            creatorName: 'Singularity Pilot',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'void',
            totalPlayers: 180,
            totalVisits: 792,
            premium: false,
            story: "Stars warp around a dark gravitational energy vortex behind high-strength plasma fields. Gravity coordinates are fluctuating wildy.\n\nOn the reactor pedestal, warning labels read: 'To prevent spacetime tears and secure containment blocks, calibrate gravity coefficient metrics to: GRAVITY-0.'",
            puzzle: {
              description: "Calibrate gravity stabilizing reactors to prevent containment tear.",
              solution: "GRAVITY-0",
              objects: [
                { id: 'regulator', name: 'Gravity Regulator', description: 'A metal pedestal monitoring spatial pressure and showing gravity calculations.', isKey: false },
                { id: 'stabilizer', name: 'Singularity Stand', description: 'The main magnetic containment coil. Key in the zero-gravity index to lock in gravity fields.', isKey: true }
              ],
              hints: ["Check the warnings on the Gravity Regulator monitor.", "Enter standard gravity word joined with zero: 'GRAVITY-0'."]
            },
            hiddenLore: ["The singularity chamber was originally designed of harvesting dark energy to fuel interstellar travel."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          },
          {
            roomId: 'room_daily_challenge',
            title: "The Echo Chamber (Daily Challenge)",
            description: "A futuristic simulation training deck. The holographic grid rotates its encryption keys every 24 hours.",
            category: RoomCategory.DAILY,
            difficulty: RoomDifficulty.EXPERT,
            creatorId: 'echo_mainframe',
            creatorName: 'Echo Mainframe',
            status: 'active',
            aiGenerated: false,
            thumbnail: 'mainframe',
            totalPlayers: 240,
            totalVisits: 980,
            premium: false,
            story: "Cyan matrices glow on soundless grid floors. A towering Holo-Projection Pedestal in the room center constantly projects blue simulation diagnostics.\n\nA lock cylinder controls the active energy supply line. The containment grid is impenetrable unless Today's resonance sequence gets calibrated.",
            puzzle: {
              description: "Calibrate the daily mainframe security matrix password to reboot the Plasma Containment Grid.",
              solution: "ECHO-2026",
              objects: [
                { id: 'desk', name: 'Projection Pedestal', description: 'A sleek digital console displaying active simulation metrics and date encryption logs.', isKey: false },
                { id: 'generator', name: 'Plasma Containment Grid', description: 'A massive glowing magnetic generator holding high-frequency light shields.', isKey: true }
              ],
              hints: ["Check the calendar telemetry logs on the Projection Pedestal.", "The passcode structure is brand name 'ECHO' conjoined with standard year '2026'."]
            },
            hiddenLore: ["This mainframe coordinates the safety simulations for all EchoVerse adventurers."],
            evolvedLore: [],
            createdAt: new Date().toISOString()
          }
        ];

        const existingIds = snap.docs.map(d => d.id);
        for (const item of preSeeds) {
          if (!existingIds.includes(item.roomId)) {
            console.log(`Pre-seeding missing room: ${item.roomId}`);
            try {
              await setDoc(doc(db, 'rooms', item.roomId), item);
            } catch (err) {
              console.error(`Failed seeding room document ${item.roomId}:`, err);
              handleFirestoreError(err, OperationType.WRITE, `rooms/${item.roomId}`);
            }
          }
        }
      }
    };

    seedDefaultRooms();
  }, []);

  // QUERY FOR ACTIVE DIRECTORY ROOMS
  useEffect(() => {
    let q = query(collection(db, 'rooms'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Room[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Room);
      });
      // Sort newest level additions first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRooms(list);
      setRoomsLoading(false);
    }, (error) => {
      setRoomsLoading(false);
    });
    return unsubscribe;
  }, []);

  // GAME TIMERS (10 MINUTE COOLDOWN)
  useEffect(() => {
    if (currentView !== 'play' || gameState !== 'exploring') return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSolvingStatus('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, gameState]);

  // Handle gameplay session selections
  const handleSelectRoom = (room: Room) => {
    // If premium, confirm unlocked
    const isUnlocked = !room.premium || user?.premium || user?.purchasedRooms?.includes(room.roomId);
    if (!isUnlocked) {
      setView('bazaar');
      return;
    }

    setActiveRoom(room);
    setActiveObject(null);
    setCodeGuess('');
    setSolvingStatus('idle');
    setTimeRemaining(600); // 10 minutes reset
    setGameState('intro');
    setView('play');
  };

  // Submit password puzzle solving key
  const handleSubmitCode = async () => {
    if (!activeRoom) return;
    const target = activeRoom.puzzle.solution.trim().toUpperCase();
    const guess = codeGuess.trim().toUpperCase();

    if (guess === target) {
      playSuccessMelody();
      setSolvingStatus('success');
      setGameState('escaped');
      
      // Award XP & Coins to the victorious player!
      if (addXp && addCoins) {
        await addXp(120);
        await addCoins(30);
      }

      // Record room metrics in-app notifications
      try {
        const notifId = 'notif_' + Math.random().toString(36).substring(2, 11);
        await addDoc(collection(db, 'notifications'), {
          notificationId: notifId,
          userId: user?.uid,
          title: 'Grid Node Decoupled',
          body: `You solved "${activeRoom.title}" successfully! +120 XP & +30 Coins added to your index ledger.`,
          type: 'solve',
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Metric logging fail: ", err);
      }
    } else {
      playErrorTone();
      setSolvingStatus('failed');
    }
  };

  // Auth Submit Handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmail(loginEmail, loginPass);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials format.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!regUsername || !regEmail || !regPass) {
      setLoginError("Please complete all fields to align frequencies.");
      return;
    }
    try {
      await signUpWithEmail(regEmail, regPass, regUsername, ['Mystery', 'Historical']);
    } catch (err: any) {
      setLoginError(err.message || "Registration conflict alignment failed.");
    }
  };

  // Filters calculation
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || r.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Loading Gate fallback
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-neutral-100 flex flex-col items-center justify-center space-y-4 font-sans text-neutral-200">
        <div className="w-12 h-12 rounded bg-gradient-to-br from-amber-500 to-teal-500 flex items-center justify-center font-mono font-bold text-black border border-amber-450/35 animate-pulse text-lg">
          Ω
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold font-mono text-neutral-150 tracking-widest uppercase">Connecting EchoVerse</h2>
          <p className="text-[10px] text-teal-400 font-mono uppercase tracking-widest">Compiling active frequencies...</p>
        </div>
      </div>
    );
  }

  // LOGIN PORTAL CARD
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-[#dee2e6] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-neutral-200">
        {/* Subtle decorative background flares */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div id="login-container" className="w-full max-w-md bg-[#121216] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative p-8">
          {/* Brand header */}
          <div className="text-center pb-4 mb-6 border-b border-white/5">
            <span className="w-10 h-10 mx-auto rounded bg-gradient-to-br from-amber-500 to-teal-500 flex items-center justify-center font-mono font-bold text-black border border-amber-450/30 mb-3 text-lg">
              Ω
            </span>
            <h1 className="text-xl font-bold font-sans text-white uppercase tracking-tight">EchoVerse Portal</h1>
            <p className="text-xs text-teal-400 font-mono tracking-wider mt-0.5 uppercase">Asynchronous Mystery Archives</p>
          </div>

          <div className="space-y-4">
            {showRegisterForm ? (
              // REGISTER ACCOUNT DRAFTMAN
              <form id="registrar-form" onSubmit={handleRegister} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider">Investigator Profile Name</label>
                  <input
                    id="register-username"
                    type="text"
                    placeholder="e.g. detective_croft"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/65 rounded p-2.5 text-xs text-neutral-100 font-mono outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider">Mail Address</label>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="detective@echoverse.io"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/65 rounded p-2.5 text-xs text-neutral-100 font-mono outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider">Security Access Pass (Password)</label>
                  <input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/65 rounded p-2.5 text-xs text-neutral-100 font-mono outline-none"
                    required
                  />
                </div>

                {loginError && (
                  <p id="register-error-msg" className="text-[10px] text-amber-500 font-mono bg-amber-500/5 p-2 rounded border border-amber-500/20 text-center uppercase">
                    ⚠ {loginError}
                  </p>
                )}

                <button
                  id="register-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-teal-400 hover:text-white transition"
                >
                  Confirm Frequency Register
                </button>

                <p className="text-[11px] text-neutral-500 text-center font-sans pt-1">
                  Already registered?{' '}
                  <span 
                    onClick={() => {
                      setShowRegisterForm(false);
                      setLoginError('');
                    }}
                    className="text-amber-500 hover:underline cursor-pointer font-semibold font-mono"
                  >
                    Authorize Frequency
                  </span>
                </p>
              </form>
            ) : (
              // EMAIL LOGIN SIGN-IN
              <form id="authenticator-sign-in" onSubmit={handleSignIn} className="space-y-4 text-left">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-teal-400 uppercase tracking-wider">Frequency Mail Address</label>
                  <input
                    id="login-email-input"
                    type="email"
                    placeholder="detective@echoverse.io"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/65 rounded p-2.5 text-xs text-neutral-100 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-teal-400 uppercase tracking-wider">Access Pass (Password)</label>
                  <input
                    id="login-pass-input"
                    type="password"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/65 rounded p-2.5 text-xs text-neutral-100 outline-none"
                    required
                  />
                </div>

                {loginError && (
                  <p id="login-error-msg" className="text-[10px] text-amber-500 font-mono bg-amber-500/5 p-2 rounded border border-amber-500/20 text-center uppercase">
                    ⚠ {loginError}
                  </p>
                )}

                <button
                  id="email-login-submit"
                  type="submit"
                  className="w-full py-2.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 rounded font-mono text-xs uppercase text-teal-400 hover:text-white transition tracking-widest"
                >
                  Calibrate Access ID
                </button>

                <p className="text-[11px] text-neutral-500 text-center pt-1 font-sans">
                  Need register?{' '}
                  <span 
                    onClick={() => {
                      setShowRegisterForm(true);
                      setLoginError('');
                    }}
                    className="text-amber-500 hover:underline cursor-pointer font-semibold font-mono"
                  >
                    Claim Free Frequency Code
                  </span>
                </p>
              </form>
            )}

            {/* SEPARATOR */}
            <div className="flex items-center justify-between text-neutral-700 py-2">
              <div className="w-full h-px bg-white/5"></div>
              <span className="text-[9px] font-mono uppercase px-2 tracking-widest text-[#5d7390]">OR</span>
              <div className="w-full h-px bg-white/5"></div>
            </div>

            {/* HIGH FIDELITY GOOGLE LOGIN ACTUATOR */}
            <button
              id="google-popup-btn"
              onClick={signInWithGoogle}
              className="w-full py-2.5 bg-[#0a0a0c] hover:bg-white/5 border border-white/10 rounded text-xs font-mono font-semibold text-neutral-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.62l2.437-2.437C17.435 1.61 14.974 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.54 0 10.457-4 10.457-11 0-.714-.07-1.3-.214-1.714H12.24z" />
              </svg>
              Google Holographic Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IF AUTHED BUT USER PROFILE IS NOT CREATED IN FIRESTORE, PIPELINE ONBOARDING STEPPER
  if (firebaseUser && !user) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#dee2e6] flex flex-col font-sans relative overflow-hidden selection:bg-teal-500/20 selection:text-teal-300">
      {/* GLOBAL ATMOSPHERE FLOATING LOG INDICATORS */}
      <div className="absolute top-24 left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-24 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Persistent Navigation */}
      <Navigation currentView={currentView} setView={setView} />

      {/* MAIN VIEW CONTROLLER */}
      <main id="app-viewport" className="flex-1 pb-16">
        
        {/* VIEW 1: CENTRAL METROPOLIS DASHBOARD */}
        {currentView === 'dashboard' && (
          <div id="view-dashboard" className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-fade-in text-left">
            {/* Ambient Hero Card */}
            <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="space-y-2">
                <span className="text-[10px] text-amber-500 font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5">
                  Active Expedition Cycle
                </span>
                <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">Synchronized Mystery Grid</h2>
                <p className="text-xs text-slate-400 max-w-xl font-mono">Every movement is recorded. Investigate the memories of prior players. Input stabilizer sequences. Upgrade your directory ranks.</p>
              </div>

              {/* Investigator Welcome Stats card */}
              <div className="flex items-center gap-3 bg-[#0D0D10] border border-white/5 p-3.5 rounded-xl shrink-0 min-w-56 font-mono text-xs">
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-10 h-10 rounded bg-[#121216] border border-white/10 p-0.5"
                />
                <div>
                  <h4 className="font-bold text-white">@{user.username}</h4>
                  <div className="flex gap-2 text-[10px] mt-0.5">
                    <span className="text-amber-500 font-bold uppercase">{user.rank}</span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-teal-400">Credibility: {user.credibilityScore * 5 + 100}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct filtering columns */}
            <div className="bg-[#121216]/50 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
              {/* Search text box */}
              <div className="relative w-full sm:w-1/3 text-left">
                <input
                  id="dashboard-search-input"
                  type="text"
                  placeholder="Query archive title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 pl-9 pr-3 py-2 text-xs text-neutral-200 outline-none rounded"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
              </div>

              {/* Categories badge filter */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-neutral-500 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                  <Filter className="w-3 h-3 text-teal-500" /> Layer:
                </span>
                {['All', ...Object.values(RoomCategory)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-1 px-3 rounded transition ${
                      selectedCategory === cat 
                        ? 'text-amber-400 border border-amber-500/20 bg-amber-500/5 font-bold' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Layout of available layers */}
            {roomsLoading ? (
              <div className="py-24 text-center space-y-3 flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-t-amber-500 border-white/5 rounded-full animate-spin"></div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Opening Archive indexes...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="border border-dashed border-white/5 py-20 text-center rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                <MapPin className="w-10 h-10 text-slate-700 animate-pulse" />
                <h3 className="text-sm font-bold font-mono text-slate-400 uppercase">Chamber indices undetected</h3>
                <p className="text-xs text-slate-500 max-w-sm font-mono">No synchronized layouts matched your filtering rules. Expand your search patterns or build a custom room layout.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => {
                  const unlocked = !room.premium || user.premium || user.purchasedRooms?.includes(room.roomId);
                  return (
                    <RoomCard
                      key={room.roomId}
                      room={room}
                      isUnlocked={unlocked}
                      onSelect={() => handleSelectRoom(room)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: HIGH INTENSITY PLAYROOM ACTIVE CHAMBER */}
        {currentView === 'play' && activeRoom && (
          <div id="view-playroom" className="max-w-5xl mx-auto px-6 py-6 animate-fade-in text-left font-sans">
            {/* Header coordinates bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-3">
              <div>
                <span className="text-[10px] text-teal-400 font-mono uppercase tracking-widest block font-bold">Investigation Space ID: {activeRoom.roomId}</span>
                <h1 className="text-lg font-sans font-bold text-white flex items-center gap-1.5 uppercase">{activeRoom.title}</h1>
              </div>

              {/* Status parameters / Exit buttons */}
              <div className="flex items-center gap-3 font-mono text-xs">
                {gameState === 'exploring' && (
                  <div className="flex items-center gap-2 bg-[#0D0D10] border border-white/10 px-3 py-1.5 rounded" title="Solve cooldown timer">
                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-amber-400 font-mono tracking-wider">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60) < 10 ? `0${timeRemaining % 60}` : timeRemaining % 60}
                    </span>
                  </div>
                )}
                
                <button
                  id="leave-playroom"
                  onClick={() => {
                    setView('dashboard');
                    setActiveRoom(null);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white uppercase font-mono text-[10px] rounded transition"
                >
                  Return to Grid
                </button>
              </div>
            </div>

            {/* DYNAMIC SOLVING PHASES: INTRO STORY vs EXPLORING vs ESCAPED SUCCESS */}
            {gameState === 'intro' && (
              <div id="play-intro-module" className="bg-[#121216] border border-white/5 rounded-2xl p-8 max-w-2xl mx-auto space-y-6 shadow-2xl relative text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="text-center space-y-2">
                  <span className="text-[9px] text-amber-500 font-mono uppercase tracking-widest font-bold">Entering Living Archive</span>
                  <h2 className="text-base font-bold font-mono tracking-wider text-white uppercase">Initial Calibration Sequence</h2>
                  <p className="text-xs text-[#5d7390]">Establish cognitive link to core memory nodes.</p>
                </div>

                {/* Backstory text scrollboard */}
                <div className="p-5 rounded bg-[#0A0A0C] border border-white/5 max-h-80 overflow-y-auto text-xs leading-relaxed text-neutral-300 font-sans space-y-4 text-left">
                  {activeRoom.story.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-center">
                  <button
                    id="begin-exploration"
                    onClick={() => setGameState('exploring')}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500/80 to-teal-500/80 text-black px-8 py-3 rounded font-mono text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Begin Active Investigation
                  </button>
                </div>
              </div>
            )}

            {gameState === 'exploring' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LARGE LEFT HAND COL: GRAPHICS SCENERY BOARD AND INSPECTOR */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Dynamic Graphical Micro-Simulation Map */}
                  <RoomAtmosphere 
                    room={activeRoom} 
                    selectedObjectId={activeObject?.id || null} 
                    onSelectObject={(obj) => setActiveObject(obj)} 
                  />

                  {/* Dedicated visual item inspection viewport console */}
                  {activeObject && (
                    <div id="inspector-console-view" className="bg-[#121216] border border-white/5 rounded-xl p-5 shadow-lg space-y-4 text-left animate-fade-in">
                      <div className="flex justify-between border-b border-white/5 pb-2 text-[#5d7390] font-mono text-[10px] uppercase">
                        <span>Examining: {activeObject.name}</span>
                        <span className="text-amber-500 tracking-wider font-semibold animate-pulse">Active Inspector Stream</span>
                      </div>
                      {/* Interactive Clue & Journal Reader System */}
                      <JournalReader 
                        roomID={activeRoom.roomId}
                        category={activeRoom.category}
                        object={activeObject}
                      />
                      
                      {/* If chosen item is key object safe, prompt the Solver Code input box directly */}
                      {activeObject.isKey ? (
                        <div className="pt-4 border-t border-white/5 mt-2 flex flex-col gap-2">
                          <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider block font-semibold">Calibrate Object Solution Code</label>
                          <div className="flex items-center gap-3">
                            <input
                              id="keypad-input-box"
                              type="text"
                              placeholder="Enter sequence key..."
                              value={codeGuess}
                              onChange={(e) => {
                                setCodeGuess(e.target.value);
                                playClick();
                              }}
                              className="bg-[#0A0A0C] border border-white/10 text-neutral-100 font-mono px-3 py-2 text-xs w-52 rounded uppercase text-center focus:border-amber-450 outline-none cursor-text"
                            />
                            <button
                              id="keypad-cipher-submit"
                              onClick={handleSubmitCode}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-black rounded font-mono text-xs font-bold uppercase transition active:scale-95"
                            >
                              Decrypt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 text-neutral-550 font-mono text-[9px] uppercase flex items-center gap-1.5 text-slate-500">
                          <Search className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                          <span>No lock interface detected on this object nodule. Search elsewhere...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LARGE PERSISTENT REVOLUTIONARY USER CLUES BOARD WALL */}
                  <ClueWall roomId={activeRoom.roomId} />
                </div>

                {/* RIGHT HAND COLUMN: COGNITIVE HUD AND ACTION BOARD */}
                <div className="space-y-6">
                  {/* Active solve actions module */}
                  <div className="bg-[#121216] border border-white/5 rounded-xl p-5 shadow-lg space-y-4 text-left">
                    <h3 className="text-xs font-bold font-mono text-teal-400 uppercase tracking-widest border-b border-white/5 pb-2">Investigator HUD</h3>
                    
                    <div className="space-y-4">
                      {/* Difficulty reminder and rules */}
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="p-2 bg-[#0A0A0C] rounded border border-white/5">
                          <span className="text-slate-500 uppercase block">Complexity</span>
                          <span className="text-amber-500 font-bold uppercase mt-1 block">{activeRoom.difficulty}</span>
                        </div>
                        <div className="p-2 bg-[#0A0A0C] rounded border border-white/5">
                          <span className="text-slate-500 uppercase block">Expedition Value</span>
                          <span className="text-teal-400 font-bold uppercase mt-1 block">+120 XP / +30 🪙</span>
                        </div>
                      </div>

                      {/* KEYPAD CIPHER MODULE */}
                      <div className="p-3.5 rounded bg-[#0A0A0C] border border-white/10 space-y-3 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#5a7390]">
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chamber Keypad Lock</span>
                        </div>

                        {/* Solving status toaster alerts */}
                        {solvingStatus === 'failed' && (
                          <div id="keypad-failed-toast" className="p-2 bg-rose-500/15 text-rose-400 rounded text-[11px] font-mono flex items-center gap-1.5 border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Frequency mismatch code rejected.</span>
                          </div>
                        )}

                        <div className="space-y-2">
                          <input
                            id="keypad-hud-input"
                            type="text"
                            placeholder="e.g. SOL-88"
                            value={codeGuess}
                            onChange={(e) => setCodeGuess(e.target.value)}
                            className="w-full bg-[#121216] border border-white/10 focus:border-amber-500/40 text-white font-mono text-center text-sm py-2 px-3 rounded outline-none uppercase"
                          />
                          <button
                            id="keypad-hud-submit"
                            onClick={handleSubmitCode}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 text-black font-semibold rounded font-mono text-xs uppercase cursor-pointer"
                          >
                            Submit Cipher Key
                          </button>
                        </div>
                      </div>

                      {/* MULTIPLAYER ARCHIVE CO-OPERATION BUTTONS */}
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] text-[#5c7390] font-mono uppercase tracking-widest block">Expedition Contributions</span>
                        
                        <button
                          id="composer-modal-trigger"
                          onClick={() => setIsComposerOpen(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 rounded font-mono text-xs uppercase tracking-wide text-teal-400 hover:text-white transition"
                        >
                          <Cpu className="w-4 h-4 text-amber-500 fill-transparent shrink-0 animate-pulse" />
                          Transmit Memory Clue
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Hints container board */}
                  <div className="bg-[#121216] border border-white/5 rounded-xl p-5 shadow-lg space-y-3 font-sans text-xs text-left">
                    <h4 className="font-mono text-xs text-amber-500 tracking-wider uppercase border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Static Hints Available ({activeRoom.puzzle.hints.length})
                    </h4>
                    <ul className="space-y-2.5 list-disc pl-4 text-slate-400">
                      {activeRoom.puzzle.hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {/* STAGE 3: ESCAPE SUCCESSFUL CONGRATS CARD */}
            {gameState === 'escaped' && (
              <div id="play-escaped-hero" className="bg-[#121216] border border-emerald-500/20 rounded-2xl p-10 max-w-xl mx-auto text-center space-y-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none rounded-2xl"></div>

                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl animate-bounce">
                    🎉
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest block font-bold">GRID NODE DECOUPLED INDEFINITELY!</span>
                  <h2 className="text-xl font-bold font-sans text-white uppercase tracking-tight">{activeRoom.title}</h2>
                </div>

                <div className="p-4 rounded-lg bg-[#0A0A0C] border border-white/5 font-sans text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto space-y-2 text-left">
                  <p>Stabilization sequence fully matched and committed to the central server archive.</p>
                  <p>Your actions leave a permanent coordinate imprint. Check leaderboard ranks to see your newly calculated intelligence index!</p>
                </div>

                <div className="flex items-center justify-center gap-6 py-2.5 max-w-xs mx-auto text-xs font-mono">
                  <div className="p-2 border border-white/10 rounded-lg bg-[#0A0A0C] text-center w-full">
                    <span className="text-[#5d7390] uppercase text-[9px] block">Rank Gains</span>
                    <span className="text-teal-400 font-bold block mt-1">+120 XP</span>
                  </div>
                  <div className="p-2 border border-white/10 rounded-lg bg-[#0A0A0C] text-center w-full">
                    <span className="text-[#5d7390] uppercase text-[9px] block">Coins Found</span>
                    <span className="text-amber-500 font-bold block mt-1">+30 Coins</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center font-mono text-xs">
                  <button
                    onClick={() => {
                      setView('dashboard');
                      setActiveRoom(null);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 text-black font-semibold rounded uppercase tracking-wider"
                  >
                    Return to Grid list
                  </button>
                </div>
              </div>
            )}

            {/* Modal Clue Composer Overlay */}
            <ClueComposer
              roomId={activeRoom.roomId}
              isOpen={isComposerOpen}
              onClose={() => setIsComposerOpen(false)}
              onClueAdded={async () => {
                setIsComposerOpen(false);
                if (activeRoom && addXp && addCoins) {
                  // Incremented player profile stats
                  await addXp(50);
                  await addCoins(15);
                }
              }}
            />
          </div>
        )}

        {/* VIEW 3: CREATOR FORGE PANEL */}
        {currentView === 'create' && (
          <CreatorPanel onRoomCreated={() => setView('dashboard')} />
        )}

        {/* VIEW 4: PREMIUM SUBSCRIPTION AND CREDIT BAZAAR */}
        {currentView === 'bazaar' && (
          <Bazaar />
        )}

        {/* VIEW 5: LEADERBOARDS AND SCORE RATINGS */}
        {currentView === 'leaderboard' && (
          <Leaderboard />
        )}

        {/* VIEW 6: settings and cosmetics themes layout options */}
        {currentView === 'settings' && user && (
          <div id="view-settings" className="max-w-2xl mx-auto py-8 px-6 text-left animate-fade-in font-sans space-y-6">
            <div className="border-b border-white/5 pb-4 mb-6">
              <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">Investigator Terminal</span>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Settings</h1>
              <p className="text-xs text-slate-500 font-mono">Adjust calibration protocols, bio records, and in-app display cosmetics.</p>
            </div>

            {/* BIO EDIT CARD */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                alert("Settings coordinates committed to persistent profile Firestore.");
              }}
              className="space-y-4 bg-[#121216] border border-white/5 p-5 rounded-xl shadow-lg"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-teal-400 font-mono uppercase tracking-wider block font-semibold">Investigator Biography (Bio)</label>
                <textarea
                  rows={3}
                  placeholder="Share your expertise secrets with other players..."
                  value={user.bio || ''}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  className="w-full bg-[#0A0A0C] border border-white/10 focus:border-amber-500/40 p-3 text-xs text-neutral-200 font-sans outline-none rounded resize-none"
                ></textarea>
              </div>

              {/* Color accents theme toggle */}
              <div className="space-y-2 pt-2 text-left">
                <span className="text-[10px] text-teal-400 font-mono uppercase tracking-wider block font-semibold">Visual Highlight Accent Color Theme</span>
                <div className="flex gap-3">
                  {[
                    { id: 'amber', name: 'Amber Core', hex: 'bg-amber-500' },
                    { id: 'cyan', name: 'Cyber Cyan', hex: 'bg-cyan-500' },
                    { id: 'emerald', name: 'Emerald Vault', hex: 'bg-emerald-500' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setCosmeticColorTheme(theme.id as any)}
                      className={`flex-1 py-2 font-mono text-[11px] uppercase rounded border transition flex items-center justify-center gap-1.5 ${
                        cosmeticColorTheme === theme.id 
                          ? 'border-amber-500 text-amber-500 bg-amber-500/5 font-bold' 
                          : 'border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/10'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.hex}`}></span>
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-450 selection:bg-amber-600 text-black font-semibold rounded font-mono text-xs uppercase"
                >
                  Save Coordinates
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
