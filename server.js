const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    hasDataGoKrKey: !!process.env.DATA_GO_KR_API_KEY
  });
});

app.post("/land", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;
    const key = process.env.VWORLD_KEY;

    if (!targetUrl) {
      return res.status(500).json({ error: true, message: "TARGET_URL not set" });
    }

    if (!key) {
      return res.status(500).json({ error: true, message: "VWORLD_KEY not set" });
    }

    console.log("LAND_ROUTE_HIT");
    console.log("BODY:", req.body);

    const response = await axios.get(targetUrl, {
      params: {
        key: encodeURIComponent(key),
        ...req.body
      }
    });

    console.log("🌍 토지 응답:", response.data);

    return res.json(response.data);
  } catch (err) {
    console.error("LAND ERROR:", err.response?.data || err.message);
    return res.status(500).json({
      error: true,
      message: err.response?.data || err.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER RUNNING");
});
