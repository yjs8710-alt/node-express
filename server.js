const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY
  });
});

app.get("/land", async (req, res) => {
  const { pnu } = req.query;

  if (!pnu) {
    return res.status(400).json({
      error: true,
      message: "pnu is required"
    });
  }

  if (!process.env.TARGET_URL) {
    return res.status(500).json({
      error: true,
      message: "TARGET_URL not set"
    });
  }

  if (!process.env.VWORLD_KEY) {
    return res.status(500).json({
      error: true,
      message: "VWORLD_KEY not set"
    });
  }

  try {
    const response = await axios.get(process.env.TARGET_URL, {
      params: {
        pnu,
        key: process.env.VWORLD_KEY,
        format: "json"
      },
      timeout: 20000
    });

    return res.json({
      ok: true,
      upstreamStatus: response.status,
      upstreamData: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.message,
      upstreamData: error.response?.data || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
