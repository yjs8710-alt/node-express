const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("land proxy running");
});

app.all("/land", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;

    if (!targetUrl) {
      return res.status(500).json({
        error: true,
        message: "TARGET_URL not set"
      });
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: req.query,
      data: req.body,
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30000
    });

    if (typeof response.data === "object") {
      return res.status(response.status).json(response.data);
    }

    return res.status(response.status).send(response.data);
  } catch (error) {
    console.error("proxy error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on ${PORT}`);
});
