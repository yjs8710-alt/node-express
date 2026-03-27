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

    // 🔥 핵심 수정 부분
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
