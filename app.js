/**
 * App.js — Student Manager · B-Tree Order 3
 * Event-driven step animation: split / merge / rotate đều hiển thị từng frame
 */

// ─── STATE ────────────────────────────────────────────────────────────────────
const students   = new Map();
const idTree     = new BTree(3);
const nameTree   = new BTree(3);

let searchMode    = 'id';
let isDark        = true;
let currentTreeTab = 'id';

// Animation state
let animFrames   = [];   // [{snapshot, label, type, highlightIds, hlKey, hlType}]
let animIdx      = -1;
let animTimer    = null;
let animSpeed    = 700;  // ms per frame
let isPlaying    = false;

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const SAMPLE = [
  { id:'24521123', name:'Nguyễn Văn An',   gender:'Nam', dob:'2006-05-12', dept:'Khoa Học Máy Tính',         email:'24521123@gm.uit.edu.vn' },
  { id:'24521124', name:'Trần Thị Bích',   gender:'Nữ',  dob:'2006-11-20', dept:'Kỹ Thuật Phần Mềm',        email:'24521124@gm.uit.edu.vn' },
  { id:'24521125', name:'Lê Hoàng Cường',  gender:'Nam', dob:'2006-01-08', dept:'Công Nghệ Thông Tin',       email:'24521125@gm.uit.edu.vn' },
  { id:'23521126', name:'Phạm Thị Dung',   gender:'Nữ',  dob:'2005-07-25', dept:'Mạng Máy Tính & TT',       email:'23521126@gm.uit.edu.vn' },
  { id:'24521127', name:'Hoàng Minh Đức',  gender:'Nam', dob:'2004-03-14', dept:'Khoa Học & KT Thông Tin',   email:'24521127@gm.uit.edu.vn' },
  { id:'24521128', name:'Đặng Thị Hà',     gender:'Nữ',  dob:'2003-09-30', dept:'Khoa Học & KT Thông Tin',   email:'24521128@gm.uit.edu.vn' },
  { id:'24521129', name:'Phan Văn Hải',    gender:'Nam', dob:'2004-06-18', dept:'Công Nghệ Thông Tin',       email:'24521129@gm.uit.edu.vn' },
  { id:'24521130', name:'Vũ Thị Hương',    gender:'Nữ',  dob:'2003-12-05', dept:'Kỹ Thuật Phần Mềm',        email:'24521130@gm.uit.edu.vn' },
  { id:'24521131', name:'Trương Văn Khoa', gender:'Nam', dob:'2004-02-28', dept:'Công Nghệ Thông Tin',       email:'24521131@gm.uit.edu.vn' },
  { id:'24521132', name:'Lý Thị Lan',      gender:'Nữ',  dob:'2003-08-15', dept:'Khoa Học & KT Thông Tin',   email:'24521132@gm.uit.edu.vn' },
  { id:'24521133', name:'Đỗ Văn Long',     gender:'Nam', dob:'2004-04-22', dept:'Công Nghệ Thông Tin',       email:'24521133@gm.uit.edu.vn' },
  { id:'24521134', name:'Ngô Thị Mai',     gender:'Nữ',  dob:'2003-10-10', dept:'Khoa Học & KT Thông Tin',   email:'24521134@gm.uit.edu.vn' },
  { id:'24521135', name:'Bùi Văn Nam',     gender:'Nam', dob:'2004-05-30', dept:'Kỹ Thuật Phần Mềm',        email:'24521135@gm.uit.edu.vn' },
  { id:'24521136', name:'Phạm Thị Oanh',   gender:'Nữ',  dob:'2003-06-15', dept:'Khoa Học & KT Thông Tin',   email:'24521136@gm.uit.edu.vn' },
  { id:'24521137', name:'Trần Văn Phúc',   gender:'Nam', dob:'2004-08-12', dept:'Khoa Học & KT Thông Tin',   email:'24521137@gm.uit.edu.vn' },
  { id:'24521138', name:'Lê Thị Quỳnh',    gender:'Nữ',  dob:'2003-04-20', dept:'Khoa Học & KT Thông Tin',   email:'24521138@gm.uit.edu.vn' },
  { id:'24521139', name:'Võ Văn Sơn',      gender:'Nam', dob:'2004-07-05', dept:'Công Nghệ Thông Tin',       email:'24521139@gm.uit.edu.vn' },
];

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  SAMPLE.forEach(sv => insertRaw(sv));
  renderCurrentTree(null);
  updateStats();
  bindEvents();
});

