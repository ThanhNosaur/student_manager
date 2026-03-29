/**
 * B-Tree bậc 3 (Order = 3)
 *   maxKeys = 2, minKeys = 1, maxChildren = 3
 *
 * Delete dùng lazy post-rebalance: xóa xong rồi mới cân bằng lại khi đi lên.
 * Cách này đảm bảo không bao giờ có node tạm thời > maxKeys.
 */

class BTreeNode {
  constructor(isLeaf = true) {
    this.keys     = [];
    this.values   = [];
    this.children = [];
    this.isLeaf   = isLeaf;
    this.id       = BTreeNode._idCtr++;
  }
}
BTreeNode._idCtr = 0;

function cloneTree(node) {
  if (!node) return null;
  const n    = new BTreeNode(node.isLeaf);
  n.id       = node.id;
  n.keys     = [...node.keys];
  n.values   = [...node.values];
  n.children = node.isLeaf ? [] : node.children.map(cloneTree);
  return n;
}

class BTree {
  constructor(order = 3) {
    this.order   = order;
    this.maxKeys = order - 1;                  // 2
    this.minKeys = Math.ceil(order / 2) - 1;   // 1
    this.root    = null;
    this._events = [];
    this._record = false;
  }

  _emit(type, payload) {
    if (!this._record) return;
    this._events.push({ type, ...payload, snapshot: cloneTree(this.root) });
  }

  insertWithEvents(key, value) {
    this._events = []; this._record = true;
    this.insert(key, value);
    this._record = false;
    return this._events;
  }

  deleteWithEvents(key) {
    this._events = []; this._record = true;
    const ok = this.delete(key);
    this._record = false;
    return ok ? this._events : [];
  }

  // ─── INSERT ────────────────────────────────────────────────
  insert(key, value) {
    if (!this.root) {
      this.root = new BTreeNode(true);
      this.root.keys.push(key);
      this.root.values.push(value);
      this._emit('insert-leaf', { key, nodeId: this.root.id, label: `Cây rỗng — tạo root mới chứa "${key}"` });
      return;
    }
    const split = this._insertRec(this.root, key, value);
    if (split) {
      const newRoot = new BTreeNode(false);
      newRoot.keys.push(split.key);
      newRoot.values.push(split.value);
      newRoot.children.push(split.left, split.right);
      this.root = newRoot;
      this._emit('new-root', {
        key: split.key, rootId: newRoot.id,
        leftId: split.left.id, rightId: split.right.id,
        label: `Root bị split → tạo root mới chứa median "${split.key}"`,
      });
    }
  }

  _insertRec(node, key, value) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;
    if (i < node.keys.length && key === node.keys[i]) {
      node.values[i] = value; return null;
    }

    if (node.isLeaf) {
      node.keys.splice(i, 0, key);
      node.values.splice(i, 0, value);
      this._emit('insert-leaf', {
        key, nodeId: node.id,
        label: `Chèn "${key}" vào node lá → [${node.keys.join(', ')}]`,
      });
    } else {
      this._emit('traverse', {
        key, nodeId: node.id, childIdx: i,
        label: `Duyệt node [${node.keys.join(', ')}] → đi xuống nhánh ${i}`,
      });
      const split = this._insertRec(node.children[i], key, value);
      if (split) {
        node.keys.splice(i, 0, split.key);
        node.values.splice(i, 0, split.value);
        node.children.splice(i, 1, split.left, split.right);
        this._emit('push-median', {
          key: split.key, nodeId: node.id,
          leftId: split.left.id, rightId: split.right.id,
          label: `Đẩy median "${split.key}" lên cha → [${node.keys.join(', ')}]`,
        });
      }
    }

