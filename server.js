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
    console.log("params =", JSON.stringify(params, null, 2));

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
      upstreamData: response.data
    });
  } catch (error) {
    console.log("===== AXIOS ERROR =====");
    console.log("message =", error.message);
    console.log("status =", error.response?.status || null);
    console.log(
      "data =",
      typeof error.response?.data === "string"
        ? error.response?.data
        : JSON.stringify(error.response?.data || null, null, 2)
    );

    return res.status(500).json({
      error: true,
      message: error.message,
      status: error.response?.status || null,
      upstreamData: error.response?.data || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