function bindEvents() {
  document.getElementById('btn-add').addEventListener('click', handleAdd);
  document.getElementById('btn-clear-form').addEventListener('click', clearForm);
  document.getElementById('btn-search').addEventListener('click', handleSearch);
  document.getElementById('btn-delete').addEventListener('click', handleDelete);
  document.getElementById('btn-theme').addEventListener('click', () => { isDark = !isDark; applyTheme(); });
  document.getElementById('op-close').addEventListener('click', () => document.getElementById('op-log').classList.add('hidden'));

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); searchMode = t.dataset.tab;
    document.getElementById('inp-search').placeholder =
      searchMode === 'id' ? 'Nhập Mã SV (VD: 24521123)...' : 'Nhập họ tên hoặc một phần...';
    document.getElementById('search-result').classList.add('hidden');
  }));

  document.querySelectorAll('.tree-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tree-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    currentTreeTab = t.dataset.treeTab;
    stopAnim();
    renderCurrentTree(null);
    clearAnimPanel();
  }));

  document.getElementById('inp-search').addEventListener('keydown', e => e.key==='Enter' && handleSearch());
  document.getElementById('inp-delete').addEventListener('keydown', e => e.key==='Enter' && handleDelete());

  document.getElementById('anim-speed').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    animSpeed = Math.round(1400 / v);
    document.getElementById('speed-val').textContent = v.toFixed(1) + 'x';
    if (isPlaying) { stopAnim(); togglePlay(); } // restart with new speed
  });

  document.getElementById('btn-prev').addEventListener('click', stepPrev);
  document.getElementById('btn-next').addEventListener('click', stepNext);
  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document.getElementById('btn-reset').addEventListener('click', () => {
    stopAnim(); clearAnimPanel();
    const tree = currentTreeTab === 'id' ? idTree : nameTree;
    renderCurrentTree(null);
  });
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('btn-theme').textContent = isDark ? '☀ Sáng' : '🌙 Tối';
}

// ─── OPERATIONS ───────────────────────────────────────────────────────────────

function handleAdd() {
  if (isPlaying) { showOp('error','⚠ Animation đang chạy — nhấn Dừng trước'); return; }
  const id     = document.getElementById('inp-id').value.trim().toUpperCase();
  const name   = document.getElementById('inp-name').value.trim();
  const gender = document.getElementById('inp-gender').value;
  const dob    = document.getElementById('inp-dob').value;
  const dept   = document.getElementById('inp-dept').value.trim();
  const email  = document.getElementById('inp-email').value.trim();

  if (!id || !name) { showOp('error','⚠ Vui lòng nhập Mã SV và Họ tên!'); return; }
  if (students.has(id)) { showOp('error',`⚠ Mã SV "${id}" đã tồn tại!`); return; }

  const sv = { id, name, gender, dob, dept, email };

  // 1. Lấy insert path TRƯỚC khi chèn (để có frame duyệt cây)
  const tree     = currentTreeTab === 'id' ? idTree : nameTree;
  const insertKey = currentTreeTab === 'id' ? id : name;
  const pathFrames = buildPathFrames(tree, insertKey, 'traverse', 'add');

  // 2. Thực sự chèn vào CẢ HAI cây, lấy events từ cây đang hiển thị
  students.set(id, sv);
  addTableRow(sv, true);
  updateStats();

  let structEvents;
  if (currentTreeTab === 'id') {
    structEvents = idTree.insertWithEvents(id, id);
    nameTree.insert(name, id);
  } else {
    idTree.insert(id, id);
    structEvents = nameTree.insertWithEvents(name, id);
  }

  // 3. Chuyển events thành frames có snapshot
  const structFrames = eventsToFrames(structEvents, insertKey, 'add');

  // 4. Frame cuối: kết quả hoàn chỉnh không highlight
  const doneFrame = {
    snapshot: cloneTree(tree.root),
    label: `✓ Chèn "${insertKey}" hoàn tất`,
    type: 'done', highlightIds: [], hlKey: insertKey, hlType: 'add',
  };

  const frames = [...pathFrames, ...structFrames, doneFrame];
  clearForm();
  showOp('success', `✓ Đã thêm ${id} — ${name}`);
  startAnim(frames);
}

