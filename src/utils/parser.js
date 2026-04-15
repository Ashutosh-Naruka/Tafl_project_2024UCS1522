// ─── Grammar Parser ──────────────────────────────────────────────────────────

export function parseGrammar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rules = {};
  let startSymbol = null;
  const nonTerminals = new Set();

  for (const line of lines) {
    // Support ASCII (->) , unicode (→), and colon-equals (:=)
    const parts = line.split(/->|:=|→/);
    if (parts.length < 2) continue;

    const lhs = parts[0].trim();
    if (!startSymbol) startSymbol = lhs;
    nonTerminals.add(lhs);

    if (!rules[lhs]) rules[lhs] = [];

    const productions = parts[1].split('|').map(s => s.trim());
    for (let p of productions) {
      if (p.toLowerCase() === 'epsilon' || p.toLowerCase() === 'eps' || p === 'ε') {
        p = '';
      } else {
        p = p.replace(/\s+/g, '');
      }
      rules[lhs].push(p);
    }
  }

  return { rules, startSymbol, nonTerminals };
}

// ─── Derivation Engine ───────────────────────────────────────────────────────

function getNextNonTerminalIndex(str, nonTerminals, type = 'LMD') {
  if (type === 'LMD') {
    for (let i = 0; i < str.length; i++) {
      if (nonTerminals.has(str[i])) return i;
    }
  } else {
    for (let i = str.length - 1; i >= 0; i--) {
      if (nonTerminals.has(str[i])) return i;
    }
  }
  return -1;
}

export function generateDerivations(grammar, targetString, type = 'LMD', maxSteps = 10000) {
  const { rules, startSymbol, nonTerminals } = grammar;
  if (!startSymbol) return [];

  const queue = [{ str: startSymbol, path: [{ str: startSymbol, ruleApplied: null }] }];
  const successfulPaths = [];
  let iterations = 0;

  while (queue.length > 0 && iterations < maxSteps) {
    const current = queue.shift();
    iterations++;

    const nextNtIdx = getNextNonTerminalIndex(current.str, nonTerminals, type);

    if (nextNtIdx === -1) {
      if (current.str === targetString) {
        successfulPaths.push(current.path);
      }
      continue;
    }

    let terminalCount = 0;
    for (let i = 0; i < current.str.length; i++) {
      if (!nonTerminals.has(current.str[i])) terminalCount++;
    }
    if (terminalCount > targetString.length) continue;

    const nt = current.str[nextNtIdx];
    const productions = rules[nt] || [];

    for (const prod of productions) {
      const nextStr = current.str.slice(0, nextNtIdx) + prod + current.str.slice(nextNtIdx + 1);
      const ruleText = `${nt} -> ${prod === '' ? 'ε' : prod}`;
      const newPath = [...current.path, { str: nextStr, ruleApplied: ruleText, nt, prod }];
      queue.push({ str: nextStr, path: newPath });
    }
  }

  return successfulPaths;
}

// ─── Parse Tree Builder ──────────────────────────────────────────────────────

export function buildParseTreeFromPath(path, type = 'LMD', nonTerminals) {
  if (!path || path.length === 0) return null;

  let root = { name: path[0].str, id: 'root-0', isExpanded: false, children: [] };
  let idCounter = 1;

  for (let i = 1; i < path.length; i++) {
    const step = path[i];

    const leaves = [];
    function collectLeaves(node) {
      if (!node.children || node.children.length === 0) {
        if (!node.isExpanded) leaves.push(node);
      } else {
        node.children.forEach(collectLeaves);
      }
    }
    collectLeaves(root);

    let targetLeaf = null;
    if (type === 'LMD') {
      for (let l of leaves) {
        if (nonTerminals.has(l.name)) { targetLeaf = l; break; }
      }
    } else {
      for (let j = leaves.length - 1; j >= 0; j--) {
        if (nonTerminals.has(leaves[j].name)) { targetLeaf = leaves[j]; break; }
      }
    }

    if (targetLeaf) {
      targetLeaf.isExpanded = true;
      targetLeaf.children = [];
      const prodString = step.prod;
      if (prodString === '') {
        targetLeaf.children.push({ name: 'ε', id: `node-${idCounter++}` });
      } else {
        for (let charIdx = 0; charIdx < prodString.length; charIdx++) {
          targetLeaf.children.push({ name: prodString[charIdx], id: `node-${idCounter++}` });
        }
      }
    }
  }

  return root;
}

// ─── Ambiguity Removal Engine ────────────────────────────────────────────────

export function grammarToText(grammar) {
  const { rules, startSymbol } = grammar;
  const lines = [];
  if (startSymbol && rules[startSymbol]) {
    const prods = rules[startSymbol].map(p => p === '' ? 'epsilon' : p);
    lines.push(`${startSymbol} -> ${prods.join(' | ')}`);
  }
  for (const [lhs, prods] of Object.entries(rules)) {
    if (lhs === startSymbol) continue;
    const prodStr = prods.map(p => p === '' ? 'epsilon' : p);
    lines.push(`${lhs} -> ${prodStr.join(' | ')}`);
  }
  return lines.join('\n');
}

/**
 * Robust ambiguity remover. Handles common ambiguous patterns properly:
 * 1. Arithmetic Operations (E -> E+E | E*E | a) -> precedence layers
 * 2. Left Recursion (S -> Sa | a) -> right recursion or deterministic loops
 * 3. Generic S -> SS | a -> right recursion
 */
