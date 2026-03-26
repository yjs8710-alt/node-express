const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("SERVER_OK");
});

app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    targetUrl: process.env.TARGET_URL || null
  });
});

app.get("/land", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;
    const key = process.env.VWORLD_KEY;

    if (!targetUrl) {
      return res.status(500).json({
        error: true,
        message: "TARGET_URL not set"
      });
    }

    if (!key) {
      return res.status(500).json({
        error: true,
        message: "VWORLD_KEY not set"
      });
    }

    const response = await axios.get(targetUrl, {
      params: {
        key,
        ...req.query
      },
      timeout: 30000
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SERVER START ${PORT}`);
});
