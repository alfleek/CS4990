const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

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
            history: session.history,
        });
    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
