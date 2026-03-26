const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("FINAL_OK");
});

app.get("/env-check", (req, res) => {
  res.json({
    hasTargetUrl: !!process.env.TARGET_URL,
    hasVworldKey: !!process.env.VWORLD_KEY,
    hasDataGoKrKey: !!process.env.DATA_GO_KR_API_KEY,
  });
});

function safePick(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function normalizeLandResult({ pnu, nsdiData, vworldData }) {
  const nsdiRoot =
    nsdiData?.landCharacteristicss ||
    nsdiData?.landCharacteristics ||
    nsdiData?.response ||
    nsdiData ||
    {};

  const vworldRoot =
    vworldData?.response?.result?.featureCollection?.features?.[0]?.properties ||
    vworldData?.result?.featureCollection?.features?.[0]?.properties ||
    vworldData?.response?.result?.feature?.[0]?.properties ||
    vworldData?.response?.result?.feature?.properties ||
    vworldData?.response?.result?.items?.[0] ||
    vworldData?.response?.result ||
    vworldData ||
    {};

  const area = safePick(nsdiRoot, [
    "lndpclAr",
    "landArea",
    "area",
    "ladAr",
    "prposArea",
  ]) || safePick(vworldRoot, ["area", "AREA", "a0", "ladAr"]);

  const jimok = safePick(nsdiRoot, [
    "lndcgrCodeNm",
    "jimok",
    "jibunJimok",
    "landCategory",
  ]) || safePick(vworldRoot, ["jibun", "JIMOK", "jimok", "ldCodeNm"]);

  const zone = safePick(nsdiRoot, [
    "prposArea1Nm",
    "prposArea2Nm",
    "landUse",
    "useZone",
    "spfc1",
  ]) || safePick(vworldRoot, ["zone", "ZONE", "landUse", "useZone"]);

  const price = safePick(nsdiRoot, [
    "pblntfPclnd",
    "officialLandPrice",
    "price",
    "pblntfPc",
  ]) || safePick(vworldRoot, ["price", "PRICE", "officialPrice"]);

  return {
    land: {
      area: area ?? null,
      jimok: jimok ?? null,
      zone: zone ?? null,
      price: price ?? null,
      pnu: pnu ?? null,
    },
  };
}

async function fetchNsdiLand({ pnu }) {
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    return {
      _nsdi_error: "DATA_GO_KR_API_KEY not set",
      _nsdi_conn_error: true,
    };
  }

  const url =
    "https://apis.data.go.kr/1613000/nsdi/LandCharacteristicsService/attr/getLandCharacteristics";

  const candidateYears = [2025, 2024, 2026];

  for (const stdrYear of candidateYears) {
    try {
      const response = await axios.get(url, {
        params: {
          serviceKey,
          pnu,
          stdrYear,
          format: "json",
          numOfRows: 10,
          pageNo: 1,
        },
        timeout: 15000,
      });

      const data = response.data;
      const text = typeof data === "string" ? data : JSON.stringify(data);

      if (
        text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") ||
        text.includes("인증") ||
        text.includes("SERVICE ACCESS DENIED") ||
        text.includes("401")
      ) {
        return {
          _nsdi_error: data,
          _nsdi_conn_error: false,
          _key_error: true,
        };
      }

      const rows =
        data?.landCharacteristicss?.field ||
        data?.landCharacteristics?.field ||
        data?.response?.body?.items?.item ||
        data?.response?.body?.items ||
        data?.items?.item ||
        [];

      if (Array.isArray(rows) && rows.length > 0) {
        return {
          _nsdi_error: null,
          _nsdi_conn_error: false,
          _key_error: false,
          data: rows[0],
          raw: data,
          stdrYear,
        };
      }

      if (rows && !Array.isArray(rows)) {
        return {
          _nsdi_error: null,
          _nsdi_conn_error: false,
          _key_error: false,
          data: rows,
          raw: data,
          stdrYear,
        };
      }
    } catch (err) {
      const detail = err.response?.data || err.message;
      console.error(`NSDI ERROR ${stdrYear}:`, detail);
    }
  }

  return {
    _nsdi_error: "NSDI no usable rows",
    _nsdi_conn_error: true,
    _key_error: false,
  };
}

async function fetchVworldLand({ pnu }) {
  const key = process.env.VWORLD_KEY;
  const targetUrl =
    process.env.TARGET_URL ||
    "https://api.vworld.kr/req/data";

  if (!key) {
    return {
      _vworld_error: "VWORLD_KEY not set",
      _key_error: true,
    };
  }

  try {
    const response = await axios.get(targetUrl, {
      params: {
        key,
        service: "data",
        request: "GetFeature",
        data: "LP_PA_CBND_BUBUN,LP_PA_CBND_BONBUN",
        geometry: false,
        size: 1,
        format: "json",
        attrFilter: `pnu:=:${pnu}`,
      },
      timeout: 15000,
    });

    return {
      _vworld_error: null,
      _key_error: false,
      raw: response.data,
    };
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("VWORLD ERROR:", detail);

    return {
      _vworld_error: detail,
      _key_error:
        typeof detail === "string"
          ? detail.includes("INCORRECT_KEY")
          : JSON.stringify(detail).includes("INCORRECT_KEY"),
    };
  }
}

app.post("/land", async (req, res) => {
  try {
    const { pnu, address, bun, ji } = req.body || {};

    console.log("LAND_ROUTE_HIT");
    console.log("BODY:", req.body);

    if (!pnu) {
      return res.status(400).json({
        error: true,
        message: "pnu is required",
        received: { address, bun, ji, pnu },
      });
    }

    const nsdiResult = await fetchNsdiLand({ pnu });
    const vworldResult = await fetchVworldLand({ pnu });

    const normalized = normalizeLandResult({
      pnu,
      nsdiData: nsdiResult.data || nsdiResult.raw || null,
      vworldData: vworldResult.raw || null,
    });

    const finalResult = {
      ...normalized,
      _verdict:
        normalized.land.area ||
        normalized.land.jimok ||
        normalized.land.zone ||
        normalized.land.price
          ? "ok"
          : "empty",
      _key_error: !!nsdiResult._key_error || !!vworldResult._key_error,
      _land_conn_error:
        !!nsdiResult._nsdi_conn_error && !vworldResult.raw,
      _debug: {
        pnu,
        nsdiYear: nsdiResult.stdrYear || null,
        nsdiError: nsdiResult._nsdi_error || null,
        vworldError: vworldResult._vworld_error || null,
      },
    };

    console.log("NSDI RAW:", nsdiResult.raw || nsdiResult.data || nsdiResult);
    console.log("VWORLD RAW:", vworldResult.raw || vworldResult);
    console.log("🌍 토지 응답:", finalResult);

    return res.json(finalResult);
  } catch (err) {
    console.error("LAND ERROR:", err.response?.data || err.message);
    return res.status(500).json({
      error: true,
      message: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER RUNNING");
});
console.log("🔥 LAND START");
console.log("🌍 토지 응답:", finalResult);
