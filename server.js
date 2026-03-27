const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 기본 확인
app.get("/", (req, res) => {
  console.log("=== / called ===");
  res.send("FINAL_OK");
});

// 환경 확인
app.get("/env-check", (req, res) => {
  console.log("=== /env-check called ===");
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    hasDataGoKrKey: !!process.env.DATA_GO_KR_KEY
  });
});

// 토지 조회 (최종 버전)
app.get("/land", async (req, res) => {
  console.log("=== /land called ===");

  try {
    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const { pnu } = req.query;

    console.log("TARGET_URL:", targetUrl);
    console.log("pnu:", pnu);

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

    const response = await axios.get(targetUrl, {
      params: {
        pnu: pnu,
        key: vworldKey,
        format: "json"
      },
      timeout: 20000
    });

    console.log("external response success");

    return res.json(response.data);

  } catch (error) {
    console.log("external request failed");

    return res.status(500).json({
      error: true,
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING on ${PORT}`);
});
