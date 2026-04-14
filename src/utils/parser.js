export function parseGrammar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rules = {};
  let startSymbol = null;
  const nonTerminals = new Set();

  for (const line of lines) {
    const parts = line.split(/->|:=/);
    if (parts.length < 2) continue;
    
    const lhs = parts[0].trim();
    if (!startSymbol) startSymbol = lhs;
    nonTerminals.add(lhs);

    if (!rules[lhs]) rules[lhs] = [];

    const productions = parts[1].split('|').map(s => s.trim());
    for (let p of productions) {
      if (p.toLowerCase() === 'epsilon' || p.toLowerCase() === 'eps' || p.toLowerCase() === 'ε') {
        p = '';
      } else {
        p = p.replace(/\s+/g, '');
      }
      rules[lhs].push(p);
    }
  }

  return { rules, startSymbol, nonTerminals };
}

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
    for(let i = 0; i < current.str.length; i++) {
       if(!nonTerminals.has(current.str[i])) terminalCount++;
    }
    
    if (terminalCount > targetString.length) {
       continue; 
    }

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
       for(let l of leaves) {
           if(nonTerminals.has(l.name)) {
               targetLeaf = l;
               break;
           }
       }
    } else {
       for(let j = leaves.length - 1; j >= 0; j--) {
           if(nonTerminals.has(leaves[j].name)) {
               targetLeaf = leaves[j];
               break;
           }
       }
    }

    if (targetLeaf) {
      targetLeaf.isExpanded = true;
      targetLeaf.children = [];
      const prodString = step.prod;
      if (prodString === '') {
         targetLeaf.children.push({ name: 'ε', id: `node-${idCounter++}` });
      } else {
         for(let charIdx=0; charIdx < prodString.length; charIdx++) {
             targetLeaf.children.push({ name: prodString[charIdx], id: `node-${idCounter++}` });
         }
      }
    }
  }

  return root;
}
