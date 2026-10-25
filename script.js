"use strict";

/* =====================================================
   TwinCity Transit Atlas
   Data source : OpenStreetMap via the Overpass API
   Libraries   : Leaflet 1.9.4, Leaflet.markercluster

   Loading strategy (designed for free public servers):
   1. Fresh copy in browser cache (6 hours)
   2. Overpass API, ONE server at a time:
        stops first (shown immediately), routes in the background
   3. Older browser cache
   4. Built-in snapshot stored inside this file (BUILT_IN_SNAPSHOT)
   ===================================================== */

/* ---------- 1. Configuration ---------- */
const CONFIG = {
  // South, West, North, East bounding box covering Rawalpindi and Islamabad
  bbox: "33.52,72.85,33.80,73.20",
  center: [33.65, 73.05],
  zoom: 12,

  // Public Overpass servers, tried one after another (never all at once)
  mirrors: [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ],
  points: { timeoutMs: 30000, rounds: 2 },
  routes: { timeoutMs: 45000, rounds: 1 },

  // The first key is used for saving; older keys are still read as a fallback
  cacheKeys: [
    "twincity-transit-cache-v3",
    "twincity-transit-cache-v2",
    "twincity-transit-cache-v1"
  ],
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  themeKey: "twincity-theme"
};

/* ---------- Built-in snapshot (optional backup, see instructions) ----------
   After one successful live load, open the browser console and run:
       copy(makeSnapshot())
   Then replace the word null below with the copied text, like this:
       const BUILT_IN_SNAPSHOT = { ...pasted text... };
   ------------------------------------------------------------------------ */
const BUILT_IN_SNAPSHOT = null;

const TYPE_INFO = {
  metro:    { label: "Metro Bus Station" },
  terminal: { label: "Bus Terminal / Station" },
  stop:     { label: "Bus Stop" }
};

const ROUTE_KIND_LABEL = {
  metro: "Metro Bus",
  bus: "Bus route",
  minibus: "Minibus route",
  share_taxi: "Shared taxi / wagon route",
  trolleybus: "Trolleybus route"
};

const METRO_COLOR = "#14b8a6";
// Mid-tone colours that stay readable on both light and dark maps
const ROUTE_PALETTE = [
  "#2563eb", "#db2777", "#ea580c", "#7c3aed", "#ca8a04",
  "#16a34a", "#dc2626", "#0284c7", "#65a30d", "#c026d3"
];

/* ---------- 2. Basemap providers (no API key needed) ---------- */
const ATTR_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ATTR_CARTO = ATTR_OSM + ' &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ATTR_ESRI = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors';

const PROVIDERS = {
  cartoDark: {
    name: "CARTO Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  cartoLight: {
    name: "CARTO Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  cartoVoyager: {
    name: "CARTO Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  esriDark: {
    name: "Esri Dark Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 16, attribution: ATTR_ESRI }
  },
  esriLight: {
    name: "Esri Light Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 16, attribution: ATTR_ESRI }
  },
  esriStreet: {
    name: "Esri Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: ATTR_ESRI }
  },
  esriSat: {
    name: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" }
  },
  esriTopo: {
    name: "Esri Topographic",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: ATTR_ESRI }
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    opts: { maxZoom: 19, attribution: ATTR_OSM }
  },
  osmFr: {
    name: "OpenStreetMap France",
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    opts: { subdomains: "abc", maxZoom: 19, attribution: '&copy; OpenStreetMap France | ' + ATTR_OSM }
  },
  openTopo: {
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    opts: {
      subdomains: "abc", maxZoom: 19, maxNativeZoom: 17,
      attribution: 'Map data: ' + ATTR_OSM + ', SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    }
  }
};

// If the first provider in a chain is blocked or too slow, the next one is used automatically.
const CHAINS = {
  dark:      ["cartoDark", "esriDark", "esriStreet", "osmFr"],
  light:     ["cartoLight", "esriLight", "esriStreet", "osmFr"],
  streets:   ["cartoVoyager", "esriStreet", "osmFr", "osm"],
  osm:       ["osm", "osmFr", "cartoVoyager", "esriStreet"],
  satellite: ["esriSat", "esriStreet", "cartoVoyager"],
  topo:      ["esriTopo", "openTopo", "esriStreet"]
};

/* ---------- 3. DOM references and state ---------- */
const $ = (id) => document.getElementById(id);

