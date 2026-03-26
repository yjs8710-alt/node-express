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
    hasDataGoKrKey: !!process.env.DATA_GO_KR_API_KEY,
  });
});

// 토지 조회
app.post("/land", async (req, res) => {
  try {
    console.log("🔥 LAND START");

    const { pnu, address, bun, ji } = req.body || {};

    console.log("📦 요청 BODY:", req.body);
    console.log("📌 PNU:", pnu);
    console.log("📌 address:", address);
    console.log("📌 bun:", bun);
    console.log("📌 ji:", ji);

    if (!pnu) {
      console.log("❌ PNU 없음");
      return res.status(400).json({
        error: true,
        message: "pnu is required",
        received: { address, bun, ji, pnu },
      });
    }

    const nsdiKey = process.env.DATA_GO_KR_API_KEY;
    const vworldKey = process.env.VWORLD_KEY;

    console.log("🔑 NSDI KEY 존재:", !!nsdiKey);
    console.log("🔑 VWORLD KEY 존재:", !!vworldKey);

    let nsdiData = null;
    let vworldData = null;

    // 1) NSDI 호출
    if (nsdiKey) {
      try {
        const nsdiRes = await axios.get(
          "https://apis.data.go.kr/1613000/nsdi/LandCharacteristicsService/attr/getLandCharacteristics",
          {
            params: {
              serviceKey: nsdiKey,
              pnu,
              stdrYear: 2025,
              format: "json",
              numOfRows: 10,
              pageNo: 1,
            },
            timeout: 10000,
          }
        );

        nsdiData = nsdiRes.data;
        console.log("📊 NSDI RAW:", JSON.stringify(nsdiData).slice(0, 800));
      } catch (err) {
        console.log("❌ NSDI ERROR:", err.response?.data || err.message);
      }
    }

    // 2) VWorld 호출
    if (vworldKey) {
      try {
        const vworldRes = await axios.get("https://api.vworld.kr/req/data", {
          params: {
            key: vworldKey,
            service: "data",
            request: "GetFeature",
            data: "LP_PA_CBND_BUBUN",
            geometry: false,
            size: 1,
            format: "json",
            attrFilter: `pnu:=:${pnu}`,
          },
          timeout: 10000,
        });

        vworldData = vworldRes.data;
        console.log("🌐 VWORLD RAW:", JSON.stringify(vworldData).slice(0, 800));
      } catch (err) {
        console.log("❌ VWORLD ERROR:", err.response?.data || err.message);
      }
    }

    // 3) 값 추출
    let area = null;
    let jimok = null;
    let zone = null;
    let price = null;

    try {
      const nsdiItem =
        nsdiData?.landCharacteristicss?.field ||
        nsdiData?.landCharacteristics?.field ||
        nsdiData?.response?.body?.items?.item ||
        null;

      if (nsdiItem) {
        area = nsdiItem.lndpclAr ?? null;
        jimok = nsdiItem.lndcgrCodeNm ?? null;
        zone = nsdiItem.prposArea1Nm ?? null;
        price = nsdiItem.pblntfPclnd ?? null;
      }

      const vworldItem =
        vworldData?.response?.result?.featureCollection?.features?.[0]?.properties ||
        null;

      if (vworldItem) {
        if (!area) area = vworldItem.area ?? vworldItem.AREA ?? null;
        if (!jimok) jimok = vworldItem.jimok ?? vworldItem.JIMOK ?? null;
        if (!zone) zone = vworldItem.zone ?? vworldItem.ZONE ?? null;
        if (!price) price = vworldItem.price ?? vworldItem.PRICE ?? null;
      }
    } catch (err) {
      console.log("❌ 파싱 오류:", err.message);
    }

    // 4) 최종 결과
    const finalResult = {
      land: {
        area: area ?? null,
        jimok: jimok ?? null,
        zone: zone ?? null,
        price: price ?? null,
        pnu: pnu ?? null,
      },
      _verdict: area || jimok || zone || price ? "ok" : "empty",
      _key_error: false,
      _land_conn_error: false,
    };

    console.log("🌍 토지 응답:", finalResult);

    return res.json(finalResult);
  } catch (err) {
    console.log("❌ LAND 전체 에러:", err.response?.data || err.message);

    return res.status(500).json({
      error: true,
      message: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER RUNNING");
});
