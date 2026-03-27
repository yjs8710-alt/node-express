const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 기본 확인
app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

// 환경변수 확인
app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    hasDataGoKrKey: !!process.env.DATA_GO_KR_KEY
  });
});

// 토지 조회
app.get("/land", async (req, res) => {
  try {
    console.log("=== /land called ===");
    console.log("query:", req.query);

    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const dataGoKrKey = process.env.DATA_GO_KR_KEY;

    console.log("hasTargetUrl:", !!targetUrl);
    console.log("hasVworldKey:", !!vworldKey);
    console.log("hasDataGoKrKey:", !!dataGoKrKey);

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

    const params = {
      ...req.query,
      key: vworldKey,
      serviceKey: dataGoKrKey
    };

    console.log("targetUrl:", targetUrl);
    console.log("request params:", params);

    const response = await axios.get(targetUrl, {
      params,
      timeout: 15000
    });

    console.log("external response received");

    res.json({
      ok: true,
      requestedQuery: req.query,
      response: response.data
    });
  } catch (error) {
    console.error("LAND ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: true,
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING on ${PORT}`);
});
