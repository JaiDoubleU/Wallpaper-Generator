import './styles.css';
import {
  DEVICES, ENGINE_VERSION, FAMILIES, GLOBAL_PARAMS, PRESETS, TEXTURES, TEXTURE_DEFAULTS,
  clone, familyById, randomSeed, type ParamDef, type Recipe, type TextureType, type Variant,
} from './recipe';
import { Renderer } from './renderer';
import { backgroundPalette } from './color';
import { withTextChunk } from './png';

// ---------- Small helpers ----------
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: svg('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  shuffle: svg('<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>'),
  save: svg('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
  auto: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
  light: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  dark: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'),
};

// ---------- State ----------
let recipe: Recipe = clone(PRESETS[0]);
let committed = JSON.stringify(recipe);
const undoStack: string[] = [];
const redoStack: string[] = [];
let overlay: 'lock' | 'home' | 'none' = 'lock';
let format: 'png' | 'jpeg' = 'png';

interface Target { id: string; label: string; w: number; h: number }
const targets: Target[] = [];
let target: Target;

// The artifact viewer's save capability, when present (opens the share sheet on iPhone).
type Downloads = { save(r: { filename: string; data: Blob }): Promise<{ status: string }> };
const claudeApi = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
const downloadsReady: Promise<Downloads | null> = claudeApi?.use
  ? (claudeApi.use('downloads') as Promise<Downloads | null>).catch(() => null)
  : Promise.resolve(null);

let preview: Renderer;
let util: Renderer;

// ---------- Boot ----------
function boot() {
  try {
    preview = new Renderer($<HTMLCanvasElement>('preview'));
    util = new Renderer(document.createElement('canvas'), { preserve: true });
    preview.render(recipe, 4, 8); // compile early so failures surface now
  } catch (err) {
    console.error(err);
    $('unsupported').hidden = false;
    return;
  }

  $('undo').innerHTML = ICONS.undo;
  $('redo').innerHTML = ICONS.redo;
  $('shuffle-icon').innerHTML = ICONS.shuffle;
  $('save-icon').innerHTML = ICONS.save;
  $('engine-out').textContent = ENGINE_VERSION;
  $('home-grid').innerHTML = '<span></span>'.repeat(20);

  setupTargets();
  buildStaticControls();
  buildTextureControls();
  bindEvents();
  setupTheme();
  tickClock();
  syncUI();

  new ResizeObserver(() => requestRender()).observe($('preview'));
  requestRender();

  // Off the critical path: preset thumbnails and the app's own linen
  setTimeout(() => { renderThumbnails(); paintGround(); }, 30);
}

// ---------- Rendering ----------
let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(draw);
}
function draw() {
  renderQueued = false;
  const c = preview.canvas;
  const r = c.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  preview.render(recipe, Math.round(r.width * dpr), Math.round(r.height * dpr));
  const { mean, spread } = preview.clockBandStats();
  $('phone').style.setProperty('--clock', mean > 0.56 ? 'var(--clock-ink)' : 'var(--clock-ivory)');
  $('clock-note').hidden = !(overlay === 'lock' && spread > 0.06 && recipe.global.calm < 0.9);
}

function renderThumbnails() {
  const w = 192, h = Math.round((192 * 2556) / 1179);
  for (const p of PRESETS) {
    util.render(p, w, h);
    const img = document.querySelector<HTMLImageElement>(`.preset[data-id="${p.origin.presetId}"] img`);
    if (img) img.src = util.canvas.toDataURL('image/jpeg', 0.86);
  }
}

