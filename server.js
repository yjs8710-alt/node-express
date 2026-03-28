app.get("/land", async (req, res) => {
  const { pnu } = req.query;

  try {
    const response = await axios.get(process.env.TARGET_URL, {
      params: {
        pnu,
        key: process.env.VWORLD_KEY,
        format: "json"
      },
      timeout: 20000
    });

    return res.json({
      ok: true,
      upstreamStatus: response.status,
      upstreamData: response.data
    });

  } catch (error) {
    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.message,
      upstreamData: error.response?.data || null
    });
  }
});
