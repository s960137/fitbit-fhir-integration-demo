const API_BASE = "https://api.fitbit.com";

const demoData = {
  profile: {
    user: {
      encodedId: "DEMO-USER",
      displayName: "示範使用者",
      dateOfBirth: "1990-01-01",
      gender: "UNKNOWN",
      height: 170,
      weight: 65,
      timezone: "Asia/Taipei",
      languageLocale: "zh_TW"
    }
  },
  heart: {
    "activities-heart": [{ dateTime: "2026-08-20", value: { restingHeartRate: 68 } }],
    "activities-heart-intraday": {
      datasetInterval: 1,
      datasetType: "minute",
      dataset: [
        { time: "09:00:00", value: 72 },
        { time: "09:01:00", value: 74 },
        { time: "09:02:00", value: 73 }
      ]
    }
  },
  activity: {
    activities: [{ activityName: "Walk", distance: 2.4, duration: 1800000, calories: 125 }],
    pagination: { afterDate: "2026-08-19", limit: 20, sort: "desc", offset: 0 }
  }
};

const state = {
  profile: demoData.profile,
  heart: null,
  activity: null,
  fhirBundle: null
};

const $ = (id) => document.getElementById(id);

function isoDate(daysAgo = 0) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString().slice(0, 10);
}

function setStatus(message, kind = "") {
  $("status").textContent = message;
  $("status").className = `status ${kind}`.trim();
}

function token() {
  return $("accessToken").value.trim();
}

async function fitbitFetch(path) {
  if (!token()) throw new Error("請輸入 Fitbit Access Token。");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token()}` }
  });
  if (!response.ok) {
    throw new Error(`Fitbit API 回應 ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function showJson(data) {
  $("rawData").textContent = JSON.stringify(data, null, 2);
}

function renderProfile(payload) {
  const user = payload?.user ?? {};
  $("displayName").textContent = user.displayName || "—";
  $("gender").textContent = user.gender || "—";
  $("dateOfBirth").textContent = user.dateOfBirth || "—";
  $("height").textContent = Number.isFinite(Number(user.height)) ? `${user.height} cm` : "—";
  $("weight").textContent = Number.isFinite(Number(user.weight)) ? `${user.weight} kg` : "—";
  $("timezone").textContent = user.timezone || "—";
  $("locale").textContent = user.languageLocale || "—";
  $("fitbitUserId").textContent = user.encodedId || "—";
}

async function loadProfile() {
  try {
    const data = $("dataMode").value === "demo"
      ? demoData.profile
      : await fitbitFetch("/1/user/-/profile.json");
    state.profile = data;
    state.fhirBundle = null;
    renderProfile(data);
    showJson(data);
    setStatus("個人資料已載入。", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function loadHeart() {
  const start = $("startDate").value;
  const end = $("endDate").value;
  try {
    const data = $("dataMode").value === "demo"
      ? demoData.heart
      : await fitbitFetch(`/1/user/-/activities/heart/date/${start}/${end}.json`);
    state.heart = data;
    state.fhirBundle = null;
    showJson(data);
    setStatus("心率資料已載入。", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function loadActivity() {
  const beforeDate = $("endDate").value;
  try {
    const data = $("dataMode").value === "demo"
      ? demoData.activity
      : await fitbitFetch(`/1/user/-/activities/list.json?beforeDate=${encodeURIComponent(beforeDate)}&sort=desc&offset=0&limit=20`);
    state.activity = data;
    showJson(data);
    setStatus("活動紀錄已載入。", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function observation({ id, patientId, code, display, value, unit, unitCode, effectiveDateTime }) {
  return {
    resourceType: "Observation",
    id,
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs"
      }]
    }],
    code: { coding: [{ system: "http://loinc.org", code, display }], text: display },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime,
    valueQuantity: {
      value,
      unit,
      system: "http://unitsofmeasure.org",
      code: unitCode
    }
  };
}

function buildFhirBundle() {
  const user = state.profile?.user;
  if (!user) {
    setStatus("請先載入個人資料。", "error");
    return;
  }

  const patientId = String(user.encodedId || "fitbit-user").replace(/[^A-Za-z0-9-.]/g, "-");
  const entries = [{
    fullUrl: `https://api.fitbit.com/user/${patientId}`,
    resource: {
      resourceType: "Patient",
      id: patientId,
      identifier: [{ system: "https://fitbit.com/user-id", value: user.encodedId || patientId }],
      name: user.displayName ? [{ text: user.displayName }] : undefined,
      gender: String(user.gender || "unknown").toLowerCase(),
      birthDate: user.dateOfBirth || undefined
    }
  }];

  const measuredAt = new Date().toISOString();
  if (Number.isFinite(Number(user.height))) {
    entries.push({
      resource: observation({
        id: "body-height",
        patientId,
        code: "8302-2",
        display: "Body height",
        value: Number(user.height),
        unit: "cm",
        unitCode: "cm",
        effectiveDateTime: measuredAt
      })
    });
  }
  if (Number.isFinite(Number(user.weight))) {
    entries.push({
      resource: observation({
        id: "body-weight",
        patientId,
        code: "29463-7",
        display: "Body weight",
        value: Number(user.weight),
        unit: "kg",
        unitCode: "kg",
        effectiveDateTime: measuredAt
      })
    });
  }

  const firstHeart = state.heart?.["activities-heart-intraday"]?.dataset?.[0];
  if (firstHeart && Number.isFinite(Number(firstHeart.value))) {
    const date = state.heart?.["activities-heart"]?.[0]?.dateTime || isoDate();
    entries.push({
      resource: observation({
        id: "heart-rate",
        patientId,
        code: "8867-4",
        display: "Heart rate",
        value: Number(firstHeart.value),
        unit: "beats/minute",
        unitCode: "/min",
        effectiveDateTime: `${date}T${firstHeart.time}`
      })
    });
  }

  state.fhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: entries
  };
  $("fhirOutput").textContent = JSON.stringify(state.fhirBundle, null, 2);
  $("downloadFhir").disabled = false;
  setStatus("FHIR Bundle 已產生。", "success");
}

function downloadFhir() {
  if (!state.fhirBundle) return;
  const blob = new Blob([JSON.stringify(state.fhirBundle, null, 2)], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fitbit-fhir-bundle.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

$("startDate").value = isoDate(1);
$("endDate").value = isoDate();
$("loadProfile").addEventListener("click", loadProfile);
$("loadHeart").addEventListener("click", loadHeart);
$("loadActivity").addEventListener("click", loadActivity);
$("buildFhir").addEventListener("click", buildFhirBundle);
$("downloadFhir").addEventListener("click", downloadFhir);
$("dataMode").addEventListener("change", () => {
  const usingDemo = $("dataMode").value === "demo";
  $("accessToken").disabled = usingDemo;
  setStatus(usingDemo ? "展示資料已就緒。" : "請輸入短效的 Fitbit Access Token。", "");
});

$("accessToken").disabled = true;
renderProfile(demoData.profile);