// The background linen, made by the same engine (Look Guide A6)
let groundUrl = '';
let groundKey = '';
function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return matchMedia('(prefers-color-scheme: dark)').matches;
}
function paintGround() {
  const dark = isDark();
  const cssW = window.innerWidth, cssH = window.innerHeight;
  const key = `${dark}-${Math.round(cssW / 120)}-${Math.round(cssH / 120)}`;
  if (key === groundKey) return;
  groundKey = key;
  let scale = Math.min(window.devicePixelRatio || 1, 2);
  if (cssW * cssH * scale * scale > 3_000_000) scale = Math.sqrt(3_000_000 / (cssW * cssH));
  const w = Math.round(cssW * scale), h = Math.round(cssH * scale);
  const bg: Recipe = {
    ...clone(PRESETS[0]),
    seed: 31,
    texture: { type: 'weave', params: { density: Math.min(cssW, cssH) / 3.4, slub: 0.5, variation: 0.6, relief: 0.6, mottle: 0.3, mottleScale: 0.5 } },
    global: { saturation: 1, warmth: 0, contrast: 1, brightness: 0, grain: 0.02, vignette: 0, rotation: 0, calm: 0 },
  };
  util.render(bg, w, h, backgroundPalette(dark ? '#1A1A19' : '#E8E4DA', dark ? 0.018 : 0.026));
  util.canvas.toBlob((blob) => {
    if (!blob) return;
    if (groundUrl) URL.revokeObjectURL(groundUrl);
    groundUrl = URL.createObjectURL(blob);
    document.documentElement.style.setProperty('--ground-img', `url("${groundUrl}")`);
  }, 'image/jpeg', 0.9);
}

// ---------- Export targets ----------
function setupTargets() {
  const dpr = window.devicePixelRatio || 1;
  let w = Math.round(screen.width * dpr), h = Math.round(screen.height * dpr);
  if (w > h) [w, h] = [h, w];
  const isPhone = w <= 1600 && h / w > 1.6 && 'ontouchstart' in window;
  if (isPhone) {
    const match = DEVICES.find((d) => d.w === w && d.h === h);
    targets.push({ id: 'this', label: match ? `This phone (${match.label})` : 'This phone', w, h });
  }
  targets.push(...DEVICES);
  target = targets[0];
  const sel = $<HTMLSelectElement>('device');
  sel.innerHTML = targets.map((t) => `<option value="${t.id}">${t.label} · ${t.w} × ${t.h}</option>`).join('');
  applyTarget();
}
function applyTarget() {
  document.documentElement.style.setProperty('--phone-ratio', `${target.w} / ${target.h}`);
  $('size-out').textContent = `${target.w} × ${target.h}`;
  requestRender();
}

// ---------- Controls ----------
function slider(prefix: string, p: ParamDef) {
  const id = `${prefix}-${p.key}`;
  return `<div class="control">
    <label for="${id}">${p.label}</label><output id="${id}-out" for="${id}"></output>
    <input type="range" id="${id}" data-scope="${prefix}" data-key="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}">
  </div>`;
}

function buildStaticControls() {
  for (const group of ['colour', 'finish', 'layout'] as const) {
    $(`${group}-controls`).innerHTML = GLOBAL_PARAMS.filter((p) => p.group === group).map((p) => slider('g', p)).join('');
  }
  $('texture-seg').innerHTML = (Object.keys(TEXTURES) as TextureType[])
    .map((t) => `<label class="seg-opt"><input type="radio" name="texture" id="tex-${t}" value="${t}"><span>${TEXTURES[t].label}</span></label>`)
    .join('');
  $('families').innerHTML = FAMILIES.map((f) => `<label class="family">
      <input type="radio" name="family" id="fam-${f.id}" value="${f.id}">
      <span class="strip" id="strip-${f.id}"></span>
      <span class="family-name">${f.name}</span>
    </label>`).join('');
  $('presets').innerHTML = PRESETS.map((p) => `<button type="button" class="preset" data-id="${p.origin.presetId}" aria-pressed="false">
      <img alt="" width="96" height="208">
      <span class="preset-name">${p.name}</span>
      <span class="preset-meta">${TEXTURES[p.texture.type].label} · ${familyById(p.palette.family).name}</span>
    </button>`).join('');
}

