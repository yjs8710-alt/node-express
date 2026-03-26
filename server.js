const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 확인용
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
    const key = process.env.VWORLDKEY;

    if (!targetUrl) {
      return res.status(500).json({ error: true, message: "TARGET_URL not set" });
    }

    if (!key) {
      return res.status(500).json({ error: true, message: "VWORLD_KEY not set" });
    }

    const response = await axios.get(targetUrl, {
      params: {
        key,
        ...req.query
      }
    });

    return res.json(response.data);

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.response?.data || err.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER RUNNING");
});
