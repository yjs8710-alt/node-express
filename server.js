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

// 주소 -> PNU 변환
app.get("/address-to-pnu", async (req, res) => {
  try {
    const vworldKey = process.env.VWORLD_KEY;
    const { address } = req.query;

    if (!vworldKey) {
      return res.status(500).json({
        error: true,
        message: "VWORLD_KEY not set"
      });
    }

    if (!address) {
      return res.status(400).json({
        error: true,
        message: "address is required"
      });
    }

    const response = await axios.get("https://api.vworld.kr/req/search", {
      params: {
        service: "search",
        request: "search",
        version: "2.0",
        type: "address",
        category: "parcel",
        format: "json",
        errorFormat: "json",
        query: address,
        size: 1,
        page: 1,
        key: vworldKey
      },
      timeout: 20000
    });

    const item =
      response.data?.response?.result?.items?.[0] ||
      response.data?.result?.items?.[0] ||
      null;

    if (!item) {
      return res.json({
        ok: false,
        message: "주소 검색 결과 없음",
        raw: response.data
      });
    }

    return res.json({
      ok: true,
      address,
      pnu: item.id || "",
      parcelAddress: item.address?.parcel || "",
      roadAddress: item.address?.road || "",
      point: item.point || null,
      raw: response.data
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      step: "address-to-pnu",
      message: error.response?.data || error.message
    });
  }
});

// PNU -> 토지조회
app.get("/land", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const { pnu } = req.query;

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

    const response = await axios.get(targetUrl, {
      params: {
        pnu,
        key: vworldKey,
        format: "json"
      },
      timeout: 20000
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: true,
      step: "land",
      message: error.response?.data || error.message
    });
  }
});

// 주소로 바로 토지조회
app.get("/land-by-address", async (req, res) => {
  try {
    const targetUrl = process.env.TARGET_URL;
    const vworldKey = process.env.VWORLD_KEY;
    const { address } = req.query;

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

    if (!address) {
      return res.status(400).json({
        error: true,
        message: "address is required"
      });
    }

    // 1. 주소 -> PNU
    const pnuRes = await axios.get("https://api.vworld.kr/req/search", {
      params: {
        service: "search",
        request: "search",
        version: "2.0",
        type: "address",
        category: "parcel",
        format: "json",
        errorFormat: "json",
        query: address,
        size: 1,
        page: 1,
        key: vworldKey
      },
      timeout: 20000
    });

    const item =
      pnuRes.data?.response?.result?.items?.[0] ||
      pnuRes.data?.result?.items?.[0] ||
      null;

    if (!item || !item.id) {
      return res.json({
        ok: false,
        message: "주소 검색 결과 없음",
        address,
        pnuSearchRaw: pnuRes.data
      });
    }

    const pnu = item.id;

    // 2. PNU -> 토지조회
    const landRes = await axios.get(targetUrl, {
      params: {
        pnu,
        key: vworldKey,
        format: "json"
      },
      timeout: 20000
    });

    return res.json({
      ok: true,
      address,
      pnu,
      parcelAddress: item.address?.parcel || "",
      roadAddress: item.address?.road || "",
      point: item.point || null,
      land: landRes.data
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      step: "land-by-address",
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING on ${PORT}`);
});