let builtTexture: TextureType | null = null;
function buildTextureControls() {
  const type = recipe.texture.type;
  if (builtTexture === type) return;
  builtTexture = type;
  $('texture-controls').innerHTML = TEXTURES[type].params.map((p) => slider('t', p)).join('');
}

function setRange(input: HTMLInputElement, p: ParamDef, v: number) {
  input.value = String(v);
  const pctFill = ((v - p.min) / (p.max - p.min)) * 100;
  input.style.setProperty('--fill', `${pctFill}%`);
  const out = document.getElementById(`${input.id}-out`);
  if (out) out.textContent = p.format ? p.format(v) : String(v);
}

function findParam(scope: string, key: string): ParamDef | undefined {
  return scope === 'g' ? GLOBAL_PARAMS.find((p) => p.key === key) : TEXTURES[recipe.texture.type].params.find((p) => p.key === key);
}

function syncUI() {
  buildTextureControls();
  for (const p of TEXTURES[recipe.texture.type].params) setRange($<HTMLInputElement>(`t-${p.key}`), p, recipe.texture.params[p.key]);
  for (const p of GLOBAL_PARAMS) setRange($<HTMLInputElement>(`g-${p.key}`), p, recipe.global[p.key]);
  $<HTMLInputElement>(`tex-${recipe.texture.type}`).checked = true;
  $<HTMLInputElement>(`fam-${recipe.palette.family}`).checked = true;
  $<HTMLInputElement>(`var-${recipe.palette.variant}`).checked = true;

  // Strips show the version currently selected
  for (const f of FAMILIES) {
    $(`strip-${f.id}`).innerHTML = f[recipe.palette.variant].map((c) => `<i style="background:${c}"></i>`).join('');
  }
  document.querySelectorAll<HTMLButtonElement>('.preset').forEach((b) => {
    b.setAttribute('aria-pressed', String(recipe.origin.presetId === b.dataset.id && !recipe.origin.modified));
  });

  $('seed-out').textContent = String(recipe.seed);
  const personal = recipe.origin.source === 'preset' && !recipe.origin.modified;
  $('licence-name').textContent = recipe.origin.modified ? `${recipe.name}, edited` : recipe.name;
  $('licence-terms').textContent = personal ? 'Signature preset · personal use' : 'Your design · you own the export';

  $<HTMLButtonElement>('undo').disabled = undoStack.length === 0;
  $<HTMLButtonElement>('redo').disabled = redoStack.length === 0;
}

/** Any change except a new seed counts as an edit (Requirements §3.5, FR-27). */
function markEdited() { recipe.origin.modified = true; }

function commit() {
  const now = JSON.stringify(recipe);
  if (now === committed) return;
  undoStack.push(committed);
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  committed = now;
  syncUI();
}
function restore(json: string) {
  recipe = JSON.parse(json);
  committed = json;
  syncUI();
  requestRender();
}