function handleDelete() {
  if (isPlaying) { showOp('error','⚠ Animation đang chạy — nhấn Dừng trước'); return; }
  const id = document.getElementById('inp-delete').value.trim().toUpperCase();
  if (!id) { showOp('error','⚠ Nhập Mã SV cần xóa'); return; }
  const sv = students.get(id);
  if (!sv) { showOp('error',`⚠ Không tìm thấy "${id}"`); return; }

  const tree      = currentTreeTab === 'id' ? idTree : nameTree;
  const deleteKey = currentTreeTab === 'id' ? id : sv.name;

  // Search frames TRƯỚC khi xóa
  const searchFrames = buildSearchFrames(tree, deleteKey, 'delete');

  // Thực sự xóa
  students.delete(id);
  removeTableRow(id);
  updateStats();

  let structEvents;
  if (currentTreeTab === 'id') {
    structEvents = idTree.deleteWithEvents(id);
    nameTree.delete(sv.name);
  } else {
    idTree.delete(id);
    structEvents = nameTree.deleteWithEvents(sv.name);
  }

  const structFrames = eventsToFrames(structEvents, deleteKey, 'delete');
  const doneFrame = {
    snapshot: cloneTree(tree.root),
    label: `✓ Xóa "${deleteKey}" hoàn tất — cây đã tái cân bằng`,
    type: 'done', highlightIds: [], hlKey: null, hlType: null,
  };

  document.getElementById('inp-delete').value = '';
  showOp('success', `✓ Đã xóa ${id} — ${sv.name}`);
  startAnim([...searchFrames, ...structFrames, doneFrame]);
}

function handleSearch() {
  if (isPlaying) { showOp('error','⚠ Animation đang chạy — nhấn Dừng trước'); return; }
  const query = document.getElementById('inp-search').value.trim();
  if (!query) { showOp('error','⚠ Nhập từ khóa tìm kiếm'); return; }

  const resultEl = document.getElementById('search-result');
  let tree, searchKey, found, results;

  if (searchMode === 'id') {
    searchKey = query.toUpperCase(); tree = idTree;
    const r = idTree.search(searchKey);
    found = !!r;
    results = found && students.has(searchKey) ? [students.get(searchKey)] : [];
    currentTreeTab = 'id';
    document.querySelectorAll('.tree-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tree-tab="id"]').classList.add('active');
  } else {
    tree = nameTree;
    const matches = nameTree.searchByPrefix(query);
    found = matches.length > 0;
    results = matches.map(m => students.get(m.value)).filter(Boolean);
    searchKey = found ? matches[0].key : query;
    currentTreeTab = 'name';
    document.querySelectorAll('.tree-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tree-tab="name"]').classList.add('active');
  }

  if (found && results.length > 0) {
    resultEl.className = 'search-result found';
    resultEl.innerHTML = results.map(buildCard).join('');
    results.forEach(sv => highlightRow(sv.id));
  } else {
    resultEl.className = 'search-result notfound';
    resultEl.innerHTML = `<p>❌ Không tìm thấy "<strong>${query}</strong>"</p>`;
  }
  resultEl.classList.remove('hidden');

  const frames = buildSearchFrames(tree, searchKey, found ? 'search-found' : 'search-fail');
  if (!found) frames.push({
    snapshot: cloneTree(tree.root),
    label: `❌ Không tìm thấy "${searchKey}" trong cây`,
    type: 'not-found', highlightIds: [], hlKey: null, hlType: null,
  });

  showOp(found ? 'success' : 'error',
    found ? `✓ Tìm thấy ${results.length} kết quả` : `❌ Không tìm thấy "${query}"`);
  startAnim(frames);
}

window.quickDelete = id => {
  document.getElementById('inp-delete').value = id;
  handleDelete();
};

// ─── FRAME BUILDERS ───────────────────────────────────────────────────────────

/** Tạo frames duyệt cây đến lá (insert) */
function buildPathFrames(tree, key, stepType, hlType) {
  const path = tree.getInsertPath(key);
  return path.map((step, i) => ({
    snapshot: cloneTree(tree.root),
    label: i < path.length - 1
      ? `🔍 Duyệt node [${step.keys.join(', ')}] — "${key}" ${key > step.keys[step.keys.length-1] ? '>' : key < step.keys[0] ? '<' : 'trong khoảng'} keys → đi xuống nhánh ${step.childIdx}`
      : `🎯 Đến node lá [${step.keys.join(', ')}] — sẽ chèn "${key}" tại đây`,
    type: stepType,
    highlightIds: [step.nodeId],
    hlKey: key,
    hlType,
  }));
}

