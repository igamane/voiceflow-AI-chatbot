require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.send('working...');
});

app.get("/start", async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.json({ thread_id: thread.id });
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

app.post("/chat", async (req, res) => {
  let { thread_id: threadId, message, assistantId, initial_message } = req.body;

  if (initial_message != "") {
    message = initial_message;
  }

  if (!threadId) {
    return res.status(400).json({ error: "Missing thread_id" });
  }

  try {
    console.log(`Received message: ${message} for thread ID: ${threadId}`);
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data[0].content[0].text.value;

    console.log('Assistant response: ', response);
    res.json({ response });
  } catch (error) {
    console.error("Error handling chat:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

port = 8080;

app.listen(port, () => {
  console.log("Server running on port 8080");
});