const els = {
  loading: $("loading"), loadingText: $("loadingText"),
  error: $("error"), errorText: $("errorText"), retryBtn: $("retryBtn"),
  toast: $("toast"),
  search: $("searchInput"), zone: $("zoneFilter"), basemap: $("basemapSelect"),
  routeToggle: $("routeToggle"),
  resultCount: $("resultCount"), resultList: $("resultList"), resetBtn: $("resetBtn"),
  routeSearch: $("routeSearch"), routeCount: $("routeCount"), routeList: $("routeList"),
  routesAllBtn: $("routesAllBtn"), routesNoneBtn: $("routesNoneBtn"),
  statMetro: $("statMetro"), statTerminal: $("statTerminal"), statStop: $("statStop"), statRoute: $("statRoute"),
  barIsb: $("barIsb"), barRwp: $("barRwp"), cntIsb: $("cntIsb"), cntRwp: $("cntRwp"),
  sourceInfo: $("sourceInfo"),
  nearestCard: $("nearestCard"), nearestBody: $("nearestBody"),
  locateBtn: $("locateBtn"), refreshBtn: $("refreshBtn"), exportBtn: $("exportBtn"),
  themeBtn: $("themeBtn"), menuBtn: $("menuBtn"), sidebar: $("sidebar")
};

const state = {
  theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  features: [],
  routes: [],
  markers: new Map(),
  routeLayers: new Map(),
  filtered: [],
  activeRoute: null,
  userLatLng: null,
  userMarker: null,
  nearestLine: null,
  sourceLabel: ""
};

/* ---------- 4. Map setup ---------- */
const map = L.map("map", { zoomControl: true, preferCanvas: true, maxZoom: 19 })
  .setView(CONFIG.center, CONFIG.zoom);

const routeLayer = L.layerGroup().addTo(map);
const metroLayer = L.layerGroup().addTo(map);
const terminalLayer = L.layerGroup().addTo(map);
const stopCluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 45,
  chunkedLoading: true,
  iconCreateFunction: (c) =>
    L.divIcon({
      html: `<div class="cluster">${c.getChildCount()}</div>`,
      className: "cluster-wrap",
      iconSize: [38, 38]
    })
}).addTo(map);

/* ---------- 5. Helpers ---------- */
function esc(value) {
  const d = document.createElement("div");
  d.textContent = value == null ? "" : String(value);
  return d.innerHTML;
}

function haversine(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function yesNo(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();
  if (s === "yes" || s === "true") return "Yes";
  if (s === "no" || s === "false") return "No";
  return v;
}

// Approximate city split (used for filtering and statistics only)
function zoneOf(lat, lon) {
  return lat < 33.655 && lon < 73.13 ? "Rawalpindi" : "Islamabad";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let toastTimer;
function toast(message, ms = 4500) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add("hidden"), ms);
}

function showLoading(text) {
  els.error.classList.add("hidden");
  els.loading.classList.remove("hidden");
  if (text) els.loadingText.textContent = text;
}
function hideLoading() { els.loading.classList.add("hidden"); }
function showError(message) {
  hideLoading();
  els.errorText.textContent = message;
  els.error.classList.remove("hidden");
}

/* ---------- 6. Theme and basemap handling ---------- */
const tiles = { chain: [], index: 0, layer: null, ok: 0, fail: 0, warned: false, timer: null };

function mountTileLayer() {
  clearTimeout(tiles.timer);
  if (tiles.layer) map.removeLayer(tiles.layer);

  const provider = PROVIDERS[tiles.chain[tiles.index]];
  const layer = L.tileLayer(provider.url, { ...provider.opts });
  tiles.ok = 0;
  tiles.fail = 0;

  // Move to the next provider in the chain (or warn once if none is left)
  const tryNext = (reason) => {
    if (tiles.layer !== layer) return;
    if (tiles.index < tiles.chain.length - 1) {
      tiles.index++;
      toast(`${reason} Switching to ${PROVIDERS[tiles.chain[tiles.index]].name}...`, 5000);
      mountTileLayer();
    } else if (!tiles.warned) {
      tiles.warned = true;
      toast("Basemap tiles could not be loaded. Please check your internet connection.", 7000);
    }
  };

  layer.on("tileload", () => {
    if (tiles.layer === layer) tiles.ok++;
  });

  layer.on("tileerror", () => {
    if (tiles.layer !== layer) return;
    tiles.fail++;
    if ((tiles.ok === 0 && tiles.fail >= 3) || (tiles.fail >= 8 && tiles.fail > tiles.ok)) {
      tryNext("This map provider is not reachable on your network.");
    }
  });

  tiles.layer = layer;
  layer.addTo(map);
  layer.bringToBack();

  // Watchdog: if nothing has loaded after 8 seconds, try the next provider
  tiles.timer = setTimeout(() => {
    if (tiles.layer === layer && tiles.ok === 0) tryNext("The map is loading too slowly.");
  }, 8000);
}

function applyBasemap() {
  tiles.chain = CHAINS[els.basemap.value] || CHAINS.dark;
  tiles.index = 0;
  tiles.warned = false;
  mountTileLayer();
}

