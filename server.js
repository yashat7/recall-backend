const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const RECALL_API_KEY = process.env.RECALL_API_KEY;

// 🔥 WEBHOOK HANDLER
app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));

  const { event, data } = req.body;
  const recordingId = data?.recordings?.[0]?.id;
console.log("DEBUG data:", JSON.stringify(data, null, 2));
console.log("Extracted recordingId:", recordingId);

  try {
    // ✅ STEP 4A: When recording is done → create transcript
 if (event === "recording.done") {
  const recordingId = data?.recording?.id;

  console.log("Extracted recordingId:", recordingId);

  if (!recordingId) {
    console.log("❌ No recording ID found");
    return;
  }

  console.log("🎯 Triggering transcript for:", recordingId);

  try {
    await axios.post(
      `https://ap-northeast-1.recall.ai/api/v1/recording/${recordingId}/create_transcript/`,
provider: {
  google_speech_v2_async: {}
},
      },
      {
        headers: {
          Authorization: `Token ${RECALL_API_KEY}`,
        },
      }
    );

    console.log("✅ Transcript started");
  } catch (err) {
    console.error("❌ Transcript error:", err.response?.data || err.message);
  }
}

    // ✅ STEP 5: When transcript is ready → fetch + process
    if (event === "recording.analysis_done") {
      console.log("📥 Fetching transcript for:", recordingId);

      const response = await axios.get(
        `https://ap-northeast-1.recall.ai/api/v1/recording/${recordingId}/`,
        {
          headers: {
            Authorization: `Token ${RECALL_API_KEY}`,
          },
        }
      );

      const transcriptUrl =
        response.data.recordings[0].media_shortcuts.transcript?.data?.download_url;

      if (!transcriptUrl) {
        console.log("⏳ Transcript not ready yet");
        return;
      }

      const transcriptRes = await axios.get(transcriptUrl);
      const transcriptText = JSON.stringify(transcriptRes.data);

      console.log("🧠 Generating summary...");

      // 🔥 AI CALL (you can plug)
      // For now just simulate:
      const result = {
        english: "Summary will come here",
        hindi: "हिंदी सारांश यहाँ आएगा",
        marathi: "मराठी सारांश येथे येईल",
        telugu: "తెలుగు సారాంశం ఇక్కడ వస్తుంది",
      };

      console.log("✅ FINAL OUTPUT:", result);

      // 👉 Here you can save to DB later
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }

  res.send("OK");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});