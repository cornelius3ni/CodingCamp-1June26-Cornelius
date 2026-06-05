/* ============================================================
   Personal Dashboard — JavaScript
   Challenges: Light/Dark Mode | Custom Name | No Duplicates
   ============================================================ */

/* ── Helpers ────────────────────────────────────────────────── */
function pad(n) {
  return String(n).padStart(2, '0');
}

/* ============================================================
   CHALLENGE 1 — Light / Dark Mode
   ============================================================ */
(function initTheme() {
  const btn  = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Restore saved preference (default: light)
  const saved = localStorage.getItem('dashboard_theme') || 'light';
  html.setAttribute('data-theme', saved);
  btn.textContent = saved === 'dark' ? '☀️ Light' : '🌙 Dark';

  btn.addEventListener('click', function () {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('dashboard_theme', next);
    btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
  });
})();

/* ============================================================
   CHALLENGE 2 — Custom Name + Greeting Clock
   ============================================================ */
(function initGreeting() {
  const LS_NAME     = 'dashboard_name';
  const nameDisplay = document.getElementById('name-display');
  const nameRow     = document.getElementById('name-row');
  const nameEditRow = document.getElementById('name-edit-row');
  const nameInput   = document.getElementById('name-input');
  const btnSave     = document.getElementById('btn-save-name');
  const btnCancel   = document.getElementById('btn-cancel-name');
  const clockEl     = document.getElementById('clock');
  const dateEl      = document.getElementById('date-display');
  const greetingEl  = document.getElementById('greeting-text');

  function getName() {
    return localStorage.getItem(LS_NAME) || '';
  }

  function refreshNameDisplay() {
    const name = getName();
    nameDisplay.textContent = name ? '✏️ ' + name : '✏️ Set your name';
  }

  function openNameEdit() {
    nameRow.style.display = 'none';
    nameEditRow.classList.add('show');
    nameInput.value = getName();
    nameInput.focus();
  }

  function closeNameEdit() {
    nameEditRow.classList.remove('show');
    nameRow.style.display = '';
  }

  function saveName() {
    localStorage.setItem(LS_NAME, nameInput.value.trim());
    refreshNameDisplay();
    closeNameEdit();
  }

  // Clock & greeting (updates every second)
  function updateClock() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();

    clockEl.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
    dateEl.textContent  = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    let greeting;
    if      (h >= 5  && h < 12) greeting = 'Good Morning';
    else if (h >= 12 && h < 18) greeting = 'Good Afternoon';
    else if (h >= 18 && h < 22) greeting = 'Good Evening';
    else                         greeting = 'Good Night';

    const name = getName();
    greetingEl.textContent = name ? greeting + ', ' + name + '!' : greeting;
  }

  // Event listeners
  nameDisplay.addEventListener('click', openNameEdit);
  btnSave.addEventListener('click', saveName);
  btnCancel.addEventListener('click', closeNameEdit);
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  saveName();
    if (e.key === 'Escape') closeNameEdit();
  });

  refreshNameDisplay();
  updateClock();
  setInterval(updateClock, 1000);
})();

/* ============================================================
   Focus Timer
   ============================================================ */
(function initTimer() {
  const display  = document.getElementById('timer-display');
  const btnStart = document.getElementById('btn-start');
  const btnStop  = document.getElementById('btn-stop');
  const btnReset = document.getElementById('btn-reset');

  const DEFAULT_SECONDS = 25 * 60;
  let totalSeconds = DEFAULT_SECONDS;
  let intervalId   = null;

  function render() {
    display.textContent = pad(Math.floor(totalSeconds / 60)) + ':' + pad(totalSeconds % 60);
  }

  function setRunning(running) {
    btnStart.disabled = running;
    btnStop.disabled  = !running;
  }

  function beep() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      alert('Time is up!');
    }
  }

  function tick() {
    if (totalSeconds <= 0) {
      stopTimer();
      display.textContent = '00:00';
      beep();
      return;
    }
    totalSeconds--;
    render();
  }

  function startTimer() {
    if (intervalId || totalSeconds <= 0) return;
    intervalId = setInterval(tick, 1000);
    setRunning(true);
  }

  function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    setRunning(false);
  }

  function resetTimer() {
    stopTimer();
    totalSeconds = DEFAULT_SECONDS;
    render();
  }

  btnStart.addEventListener('click', startTimer);
  btnStop.addEventListener('click',  stopTimer);
  btnReset.addEventListener('click', resetTimer);

  render();
})();

/* ============================================================
   To-Do List  (CHALLENGE 3 — Prevent Duplicate Tasks)
   ============================================================ */
