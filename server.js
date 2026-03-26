app.post("/land", async (req, res) => {
  try {
    console.log("🔥 LAND START");

    const { pnu, address, bun, ji } = req.body || {};

    console.log("📦 요청 BODY:", req.body);
    console.log("📌 PNU:", pnu);

    if (!pnu) {
      console.log("❌ PNU 없음");
      return res.status(400).json({
        error: true,
        message: "pnu is required",
        received: { address, bun, ji, pnu },
      });
    }

    // -------------------------
    // NSDI 호출
    // -------------------------
    const nsdiKey = process.env.DATA_GO_KR_API_KEY;

    console.log("🔑 NSDI KEY 존재:", !!nsdiKey);

    let nsdiData = null;

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
        console.log("📊 NSDI RAW:", JSON.stringify(nsdiData).slice(0, 500));

      } catch (err) {
        console.log("❌ NSDI ERROR:", err.response?.data || err.message);
      }
    }

    // -------------------------
    // VWorld 호출
    // -------------------------
    const vKey = process.env.VWORLD_KEY;

    console.log("🔑 VWORLD KEY 존재:", !!vKey);

    let vworldData = null;

    if (vKey) {
      try {
        const vRes = await axios.get("https://api.vworld.kr/req/data", {
          params: {
            key: vKey,
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

        vworldData = vRes.data;
        console.log("🌐 VWORLD RAW:", JSON.stringify(vworldData).slice(0, 500));

      } catch (err) {
        console.log("❌ VWORLD ERROR:", err.response?.data || err.message);
      }
    }

    // -------------------------
    // 데이터 추출
    // -------------------------
    let area = null;
    let jimok = null;
    let zone = null;
    let price = null;

    try {
      const nsdiItem =
        nsdiData?.landCharacteristicss?.field ||
        nsdiData?.response?.body?.items?.item;

      if (nsdiItem) {
        area = nsdiItem.lndpclAr;
        jimok = nsdiItem.lndcgrCodeNm;
        zone = nsdiItem.prposArea1Nm;
        price = nsdiItem.pblntfPclnd;
      }

      const vItem =
        vworldData?.response?.result?.featureCollection?.features?.[0]?.properties;

      if (vItem && !area) {
        area = vItem.area || vItem.AREA;
      }

    } catch (err) {
      console.log("❌ 파싱 오류:", err.message);
    }

    // -------------------------
    // 최종 결과 생성 (이게 핵심)
    // -------------------------
    const finalResult = {
      land: {
        area: area ?? null,
        jimok: jimok ?? null,
        zone: zone ?? null,
        price: price ?? null,
        pnu: pnu ?? null,
      },
      _verdict: area || jimok || zone || price ? "ok" : "empty",
    };

    console.log("🌍 토지 응답:", finalResult);

    return res.json(finalResult);

  } catch (err) {
    console.log("❌ LAND 전체 에러:", err.message);

    return res.status(500).json({
      error: true,
      message: err.message,
    });
  }
});