/** Tạo frames tìm kiếm (search/delete) */
function buildSearchFrames(tree, key, resultType) {
  const steps = tree.getSearchSteps(key);
  return steps.map(step => {
    const isFound = step.found;
    return {
      snapshot: cloneTree(tree.root),
      label: isFound
        ? `✅ Tìm thấy "${key}" tại node [${step.keys.join(', ')}]`
        : `🔍 Duyệt node [${step.keys.join(', ')}]${step.isLeaf ? ' (lá)' : ''} — "${key}" ${step.keyIndex < step.keys.length ? '< "'+step.keys[step.keyIndex]+'"' : '> tất cả keys'} → ${step.isLeaf ? 'không tìm thấy' : 'đi xuống nhánh '+step.keyIndex}`,
      type: isFound ? resultType : 'traverse',
      highlightIds: [step.nodeId],
      hlKey: isFound ? key : null,
      hlType: isFound ? resultType : 'traverse',
    };
  });
}

/** Chuyển mảng events (từ insertWithEvents/deleteWithEvents) thành frames */
function eventsToFrames(events, key, opType) {
  const typeMap = {
    'traverse':           { label: e => e.label, type: 'traverse', hlType: 'traverse' },
    'insert-leaf':        { label: e => e.label, type: 'insert',   hlType: 'add'      },
    'split':              { label: e => `✂ ${e.label}`, type: 'split', hlType: 'split' },
    'push-median':        { label: e => `⬆ ${e.label}`, type: 'push-median', hlType: 'split' },
    'new-root':           { label: e => `🌱 ${e.label}`, type: 'new-root', hlType: 'split' },
    'delete-leaf':        { label: e => e.label, type: 'delete',   hlType: 'delete'   },
    'replace-predecessor':{ label: e => `↩ ${e.label}`, type: 'replace', hlType: 'delete' },
    'replace-successor':  { label: e => `↪ ${e.label}`, type: 'replace', hlType: 'delete' },
    'rotate-right':       { label: e => `↻ ${e.label}`, type: 'rotate',  hlType: 'rotate' },
    'rotate-left':        { label: e => `↺ ${e.label}`, type: 'rotate',  hlType: 'rotate' },
    'merge':              { label: e => `⊕ ${e.label}`, type: 'merge',   hlType: 'merge'  },
    'merge-before':       { label: e => `⊕ ${e.label}`, type: 'merge',   hlType: 'merge'  },
    'shrink-root':        { label: e => `🔼 ${e.label}`, type: 'shrink', hlType: 'delete' },
  };

  // Filter ra chỉ những events "thú vị" cho animation (bỏ traverse đơn giản)
  const interesting = events.filter(e => e.type !== 'traverse');

  return interesting.map(event => {
    const meta = typeMap[event.type] || { label: e => e.label || e.type, type: event.type, hlType: opType };
    return {
      snapshot: event.snapshot,
      label: meta.label(event),
      type: meta.type,
      highlightIds: event.highlightIds || (event.nodeId ? [event.nodeId] : []),
      hlKey: opType === 'add' ? key : null,
      hlType: meta.hlType,
    };
  });
}

// ─── ANIMATION ENGINE ─────────────────────────────────────────────────────────

function startAnim(frames) {
  stopAnim();
  animFrames = frames;
  animIdx    = -1;
  document.getElementById('anim-panel').classList.remove('hidden');
  document.getElementById('step-log').classList.remove('hidden');
  clearStepLog();
  // Auto-play
  togglePlay();
  stepNext(); // show first frame immediately
}

function togglePlay() {
  if (animTimer) {
    clearInterval(animTimer); animTimer = null; isPlaying = false;
    setPlayBtn(false);
  } else {
    isPlaying = true; setPlayBtn(true);
    animTimer = setInterval(() => {
      if (animIdx >= animFrames.length - 1) { stopAnim(); return; }
      stepNext();
    }, animSpeed);
  }
}

function stopAnim() {
  if (animTimer) { clearInterval(animTimer); animTimer = null; }
  isPlaying = false; setPlayBtn(false);
}

function setPlayBtn(playing) {
  const btn = document.getElementById('btn-play');
  if (!btn) return;
  btn.innerHTML = playing ? '<span>⏸</span> Dừng' : '<span>▶</span> Chạy';
  btn.classList.toggle('playing', playing);
}

function stepNext() {
  if (animIdx >= animFrames.length - 1) { stopAnim(); return; }
  animIdx++;
  applyFrame(animIdx);
}

function stepPrev() {
  if (animIdx <= 0) return;
  animIdx--;
  applyFrame(animIdx);
}

