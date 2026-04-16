const APP_STATE_KEY = "pm88-hermes-state";
const TODO_CHECK_KEY = "pm88-hermes-todo-check";

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

function getWeekKey() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getStageById(stageId) {
  return (app.checklist?.stages || []).find((s) => s.id === stageId);
}

function getCityByName(cityName) {
  return (app.subsidy?.locals || []).find((c) => c.city === cityName);
}

function stageAction(stage) {
  const first = stage?.items?.[0];
  const second = stage?.items?.[1];
  return {
    id: `stage-${stage?.id || "unknown"}`,
    title: first ? first.title : "確認目前階段重點",
    tip: second ? `完成後下一步：${second.title}` : "先完成階段首要任務。",
    links: []
  };
}

function subsidyAction(city) {
  return {
    id: `subsidy-${city?.city || "unknown"}`,
    title: city ? `確認 ${city.city} 生育/育兒補助資格與期限` : "確認所在地補助資格與期限",
    tip: city ? city.summary : "先打開官方頁，確認資格、期限與應備文件。",
    links: city?.official_url
      ? [{ label: `${city.city} 官方入口`, url: city.official_url }]
      : []
  };
}

function vaccineAction(stageId) {
  const preferredAge = stageToVaccineAge[stageId] || "2 個月";
  const timeline = app.vaccine?.timeline || [];
  const matched = timeline.find((row) => row.age === preferredAge) || timeline[0];
  const firstItem = matched?.items?.[0] || "確認近期疫苗節點";

  return {
    id: `vaccine-${stageId || "default"}`,
    title: `核對疫苗時程：${matched?.age || "近期節點"}`,
    tip: firstItem,
    links: (app.vaccine?.sources || []).slice(0, 1).map((s) => ({ label: s.label, url: s.url }))
  };
}

function getSavedPlan() {
  try {
    return JSON.parse(localStorage.getItem(APP_STATE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePlan(stageId, cityName) {
  localStorage.setItem(
    APP_STATE_KEY,
    JSON.stringify({ stageId, cityName, week: getWeekKey() })
  );
}

function getCheckState() {
  try {
    return JSON.parse(localStorage.getItem(TODO_CHECK_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCheckState(state) {
  localStorage.setItem(TODO_CHECK_KEY, JSON.stringify(state));
}

function makeTodoId(baseId, weekKey, stageId, cityName) {
  return `${weekKey}-${stageId}-${cityName}-${baseId}`;
}

function renderTodoList(stageId, cityName) {
  const stage = getStageById(stageId);
  const city = getCityByName(cityName);
  const weekKey = getWeekKey();
  const checkState = getCheckState();
  const todos = [stageAction(stage), subsidyAction(city), vaccineAction(stageId)];

  app.todoList.innerHTML = "";
  app.todoMeta.textContent = `週起始：${weekKey}｜階段：${stage?.name || "-"}｜城市：${cityName || "-"}`;

  todos.forEach((todo) => {
    const todoId = makeTodoId(todo.id, weekKey, stageId, cityName);
    const row = document.createElement("article");
    row.className = "todo-item";

    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(checkState[todoId]);
    cb.addEventListener("change", () => {
      checkState[todoId] = cb.checked;
      setCheckState(checkState);
    });

    const content = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = todo.title;
    const tip = document.createElement("p");
    tip.textContent = todo.tip;

    content.append(strong, tip);
    label.append(cb, content);
    row.append(label);

    if (todo.links?.length) {
      const linkWrap = document.createElement("div");
      linkWrap.className = "todo-links";
      todo.links.forEach((link) => {
        const a = document.createElement("a");
        a.className = "pill";
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = link.label;
        linkWrap.append(a);
      });
      row.append(linkWrap);
    }

    app.todoList.append(row);
  });
}

function renderCityQuick(cityName) {
  const cityWrap = document.getElementById("subsidy-quick-content");
  const city = getCityByName(cityName) || app.subsidy.locals?.[0];
  cityWrap.innerHTML = "";

  const p = document.createElement("p");
  p.className = "city-summary";
  p.textContent = city?.summary || "尚無資料，請先以地方政府官方頁為準。";

  cityWrap.append(p);

  if (city?.official_url) {
    const a = document.createElement("a");
    a.className = "pill";
    a.href = city.official_url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = `${city.city} 官方入口`;
    cityWrap.append(a);
  }

  const central = app.subsidy.central?.sources?.[0];
  if (central?.url) {
    const c = document.createElement("a");
    c.className = "pill";
    c.href = central.url;
    c.target = "_blank";
    c.rel = "noopener";
    c.textContent = central.label;
    cityWrap.append(c);
  }
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

  const ul = document.createElement("ul");
  focusRows.forEach((row) => {
    const li = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = `${row.age}：`;
    const text = document.createTextNode(` ${(row.items || []).join("、")}`);
    li.append(label, text);
    ul.append(li);
  });
  vaccineWrap.append(ul);

  (app.vaccine.sources || []).slice(0, 2).forEach((src) => {
    if (!src.url) return;
    const a = document.createElement("a");
    a.className = "pill";
    a.href = src.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = src.label;
    vaccineWrap.append(a);
  });
}

function renderTrustedLinks() {
  const wrap = document.getElementById("trusted-links-content");
  wrap.innerHTML = "";

  const groups = [
    {
      title: "補助官方來源",
      links: [
        ...(app.subsidy.central?.sources || []),
        ...app.subsidy.locals.slice(0, 3).map((x) => ({ label: `${x.city} 官方入口`, url: x.official_url }))
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

    group.links.filter((x) => x?.url).forEach((link) => {
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

function bindPlanner() {
  const form = document.getElementById("planner-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const stageId = app.stageSelect.value;
    const cityName = app.citySelect.value;

    if (!stageId || !cityName) return;

    savePlan(stageId, cityName);
    renderTodoList(stageId, cityName);
    renderCityQuick(cityName);
    renderVaccineQuick(stageId);
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

  const saved = getSavedPlan();
  const defaultStage = saved.stageId && getStageById(saved.stageId)
    ? saved.stageId
    : app.checklist.stages?.[0]?.id;
  const defaultCity = saved.cityName && getCityByName(saved.cityName)
    ? saved.cityName
    : app.subsidy.locals?.[0]?.city;

  if (defaultStage) app.stageSelect.value = defaultStage;
  if (defaultCity) app.citySelect.value = defaultCity;

  if (defaultStage && defaultCity) {
    renderTodoList(defaultStage, defaultCity);
    renderCityQuick(defaultCity);
    renderVaccineQuick(defaultStage);
  }
}

init().catch(() => {
  const target = document.getElementById("todo-meta");
  if (target) target.textContent = "資料載入失敗，請稍後重試。";
});
