const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const RECALL_API_KEY = process.env.RECALL_API_KEY;

// 🔥 WEBHOOK
app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));

  const { event, data } = req.body;
  const recordingId = data?.recording?.id;

  console.log("Extracted recordingId:", recordingId);

  if (event === "recording.done") {
    if (!recordingId) {
      console.log("❌ No recording ID");
      return res.send("No recording ID");
    }

    console.log("🎯 Processing recording:", recordingId);

    try {
      // ✅ Get recording details
      const response = await axios.get(
        `https://ap-northeast-1.recall.ai/api/v1/recording/${recordingId}/`,
        {
          headers: {
            Authorization: `Token ${RECALL_API_KEY}`,
          },
        }
      );

      const audioUrl = response.data?.data?.download_url;

      console.log("🎧 Audio URL:", audioUrl);

      if (!audioUrl) {
        console.log("❌ No audio URL");
        return res.send("No audio");
      }

      // ✅ Send to Deepgram
      const dgResponse = await axios.post(
        `https://api.deepgram.com/v1/listen?model=nova-2&detect_language=true`,
        {
          url: audioUrl,
        },
        {
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const transcript =
        dgResponse.data.results.channels[0].alternatives[0].transcript;

      console.log("📝 TRANSCRIPT:", transcript);
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
    }
  }

  res.send("OK");
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});	