function applyFrame(idx) {
  const frame = animFrames[idx];
  updateProgress();
  addFrameToLog(frame, idx);
  renderSnapshot(frame);
}

function updateProgress() {
  const total = animFrames.length;
  const pct   = total > 1 ? (animIdx / (total - 1)) * 100 : 100;
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('step-counter').textContent = `${animIdx + 1} / ${total}`;
  document.getElementById('btn-prev').disabled = animIdx <= 0;
  document.getElementById('btn-next').disabled = animIdx >= total - 1;
}

// ─── STEP LOG ─────────────────────────────────────────────────────────────────

const TYPE_META = {
  traverse:     { icon: '🔍', cls: 'log-traverse', badge: 'Duyệt' },
  insert:       { icon: '➕', cls: 'log-insert',   badge: 'Chèn' },
  split:        { icon: '✂',  cls: 'log-split',    badge: 'Split' },
  'push-median':{ icon: '⬆',  cls: 'log-split',    badge: 'Đẩy median' },
  'new-root':   { icon: '🌱', cls: 'log-split',    badge: 'Root mới' },
  delete:       { icon: '🗑', cls: 'log-delete',   badge: 'Xóa' },
  replace:      { icon: '↔',  cls: 'log-delete',   badge: 'Thay thế' },
  rotate:       { icon: '🔄', cls: 'log-rotate',   badge: 'Xoay' },
  merge:        { icon: '⊕',  cls: 'log-merge',    badge: 'Merge' },
  shrink:       { icon: '🔼', cls: 'log-delete',   badge: 'Co root' },
  'search-found':{ icon: '✅', cls: 'log-found',   badge: 'Tìm thấy' },
  'not-found':  { icon: '❌', cls: 'log-notfound', badge: 'Không thấy' },
  done:         { icon: '✓',  cls: 'log-done',     badge: 'Xong' },
};

