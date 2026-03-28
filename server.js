app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));

  const { event, data } = req.body;
  const recordingId = data?.recording?.id;

  console.log("Extracted recordingId:", recordingId);

  // ✅ EVENT 1 — CREATE TRANSCRIPT
  if (event === "recording.done") {
    if (!recordingId) {
      console.log("❌ No recording ID found");
      return res.send("No recording ID");
    }

    console.log("🎯 Triggering transcript for:", recordingId);

    try {
      await axios.post(
        `https://ap-northeast-1.recall.ai/api/v1/recording/${recordingId}/create_transcript/`,
        {
          provider: {
            deepgram_async: {}
          }
        },
        {
          headers: {
            Authorization: `Token ${process.env.RECALL_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Transcript started");
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
    }
  }

  // ✅ EVENT 2 — FETCH TRANSCRIPT
  if (event === "recording.analysis_done") {
    if (!recordingId) {
      console.log("❌ No recording ID for analysis");
      return res.send("No recording ID");
    }

    console.log("📥 Fetching transcript for:", recordingId);

    try {
      const response = await axios.get(
        `https://ap-northeast-1.recall.ai/api/v1/recording/${recordingId}/`,
        {
          headers: {
            Authorization: `Token ${process.env.RECALL_API_KEY}`,
          },
        }
      );

      const transcriptUrl =
        response.data.recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url;

      if (!transcriptUrl) {
        console.log("⏳ Transcript not ready yet");
        return res.send("Transcript not ready");
      }

      const transcriptRes = await axios.get(transcriptUrl);
      const transcriptText = JSON.stringify(transcriptRes.data);

      console.log("🧠 Generating summary...");

      const result = {
        english: "Summary will come here",
        hindi: "हिंदी सारांश यहाँ आएगा",
        marathi: "मराठी सारांश येथे येईल",
        telugu: "తెలుగు సారాంశం ఇక్కడ येईल",
      };

      console.log("✅ FINAL OUTPUT:", result);

    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
    }
  }

  res.send("OK");
});