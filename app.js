const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ── Початкові дані з URL (?f=base64) ──────────────────────────────────────────
let initialFilters = {};
try {
  const encoded = new URLSearchParams(window.location.search).get("f");
  if (encoded) initialFilters = JSON.parse(atob(encoded));
} catch (_) {}

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-content").forEach(el => el.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");

    document.getElementById("btn-save").style.display =
      tab.dataset.tab === "status" ? "none" : "block";
  });
});

// ── Rooms pills ───────────────────────────────────────────────────────────────
document.querySelectorAll("#rooms-group .pill").forEach(pill => {
  pill.addEventListener("click", () => pill.classList.toggle("active"));
});

// ── Blacklist ─────────────────────────────────────────────────────────────────
let blacklistWords = [];

function renderBlacklist() {
  const container = document.getElementById("blacklist-tags");
  container.innerHTML = "";
  blacklistWords.forEach((word, idx) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `<span>${word}</span><button class="tag-remove" data-idx="${idx}">×</button>`;
    container.appendChild(tag);
  });
  container.querySelectorAll(".tag-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      blacklistWords.splice(Number(btn.dataset.idx), 1);
      renderBlacklist();
    });
  });
}

document.getElementById("blacklist-add").addEventListener("click", () => {
  const input = document.getElementById("blacklist-input");
  const word = input.value.trim().toLowerCase();
  if (word && !blacklistWords.includes(word)) {
    blacklistWords.push(word);
    renderBlacklist();
  }
  input.value = "";
});

document.getElementById("blacklist-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("blacklist-add").click();
});

// ── Status tab ────────────────────────────────────────────────────────────────
const statusToggle = document.getElementById("status-toggle");
const statusText = document.getElementById("status-text");

statusToggle.addEventListener("change", () => {
  statusText.textContent = statusToggle.checked ? "✅ Активний" : "⏸️ Зупинений";
});

// ── Заповнення форми з initialFilters ─────────────────────────────────────────
function loadFilters(f) {
  if (!f || !Object.keys(f).length) return;

  if (f.city) {
    const opt = document.querySelector(`#city option[value="${f.city}"]`);
    if (opt) document.getElementById("city").value = f.city;
  }

  const types = typeof f.deal_types === "string"
    ? f.deal_types.split(",").map(s => s.trim())
    : (f.deal_types || []);
  types.forEach(type => {
    const cb = document.querySelector(`input[name="deal_type"][value="${type}"]`);
    if (cb) cb.checked = true;
  });

  const rooms = typeof f.rooms === "string" ? JSON.parse(f.rooms || "[]") : (f.rooms || []);
  rooms.forEach(r => {
    const pill = document.querySelector(`#rooms-group .pill[data-value="${r}"]`);
    if (pill) pill.classList.add("active");
  });

  if (f.price_currency) document.getElementById("price_currency").value = f.price_currency;
  if (f.price_min) document.getElementById("price_min").value = f.price_min;
  if (f.price_max) document.getElementById("price_max").value = f.price_max;
  if (f.area_min) document.getElementById("area_min").value = f.area_min;
  if (f.area_max) document.getElementById("area_max").value = f.area_max;
  if (f.floor_min) document.getElementById("floor_min").value = f.floor_min;
  if (f.floor_max) document.getElementById("floor_max").value = f.floor_max;
  if (f.floor_not_first) document.getElementById("floor_not_first").checked = !!f.floor_not_first;
  if (f.floor_not_last) document.getElementById("floor_not_last").checked = !!f.floor_not_last;
  if (f.year_min) document.getElementById("year_min").value = f.year_min;
  if (f.year_max) document.getElementById("year_max").value = f.year_max;
  if (f.only_owner) document.getElementById("only_owner").checked = !!f.only_owner;
  if (f.only_with_photo) document.getElementById("only_with_photo").checked = !!f.only_with_photo;

  try {
    blacklistWords = typeof f.blacklist_words === "string"
      ? JSON.parse(f.blacklist_words || "[]")
      : (f.blacklist_words || []);
    renderBlacklist();
  } catch (_) {}

  const isActive = f.is_active !== undefined ? !!f.is_active : true;
  statusToggle.checked = isActive;
  statusText.textContent = isActive ? "✅ Активний" : "⏸️ Зупинений";

  const cityEl = document.getElementById("stat-city");
  const typesEl = document.getElementById("stat-types");
  if (cityEl) cityEl.textContent = f.city || "Київ";
  if (typesEl) typesEl.textContent = types.length || "0";
}

loadFilters(initialFilters);

// ── Збір даних з форми ────────────────────────────────────────────────────────
function collectFilters() {
  const cityEl = document.getElementById("city");
  const cityOsmId = cityEl.options[cityEl.selectedIndex].dataset.osm;

  const dealTypes = Array.from(
    document.querySelectorAll('input[name="deal_type"]:checked')
  ).map(cb => cb.value);

  const rooms = Array.from(
    document.querySelectorAll("#rooms-group .pill.active")
  ).map(p => Number(p.dataset.value));

  const intVal = id => {
    const v = document.getElementById(id).value;
    return v ? parseInt(v, 10) : null;
  };

  return {
    city: cityEl.value,
    city_osm_id: cityOsmId,
    deal_types: dealTypes.join(",") || "flat-rent",
    rooms: rooms.length ? JSON.stringify(rooms) : null,
    price_min: intVal("price_min"),
    price_max: intVal("price_max"),
    price_currency: document.getElementById("price_currency").value,
    area_min: intVal("area_min"),
    area_max: intVal("area_max"),
    floor_min: intVal("floor_min"),
    floor_max: intVal("floor_max"),
    floor_not_first: document.getElementById("floor_not_first").checked ? 1 : 0,
    floor_not_last: document.getElementById("floor_not_last").checked ? 1 : 0,
    year_min: intVal("year_min"),
    year_max: intVal("year_max"),
    only_owner: document.getElementById("only_owner").checked ? 1 : 0,
    only_with_photo: document.getElementById("only_with_photo").checked ? 1 : 0,
    blacklist_words: JSON.stringify(blacklistWords),
    is_active: statusToggle.checked ? 1 : 0,
  };
}

// ── Збереження ────────────────────────────────────────────────────────────────
document.getElementById("btn-save").addEventListener("click", () => {
  const filters = collectFilters();
  tg.sendData(JSON.stringify({ action: "save_filters", filters }));
});
