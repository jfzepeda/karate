// Admin panel served at /admin-panel.
// Single-file HTML+JS app that talks to the same /api/* endpoints as the desktop app,
// authenticating with a superadmin JWT stored in sessionStorage.
//
// Inlined here so the server stays a single deployable unit.

const STYLE = `
  :root {
    color-scheme: dark;
    --bg: #0f1117;
    --panel: #161a23;
    --panel-2: #1d2230;
    --border: #2a3142;
    --text: #e6ebf2;
    --muted: #8a93a6;
    --accent: #4f8cff;
    --danger: #e25c5c;
    --good: #4caf78;
    --warn: #d8a84b;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text);
    font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  header { display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px; border-bottom: 1px solid var(--border); background: var(--panel); }
  header h1 { margin: 0; font-size: 16px; letter-spacing: 0.02em; }
  header .who { color: var(--muted); font-size: 13px; }
  nav { display: flex; gap: 4px; padding: 0 24px; background: var(--panel-2);
    border-bottom: 1px solid var(--border); }
  nav button { background: transparent; color: var(--muted); border: 0; padding: 12px 18px;
    border-bottom: 2px solid transparent; cursor: pointer; font-size: 13px; }
  nav button.active { color: var(--text); border-bottom-color: var(--accent); }
  main { padding: 24px; max-width: 1200px; margin: 0 auto; }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: 18px; margin-bottom: 16px; }
  .card h2 { margin: 0 0 12px; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  th { color: var(--muted); font-weight: 500; }
  input, select, textarea, button {
    font: inherit; color: inherit; background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 10px;
  }
  input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  button { cursor: pointer; }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.danger  { background: var(--danger); border-color: var(--danger); color: #fff; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; }
  .pill.good { background: rgba(76,175,120,.15); color: var(--good); }
  .pill.bad  { background: rgba(226,92,92,.15);  color: var(--danger); }
  .pill.warn { background: rgba(216,168,75,.15); color: var(--warn); }
  textarea { width: 100%; min-height: 280px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
  .muted { color: var(--muted); }
  .right { margin-left: auto; }
  .login { max-width: 360px; margin: 80px auto; background: var(--panel);
    border: 1px solid var(--border); padding: 32px; border-radius: 12px; }
  .login h1 { margin: 0 0 16px; font-size: 18px; }
  .login label { display: block; font-size: 12px; color: var(--muted); margin: 12px 0 4px; }
  .login input { width: 100%; }
  .login button { width: 100%; margin-top: 20px; padding: 10px; }
  .err { color: var(--danger); margin-top: 12px; font-size: 13px; }
`;