function setTheme(theme, persist = true) {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", state.theme);
  if (persist) {
    try { localStorage.setItem(CONFIG.themeKey, state.theme); } catch (e) { /* ignore */ }
  }
  els.themeBtn.innerHTML = state.theme === "dark" ? "&#9728; Light mode" : "&#9790; Dark mode";
}

/* ---------- 7. Overpass queries ---------- */
function pointsQuery() {
  const b = CONFIG.bbox;
  return `
    [out:json][timeout:40];
    (
      node["highway"="bus_stop"](${b});
      nwr["amenity"="bus_station"](${b});
      nwr["public_transport"="station"]["bus"="yes"](${b});
      nwr["public_transport"="station"]["name"~"metro",i](${b});
    );
    out center tags;
  `;
}

// All bus-type route relations (bus, minibus, shared taxi / wagon, trolleybus)
// plus the dedicated Metro Bus guideway.
function routesQuery() {
  const b = CONFIG.bbox;
  return `
    [out:json][timeout:60];
    (
      relation["route"~"^(bus|minibus|share_taxi|trolleybus)$"](${b});
      way["highway"="bus_guideway"](${b});
    );
    out geom tags;
  `;
}

/* ---------- 8. fetch(): one server at a time (avoids HTTP 429) ---------- */
// opts: { label, timeoutMs, rounds, progress(text) }
async function queryOverpass(query, opts) {
  const { label, timeoutMs, rounds, progress } = opts;

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < CONFIG.mirrors.length; i++) {
      const url = CONFIG.mirrors[i];
      const host = new URL(url).hostname;
      progress(`Loading ${label} (server ${i + 1} of ${CONFIG.mirrors.length}` +
               (round > 1 ? ", second attempt" : "") + ")...");

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: "data=" + encodeURIComponent(query),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`${host} returned HTTP ${res.status}`);
        const json = await res.json();
        if (!json || !Array.isArray(json.elements)) throw new Error("Unexpected response format");
        return json;
      } catch (err) {
        console.warn(`Overpass attempt failed (${host}):`, err.message || err);
      } finally {
        clearTimeout(timer);
      }
    }
    if (round < rounds) await sleep(3000); // short pause before the next round
  }
  throw new Error("The OpenStreetMap servers are busy right now.");
}

/* ---------- 9. Parse JSON into clean objects ---------- */
function classify(tags) {
  const text = [tags.name, tags["name:en"], tags.network, tags.operator, tags.brand]
    .filter(Boolean).join(" ").toLowerCase();
  if (text.includes("metro")) return "metro";
  if (tags.amenity === "bus_station" || tags.public_transport === "station") return "terminal";
  return "stop";
}