    if (node.keys.length > this.maxKeys) {
      const mid    = 1;
      const medKey = node.keys[mid];
      const medVal = node.values[mid];
      const right  = new BTreeNode(node.isLeaf);
      right.keys   = node.keys.splice(mid + 1);
      right.values = node.values.splice(mid + 1);
      if (!node.isLeaf) right.children = node.children.splice(mid + 1);
      node.keys.splice(mid, 1);
      node.values.splice(mid, 1);

      this._emit('split', {
        medianKey: medKey, leftId: node.id, rightId: right.id,
        leftKeys: node.keys, rightKeys: right.keys,
        label: `Split: left=[${node.keys.join(', ')}] | median="${medKey}" | right=[${right.keys.join(', ')}]`,
        highlightIds: [node.id, right.id],
      });
      return { key: medKey, value: medVal, left: node, right };
    }
    return null;
  }

  // ─── SEARCH ────────────────────────────────────────────────
  search(key) { return this._searchRec(this.root, key); }
  _searchRec(node, key) {
    if (!node) return null;
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;
    if (i < node.keys.length && key === node.keys[i]) return { node, index: i, value: node.values[i] };
    if (node.isLeaf) return null;
    return this._searchRec(node.children[i], key);
  }

  searchByPrefix(prefix) {
    const results = [], lp = prefix.toLowerCase();
    this._inorderAll(this.root, (k, v) => {
      if (String(k).toLowerCase().includes(lp)) results.push({ key: k, value: v });
    });
    return results;
  }

  _inorderAll(node, cb) {
    if (!node) return;
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.isLeaf) this._inorderAll(node.children[i], cb);
      cb(node.keys[i], node.values[i]);
    }
    if (!node.isLeaf) this._inorderAll(node.children[node.keys.length], cb);
  }

  // ─── DELETE (lazy post-rebalance) ──────────────────────────
  delete(key) {
    if (!this.root || !this._searchRec(this.root, key)) return false;
    this._delRec(this.root, key);
    if (this.root.keys.length === 0) {
      this.root = this.root.isLeaf ? null : this.root.children[0];
      this._emit('shrink-root', {
        newRootId: this.root ? this.root.id : null,
        label: 'Root rỗng — co cây lên 1 tầng',
      });
    }
    return true;
  }

  /**
   * Xóa key trong subtree gốc tại node.
   * Sau khi xóa, kiểm tra các children xem có thiếu key không, rồi rebalance.
   */
  _delRec(node, key) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;

    if (i < node.keys.length && node.keys[i] === key) {
      // Key nằm tại node này
      if (node.isLeaf) {
        node.keys.splice(i, 1);
        node.values.splice(i, 1);
        this._emit('delete-leaf', {
          key, nodeId: node.id,
          label: `Xóa "${key}" khỏi node lá`,
        });
      } else {
        // Internal node: thay bằng predecessor hoặc successor
        const left  = node.children[i];
        const right = node.children[i + 1];
        if (left.keys.length > this.minKeys) {
          const pred = this._rightmost(left);
          node.keys[i]   = pred.key;
          node.values[i] = pred.value;
          this._emit('replace-predecessor', {
            oldKey: key, newKey: pred.key, nodeId: node.id,
            label: `Thay "${key}" bằng predecessor "${pred.key}"`,
          });
          this._delRec(left, pred.key);
          // Rebalance left nếu cần
          if (left.keys.length < this.minKeys) this._rebalance(node, i);
        } else if (right.keys.length > this.minKeys) {
          const succ = this._leftmost(right);
          node.keys[i]   = succ.key;
          node.values[i] = succ.value;
          this._emit('replace-successor', {
            oldKey: key, newKey: succ.key, nodeId: node.id,
            label: `Thay "${key}" bằng successor "${succ.key}"`,
          });
          this._delRec(right, succ.key);
          if (right.keys.length < this.minKeys) this._rebalance(node, i + 1);
        } else {
          // Merge: left + key + right
          this._emit('merge-before', {
            key, nodeId: node.id, leftId: left.id, rightId: right.id,
            label: `Xóa nội bộ "${key}": merge [${left.keys.join(', ')}] + "${key}" + [${right.keys.join(', ')}]`,
            highlightIds: [node.id, left.id, right.id],
          });
          this._merge(node, i);
          // left bây giờ chứa cả key của right + separator (2 keys max cho order-3)
          this._delRec(left, key);
        }
      }
    } else if (!node.isLeaf) {
      // Descend
      this._emit('traverse', {
        key, nodeId: node.id, childIdx: i,
        label: `Duyệt [${node.keys.join(', ')}] → xuống nhánh ${i}`,
      });
      this._delRec(node.children[i], key);
      // Post-rebalance nếu child thiếu key
      if (node.children[i] && node.children[i].keys.length < this.minKeys) {
        this._rebalance(node, i);
      }
    }
  }

  /**
   * Rebalance node.children[i] (thiếu key) bằng cách xoay hoặc merge.
   */
  _rebalance(parent, i) {
    const child    = parent.children[i];
    const leftSib  = i > 0                          ? parent.children[i - 1] : null;
    const rightSib = i < parent.children.length - 1 ? parent.children[i + 1] : null;

    if (leftSib && leftSib.keys.length > this.minKeys) {
      // Rotate right
      child.keys.unshift(parent.keys[i - 1]);
      child.values.unshift(parent.values[i - 1]);
      parent.keys[i - 1]   = leftSib.keys.pop();
      parent.values[i - 1] = leftSib.values.pop();
      if (!child.isLeaf) child.children.unshift(leftSib.children.pop());
      this._emit('rotate-right', {
        parentId: parent.id, childId: child.id, sibId: leftSib.id,
        label: `Xoay phải: mượn "${parent.keys[i-1]}" từ anh trái, cha nhận "${parent.keys[i-1]}" từ anh`,
        highlightIds: [parent.id, child.id, leftSib.id],
      });
    } else if (rightSib && rightSib.keys.length > this.minKeys) {
      // Rotate left
      child.keys.push(parent.keys[i]);
      child.values.push(parent.values[i]);
      parent.keys[i]   = rightSib.keys.shift();
      parent.values[i] = rightSib.values.shift();
      if (!child.isLeaf) child.children.push(rightSib.children.shift());
      this._emit('rotate-left', {
        parentId: parent.id, childId: child.id, sibId: rightSib.id,
        label: `Xoay trái: mượn "${parent.keys[i]}" từ anh phải`,
        highlightIds: [parent.id, child.id, rightSib.id],
      });
    } else if (leftSib) {
      const sepKey = parent.keys[i - 1];
      this._emit('merge', {
        parentId: parent.id, leftId: leftSib.id, rightId: child.id, sepKey,
        label: `Merge: [${leftSib.keys.join(', ')}] + "${sepKey}" + [${child.keys.join(', ')}]`,
        highlightIds: [parent.id, leftSib.id, child.id],
      });
      this._merge(parent, i - 1);
    } else if (rightSib) {
      const sepKey = parent.keys[i];
      this._emit('merge', {
        parentId: parent.id, leftId: child.id, rightId: rightSib.id, sepKey,
        label: `Merge: [${child.keys.join(', ')}] + "${sepKey}" + [${rightSib.keys.join(', ')}]`,
        highlightIds: [parent.id, child.id, rightSib.id],
      });
      this._merge(parent, i);
    }
  }

  _merge(parent, i) {
    const left  = parent.children[i];
    const right = parent.children[i + 1];
    left.keys.push(parent.keys[i]);
    left.values.push(parent.values[i]);
    left.keys   = left.keys.concat(right.keys);
    left.values = left.values.concat(right.values);
    if (!left.isLeaf) left.children = left.children.concat(right.children);
    parent.keys.splice(i, 1);
    parent.values.splice(i, 1);
    parent.children.splice(i + 1, 1);
  }

  _rightmost(node) {
    while (!node.isLeaf) node = node.children[node.children.length - 1];
    return { key: node.keys[node.keys.length - 1], value: node.values[node.values.length - 1] };
  }
  _leftmost(node) {
    while (!node.isLeaf) node = node.children[0];
    return { key: node.keys[0], value: node.values[0] };
  }

  // ─── UTILITIES ─────────────────────────────────────────────
  height() {
    if (!this.root) return 0;
    let h = 0, n = this.root;
    while (!n.isLeaf) { h++; n = n.children[0]; }
    return h + 1;
  }

  nodeCount() { return this._count(this.root); }
  _count(n) {
    if (!n) return 0;
    let c = 1;
    if (!n.isLeaf) for (const ch of n.children) c += this._count(ch);
    return c;
  }

  inorder() { const r = []; this._inorderAll(this.root, k => r.push(k)); return r; }

  getSearchSteps(key) {
    const steps = [];
    let node = this.root;
    while (node) {
      let i = 0, found = false;
      while (i < node.keys.length) {
        if (key === node.keys[i]) { found = true; break; }
        if (key  < node.keys[i]) break;
        i++;
      }
      steps.push({ nodeId: node.id, keys: [...node.keys], isLeaf: node.isLeaf, found, keyIndex: i });
      if (found || node.isLeaf) break;
      node = node.children[i];
    }
    return steps;
  }

  getInsertPath(key) {
    const path = [];
    let node = this.root;
    while (node) {
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      path.push({ nodeId: node.id, keys: [...node.keys], isLeaf: node.isLeaf, childIdx: i });
      if (node.isLeaf) break;
      node = node.children[i] || null;
    }
    return path;
  }
}