const APP_JS = `
const API = location.origin;
let token = sessionStorage.getItem('karate.adminToken') || null;
let me = null;

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  if (!res.ok) {
    let body; try { body = await res.json(); } catch { body = { error: res.statusText }; }
    throw new Error(body.error || 'request_failed');
  }
  return res.json();
}

function logout() {
  sessionStorage.removeItem('karate.adminToken');
  token = null; me = null;
  render();
}

async function login(username, password) {
  const r = await fetch(API + '/api/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username, password })
  });
  if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || 'login_failed');
  const j = await r.json();
  if (j.user.role !== 'superadmin') throw new Error('not_superadmin');
  token = j.token;
  me = j.user;
  sessionStorage.setItem('karate.adminToken', token);
  sessionStorage.setItem('karate.adminUser', JSON.stringify(me));
  render();
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'on') for (const [evt,fn] of Object.entries(v)) e.addEventListener(evt, fn);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

let activeTab = 'users';

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  if (!token) { root.appendChild(loginView()); return; }
  if (!me) {
    me = JSON.parse(sessionStorage.getItem('karate.adminUser') || 'null');
    if (!me) { logout(); return; }
  }
  root.appendChild(headerView());
  root.appendChild(navView());
  const main = el('main');
  root.appendChild(main);
  if (activeTab === 'users')    renderUsers(main);
  if (activeTab === 'content')  renderContent(main);
  if (activeTab === 'files')    renderFiles(main);
  if (activeTab === 'activity') renderActivity(main);
}

function loginView() {
  const wrap = el('div', { class: 'login' });
  wrap.appendChild(el('h1', {}, 'Karate Admin Panel'));
  const u = el('input', { type: 'text', placeholder: 'superadmin' });
  const p = el('input', { type: 'password' });
  const err = el('div', { class: 'err' });
  const btn = el('button', { class: 'primary', on: { click: async () => {
    err.textContent = '';
    try { await login(u.value.trim(), p.value); }
    catch (e) { err.textContent = e.message; }
  }}}, 'Sign in');
  u.addEventListener('keydown', e => e.key === 'Enter' && p.focus());
  p.addEventListener('keydown', e => e.key === 'Enter' && btn.click());
  wrap.append(
    el('label', {}, 'Username'), u,
    el('label', {}, 'Password'), p,
    btn, err
  );
  setTimeout(() => u.focus(), 0);
  return wrap;
}

function headerView() {
  return el('header', {},
    el('h1', {}, 'Karate Tournament — Admin Panel'),
    el('div', { class: 'row' },
      el('span', { class: 'who' }, me ? me.username + ' (' + me.role + ')' : ''),
      el('button', { on: { click: logout } }, 'Sign out')
    )
  );
}

function navView() {
  const tabs = [
    ['users', 'Licenses / Users'],
    ['content', 'Content'],
    ['files', 'Files'],
    ['activity', 'Activity Log'],
  ];
  const nav = el('nav');
  for (const [id, label] of tabs) {
    const b = el('button', {
      class: activeTab === id ? 'active' : '',
      on: { click: () => { activeTab = id; render(); }}
    }, label);
    nav.appendChild(b);
  }
  return nav;
}

// ---------------- Users tab ----------------
async function renderUsers(main) {
  const card = el('div', { class: 'card' });
  card.appendChild(el('h2', {}, 'Create user'));
  const u = el('input', { type:'text', placeholder:'username' });
  const p = el('input', { type:'text', placeholder:'password (plaintext)' });
  const r = el('select');
  for (const [v, l] of [['referee','Referee'],['superadmin','Superadmin']]) {
    r.appendChild(el('option', { value: v }, l));
  }
  const e = el('input', { type:'date' });
  const err = el('div', { class: 'err' });
  const submit = el('button', { class:'primary', on:{ click: async () => {
    err.textContent = '';
    try {
      const expiresAt = e.value ? new Date(e.value).getTime() : null;
      await api('/api/users', { method: 'POST', body: JSON.stringify({
        username: u.value.trim(), password: p.value, role: r.value, expiresAt
      })});
      u.value = ''; p.value = ''; e.value = '';
      renderUsers(main.replaceChildren() || main);
    } catch (ex) { err.textContent = ex.message; }
  }}}, 'Create');
  card.append(el('div',{class:'row'}, u, p, r, e, submit), err);
  main.appendChild(card);

  const list = el('div', { class:'card' });
  list.appendChild(el('h2', {}, 'Users'));
  const tbl = el('table');
  tbl.appendChild(el('thead', {}, el('tr', {},
    el('th',{},'Username'), el('th',{},'Role'), el('th',{},'Status'),
    el('th',{},'Expires'), el('th',{},'Last login'), el('th',{},'')
  )));
  const tb = el('tbody');
  tbl.appendChild(tb);
  list.appendChild(tbl);
  main.appendChild(list);

  try {
    const { users } = await api('/api/users');
    for (const user of users) {
      const tr = el('tr', {},
        el('td', {}, user.username),
        el('td', {}, user.role),
        el('td', {}, el('span', { class: 'pill ' + (user.active ? 'good' : 'bad') },
                       user.active ? 'active' : 'inactive')),
        el('td', {}, user.expiresAt ? new Date(user.expiresAt).toISOString().slice(0,10) : '—'),
        el('td', {}, user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'),
        el('td', {},
          el('div', { class:'row' },
            el('button', { on:{ click: async () => {
              await api('/api/users/' + user.id, { method:'PATCH',
                body: JSON.stringify({ active: !user.active })});
              renderUsersTab(main);
            }}}, user.active ? 'Deactivate' : 'Activate'),
            el('button', { on:{ click: async () => {
              const np = prompt('New password for ' + user.username + ':');
              if (!np) return;
              await api('/api/users/' + user.id, { method:'PATCH',
                body: JSON.stringify({ password: np })});
              alert('Password updated.');
            }}}, 'Reset PW'),
            el('button', { class:'danger', on:{ click: async () => {
              if (!confirm('Delete user ' + user.username + '?')) return;
              try {
                await api('/api/users/' + user.id, { method:'DELETE' });
                renderUsersTab(main);
              } catch (e) { alert(e.message); }
            }}}, 'Delete'),
          )
        )
      );
      tb.appendChild(tr);
    }
  } catch (e) { list.appendChild(el('div', { class:'err' }, e.message)); }
}

function renderUsersTab(main) {
  main.innerHTML = '';
  renderUsers(main);
}

// ---------------- Content tab ----------------
async function renderContent(main) {
  const card = el('div', { class:'card' });
  card.appendChild(el('h2', {}, 'Tournament data (JSON)'));
  card.appendChild(el('p', { class:'muted' },
    'Edit the live tournament JSON. Saving overwrites the server copy and is fetched by clients on next launch.'));
  const ta = el('textarea');
  card.appendChild(ta);
  const err = el('div', { class:'err' });
  const meta = el('div', { class:'muted' });
  card.appendChild(el('div', { class:'row' },
    el('button', { class:'primary', on:{ click: async () => {
      err.textContent = '';
      let parsed;
      try { parsed = JSON.parse(ta.value); }
      catch (e) { err.textContent = 'Invalid JSON: ' + e.message; return; }
      try {
        const r = await api('/api/data', { method:'PUT', body: JSON.stringify(parsed.data ?? parsed) });
        meta.textContent = 'Saved. ETag ' + r.etag.slice(0,8) + ' at ' + new Date(r.updatedAt).toLocaleString();
      } catch (e) { err.textContent = e.message; }
    }}}, 'Save'),
    el('button', { on:{ click: async () => { await load(); }}}, 'Reload'),
    meta
  ));
  card.appendChild(err);
  main.appendChild(card);
  async function load() {
    try {
      const f = await api('/api/data');
      ta.value = JSON.stringify(f, null, 2);
      meta.textContent = 'ETag ' + (f.etag || '').slice(0,8) + ' updated ' + new Date(f.updatedAt).toLocaleString();
    } catch (e) { err.textContent = e.message; }
  }
  load();
}

// ---------------- Files tab ----------------
async function renderFiles(main) {
  const card = el('div', { class:'card' });
  card.appendChild(el('h2', {}, 'Logo'));
  const preview = el('div', {});
  const fileInput = el('input', { type:'file', accept:'image/png,image/jpeg,image/svg+xml' });
  const err = el('div', { class:'err' });
  card.append(
    preview,
    el('div', { class:'row' },
      fileInput,
      el('button', { class:'primary', on:{ click: async () => {
        err.textContent = '';
        const f = fileInput.files && fileInput.files[0];
        if (!f) { err.textContent = 'Choose a file first.'; return; }
        const fd = new FormData(); fd.append('logo', f);
        const r = await fetch(API + '/api/upload-logo', {
          method:'POST', headers: { Authorization: 'Bearer ' + token }, body: fd
        });
        if (!r.ok) { err.textContent = (await r.json().catch(()=>({}))).error || 'upload_failed'; return; }
        await refresh();
      }}}, 'Upload'),
      el('button', { class:'danger', on:{ click: async () => {
        if (!confirm('Remove the current logo?')) return;
        await api('/api/upload-logo', { method:'DELETE' });
        await refresh();
      }}}, 'Remove'),
    ),
    err
  );
  main.appendChild(card);
  async function refresh() {
    preview.innerHTML = '';
    const { logo } = await api('/api/logo-info');
    if (logo) {
      preview.appendChild(el('img', { src: '/api/logo?ts=' + Date.now(),
        style: 'max-width:200px; max-height:200px; background:#fff; padding:8px; border-radius:6px;' }));
      preview.appendChild(el('div', { class:'muted' }, logo.filename + ' · ' + logo.size + ' bytes'));
    } else {
      preview.appendChild(el('div', { class:'muted' }, 'No logo uploaded.'));
    }
  }
  refresh();
}

// ---------------- Activity tab ----------------
async function renderActivity(main) {
  const card = el('div', { class:'card' });
  card.appendChild(el('h2', {}, 'Activity log (most recent first)'));
  const tbl = el('table');
  tbl.appendChild(el('thead', {}, el('tr', {},
    el('th',{},'Time'), el('th',{},'User'), el('th',{},'Action'),
    el('th',{},'Result'), el('th',{},'IP'), el('th',{},'Notes')
  )));
  const tb = el('tbody');
  tbl.appendChild(tb);
  card.appendChild(tbl);
  main.appendChild(card);
  const { entries } = await api('/api/activity?max=500');
  for (const e of entries) {
    tb.appendChild(el('tr', {},
      el('td', {}, new Date(e.ts).toLocaleString()),
      el('td', {}, e.username || '—'),
      el('td', {}, e.action),
      el('td', {}, el('span', { class: 'pill ' + (e.result === 'success' ? 'good' : 'bad') }, e.result)),
      el('td', {}, e.ip || '—'),
      el('td', { class:'muted' }, e.message || '')
    ));
  }
}

document.addEventListener('DOMContentLoaded', render);
`;

export function renderAdminPanelHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Karate Admin Panel</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>${STYLE}</style>
</head>
<body>
<div id="app"></div>
<script>${APP_JS}</script>
</body>
</html>`;
}

export function renderAdminLoginHtml(): string {
  // Simple redirect — login is handled inside the SPA itself.
  return `<!DOCTYPE html><meta http-equiv="refresh" content="0;url=/admin-panel" />`;
}