function parseFeatures(elements) {
  const seenIds = new Set();
  const seenNamed = new Set();
  const out = [];

  for (const el of elements) {
    const lat = el.lat ?? (el.center && el.center.lat);
    const lon = el.lon ?? (el.center && el.center.lon);
    if (lat == null || lon == null) continue;

    const id = `${el.type}/${el.id}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const t = el.tags || {};
    const type = classify(t);
    const rawName = t["name:en"] || t.name || "";

    // Merge duplicate stations (for example two platforms with the same name)
    if (type !== "stop" && rawName) {
      const key = `${type}|${rawName.toLowerCase()}`;
      if (seenNamed.has(key)) continue;
      seenNamed.add(key);
    }

    out.push({
      id, lat, lon, type,
      name: rawName || (type === "stop" ? "Unnamed bus stop" : "Unnamed station"),
      named: Boolean(rawName),
      ref: t.ref || t.local_ref || "",
      operator: t.operator || "",
      network: t.network || "",
      shelter: yesNo(t.shelter),
      bench: yesNo(t.bench),
      covered: yesNo(t.covered),
      wheelchair: yesNo(t.wheelchair),
      zone: zoneOf(lat, lon)
    });
  }
  return out;
}

function compactGeometry(geometry) {
  return geometry.map((p) => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]);
}

function routeLabel(r) {
  if (r.ref && r.name) {
    return r.name.toLowerCase().includes(r.ref.toLowerCase()) ? r.name : `${r.ref} · ${r.name}`;
  }
  return r.name || r.ref || "Unnamed route";
}

// Groups OSM relations that belong to the same route (for example two directions)
function parseRoutes(elements) {
  const groups = new Map();

  for (const el of elements) {
    const t = el.tags || {};
    const segments = [];

    if (el.type === "way" && Array.isArray(el.geometry)) {
      segments.push(compactGeometry(el.geometry));
    } else if (el.type === "relation" && Array.isArray(el.members)) {
      for (const m of el.members) {
        if (m.type === "way" && Array.isArray(m.geometry) && !/stop|platform/.test(m.role || "")) {
          segments.push(compactGeometry(m.geometry));
        }
      }
    }

    const usable = segments.filter((s) => s.length > 1);
    if (!usable.length) continue;

    const isGuideway = el.type === "way";
    const name = isGuideway ? "Metro Bus guideway" : (t["name:en"] || t.name || "");
    const ref = isGuideway ? "" : (t.ref || "");
    const text = [name, ref, t.network, t.operator].join(" ").toLowerCase();
    const kind = isGuideway || text.includes("metro") ? "metro" : (t.route || "bus");
    const key = isGuideway ? "guideway" : (ref || name || String(el.id)).toLowerCase();

    let g = groups.get(key);
    if (!g) {
      g = {
        key, ref: "", name: "", operator: "", network: "", from: "", to: "",
        kind, segments: [], ids: [], visible: true, color: "#2563eb", label: ""
      };
      groups.set(key, g);
    }

    g.segments.push(...usable);
    g.ids.push(`${el.type}/${el.id}`);
    if (!g.ref && ref) g.ref = ref;
    if (!g.name && name) g.name = name;
    if (!g.operator && t.operator) g.operator = t.operator;
    if (!g.network && t.network) g.network = t.network;
    if (!g.from && t.from) g.from = t.from;
    if (!g.to && t.to) g.to = t.to;
    if (kind === "metro") g.kind = "metro";
  }

  // Do not draw the raw guideway twice if a Metro Bus route relation exists
  const hasMetroRelation = [...groups.values()].some((g) => g.kind === "metro" && g.key !== "guideway");
  if (hasMetroRelation) groups.delete("guideway");

  const routes = [...groups.values()];
  routes.forEach((r) => { r.label = routeLabel(r); });
  routes.sort((a, b) =>
    (a.kind === "metro" ? 0 : 1) - (b.kind === "metro" ? 0 : 1) ||
    a.label.localeCompare(b.label, undefined, { numeric: true }));

  let i = 0;
  routes.forEach((r) => {
    r.color = r.kind === "metro" ? METRO_COLOR : ROUTE_PALETTE[i++ % ROUTE_PALETTE.length];
  });
  return routes;
}

/* ---------- 10. Cache and built-in snapshot ---------- */
function saveCache(features, routes) {
  try {
    localStorage.setItem(CONFIG.cacheKeys[0], JSON.stringify({ t: Date.now(), features, routes }));
  } catch (e) { /* storage full or blocked: ignore */ }
}

// Reads the newest cache, falling back to the older cache names
function readCache() {
  for (const key of CONFIG.cacheKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.features) && data.features.length) return data;
    } catch (e) { /* try the next key */ }
  }
  return null;
}

function getBuiltInSnapshot() {
  const s = BUILT_IN_SNAPSHOT;
  if (s && Array.isArray(s.features) && s.features.length) return s;
  return null;
}

// Run in the browser console after a successful live load:  copy(makeSnapshot())
window.makeSnapshot = function () {
  return JSON.stringify({
    savedAt: Date.now(),
    features: state.features,
    routes: state.routes.map((r) => ({ ...r, visible: true }))
  });
};

/* ---------- 11. Build map layers ---------- */
function popupHtml(f) {
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<tr><td>${k}</td><td>${esc(v)}</td></tr>`); };

  add("City (approx.)", f.zone);
  add("Route / Ref", f.ref);
  add("Operator", f.operator);
  add("Network", f.network);
  add("Shelter", f.shelter);
  add("Bench", f.bench);
  add("Covered", f.covered);
  add("Wheelchair", f.wheelchair);
  add("Coordinates", `${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}`);
  if (state.userLatLng) add("From you", fmtDist(haversine(state.userLatLng, [f.lat, f.lon])));

  return `
    <div class="pop-title">${esc(f.name)}</div>
    <span class="pop-badge ${f.type}">${TYPE_INFO[f.type].label}</span>
    <table class="pop-table">${rows.join("")}</table>
    <div class="pop-links">
      <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}">Directions</a>
      <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/${f.id}">View on OSM</a>
    </div>`;
}

function routePopupHtml(r) {
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<tr><td>${k}</td><td>${esc(v)}</td></tr>`); };
  add("Route no.", r.ref);
  add("From", r.from);
  add("To", r.to);
  add("Operator", r.operator);
  add("Network", r.network);
  add("Mapped parts", r.ids.length);

  return `
    <div class="pop-title">${esc(r.label)}</div>
    <span class="pop-badge" style="background:${r.color};color:#fff">${ROUTE_KIND_LABEL[r.kind] || "Route"}</span>
    <table class="pop-table">${rows.join("")}</table>
    <div class="pop-links">
      <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/${r.ids[0]}">View on OSM</a>
    </div>`;
}

function makeMarker(f) {
  const isStop = f.type === "stop";
  const letter = f.type === "metro" ? "M" : f.type === "terminal" ? "B" : "";
  const size = isStop ? 14 : 28;

  const icon = L.divIcon({
    className: "",
    html: `<div class="pin pin-${f.type}">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

  const marker = L.marker([f.lat, f.lon], { icon, title: f.name, riseOnHover: true });
  marker.bindPopup(() => popupHtml(f), { maxWidth: 300 });
  return marker;
}