function addFrameToLog(frame, idx) {
  const list = document.getElementById('step-log-list');
  const meta = TYPE_META[frame.type] || { icon: '→', cls: '', badge: frame.type };
  const div = document.createElement('div');
  div.className = `log-item ${meta.cls}`;
  div.innerHTML = `
    <span class="log-num">${idx + 1}</span>
    <span class="log-badge">${meta.badge}</span>
    <span class="log-icon">${meta.icon}</span>
    <span class="log-text">${frame.label}</span>`;
  list.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearStepLog() { document.getElementById('step-log-list').innerHTML = ''; }

function clearAnimPanel() {
  document.getElementById('anim-panel').classList.add('hidden');
  document.getElementById('step-log').classList.add('hidden');
  clearStepLog();
}

// ─── SNAPSHOT RENDERER ────────────────────────────────────────────────────────

function renderCurrentTree(step) {
  const tree = currentTreeTab === 'id' ? idTree : nameTree;
  const container = document.getElementById('btree-container');
  if (!tree.root) {
    container.innerHTML = `<div class="tree-empty"><span class="empty-icon">⬡</span><p>Cây B-Tree rỗng</p></div>`;
    return;
  }
  container.innerHTML = buildSVG(tree.root, [], null, null);
}

function renderSnapshot(frame) {
  const container = document.getElementById('btree-container');
  if (!frame.snapshot) { renderCurrentTree(null); return; }
  container.innerHTML = buildSVG(frame.snapshot, frame.highlightIds || [], frame.hlKey, frame.hlType);
}

// ─── SVG RENDERER ─────────────────────────────────────────────────────────────

function buildSVG(root, highlightIds, hlKey, hlType) {
  if (!root) return `<div class="tree-empty"><span class="empty-icon">⬡</span><p>Cây B-Tree rỗng</p></div>`;

  const KW   = 54;   // px per key slot
  const NH   = 34;   // node height
  const HGAP = 18;   // gap between siblings
  const VGAP = 60;   // vertical gap
  const PADX = 10;
  const BADGE_H = 16; // badge below node

  const nodeW = n => n.keys.length * KW + PADX;

  // BFS
  const levels = [];
  let q = [root];
  while (q.length) {
    levels.push([...q]);
    const nxt = [];
    q.forEach(n => { if (!n.isLeaf) n.children.forEach(c => nxt.push(c)); });
    q = nxt;
  }
  const depth = levels.length;

  // Position bottom-up
  const pos = new Map();
  for (let l = depth - 1; l >= 0; l--) {
    const y = l * (NH + VGAP + BADGE_H) + 20;
    if (l === depth - 1) {
      let x = 16;
      levels[l].forEach(node => {
        const w = nodeW(node);
        pos.set(node.id, { x, y, cx: x + w/2, w });
        x += w + HGAP;
      });
    } else {
      levels[l].forEach(node => {
        if (node.isLeaf) {
          const w = nodeW(node);
          const idx = levels[l].indexOf(node);
          let x = 16;
          if (idx > 0) {
            const prev = levels[l][idx-1];
            const pp = pos.get(prev.id);
            if (pp) x = pp.x + pp.w + HGAP;
          }
          pos.set(node.id, { x, y, cx: x + w/2, w });
        } else {
          const cps = node.children.map(c => pos.get(c.id)).filter(Boolean);
          if (cps.length) {
            const cx = (cps[0].x + cps[cps.length-1].x + cps[cps.length-1].w) / 2;
            const w  = nodeW(node);
            pos.set(node.id, { x: cx - w/2, y, cx, w });
          } else {
            const w = nodeW(node);
            pos.set(node.id, { x: 16, y, cx: 16 + w/2, w });
          }
        }
      });
    }
  }

  let maxX = 0;
  pos.forEach(p => { if (p.x + p.w > maxX) maxX = p.x + p.w; });
  const svgW = Math.max(maxX + 20, 300);
  const svgH = depth * (NH + VGAP + BADGE_H) + 16;

  const f  = n => Math.round(n * 10) / 10;
  const xe = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const hlSet = new Set(highlightIds);

  // Determine highlight class per node
  function nodeHLClass(node) {
    if (!hlSet.has(node.id)) return '';
    if (hlType === 'split' || hlType === 'push-median')  return ' hl-split';
    if (hlType === 'merge')                               return ' hl-merge';
    if (hlType === 'rotate')                              return ' hl-rotate';
    if (hlType === 'add')                                 return ' hl-add';
    if (hlType === 'delete')                              return ' hl-delete';
    if (hlType === 'search-found')                        return ' hl-found';
    return ' hl-traverse';
  }

  function keySlotClass(key, nodeId) {
    if (!hlSet.has(nodeId)) {
      // Permanent highlight of the inserted/found key on final frame
      if (hlKey && key === hlKey) {
        if (hlType === 'add' || hlType === 'done') return 'ks-add';
        if (hlType === 'delete')    return 'ks-delete';
        if (hlType === 'search-found') return 'ks-found';
      }
      return 'ks-base';
    }
    if (hlType === 'split' || hlType === 'push-median') return 'ks-split';
    if (hlType === 'merge')    return 'ks-merge';
    if (hlType === 'rotate')   return 'ks-rotate';
    if (hlType === 'add')      return 'ks-add';
    if (hlType === 'delete')   return 'ks-delete';
    if (hlType === 'search-found') return (key === hlKey) ? 'ks-found' : 'ks-base';
    if (hlType === 'traverse') return 'ks-traverse';
    return 'ks-base';
  }

  let edgesSVG = '', nodesSVG = '';

  // Draw edges
  for (let l = 0; l < depth - 1; l++) {
    levels[l].forEach(parent => {
      if (!parent || parent.isLeaf) return;
      const pp = pos.get(parent.id);
      if (!pp) return;
      const nc = parent.children.length;
      parent.children.forEach((child, ci) => {
        const cp = pos.get(child.id);
        if (!cp) return;
        const x1 = pp.x + PADX/2 + (ci + 0.5) * ((pp.w - PADX) / nc) + PADX/2;
        const y1 = pp.y + NH;
        const x2 = cp.cx, y2 = cp.y;
        const cy = (y2 - y1) * 0.48;
        const isHL = hlSet.has(parent.id) && hlSet.has(child.id);
        edgesSVG += `<path d="M${f(x1)} ${f(y1)} C${f(x1)} ${f(y1+cy)},${f(x2)} ${f(y2-cy)},${f(x2)} ${f(y2)}"
          class="edge${isHL?' edge-hl':''}" fill="none"/>
          <polygon points="${f(x2-4)},${f(y2-7)} ${f(x2+4)},${f(y2-7)} ${f(x2)},${f(y2)}"
          class="arrow${isHL?' arrow-hl':''}"/>`;
      });
    });
  }

  // Draw nodes
  for (let l = 0; l < depth; l++) {
    levels[l].forEach(node => {
      const p = pos.get(node.id);
      if (!p) return;
      const { x, y, w } = p;
      const hlCls = nodeHLClass(node);
      const leafCls = node.isLeaf ? ' leaf' : ' internal';

      nodesSVG += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${NH}" rx="6" class="node${leafCls}${hlCls}"/>`;

      node.keys.forEach((key, ki) => {
        const kx = x + PADX/2 + ki * KW;
        if (ki > 0) nodesSVG += `<line x1="${f(kx)}" y1="${f(y+5)}" x2="${f(kx)}" y2="${f(y+NH-5)}" class="sep"/>`;
        const sc = keySlotClass(key, node.id);
        nodesSVG += `<rect x="${f(kx+1.5)}" y="${f(y+1.5)}" width="${f(KW-3)}" height="${NH-3}" rx="5" class="${sc}"/>`;
        const disp = key.length > 10 ? key.slice(0,9)+'…' : key;
        nodesSVG += `<text x="${f(kx+KW/2)}" y="${f(y+NH/2)}" class="ktext" text-anchor="middle" dominant-baseline="middle"
          textLength="${f(KW-14)}" lengthAdjust="spacingAndGlyphs">${xe(disp)}</text>`;
      });

      // Badge
      const badgeTxt = node.isLeaf ? 'Lá' : `Nội (${node.keys.length}k, ${node.children.length}c)`;
      const badgeCls = node.isLeaf ? 'badge-leaf' : 'badge-int';
      nodesSVG += `<text x="${f(x+w/2)}" y="${f(y+NH+12)}" text-anchor="middle" class="nbadge ${badgeCls}">${xe(badgeTxt)}</text>`;
    });
  }

  // Inline highlight-type label
  const typeLabel = hlType ? buildTypeLabel(hlType) : '';

  return `<svg viewBox="0 0 ${f(svgW)} ${f(svgH)}" xmlns="http://www.w3.org/2000/svg" class="btree-svg">
  <defs><style>
    .edge   { stroke:var(--ec); stroke-width:1.5; opacity:.65; }
    .edge-hl{ stroke:var(--hl-active); stroke-width:2.5; opacity:1; }
    .arrow  { fill:var(--ec); opacity:.65; }
    .arrow-hl{ fill:var(--hl-active); opacity:1; }
    .node   { fill:var(--nb); stroke:var(--nborder); stroke-width:1.5; filter:drop-shadow(0 2px 7px rgba(0,0,0,.22)); }
    .leaf   { stroke:var(--leaf-c); }
    .internal{ stroke:var(--int-c); }
    /* Highlight states */
    .hl-traverse { fill:var(--trav-bg); stroke:var(--trav-c)!important; stroke-width:2.5; filter:drop-shadow(0 0 9px var(--trav-glow)); }
    .hl-add      { fill:var(--add-bg);  stroke:var(--add-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--add-glow)); }
    .hl-delete   { fill:var(--del-bg);  stroke:var(--del-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--del-glow)); }
    .hl-found    { fill:var(--fnd-bg);  stroke:var(--fnd-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--fnd-glow)); }
    .hl-split    { fill:var(--spl-bg);  stroke:var(--spl-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--spl-glow)); animation:spl-pulse .5s ease-in-out; }
    .hl-merge    { fill:var(--mrg-bg);  stroke:var(--mrg-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--mrg-glow)); animation:mrg-pulse .5s ease-in-out; }
    .hl-rotate   { fill:var(--rot-bg);  stroke:var(--rot-c)!important;  stroke-width:2.5; filter:drop-shadow(0 0 9px var(--rot-glow)); animation:rot-pulse .5s ease-in-out; }
    @keyframes spl-pulse { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.04)} }
    @keyframes mrg-pulse { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(.97)} }
    @keyframes rot-pulse { 0%,100%{transform:rotate(0)} 50%{transform:rotate(1.5deg)} }
    /* Key slots */
    .ks-base    { fill:var(--ks-bg); }
    .ks-traverse{ fill:var(--ks-trav); }
    .ks-add     { fill:var(--ks-add); }
    .ks-delete  { fill:var(--ks-del); }
    .ks-found   { fill:var(--ks-fnd); }
    .ks-split   { fill:var(--ks-spl); }
    .ks-merge   { fill:var(--ks-mrg); }
    .ks-rotate  { fill:var(--ks-rot); }
    .sep { stroke:var(--sep-c); stroke-width:.8; opacity:.4; }
    .ktext { font-family:var(--fmono); font-size:10.5px; fill:var(--kt-c); font-weight:700; pointer-events:none; }
    .nbadge { font-family:var(--fsans); font-size:8px; opacity:.55; }
    .badge-leaf{ fill:var(--leaf-c); }
    .badge-int { fill:var(--int-c); }
  </style></defs>
  ${typeLabel}${edgesSVG}${nodesSVG}
  </svg>`;
}

function buildTypeLabel(hlType) {
  const labels = {
    'traverse':      ['Duyệt cây', '#f59e0b'],
    'add':           ['Chèn key',  '#22c55e'],
    'split':         ['Split node','#a78bfa'],
    'push-median':   ['Đẩy median','#a78bfa'],
    'new-root':      ['Root mới',  '#a78bfa'],
    'delete':        ['Xóa key',   '#ef4444'],
    'replace':       ['Thay thế',  '#f97316'],
    'rotate':        ['Xoay key',  '#06b6d4'],
    'merge':         ['Merge node','#f97316'],
    'search-found':  ['Tìm thấy',  '#3b82f6'],
    'search-fail':   ['Không thấy','#ef4444'],
  };
  const [txt, color] = labels[hlType] || ['', '#888'];
  if (!txt) return '';
  return `<text x="8" y="12" font-family="var(--fmono)" font-size="9" fill="${color}" opacity=".7" font-weight="700">[${txt}]</text>`;
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function insertRaw(sv, animate = false) {
  students.set(sv.id, sv);
  idTree.insert(sv.id, sv.id);
  nameTree.insert(sv.name, sv.id);
  addTableRow(sv, animate);
}

function addTableRow(sv, animate = false) {
  const tbody = document.getElementById('table-body');
  const empty = tbody.querySelector('.empty-row');
  if (empty) empty.remove();
  const tr = document.createElement('tr');
  tr.id = `row-${sv.id}`;
  if (animate) tr.classList.add('row-new');
  tr.innerHTML = `
    <td><span class="id-badge">${sv.id}</span></td>
    <td>${sv.name}</td>
    <td><span class="gender-tag ${sv.gender==='Nữ'?'female':''}">${sv.gender}</span></td>
    <td>${sv.dob||'—'}</td>
    <td>${sv.dept||'—'}</td>
    <td>${sv.email||'—'}</td>
    <td><button class="btn-row-del" onclick="quickDelete('${sv.id}')" title="Xóa">✕</button></td>`;
  tbody.appendChild(tr);
  if (animate) setTimeout(() => tr.classList.remove('row-new'), 1200);
}

function removeTableRow(id) {
  const row = document.getElementById(`row-${id}`);
  if (!row) return;
  row.classList.add('row-delete');
  setTimeout(() => {
    row.remove();
    if (students.size === 0) {
      document.getElementById('table-body').innerHTML =
        `<tr class="empty-row"><td colspan="7"><div class="empty-state"><span class="empty-icon">◈</span><p>Chưa có dữ liệu.</p></div></td></tr>`;
    }
  }, 450);
}

function highlightRow(id) {
  document.querySelectorAll('tr.row-hl').forEach(r => r.classList.remove('row-hl'));
  const row = document.getElementById(`row-${id}`);
  if (row) { row.classList.add('row-hl'); row.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

function buildCard(sv) {
  return `<div class="result-card">
    <div class="result-header">
      <span class="result-id">${sv.id}</span>
      <span class="result-gender ${sv.gender==='Nữ'?'female':''}">${sv.gender}</span>
    </div>
    <div class="result-name">${sv.name}</div>
    <div class="result-meta">
      <span>📅 ${sv.dob||'N/A'}</span>
      <span>🏛 ${sv.dept||'N/A'}</span>
      <span>✉ ${sv.email||'N/A'}</span>
    </div>
  </div>`;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function clearForm() {
  ['inp-id','inp-name','inp-email','inp-dept','inp-dob'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('inp-gender').selectedIndex = 0;
}

function showOp(type, msg) {
  const log = document.getElementById('op-log');
  document.getElementById('op-icon').textContent = type==='success' ? '✓' : '⚠';
  document.getElementById('op-message').textContent = msg;
  log.className = `op-log op-${type}`;
  log.classList.remove('hidden');
  setTimeout(() => log.classList.add('hidden'), 4500);
}

function updateStats() {
  document.getElementById('stat-total').textContent  = students.size;
  document.getElementById('stat-nodes').textContent  = idTree.nodeCount();
  document.getElementById('stat-height').textContent = idTree.height();
}