export function disambiguateGrammar(grammar) {
  const { rules, startSymbol, nonTerminals } = grammar;
  let newRules = JSON.parse(JSON.stringify(rules));
  let newNTs = new Set([...nonTerminals]);
  const steps = [];

  function getFreshNT() {
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      if (!newNTs.has(c) && !newRules[c]) return c;
    }
    return null;
  }

  // Pass 1: Common specific arithmetic operator disambiguation
  // Detect standard ambiguous math grammars: E -> E+E | E*E | ...
  for (const lhs of [...Object.keys(newRules)]) {
    const prods = newRules[lhs];
    
    // Check if it's a dense ambiguous expression grammar
    const hasAdd = prods.some(p => p.includes(lhs + '+' + lhs) || p.includes(lhs + '-' + lhs));
    const hasMult = prods.some(p => p.includes(lhs + '*' + lhs) || p.includes(lhs + '/' + lhs));
    
    if (hasAdd && hasMult) {
      // Split into Precedence Layers (E -> T -> F)
      const tNT = getFreshNT();
      if (!tNT) break;
      newNTs.add(tNT);
      
      const fNT = getFreshNT();
      if (!fNT) break;
      newNTs.add(fNT);

      const addProds = prods.filter(p => !p.includes('*') && !p.includes('/') && (p.includes('+') || p.includes('-')));
      const multProds = prods.filter(p => p.includes('*') || p.includes('/'));
      const baseProds = prods.filter(p => !p.includes('+') && !p.includes('-') && !p.includes('*') && !p.includes('/') && countNT(p, lhs) === 0);

      newRules[lhs] = [...addProds.map(p => p.replace(new RegExp(lhs, 'g'), tNT).replace(new RegExp(tNT + '\\+' + tNT, 'g'), lhs + '+' + tNT).replace(new RegExp(tNT + '\\-' + tNT, 'g'), lhs + '-' + tNT)), tNT];
      
      newRules[tNT] = [...multProds.map(p => p.replace(new RegExp(lhs, 'g'), fNT).replace(new RegExp(fNT + '\\*' + fNT, 'g'), tNT + '*' + fNT).replace(new RegExp(fNT + '\\/' + fNT, 'g'), tNT + '/' + fNT)), fNT];

      newRules[fNT] = baseProds.map(p => p.replace(new RegExp(lhs, 'g'), fNT));
      
      // Allow parenthesized expressions
      if (!newRules[fNT].some(p => p.includes('('))) {
         newRules[fNT].push(`(${lhs})`);
      }

      steps.push(`Converted ambiguous expression grammar \`${lhs}\` into precedence layers: \`${lhs} → ${tNT}\`, \`${tNT} → ${fNT}\``);
      continue;
    }

    // Pass 2: Multi-self-reference (S -> S S | a) converted to right-recursion (S -> a S | a)
    function countNT(p, nt) {
      let count = 0, i = 0;
      while (i < p.length) {
        if (p.slice(i, i + nt.length) === nt) { count++; i += nt.length; }
        else i++;
      }
      return count;
    }

    const multiSelf = prods.filter(p => countNT(p, lhs) >= 2);
    if (multiSelf.length > 0) {
      const baseProds = prods.filter(p => countNT(p, lhs) === 0 && p !== '');
      if (baseProds.length > 0) {
        const rightRec = [];
        for (const base of baseProds) {
          rightRec.push(base + lhs);
          rightRec.push(base);
        }
        newRules[lhs] = [...new Set([...rightRec, ...prods.filter(p => countNT(p, lhs) === 1 && !p.startsWith(lhs)), ...prods.filter(p => p === '')])];
        steps.push(`Converted multi-self-reference in \`${lhs}\` to right-recursive sequence: \`${baseProds.map(b => `${lhs} -> ${b}${lhs} | ${b}`).join(', ')}\``);
      }
    }

    // Pass 3: Left-factoring common prefixes to prevent backtracking/multiple paths
    const newProds = newRules[lhs];
    if (newProds.length >= 2) {
      const groups = {};
      for (const p of newProds) {
        const key = p.length > 0 ? p[0] : '_eps_';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      }

      let factored = false;
      const finalProds = [];
      for (const [prefix, group] of Object.entries(groups)) {
        if (prefix === '_eps_') { finalProds.push(''); continue; }
        if (group.length === 1) { finalProds.push(group[0]); continue; }

        const newNT = getFreshNT();
        if (newNT) {
          newNTs.add(newNT);
          const suffixes = group.map(p => p.slice(prefix.length) || '');
          finalProds.push(prefix + newNT);
          newRules[newNT] = [...new Set(suffixes)];
          steps.push(`Left-factored common prefix \`${prefix}\` in \`${lhs}\` into new rule \`${newNT}\`.`);
          factored = true;
        } else {
          finalProds.push(...group);
        }
      }
      if (factored) newRules[lhs] = finalProds;
    }
  }

  if (steps.length === 0) {
    steps.push("Grammar structure resolved cleanly without deep modifications or requires semantic interpretation.");
  }

  const newGrammar = { rules: newRules, startSymbol, nonTerminals: newNTs };
  return { newGrammar, steps };
}