function buildMarkers() {
  state.markers.clear();
  state.features.forEach((f) => state.markers.set(f.id, makeMarker(f)));
}

function buildRoutes() {
  routeLayer.clearLayers();
  state.routeLayers.clear();
  state.activeRoute = null;

  state.routes.forEach((r) => {
    const base = r.kind === "metro" ? 5 : 3.5;
    const glow = L.polyline(r.segments, { color: r.color, weight: base + 8, opacity: 0.16, interactive: false });
    const line = L.polyline(r.segments, { color: r.color, weight: base, opacity: 0.95, lineJoin: "round", lineCap: "round" });

    line.bindPopup(() => routePopupHtml(r), { maxWidth: 300 });
    line.on("mouseover", () => { if (state.activeRoute !== r.key) line.setStyle({ weight: base + 2.5 }); });
    line.on("mouseout", () => { if (state.activeRoute !== r.key) line.setStyle({ weight: base }); });

    state.routeLayers.set(r.key, { line, glow, base });
  });

  syncRouteLayers();
}

// Adds or removes route lines depending on the master toggle and each route's checkbox
function syncRouteLayers() {
  routeLayer.clearLayers();
  if (!els.routeToggle.checked) return;
  state.routes.forEach((r) => {
    if (!r.visible) return;
    const ly = state.routeLayers.get(r.key);
    if (!ly) return;
    routeLayer.addLayer(ly.glow);
    routeLayer.addLayer(ly.line);
  });
}

// Shows only the legend items that exist in the loaded data
function updateLegend() {
  const hasType = (t) => state.features.some((f) => f.type === t);
  const toggle = (id, show) => $(id).classList.toggle("hidden", !show);
  toggle("legMetro", hasType("metro"));
  toggle("legTerminal", hasType("terminal"));
  toggle("legStop", hasType("stop"));
  toggle("legMetroRoute", state.routes.some((r) => r.kind === "metro"));
}

/* ---------- 12. Route panel ---------- */
function getFilteredRoutes() {
  const q = els.routeSearch.value.trim().toLowerCase();
  if (!q) return state.routes;
  return state.routes.filter((r) =>
    r.label.toLowerCase().includes(q) ||
    r.ref.toLowerCase().includes(q) ||
    r.operator.toLowerCase().includes(q));
}

