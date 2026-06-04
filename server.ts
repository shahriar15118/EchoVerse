import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize server-side Gemini SDK if key is available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Server initialized server-side Gemini API client successfully.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI Room Generation features will run in mock demonstration mode.");
}

// -------------------------------------------------------------
// SERVER-SIDE API ROUTES (Must declare BEFORE Vite Middlewares)
// -------------------------------------------------------------

// 1. Health check & API state check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    has_gemini: !!apiKey,
    timestamp: new Date().toISOString()
  });
});

// 2. Gemini-Powered Mystery Room Builder (Dungeon Master)
app.post("/api/gemini/generate-room", async (req, res) => {
  const { prompt, difficulty, category } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "A descriptive prompt is required to conjure the mystery room." });
  }

  // Fallback room data case if Gemini is not key-configured
  const mockGeneratedRoom = {
    title: `The Whisper of ${category || 'Shadows'}`,
    description: `A bizarre, atmospheric chamber matching: "${prompt.slice(0, 40)}..."`,
    category: category || "Mystery",
    difficulty: difficulty || "Medium",
    story: `The floorboards creak beneath your feet in this isolated laboratory. Whispers fill the air, echoing player actions that occurred months ago.\n\nA shattered antique wall clock hangs crooked, stuck at exactly midnight. Beside it, scrap papers list chemical formulations. Underneath, a heavy steel strongbox requires some physical code.`,
    puzzle: {
      description: "Discover the password by joining clue hints found on the clock, formulation formulas, and wall carvings.",
      objects: [
        { id: "clock", name: "Crooked Midnight Clock", description: "An antique grandfather clock. The hands do not move, but clicking them reveals a tiny compartment labeled '06-04'.", isKey: false },
        { id: "papers", name: "Scribbled Formulas", description: "Formulations revealing chemical numbers: 'NITROGEN + COPPER + OXYGEN'. Using high-school chemistry abbreviations reveals N-Cu-O.", isKey: false },
        { id: "box", name: "Steel Strongbox", description: "A locked container with an alpha lock mechanism. Opening it requires entering the matching code word.", isKey: true }
      ],
      solution: "N-Cu-O",
      hints: [
        "Take a close look at the Chemical symbols for Nitrogen, Copper, and Oxygen in sequence.",
        "The hand stuck at midnight represents twelve, or atomic coordinates."
      ]
    },
    hiddenLore: [
      "The scientist who owned this lab was studying time travel or memories left by solid particles.",
      "A previous investigator found a lead here but was dragged away by mechanical spiders."
    ],
    thumbnail: "dark_haunted_science_lab"
  };

  if (!ai) {
    console.log("No Gemini API key specified. Returning highly detailed mock room draft.");
    return res.json(mockGeneratedRoom);
  }

  try {
    const formattedPrompt = `
      You are the Dungeon Master of EchoVerse, a mysterious digital dimension where player memories persist.
      Generate a complete and immersive mystery room in valid JSON format.
      
      User Prompt idea: "${prompt}"
      Target Category: "${category || 'Mystery'}"
      Target Difficulty: "${difficulty || 'Medium'}"

      Create 3 coherent paragraphs of story narrative, complete puzzles, clue hunts, interactive objects, and a definitive answer puzzle solution word. Make the atmosphere thick, descriptive, and very creative.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Evocative title, maximum 60 characters." },
            description: { type: Type.STRING, description: "Short 2-sentence visual pitch." },
            category: { type: Type.STRING, description: "One of: Mystery, Horror, Treasure Hunt, Conspiracy, Historical" },
            difficulty: { type: Type.STRING, description: "One of: Easy, Medium, Hard, Expert" },
            story: { type: Type.STRING, description: "3 spacious atmospheric paragraphs of backstory." },
            puzzle: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "The overarching puzzle challenge explanation." },
                objects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      isKey: { type: Type.BOOLEAN }
                    },
                    required: ["id", "name", "description", "isKey"]
                  }
                },
                solution: { type: Type.STRING, description: "The definitive answer string, word, or sequence." },
                hints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 sequential progression hints." }
              },
              required: ["description", "objects", "solution", "hints"]
            },
            hiddenLore: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Secret lore snippets about what originally happened here." },
            thumbnail: { type: Type.STRING, description: "Short 5-word description of image representation for visual design." }
          },
          required: ["title", "description", "category", "difficulty", "story", "puzzle", "hiddenLore", "thumbnail"]
        }
      }
    });

    const roomText = response.text;
    if (!roomText) {
      throw new Error("Empty response received from Gemini AI.");
    }

    const roomJson = JSON.parse(roomText.trim());
    return res.json(roomJson);
  } catch (err: any) {
    console.error("Gemini room generation failed, using draft fallback:", err);
    return res.status(200).json({
      ...mockGeneratedRoom,
      error: `AI call failed, returning draft design instead: ${err.message || err}`
    });
  }
});

// 3. Story Evolution Route - analyzes player clues to append living lore to rooms
app.post("/api/gemini/evolve-story", async (req, res) => {
  const { title, story, clues } = req.body;

  if (!title || !story) {
    return res.status(400).json({ error: "Room details (title, story) are required for evolution parsing." });
  }

  const cluesText = clues && clues.length > 0
    ? clues.slice(0, 15).map((c: any) => `* Clue by ${c.username}: "${c.content}"`).join("\n")
    : "* No player notes submitted yet.";

  if (!ai) {
    // Generate a simple lore snippet based on clues in local sandbox mode
    const timestamp = new Date().toLocaleDateString();
    return res.json({
      newLore: [
        `Investigators have noticed multiple references to spatial coordinates. The entity appears to respond to correct coordinates. (Evolved ${timestamp})`,
        `Faint magnetic echoes were logged inside the floorboards. (Evolved ${timestamp})`
      ]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        You are the living memory of EchoVerse inside the room "${title}".
        Original Backstory:
        "${story}"

        Player observation clues from historic runs:
        ${cluesText}

        Review player actions, theories, and notes. Based on this, generate exactly 2 new secret lore fragments that expand this living room's backstory. They should read like creepy, newly uncovered archives.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newLore: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 custom lore sentences based on player actions"
            }
          },
          required: ["newLore"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return res.json(parsed);
  } catch (err: any) {
    console.error("Failed to evolve room lore, returning draft lore:", err);
    return res.status(200).json({
      newLore: [
        "A heavy silence settled in the room as player actions began overlapping.",
        "Scrap marks indicate somebody desperately tried to measure gravity variations."
      ]
    });
  }
});

// 4. Simulated Stripe Subscription Pipeline
app.post("/api/stripe/subscribe", async (req, res) => {
  const { userId, plan } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId for subscriber upgrade." });
  }

  // Simulate a Stripe session completion
  console.log(`Processing simulated stripe checkout for ${userId} to subscription plan: ${plan}`);
  
  // Return mock successful checkout object
  res.json({
    success: true,
    stripeCustomerId: "cus_mock_" + Math.random().toString(36).substring(2, 9),
    stripeSubscriptionId: "sub_mock_" + Math.random().toString(36).substring(2, 9),
    plan: plan || "premium",
    active: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  });
});

// 5. Simulated Stripe Credits Pipeline
app.post("/api/stripe/credits", async (req, res) => {
  const { userId, amount, usdPrice } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ error: "Missing transaction parameters" });
  }

  console.log(`Processing payments for AI Credits: User [${userId}] bought ${amount} credits for $${usdPrice}`);
  res.json({
    success: true,
    transactionId: "tx_mock_" + Math.random().toString(36).substring(2, 9),
    creditsAwarded: amount,
    coinsAwarded: Math.floor(amount / 2) // Bonus coins!
  });
});

// -------------------------------------------------------------
// VITE DEV / PRODUCTION FILE SERVING MIDDLEWARES
// -------------------------------------------------------------
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start the server binding strictly to 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EchoVerse full-stack engine running on http://localhost:${PORT}`);
  });
}

initServer().catch((error) => {
  console.error("Failed to bootstrap full-stack server:", error);
});
