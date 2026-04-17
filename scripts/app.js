const STORAGE_KEY = "pm88-hermes-onboarding-v1";

const stageToVaccineAge = {
  postpartum: "出生",
  "baby-0-12y": "2 個月",
  "baby-1-4y": "12-18 個月（常見節點）",
  "baby-4-6y": "4-6 歲（常見節點）"
};

const app = {
  checklist: null,
  subsidy: null,
  vaccine: null,
  stageSelect: null,
  citySelect: null,
  todoList: null,
  todoMeta: null
};

function toUrl(path) {
  return new URL(path, document.baseURI).toString();
}

async function loadJson(path) {
  const res = await fetch(toUrl(path));
  if (!res.ok) throw new Error(`Load failed: ${path}`);
  return res.json();
}

function formatDate(dateString) {
  const d = new Date(`${dateString}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function latestUpdatedDate(...dates) {
  return dates
    .filter(Boolean)
    .map((s) => new Date(`${s}T00:00:00+08:00`))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a)[0];
}

function getStageById(stageId) {
  return (app.checklist?.stages || []).find((s) => s.id === stageId);
}

function getCityByName(cityName) {
  return (app.subsidy?.locals || []).find((c) => c.city === cityName);
}

function getSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState(nextState) {
  const prev = getSavedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...nextState }));
}

function getCheckMap() {
  return getSavedState().checks || {};
}

function setChecked(stageId, itemId, checked) {
  const state = getSavedState();
  const checks = state.checks || {};
  const key = `${stageId}::${itemId}`;
  checks[key] = checked;
  saveState({ checks });
}

function renderTodoList(stageId, cityName) {
  const stage = getStageById(stageId);
  const items = (stage?.items || []).slice(0, 3);
  const checkMap = getCheckMap();

  app.todoList.innerHTML = "";
  app.todoMeta.textContent = `階段：${stage?.name || "-"}｜城市：${cityName || "-"}`;

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "目前沒有可顯示的待辦。";
    app.todoList.append(empty);
    return;
  }

  items.forEach((item, idx) => {
    const key = `${stageId}::${item.id || idx}`;

    const row = document.createElement("article");
    row.className = "todo-item";

    const label = document.createElement("label");
    label.className = "todo-row";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(checkMap[key]);
    cb.setAttribute("aria-label", `勾選待辦：${item.title}`);
    cb.addEventListener("change", () => {
      setChecked(stageId, item.id || String(idx), cb.checked);
    });

    const content = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = item.title;
    const tip = document.createElement("p");
    tip.textContent = item.tip || "";

    content.append(strong, tip);
    label.append(cb, content);
    row.append(label);
    app.todoList.append(row);
  });
}

function renderCityQuick(cityName) {
  const cityWrap = document.getElementById("subsidy-quick-content");
  const city = getCityByName(cityName) || app.subsidy.locals?.[0];
  const central = app.subsidy.central?.sources?.[0];

  cityWrap.innerHTML = "";

  if (!city) {
    cityWrap.textContent = "找不到城市資料，請稍後再試。";
    return;
  }

  const heading = document.createElement("h3");
  heading.className = "quick-subtitle";
  heading.textContent = city.city;

  const summary = document.createElement("p");
  summary.className = "city-summary";
  summary.textContent = city.summary || "尚無摘要，請以官方頁面為準。";

  const links = document.createElement("div");
  links.className = "todo-links";

  if (city.official_url) {
    const cityLink = document.createElement("a");
    cityLink.className = "pill";
    cityLink.href = city.official_url;
    cityLink.target = "_blank";
    cityLink.rel = "noopener";
    cityLink.textContent = `${city.city} 官方入口`;
    links.append(cityLink);
  }

  if (central?.url) {
    const centralLink = document.createElement("a");
    centralLink.className = "pill";
    centralLink.href = central.url;
    centralLink.target = "_blank";
    centralLink.rel = "noopener";
    centralLink.textContent = central.label || "中央官方來源";
    links.append(centralLink);
  }

  cityWrap.append(heading, summary, links);
}

function renderVaccineQuick(stageId) {
  const vaccineWrap = document.getElementById("vaccine-quick-content");
  vaccineWrap.innerHTML = "";

  const preferredAge = stageToVaccineAge[stageId] || "2 個月";
  const timeline = app.vaccine.timeline || [];
  const idx = Math.max(
    timeline.findIndex((row) => row.age === preferredAge),
    0
  );
  const focusRows = timeline.slice(idx, idx + 2);

  const listHeading = document.createElement("h3");
  listHeading.className = "quick-subtitle";
  listHeading.textContent = "下一步時間點";

  const ul = document.createElement("ul");
  focusRows.forEach((row) => {
    const li = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = `${row.age}：`;
    const text = document.createTextNode(` ${(row.items || []).join("、")}`);
    li.append(label, text);
    ul.append(li);
  });

  const sourceHeading = document.createElement("h3");
  sourceHeading.className = "quick-subtitle";
  sourceHeading.textContent = "來源連結";

  const sourceWrap = document.createElement("div");
  sourceWrap.className = "todo-links";
  const sources = (app.vaccine.sources || []).slice(0, 2);

  if (sources.length > 0) {
    sources.forEach((src) => {
      const a = document.createElement("a");
      a.className = "pill";
      a.href = src.url || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = src.label || "官方來源（待補）";
      sourceWrap.append(a);
    });
  } else {
    const placeholder = document.createElement("a");
    placeholder.className = "pill is-placeholder";
    placeholder.href = "#";
    placeholder.setAttribute("aria-disabled", "true");
    placeholder.textContent = "官方來源（待補）";
    sourceWrap.append(placeholder);
  }

  vaccineWrap.append(listHeading, ul, sourceHeading, sourceWrap);
}

function renderTrustedLinks() {
  const wrap = document.getElementById("trusted-links-content");
  wrap.innerHTML = "";

  const groups = [
    {
      title: "補助官方來源",
      links: [
        ...(app.subsidy.central?.sources || []),
        ...app.subsidy.locals
          .slice(0, 3)
          .map((x) => ({ label: `${x.city} 官方入口`, url: x.official_url }))
      ]
    },
    {
      title: "疫苗官方來源",
      links: app.vaccine.sources || []
    }
  ];

  groups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "trust-item";
    const h3 = document.createElement("h3");
    h3.textContent = group.title;
    card.append(h3);

    const linksWrap = document.createElement("div");
    linksWrap.className = "todo-links";

    group.links
      .filter((x) => x?.url)
      .forEach((link) => {
        const a = document.createElement("a");
        a.className = "pill";
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = link.label || "官方連結";
        linksWrap.append(a);
      });

    card.append(linksWrap);
    wrap.append(card);
  });
}

function fillSelectOptions() {
  app.stageSelect.innerHTML = "";
  app.citySelect.innerHTML = "";

  (app.checklist.stages || []).forEach((stage) => {
    const option = document.createElement("option");
    option.value = stage.id;
    option.textContent = stage.name;
    app.stageSelect.append(option);
  });

  (app.subsidy.locals || []).forEach((city) => {
    const option = document.createElement("option");
    option.value = city.city;
    option.textContent = city.city;
    app.citySelect.append(option);
  });
}

function renderLastUpdated() {
  const latest = latestUpdatedDate(
    app.checklist.updated,
    app.subsidy.updated,
    app.vaccine.updated
  );

  const target = document.getElementById("last-updated");
  target.textContent = latest ? formatDate(latest.toISOString().slice(0, 10)) : "-";
}

function renderPlanner(stageId, cityName) {
  saveState({ stageId, cityName });
  renderTodoList(stageId, cityName);
  renderCityQuick(cityName);
  renderVaccineQuick(stageId);
}

function bindPlanner() {
  const form = document.getElementById("planner-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const stageId = app.stageSelect.value;
    const cityName = app.citySelect.value;

    if (!stageId || !cityName) return;
    renderPlanner(stageId, cityName);
  });
}

async function init() {
  [app.checklist, app.subsidy, app.vaccine] = await Promise.all([
    loadJson("data/checklist.json"),
    loadJson("data/subsidy.json"),
    loadJson("data/vaccine.json")
  ]);

  app.stageSelect = document.getElementById("stage-select");
  app.citySelect = document.getElementById("city-select");
  app.todoList = document.getElementById("todo-list");
  app.todoMeta = document.getElementById("todo-meta");

  fillSelectOptions();
  bindPlanner();
  renderLastUpdated();
  renderTrustedLinks();

  const saved = getSavedState();
  const defaultStage = saved.stageId && getStageById(saved.stageId)
    ? saved.stageId
    : app.checklist.stages?.[0]?.id;
  const defaultCity = saved.cityName && getCityByName(saved.cityName)
    ? saved.cityName
    : app.subsidy.locals?.[0]?.city;

  if (defaultStage) app.stageSelect.value = defaultStage;
  if (defaultCity) app.citySelect.value = defaultCity;

  if (defaultStage && defaultCity) {
    renderPlanner(defaultStage, defaultCity);
  }
}

init().catch(() => {
  const target = document.getElementById("todo-meta");
  if (target) target.textContent = "資料載入失敗，請稍後重試。";
});
