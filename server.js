const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

app.use(express.json());

const PORT = process.env.PORT || 3000;

// 기본 확인
app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

// 환경 확인
app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY
  });
});

// 토지 조회
app.get("/land", async (req, res) => {
  const { pnu } = req.query;
  const targetUrl = process.env.TARGET_URL;
  const vworldKey = process.env.VWORLD_KEY;

  if (!pnu) {
    return res.status(400).json({ error: true, message: "pnu is required" });
  }

  try {
    const params = {
      pnu,
      key: vworldKey
    };

    console.log("===== REQUEST =====");
    console.log("targetUrl =", targetUrl);
    console.log("params =", params);

    const response = await axios.get(targetUrl, {
      params,
      timeout: 20000,
      validateStatus: () => true
    });

    console.log("===== UPSTREAM STATUS =====");
    console.log(response.status);

    console.log("===== UPSTREAM DATA =====");
    console.log(
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data, null, 2)
    );

    return res.status(response.status).json({
      ok: response.status < 400,
      upstreamStatus: response.status,
      data: response.data
    });

  } catch (error) {
    console.log("===== AXIOS ERROR =====");
    console.log(error.message);

    return res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
