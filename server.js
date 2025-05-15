// server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = 5000;

// Replace these with your actual Bandwidth credentials
const BANDWIDTH_ACCOUNT_ID = "5010907";
const BANDWIDTH_USERNAME = "f513b197-7c4c-4873-837c-b32869cc4e44";
const BANDWIDTH_PASSWORD = "52PTwq7qyVUb5Py";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 1. Answer URL – basic response while voicemail is detected
app.get("/answer", (req, res) => {
  const bxml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <SpeakSentence voice="susan">Please hold while we check for voicemail.</SpeakSentence>
    </Response>
  `;
  res.type("application/xml").send(bxml);
});

// 2. Callback when machine detection is complete
app.post("/machineDetectionCallback", async (req, res) => {
  const { result, callId } = req.body;

  console.log("Machine detection result:", result);

  if (result === "answering-machine") {
    try {
      await axios.post(
        `https://voice.bandwidth.com/api/v2/accounts/${BANDWIDTH_ACCOUNT_ID}/calls/${callId}/redirect`,
        {
          redirectUrl: "https://voicemail-42qw.onrender.com/play-voicemail",
        },
        {
          auth: {
            username: BANDWIDTH_USERNAME,
            password: BANDWIDTH_PASSWORD,
          },
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Redirected to voicemail playback.");
    } catch (err) {
      console.error("Redirect failed:", err.response?.data || err.message);
    }
  }

  res.sendStatus(200);
});

// 3. Endpoint that plays the voicemail
app.get("/play-voicemail", (req, res) => {
  const bxml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <PlayAudio>https://your-ngrok-url.com/voicemail.mp3</PlayAudio>
    </Response>
  `;
  res.type("application/xml").send(bxml);
});

// 4. Serve the audio file
app.use("/voicemail.mp3", express.static("voicemail.mp3"));

app.listen(PORT, () => {
  console.log(`Voicemail server running at http://localhost:${PORT}`);
});
