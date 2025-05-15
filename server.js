const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = 5000;

const BANDWIDTH_ACCOUNT_ID = "5010907";
const BANDWIDTH_USERNAME = "f513b197-7c4c-4873-837c-b32869cc4e44";
const BANDWIDTH_PASSWORD = "52PTwq7qyVUb5Py";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/answer", (req, res) => {
  const bxml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <SpeakSentence voice="susan">Please hold while we check for voicemail.</SpeakSentence>
    </Response>
  `;
  res.type("application/xml").send(bxml.trim());
});

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

app.get("/play-voicemail", (req, res) => {
  const bxml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <PlayAudio>https://voicemail-42qw.onrender.com/voicemail.mp3</PlayAudio>
</Response>`;
  res.type("application/xml").send(bxml.trim());
});

app.get("/speak-voicemail", (req, res) => {
  const bxml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <SpeakSentence voice="susan">Hi. We’re sorry we missed your call. Please leave a message or call again later.</SpeakSentence>
</Response>`;
  res.type("application/xml").send(bxml.trim());
});

app.post("/api/create-voicemail", async (req, res) => {
  const { to, from, message } = req.body;

  if (!to || !from) {
    return res.status(400).json({ error: 'Missing "to" or "from" fields' });
  }

  try {
    const payload = {
      from,
      to,
      answerUrl: "https://voicemail-42qw.onrender.com/answer",
      answerMethod: "GET",
      disconnectMethod: "POST",
      machineDetection: {
        mode: "enable",
        detectionTimeout: 5000,
        silenceTimeout: 2000,
        speechThreshold: 500,
        speechEndThreshold: 1000,
      },
      machineDetectionCallbackUrl:
        "https://voicemail-42qw.onrender.com/machineDetectionCallback",
      machineDetectionCallbackMethod: "POST",
      tags: {
        message,
      },
    };

    const response = await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${BANDWIDTH_ACCOUNT_ID}/calls`,
      payload,
      {
        auth: {
          username: BANDWIDTH_USERNAME,
          password: BANDWIDTH_PASSWORD,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    res.status(200).json({
      message: "Voicemail call initiated successfully",
      callId: response.data.callId,
    });
  } catch (error) {
    console.error(
      "Bandwidth call error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to create voicemail call",
      details: error.response?.data || error.message,
    });
  }
});

app.use("/voicemail.mp3", express.static("voicemail.mp3"));

app.listen(PORT, () => {
  console.log(`Voicemail server running at http://localhost:${PORT}`);
});