(function initTodo() {
  const LS_KEY = 'dashboard_tasks';
  const listEl = document.getElementById('todo-list');
  const inp    = document.getElementById('todo-input');
  const btnAdd = document.getElementById('btn-add-task');
  const errEl  = document.getElementById('todo-error');

  /* Storage helpers */
  function loadTasks() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveTasks(tasks) {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  }

  /* Error helpers */
  function showErr(msg) { errEl.textContent = msg; errEl.classList.add('show'); }
  function hideErr()    { errEl.classList.remove('show'); }

  /* Challenge 3 — duplicate check (case-insensitive, excludes self by id) */
  function isDuplicate(label, excludeId) {
    return loadTasks().some(function (t) {
      return t.label.toLowerCase() === label.toLowerCase() && t.id !== excludeId;
    });
  }

  /* Render all tasks */
  function render() {
    const tasks = loadTasks();
    listEl.innerHTML = '';

    tasks.forEach(function (t) {
      const li  = document.createElement('li');
      li.className  = 'todo-item' + (t.done ? ' done' : '');
      li.dataset.id = t.id;

      // Checkbox
      const cb = document.createElement('input');
      cb.type      = 'checkbox';
      cb.className = 'todo-checkbox';
      cb.checked   = t.done;
      cb.setAttribute('aria-label', 'Complete task');
      cb.addEventListener('change', function () { toggleTask(t.id); });

      // Label (double-click to edit)
      const lbl = document.createElement('span');
      lbl.className   = 'todo-label';
      lbl.textContent = t.label;
      lbl.addEventListener('dblclick', function () { startEdit(t.id); });

      // Delete button
      const del = document.createElement('button');
      del.className   = 'btn-danger';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete task');
      del.addEventListener('click', function () { removeTask(t.id); });

      li.append(cb, lbl, del);
      listEl.appendChild(li);
    });
  }

  /* Add task */
  function addTask(text) {
    const value = text.trim();
    if (!value) { showErr('Task cannot be empty.'); return; }
    if (isDuplicate(value, null)) { showErr('"' + value + '" is already in your list.'); return; }

    hideErr();
    const tasks = loadTasks();
    tasks.push({ id: crypto.randomUUID(), label: value, done: false });
    saveTasks(tasks);
    render();
    inp.value = '';
  }

  /* Remove task */
  function removeTask(id) {
    saveTasks(loadTasks().filter(function (t) { return t.id !== id; }));
    render();
  }

  /* Toggle completion */
  function toggleTask(id) {
    saveTasks(loadTasks().map(function (t) {
      return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
    }));
    render();
  }

  /* Inline edit */
  function startEdit(id) {
    const li   = listEl.querySelector('[data-id="' + id + '"]');
    const task = loadTasks().find(function (t) { return t.id === id; });
    if (!li || !task) return;

    li.innerHTML = '';

    const ei = document.createElement('input');
    ei.type      = 'text';
    ei.className = 'edit-input';
    ei.value     = task.label;

    const sv = document.createElement('button');
    sv.className   = 'btn-save';
    sv.textContent = 'Save';

    const errSpan = document.createElement('span');
    errSpan.style.cssText = 'color:#ef4444;font-size:0.78rem;margin-left:4px;';

    function confirmEdit() {
      const value = ei.value.trim();
      if (!value)              { errSpan.textContent = 'Cannot be empty.'; return; }
      if (isDuplicate(value, id)) { errSpan.textContent = 'Already exists.';  return; }

      saveTasks(loadTasks().map(function (t) {
        return t.id === id ? Object.assign({}, t, { label: value }) : t;
      }));
      render();
    }

    sv.addEventListener('click', confirmEdit);
    ei.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  confirmEdit();
      if (e.key === 'Escape') render();
    });

    li.append(ei, sv, errSpan);
    ei.focus();
  }

  /* Event listeners */
  btnAdd.addEventListener('click', function () { addTask(inp.value); });
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') addTask(inp.value); });
  inp.addEventListener('input', hideErr);

  render();
})();

/* ============================================================
   Quick Links
   ============================================================ */
(function initQuickLinks() {
  const LS_KEY  = 'dashboard_links';
  const listEl  = document.getElementById('links-list');
  const lblInp  = document.getElementById('link-label-input');
  const urlInp  = document.getElementById('link-url-input');
  const btnAdd  = document.getElementById('btn-add-link');
  const errEl   = document.getElementById('links-error');

  /* Storage helpers */
  function loadLinks() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveLinks(links) {
    localStorage.setItem(LS_KEY, JSON.stringify(links));
  }

  /* Error helpers */
  function showErr(msg) { errEl.textContent = msg; errEl.classList.add('show'); }
  function hideErr()    { errEl.classList.remove('show'); }

  function isValidUrl(str) {
    try { new URL(str); return true; }
    catch (_) { return false; }
  }

  /* Render all links */
  function render() {
    const links = loadLinks();
    listEl.innerHTML = '';

    links.forEach(function (l) {
      const li = document.createElement('li');

      const a = document.createElement('a');
      a.href        = l.url;
      a.target      = '_blank';
      a.rel         = 'noopener noreferrer';
      a.className   = 'link-chip';
      a.textContent = l.label;

      const del = document.createElement('button');
      del.className   = 'link-chip-delete';
      del.textContent = '×';
      del.setAttribute('aria-label', 'Delete link');
      del.addEventListener('click', function (e) {
        e.preventDefault();
        removeLink(l.id);
      });

      a.appendChild(del);
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  /* Add link */
  function addLink(label, url) {
    const l = label.trim();
    const u = url.trim();

    if (!l)           { showErr('Label cannot be empty.'); return; }
    if (!u)           { showErr('URL cannot be empty.'); return; }
    if (!isValidUrl(u)) { showErr('Enter a valid URL (e.g. https://google.com).'); return; }

    hideErr();
    const links = loadLinks();
    links.push({ id: crypto.randomUUID(), label: l, url: u });
    saveLinks(links);
    render();
    lblInp.value = '';
    urlInp.value = '';
  }

  /* Remove link */
  function removeLink(id) {
    saveLinks(loadLinks().filter(function (l) { return l.id !== id; }));
    render();
  }

  /* Event listeners */
  btnAdd.addEventListener('click', function () { addLink(lblInp.value, urlInp.value); });
  [lblInp, urlInp].forEach(function (input) {
    input.addEventListener('input', hideErr);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addLink(lblInp.value, urlInp.value);
    });
  });

  render();
})();
