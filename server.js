const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
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

  if (!pnu) {
    return res.status(400).json({
      error: true,
      message: "pnu is required"
    });
  }

  try {
    const response = await axios.get(process.env.TARGET_URL, {
      params: {
        pnu,
        key: process.env.VWORLD_KEY,
        format: "json"
      }
    });

    return res.json({
      ok: true,
      data: response.data
    });

  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