function renderRouteList() {
  const list = getFilteredRoutes();
  els.routeCount.textContent = `${list.length} route${list.length === 1 ? "" : "s"}`;
  els.routeList.innerHTML = "";

  if (!list.length) {
    els.routeList.innerHTML = '<li class="result-empty">No routes found for this area or filter.</li>';
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach((r) => {
    const li = document.createElement("li");
    li.className = "route-item" + (state.activeRoute === r.key ? " active" : "");

    const detail = r.from && r.to ? ` · ${r.from} → ${r.to}` : r.operator ? ` · ${r.operator}` : "";
    li.innerHTML = `
      <input type="checkbox" ${r.visible ? "checked" : ""} aria-label="Show or hide this route" />
      <span class="route-swatch" style="background:${r.color}"></span>
      <span class="route-text">
        <span class="route-title">${esc(r.label)}</span>
        <span class="route-sub">${esc((ROUTE_KIND_LABEL[r.kind] || "Route") + detail)}</span>
      </span>`;

    const box = li.querySelector("input");
    box.addEventListener("click", (e) => e.stopPropagation());
    box.addEventListener("change", () => {
      r.visible = box.checked;
      syncRouteLayers();
    });
    li.addEventListener("click", () => focusRoute(r.key));
    frag.appendChild(li);
  });
  els.routeList.appendChild(frag);
}

function focusRoute(key) {
  const r = state.routes.find((x) => x.key === key);
  const ly = state.routeLayers.get(key);
  if (!r || !ly) return;

  // Reset the previously highlighted route
  if (state.activeRoute && state.routeLayers.has(state.activeRoute)) {
    const prev = state.routeLayers.get(state.activeRoute);
    prev.line.setStyle({ weight: prev.base });
  }
  state.activeRoute = key;

  if (!r.visible || !els.routeToggle.checked) {
    r.visible = true;
    els.routeToggle.checked = true;
    syncRouteLayers();
  }

  ly.line.setStyle({ weight: ly.base + 4 });
  ly.line.bringToFront();
  map.fitBounds(ly.line.getBounds().pad(0.15));
  ly.line.openPopup(ly.line.getBounds().getCenter());
  renderRouteList();

  if (window.innerWidth <= 860) els.sidebar.classList.add("collapsed");
}

function setRoutesVisible(visible) {
  getFilteredRoutes().forEach((r) => { r.visible = visible; });
  if (visible) els.routeToggle.checked = true;
  syncRouteLayers();
  renderRouteList();
}

/* ---------- 13. Filtering and rendering of stops ---------- */
function getFiltered() {
  const q = els.search.value.trim().toLowerCase();
  const zone = els.zone.value;
  const types = new Set(
    [...document.querySelectorAll(".type-toggle:checked")].map((c) => c.value)
  );

  return state.features.filter((f) => {
    if (!types.has(f.type)) return false;
    if (zone !== "all" && f.zone !== zone) return false;
    if (q && !(f.name.toLowerCase().includes(q) || f.ref.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render() {
  const list = getFiltered();
  state.filtered = list;

  metroLayer.clearLayers();
  terminalLayer.clearLayers();
  stopCluster.clearLayers();

  const stops = [];
  list.forEach((f) => {
    const m = state.markers.get(f.id);
    if (!m) return;
    if (f.type === "metro") metroLayer.addLayer(m);
    else if (f.type === "terminal") terminalLayer.addLayer(m);
    else stops.push(m);
  });
  stopCluster.addLayers(stops);

  updateStats(list);
  renderList(list);
}

function updateStats(list) {
  const count = (t) => list.filter((f) => f.type === t).length;
  els.statMetro.textContent = count("metro");
  els.statTerminal.textContent = count("terminal");
  els.statStop.textContent = count("stop");
  els.statRoute.textContent = state.routes.length;

  const isb = list.filter((f) => f.zone === "Islamabad").length;
  const rwp = list.length - isb;
  const total = list.length || 1;
  els.cntIsb.textContent = isb;
  els.cntRwp.textContent = rwp;
  els.barIsb.style.width = (isb / total) * 100 + "%";
  els.barRwp.style.width = (rwp / total) * 100 + "%";

  els.sourceInfo.textContent = `Data status: ${state.sourceLabel}`;
}

function renderList(list) {
  els.resultCount.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;

  const order = { metro: 0, terminal: 1, stop: 2 };
  const sorted = [...list]
    .sort((a, b) =>
      order[a.type] - order[b.type] ||
      Number(b.named) - Number(a.named) ||
      a.name.localeCompare(b.name))
    .slice(0, 40);

  els.resultList.innerHTML = "";
  if (!sorted.length) {
    els.resultList.innerHTML = '<li class="result-empty">No matching features. Try changing the filters.</li>';
    return;
  }

  const frag = document.createDocumentFragment();
  sorted.forEach((f) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="r-left"><i class="dot ${f.type}"></i><span class="r-name">${esc(f.name)}</span></span>
      <span class="r-meta">${f.zone}</span>`;
    li.addEventListener("click", () => focusFeature(f.id));
    frag.appendChild(li);
  });
  els.resultList.appendChild(frag);
}

function focusFeature(id) {
  const f = state.features.find((x) => x.id === id);
  const m = state.markers.get(id);
  if (!f || !m) return;

  if (f.type === "stop" && stopCluster.hasLayer(m)) {
    stopCluster.zoomToShowLayer(m, () => m.openPopup());
  } else {
    map.flyTo([f.lat, f.lon], 16, { duration: 0.8 });
    map.once("moveend", () => m.openPopup());
  }
  if (window.innerWidth <= 860) els.sidebar.classList.add("collapsed");
}

/* ---------- 14. Nearest stop (browser geolocation) ---------- */
function findNearest() {
  if (!navigator.geolocation) {
    toast("Geolocation is not supported by this browser.");
    return;
  }
  if (!state.features.length) {
    toast("Please wait until the data has loaded.");
    return;
  }
  toast("Locating you...", 2500);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const here = [pos.coords.latitude, pos.coords.longitude];
      state.userLatLng = here;

      let best = null, bestD = Infinity;
      state.features.forEach((f) => {
        const d = haversine(here, [f.lat, f.lon]);
        if (d < bestD) { bestD = d; best = f; }
      });

      if (state.userMarker) map.removeLayer(state.userMarker);
      if (state.nearestLine) map.removeLayer(state.nearestLine);

      state.userMarker = L.marker(here, {
        icon: L.divIcon({ className: "", html: '<div class="user-pulse"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000
      }).addTo(map).bindPopup("<b>You are here</b>");

      if (bestD > 40000) {
        map.setView(here, 13);
        toast("You appear to be outside the twin-city study area.");
        return;
      }

      state.nearestLine = L.polyline([here, [best.lat, best.lon]], {
        color: "#3b82f6", weight: 3, dashArray: "6 8"
      }).addTo(map);

      map.fitBounds(L.latLngBounds([here, [best.lat, best.lon]]).pad(0.5));
      const walkMin = Math.max(1, Math.round(bestD / 83)); // about 5 km/h

      els.nearestCard.classList.remove("hidden");
      els.nearestBody.innerHTML = `
        <div class="big">${esc(best.name)}</div>
        <div class="row"><span>Type: <b>${TYPE_INFO[best.type].label}</b></span></div>
        <div class="row"><span>Distance: <b>${fmtDist(bestD)}</b></span><span>Walk: <b>about ${walkMin} min</b></span></div>`;

      const m = state.markers.get(best.id);
      if (m) {
        setTimeout(() => {
          if (stopCluster.hasLayer(m)) stopCluster.zoomToShowLayer(m, () => m.openPopup());
          else m.openPopup();
        }, 500);
      }
    },
    (err) => {
      const msg = err.code === 1
        ? "Location permission was denied. Allow it in your browser to use this feature."
        : "Could not determine your location.";
      toast(msg, 6000);
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* ---------- 15. Export ---------- */
function exportGeoJSON() {
  const visibleRoutes = state.routes.filter((r) => r.visible);
  if (!state.filtered.length && !visibleRoutes.length) {
    toast("Nothing to export with the current filters.");
    return;
  }

  const pointFeatures = state.filtered.map((f) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [f.lon, f.lat] },
    properties: {
      id: f.id, name: f.name, type: TYPE_INFO[f.type].label, city_approx: f.zone,
      ref: f.ref, operator: f.operator, network: f.network,
      shelter: f.shelter, bench: f.bench, wheelchair: f.wheelchair
    }
  }));

  const routeFeatures = visibleRoutes.map((r) => ({
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: r.segments.map((seg) => seg.map((p) => [p[1], p[0]]))
    },
    properties: {
      name: r.label, kind: ROUTE_KIND_LABEL[r.kind] || "Route", ref: r.ref,
      from: r.from, to: r.to, operator: r.operator, network: r.network
    }
  }));

  const geojson = { type: "FeatureCollection", features: [...pointFeatures, ...routeFeatures] };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "twincity-transit.geojson";
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`Exported ${pointFeatures.length} stops and ${routeFeatures.length} routes.`);
}

/* ---------- 16. Data loading ---------- */
function applyData(features, routes, label, fit = true) {
  routes.forEach((r) => { r.visible = true; });
  state.features = features;
  state.routes = routes;
  state.sourceLabel = label;

  buildMarkers();
  buildRoutes();
  render();
  renderRouteList();
  updateLegend();

  const metro = features.filter((f) => f.type === "metro");
  if (fit && metro.length > 1) {
    map.fitBounds(L.latLngBounds(metro.map((f) => [f.lat, f.lon])).pad(0.25));
  }
}

// Replaces only the routes (used when routes finish loading in the background)
function applyRoutes(routes, label) {
  routes.forEach((r) => { r.visible = true; });
  state.routes = routes;
  state.sourceLabel = label;

  buildRoutes();
  renderRouteList();
  updateLegend();
  updateStats(state.filtered);
}

let loadSeq = 0; // protects against two loads running at the same time

async function loadData(force = false) {
  const mySeq = ++loadSeq;
  const cached = readCache();
  const snap = getBuiltInSnapshot();

  // 1. Fresh browser cache
  if (!force && cached && Date.now() - cached.t < CONFIG.cacheTtlMs) {
    applyData(cached.features, cached.routes || [], `loaded from recent cache (${new Date(cached.t).toLocaleTimeString()})`);
    hideLoading();
    toast("Loaded recent data from this browser. Press Refresh data for a live request.");
    return;
  }

  // 2. Show a saved copy or the built-in snapshot immediately, then update quietly
  let quiet = false;
  if (!force && cached) {
    applyData(cached.features, cached.routes || [],
      `saved copy from ${new Date(cached.t).toLocaleString()}; checking for live data...`);
    quiet = true;
  } else if (!force && snap) {
    const when = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString() : "an earlier date";
    applyData(snap.features, snap.routes || [],
      `built-in snapshot saved on ${when}; checking for live data...`);
    quiet = true;
  }

  if (quiet) hideLoading();
  else showLoading("Checking for saved data...");

  // In quiet mode the map is already usable, so use shorter waits and no loading screen
  const progress = quiet
    ? (text) => { els.sourceInfo.textContent = `Data status: ${text}`; }
    : showLoading;
  const pointsOpts = quiet ? { timeoutMs: 15000, rounds: 1 } : CONFIG.points;
  const routesOpts = quiet ? { timeoutMs: 25000, rounds: 1 } : CONFIG.routes;

  // 3. Live API: stops first, then routes in the background
  try {
    const pointsJson = await queryOverpass(pointsQuery(), {
      label: "stops and stations",
      timeoutMs: pointsOpts.timeoutMs,
      rounds: pointsOpts.rounds,
      progress
    });
    if (mySeq !== loadSeq) return;

    const features = parseFeatures(pointsJson.elements);
    if (!features.length) throw new Error("The API returned no transport features for this area.");

    // Until fresh routes arrive, show the last known routes (if any)
    const knownRoutes = quiet ? state.routes
      : (cached && cached.routes && cached.routes.length) ? cached.routes
      : (snap && snap.routes) ? snap.routes : [];

    const stamp = new Date().toLocaleTimeString();
    // Avoid moving the map while the visitor is already using saved data
    applyData(features, knownRoutes, `stops live from Overpass API (${stamp}); loading routes...`, !quiet);
    hideLoading();
    saveCache(features, knownRoutes);

    try {
      const routesJson = await queryOverpass(routesQuery(), {
        label: "bus routes",
        timeoutMs: routesOpts.timeoutMs,
        rounds: routesOpts.rounds,
        progress: (text) => { els.sourceInfo.textContent = `Data status: ${text}`; }
      });
      if (mySeq !== loadSeq) return;

      const routes = parseRoutes(routesJson.elements);
      if (routes.length) {
        applyRoutes(routes, `live from Overpass API (${new Date().toLocaleTimeString()})`);
        saveCache(features, routes);
      } else {
        state.sourceLabel = `stops live from Overpass API (${stamp}); no mapped bus routes found`;
        updateStats(state.filtered);
        toast("The API returned stops, but no mapped bus routes for this area.", 6000);
      }
    } catch (routeErr) {
      console.warn("Route layer unavailable:", routeErr);
      if (mySeq !== loadSeq) return;
      state.sourceLabel = knownRoutes.length
        ? `stops live (${stamp}); routes from a saved copy`
        : `stops live (${stamp}); routes unavailable right now`;
      updateStats(state.filtered);
      toast(knownRoutes.length
        ? "Routes could not be refreshed, so the last saved routes are shown."
        : "Stops loaded, but the route lines could not be fetched this time. Press Refresh data to retry.", 7000);
    }
    return;
  } catch (err) {
    console.error("Live request failed:", err);
  }

  if (mySeq !== loadSeq) return;

  // Live servers failed. If something is already on screen, just say so.
  if (quiet) {
    state.sourceLabel = `${state.sourceLabel.split(";")[0]}; live servers busy, showing saved data`;
    updateStats(state.filtered);
    toast("The live servers are busy, so saved data is shown. Press Refresh data to retry.", 7000);
    return;
  }

  // Manual refresh or first visit with nothing on screen yet
  if (cached) {
    applyData(cached.features, cached.routes || [], `saved copy from ${new Date(cached.t).toLocaleString()}`);
    hideLoading();
    toast("The data servers are busy, so a saved copy of the data is shown. Press Refresh data to retry.", 8000);
    return;
  }

  if (snap) {
    const when = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString() : "an earlier date";
    applyData(snap.features, snap.routes || [], `built-in snapshot saved on ${when}`);
    hideLoading();
    toast("The live servers are busy, so the built-in snapshot is shown. Press Refresh data to retry.", 8000);
    return;
  }

  showError("The OpenStreetMap servers are busy right now. This is usually temporary. Please wait a minute and try again.");
}

/* ---------- 17. Events ---------- */
let searchTimer;
els.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 150);
});
els.zone.addEventListener("change", render);
document.querySelectorAll(".type-toggle").forEach((c) => c.addEventListener("change", render));
els.routeToggle.addEventListener("change", syncRouteLayers);

els.routeSearch.addEventListener("input", renderRouteList);
els.routesAllBtn.addEventListener("click", () => setRoutesVisible(true));
els.routesNoneBtn.addEventListener("click", () => setRoutesVisible(false));

els.resetBtn.addEventListener("click", () => {
  els.search.value = "";
  els.zone.value = "all";
  els.routeSearch.value = "";
  document.querySelectorAll(".type-toggle").forEach((c) => (c.checked = true));
  els.routeToggle.checked = true;
  state.routes.forEach((r) => { r.visible = true; });
  syncRouteLayers();
  render();
  renderRouteList();
});

els.basemap.addEventListener("change", applyBasemap);
els.themeBtn.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));

els.locateBtn.addEventListener("click", findNearest);
els.exportBtn.addEventListener("click", exportGeoJSON);
els.refreshBtn.addEventListener("click", () => loadData(true));
els.retryBtn.addEventListener("click", () => loadData(true));
els.menuBtn.addEventListener("click", () => els.sidebar.classList.toggle("collapsed"));

/* ---------- 18. Start ---------- */
setTheme(state.theme, false);
applyBasemap();
loadData();