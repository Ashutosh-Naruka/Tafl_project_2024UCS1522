import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, X } from 'lucide-react';

const DUMMY_GRAMMARS = [
  { _id: '1', name: 'Palindromes', description: 'Generates even-length palindromes over {a,b}', rulesText: 'S -> a S a | b S b | epsilon' },
  { _id: '2', name: 'Algebraic Expressions', description: 'Standard arithmetic expressions', rulesText: 'E -> E+E | E*E | (E) | id' },
  { _id: '3', name: 'Balanced Parentheses', description: 'Classic Dyck language', rulesText: 'S -> (S) | SS | epsilon' }
];

export default function GrammarLibrary({ onSelectGrammar }) {
  const [grammars, setGrammars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRules, setNewRules] = useState('');

  const fetchGrammars = () => {
    fetch('https://tafl-project-2024ucs1522.onrender.com/api/grammars')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setGrammars(data.length > 0 ? data : DUMMY_GRAMMARS);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Backend not running or unreachable, using dummy data.', err);
        setGrammars(DUMMY_GRAMMARS);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGrammars();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newRules.trim()) return;

    try {
      const res = await fetch('https://tafl-project-2024ucs1522.onrender.com/api/grammars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          rulesText: newRules
        })
      });
      if (res.ok) {
        const added = await res.json();
        setGrammars([added, ...grammars.filter(g => !DUMMY_GRAMMARS.find(d => d._id === g._id))]); // Prevent intermixing local mock ID conflicts
        setIsCreating(false);
        setNewName('');
        setNewDesc('');
        setNewRules('');
      } else {
        alert("Failed to save to database. Is the backend attached to MongoDB running?");
      }
    } catch(err) {
       console.error("Fetch POST error:", err);
       alert("Failed to connect to backend server. Make sure it is running on port 5001.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div style={{ padding: '40px', height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '2rem' }}>
          <Database className="text-neon-blue" />
          Community Grammars
        </h2>
        <button className="btn-cyber" onClick={() => setIsCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Grammar
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{ 
              background: 'rgba(30,30,40,0.9)', 
              border: '1px solid var(--accent-purple)', 
              padding: '24px', 
              borderRadius: '16px',
              marginBottom: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(176,38,255,0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--accent-purple)', margin: 0 }}>Add New Grammar</h3>
              <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" className="input-cyber" placeholder="Grammar Name (e.g. Binary Numbers)" value={newName} onChange={e => setNewName(e.target.value)} required />
              <input type="text" className="input-cyber" placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <textarea className="textarea-cyber" rows={4} placeholder={"S -> 0 S | 1 S | epsilon"} value={newRules} onChange={e => setNewRules(e.target.value)} required />
              <button type="submit" className="btn-cyber" style={{ background: 'rgba(176,38,255,0.1)' }}>Save to Library</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading grammars...</div>
      ) : (
        <motion.div 
          className="grammar-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}
        >
          {grammars.map((grammar) => (
            <motion.div
              key={grammar._id}
              variants={cardVariants}
              whileHover={{ 
                y: -4, 
                boxShadow: '0 8px 30px rgba(0, 240, 255, 0.25)',
                borderColor: 'var(--accent-blue)'
              }}
              onClick={() => onSelectGrammar(grammar.rulesText)}
              style={{
                background: 'rgba(30, 41, 59, 0.5)', /* bg-slate-800/50 equivalent */
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '24px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'border-color 0.3s ease'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>{grammar.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{grammar.description}</p>
              
              <div style={{ 
                marginTop: 'auto', 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap'
              }}>
                {grammar.rulesText}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
