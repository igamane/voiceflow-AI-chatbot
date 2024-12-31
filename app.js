require("dotenv").config(); // Still can load .env if you want fallback vars
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Just a simple health check
app.get("/", async (req, res) => {
  res.send('working...');
});

/**
 * POST /start
 *  - Expects { apiKey: "...your openai api key..." }
 *  - Creates a new OpenAI thread
 *  - Returns { thread_id: "..." }
 */
app.post("/start", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "Missing apiKey" });
    }

    // Initialize OpenAI with the passed-in apiKey
    const openai = new OpenAI({ apiKey });

    // Create a new thread
    const thread = await openai.beta.threads.create();
    res.json({ thread_id: thread.id });
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

/**
 * POST /chat
 *  - Expects { apiKey, thread_id, message, assistant_id, initial_message }
 *  - If `initial_message` is not empty, use that as the message
 *  - Posts the user message, polls for completion, then returns assistant response
 */
app.post("/chat", async (req, res) => {
  try {
    let {
      apiKey,
      thread_id: threadId,
      message,
      assistant_id,
      initial_message,
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "Missing apiKey" });
    }

    // Initialize OpenAI with the passed-in apiKey
    const openai = new OpenAI({ apiKey });

    // If there's an initial_message, use it instead of "message"
    if (initial_message) {
      message = initial_message;
    }

    if (!threadId) {
      return res.status(400).json({ error: "Missing thread_id" });
    }

    console.log(`Received message: ${message} for thread ID: ${threadId}`);
    
    // 1) Create user message in that thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // 2) Create and poll the run
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistant_id,
    });

    // 3) Get the list of messages to fetch the assistant's response
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data[0].content[0].text.value;

    console.log('Assistant response: ', response);
    res.json({ response });
  } catch (error) {
    console.error("Error handling chat:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

const port = 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