// ---------- Events ----------
function bindEvents() {
  const panel = $('panel');

  panel.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.type !== 'range') return;
    const scope = el.dataset.scope!, key = el.dataset.key!;
    const p = findParam(scope, key);
    if (!p) return;
    const v = parseFloat(el.value);
    if (scope === 'g') recipe.global[key] = v; else recipe.texture.params[key] = v;
    markEdited();
    setRange(el, p, v);
    requestRender();
  });

  panel.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el instanceof HTMLInputElement && el.type === 'range') { commit(); return; }
    if (el.name === 'texture') {
      const type = el.value as TextureType;
      recipe.texture = { type, params: { ...TEXTURE_DEFAULTS[type] } };
      markEdited();
    } else if (el.name === 'family') {
      recipe.palette.family = el.value; markEdited();
    } else if (el.name === 'variant') {
      recipe.palette.variant = el.value as Variant; markEdited();
    } else if (el.name === 'format') {
      format = el.value as 'png' | 'jpeg'; return;
    } else if (el.id === 'device') {
      target = targets.find((t) => t.id === el.value) ?? targets[0];
      applyTarget(); return;
    } else return;
    commit();
    requestRender();
  });

  $('presets').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.preset');
    if (!btn) return;
    const p = PRESETS.find((x) => x.origin.presetId === btn.dataset.id);
    if (!p) return;
    recipe = clone(p);
    commit();
    syncUI();
    requestRender();
  });

  document.querySelectorAll<HTMLInputElement>('input[name="overlay"]').forEach((r) =>
    r.addEventListener('change', () => {
      overlay = r.value as typeof overlay;
      $('ui-lock').hidden = overlay !== 'lock';
      $('ui-home').hidden = overlay !== 'home';
      requestRender();
    }));

  $('undo').addEventListener('click', () => {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(committed);
    restore(prev);
  });
  $('redo').addEventListener('click', () => {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(committed);
    restore(next);
  });
  document.addEventListener('keydown', (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
    e.preventDefault();
    $(e.shiftKey ? 'redo' : 'undo').click();
  });

  $('randomize').addEventListener('click', () => {
    recipe.seed = randomSeed(); // a new seed alone is not an edit
    commit();
    requestRender();
  });
  $('calm-fix').addEventListener('click', () => {
    recipe.global.calm = 0.95;
    markEdited();
    commit();
    requestRender();
  });
  $('save').addEventListener('click', save);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(paintGround, 300);
  });
}

// ---------- Theme (Look Guide A1: each mode designed on its own) ----------
function setupTheme() {
  const btn = $('theme');
  const modes = ['auto', 'light', 'dark'] as const;
  type Mode = (typeof modes)[number];
  let mode: Mode = (store.get('wg-theme') as Mode) || 'auto';
  if (!modes.includes(mode)) mode = 'auto';
  const apply = (persist: boolean) => {
    if (persist) {
      if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', mode);
      store.set('wg-theme', mode);
    }
    btn.innerHTML = ICONS[mode];
    btn.setAttribute('aria-label', `Appearance: ${mode === 'auto' ? 'automatic' : mode}. Change appearance`);
  };
  apply(mode !== 'auto');
  btn.addEventListener('click', () => {
    mode = modes[(modes.indexOf(mode) + 1) % modes.length];
    apply(true);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintGround);
  new MutationObserver(paintGround).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// ---------- Lock-screen clock ----------
function tickClock() {
  const now = new Date();
  $('lock-time').textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: false }).format(now);
  $('lock-date').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  setTimeout(tickClock, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
}

// ---------- Save (Requirements FR-16 to FR-19) ----------
let toastTimer = 0;
function toast(msg: string) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 3200);
}

function exportRecipe() {
  const fam = familyById(recipe.palette.family);
  return { ...recipe, palette: { ...recipe.palette, colors: fam[recipe.palette.variant] } };
}

async function renderExport(): Promise<{ blob: Blob; filename: string }> {
  util.render(recipe, target.w, target.h);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  let blob = await new Promise<Blob | null>((r) => util.canvas.toBlob(r, mime, 0.92));
  if (!blob) throw new Error('encode-failed');
  if (format === 'png') blob = await withTextChunk(blob, 'wallpaper-recipe', JSON.stringify(exportRecipe()));
  const filename = `wallpaper_${recipe.texture.type}_${recipe.seed}_${target.w}x${target.h}.${format === 'png' ? 'png' : 'jpg'}`;
  return { blob, filename };
}

