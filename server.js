app.get("/land", async (req, res) => {
  try {
    const { pnu } = req.query;

    if (!pnu) {
      return res.status(400).json({
        error: true,
        message: "pnu is required"
      });
    }

    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;

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
      pnu,
      key: vworldKey,
      domain: "jibda.co.kr"
    };

    console.log("===== LAND REQUEST START =====");
    console.log("targetUrl:", targetUrl);
    console.log("params:", params);

    const response = await axios.get(targetUrl, {
      params,
      timeout: 20000
    });

    console.log("===== LAND RESPONSE SUCCESS =====");
    console.log(JSON.stringify(response.data, null, 2));

    return res.json({
      ok: true,
      proxy: "cloudtype",
      pnu,
      data: response.data
    });
  } catch (error) {
    console.log("===== LAND RESPONSE ERROR =====");
    console.log("message:", error.message);
    console.log("status:", error.response?.status || null);
    console.log("data:", JSON.stringify(error.response?.data || null, null, 2));

    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.message,
      status: error.response?.status || null,
      upstream: error.response?.data || null
    });
  }
});
