const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: 'https://alfleek.github.io',
    optionsSuccessStatus: 200 // For legacy browsers
  };
  
app.use(cors(corsOptions));


const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    response_schema: {
    "type": "object",
    "properties": {
        "story": {"type": "string"},
        "firstoption": {"type": "string"},
        "secondoption": {"type": "string"},
        "name": {"type": "string"},
        "hp": {"type": "integer"},
        "location": {"type": "string"},
        "inventory": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "integer"}
                },
                "required": ["name", "quantity"]
            }
        }
    },
    "required": ["story", "firstoption", "secondoption", "name", "hp", "location", "inventory"]
    }
};

app.use(bodyParser.json());

// In-memory session storage (for simplicity; consider a database for production)
const sessions = {};

// Create or fetch a session
app.post("/start-session", (req, res) => {
    const sessionId = uuidv4();
    sessions[sessionId] = { history: [] };
    res.json({ sessionId });
});

// Handle AI requests
app.post("/generate", async (req, res) => {
    const { sessionId, input } = req.body;

    if (!sessions[sessionId]) {
        return res.status(404).send("Session not found");
    }

    try {
        // Retrieve session history
        const session = sessions[sessionId];
        const chatSession = model.startChat({
            generationConfig,
            history: session.history,
        });

        // Generate a response
        const response = await chatSession.sendMessage(input);

        // Update the session history
        session.history.push({ role: "user", content: input });
        session.history.push({ role: "assistant", content: response.response.text() });

        res.json({
            story: response.response.text().story,
            firstoption: response.response.text().firstoption,
            secondoption: response.response.text().secondoption,
            inventory: response.response.text().inventory,
        });
    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
