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

    // 여기서 실제 호출 직전 로그
    console.log("request start");

    // 기존 axios 호출 코드 유지
  } catch (error) {
    console.error("LAND ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: true,
      message: error.response?.data || error.message
    });
  }
});
