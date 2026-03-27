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

// 환경변수 확인
app.get("/env-check", (req, res) => {
  console.log("=== /env-check called ===");
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    hasDataGoKrKey: !!process.env.DATA_GO_KR_KEY
  });
});

// TARGET_URL 확인
app.get("/target-check", (req, res) => {
  console.log("=== /target-check called ===");
  res.json({
    targetUrl: process.env.TARGET_URL || null
  });
});

// 토지 조회
app.get("/land", async (req, res) => {
  console.log("=== /land called ===");
  console.log("method:", req.method);
  console.log("url:", req.originalUrl);
  console.log("query:", req.query);

  try {
    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const dataGoKrKey = process.env.DATA_GO_KR_KEY;

    console.log("TARGET_URL:", targetUrl);
    console.log("VWORLD_KEY exists:", !!vworldKey);
    console.log("DATA_GO_KR_KEY exists:", !!dataGoKrKey);

    if (!targetUrl) {
      return res.status(500).json({
        error: true,
        step: "env-check",
        message: "TARGET_URL not set"
      });
    }

    if (!vworldKey) {
      return res.status(500).json({
        error: true,
        step: "env-check",
        message: "VWORLD_KEY not set"
      });
    }

    const params = {
      ...req.query,
      key: vworldKey
    };

    if (dataGoKrKey) {
      params.serviceKey = dataGoKrKey;
    }

    console.log("external request start");
    console.log("request targetUrl:", targetUrl);
    console.log("request params:", JSON.stringify(params, null, 2));

    const response = await axios.get(targetUrl, {
      params,
      timeout: 15000
    });

    console.log("external response success");

    return res.json({
      ok: true,
      step: "success",
      requestQuery: req.query,
      externalData: response.data
    });
  } catch (error) {
    console.log("external request failed");

    if (error.response) {
      console.log("error status:", error.response.status);
      console.log("error data:", error.response.data);
    } else {
      console.log("error message:", error.message);
    }

    return res.status(500).json({
      error: true,
      step: "catch",
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING on ${PORT}`);
});