async function save() {
  const btn = $<HTMLButtonElement>('save');
  btn.disabled = true;
  $('save-label').textContent = 'Preparing…';
  await nextFrame();
  try {
    const { blob, filename } = await renderExport();
    const downloads = await Promise.race([downloadsReady, new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
    if (downloads) {
      try {
        await downloads.save({ filename, data: blob });
        afterSaved();
        return;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === 'declined') { toast('Save cancelled.'); return; }
        if (code === 'rate_limited') { toast('Another save is still open. Finish that one first.'); return; }
        // Any other code: fall through to the browser's own options
      }
    }
    showFileSheet(blob, filename);
  } catch (err) {
    console.error(err);
    toast('The image couldn’t be created. Try a smaller size.');
  } finally {
    btn.disabled = false;
    $('save-label').textContent = 'Save wallpaper';
  }
}

function licenceLine() {
  return recipe.origin.source === 'preset' && !recipe.origin.modified
    ? 'Made from an unedited signature preset, so it’s for personal use only.'
    : 'You made this design. You own the image you saved.';
}

const SET_STEPS = `<ol class="steps">
  <li><strong>iPhone</strong><span>Open Photos, choose the image, tap Share, then Use as Wallpaper.</span></li>
  <li><strong>Android</strong><span>Open Photos or Gallery, choose the image, tap More (⋮), then Set as wallpaper.</span></li>
</ol>`;

function afterSaved() {
  if (store.get('wg-howto-seen')) { toast('Saved. ' + (recipe.origin.modified ? 'You own this image.' : 'Personal use only.')); return; }
  store.set('wg-howto-seen', '1');
  openSheet('Saved. Now set it as your wallpaper.', `${SET_STEPS}<p>${licenceLine()}</p>`, [
    { label: 'Done', primary: true, onClick: closeSheet },
  ]);
}

/** Fallback when the viewer can't save for us: share sheet, long-press, or a download link. */
function showFileSheet(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const file = new File([blob], filename, { type: blob.type });
  const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const body = `<img src="${url}" alt="Your wallpaper, ready to save">
    <p>${canShare ? 'Tap Save to Photos, or press and hold the image.' : 'Press and hold the image to save it, or download the file.'}</p>
    ${SET_STEPS}<p>${licenceLine()}</p>`;
  const actions: SheetAction[] = [{ label: 'Close', onClick: () => { closeSheet(); URL.revokeObjectURL(url); } }];
  if (canShare) {
    actions.push({
      label: 'Save to Photos', primary: true,
      onClick: () => { navigator.share({ files: [file] }).then(closeSheet).catch(() => { /* viewer cancelled */ }); },
    });
  } else {
    actions.push({ label: 'Download', primary: true, href: url, download: filename });
  }
  openSheet('Your wallpaper is ready', body, actions);
}

interface SheetAction { label: string; primary?: boolean; onClick?: () => void; href?: string; download?: string }
let lastFocus: HTMLElement | null = null;
function openSheet(title: string, bodyHtml: string, actions: SheetAction[]) {
  lastFocus = document.activeElement as HTMLElement | null;
  $('sheet-title').textContent = title;
  $('sheet-body').innerHTML = bodyHtml;
  const wrap = $('sheet-actions');
  wrap.innerHTML = '';
  for (const a of actions) {
    const el = a.href ? document.createElement('a') : document.createElement('button');
    el.className = `btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`;
    el.textContent = a.label;
    if (el instanceof HTMLAnchorElement) { el.href = a.href!; if (a.download) el.download = a.download; }
    else el.type = 'button';
    if (a.onClick) el.addEventListener('click', a.onClick);
    wrap.appendChild(el);
  }
  $('sheet').hidden = false;
  (wrap.lastElementChild as HTMLElement | null)?.focus();
}
function closeSheet() {
  if ($('sheet').hidden) return;
  $('sheet').hidden = true;
  lastFocus?.focus();
}

boot();

// Development hook for visual checks: ?debug exposes a full-size render.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as Record<string, unknown>).__wgRender = (id: string, w: number, h: number, patch?: Partial<Recipe>) => {
    const r = { ...clone(PRESETS.find((p) => p.origin.presetId === id) ?? PRESETS[0]), ...(patch ?? {}) };
    util.render(r as Recipe, w, h);
    return util.canvas.toDataURL('image/png');
  };
}
