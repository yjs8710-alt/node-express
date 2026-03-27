const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 서버 동작 확인
app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

// 환경변수 확인
app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY
  });
});

// 토지 조회
app.get("/land", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const { pnu } = req.query;

    if (!targetUrl) {
      return res.status(500).json({
        error: true,
        message: "TARGET_URL not set"
      });
    }

    if (!vworldKey) {
      return res.status(500).json({
        error: true,
        message: "VWORLD_KEY not set"
      });
    }

    if (!pnu) {
      return res.status(400).json({
        error: true,
        message: "pnu is required"
      });
    }

    const url = `${targetUrl}?key=${encodeURIComponent(vworldKey)}&pnu=${encodeURIComponent(pnu)}`;

    console.log("LAND_REQUEST_URL:", url);

    const response = await axios.get(url, {
      timeout: 15000
    });

    res.json(response.data);
  } catch (error) {
    console.error("LAND_ERROR:", error.message);

    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: true,
        message: "External API error",
        detail: error.response.data
      });
    }

    res.status(500).json({
      error: true,
      message: error.message || "Unknown server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
