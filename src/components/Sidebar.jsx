import React from 'react';
import { AlignLeft, AlignRight, Play, AlertTriangle } from 'lucide-react';

export default function Sidebar({
  grammarText,
  setGrammarText,
  targetString,
  setTargetString,
  onGenerate,
  derivationsCount,
  isAmbiguous,
  derivationType,
  setDerivationType
}) {
  return (
    <div className="sidebar">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          CFG <span className="text-gradient">Visualizer</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Context-Free Grammar Derivation & Parse Tree Generator
        </p>
      </div>

      <div className="input-group" style={{ marginTop: '1rem' }}>
        <label className="input-label">Production Rules</label>
        <textarea
          className="textarea-cyber"
          rows={6}
          value={grammarText}
          onChange={(e) => setGrammarText(e.target.value)}
          placeholder={"S -> aSb\nS -> epsilon"}
        />
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '-4px' }}>
          Format: S {"->"} aSb | epsilon. Use single uppercase letters for Non-Terminals.
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">Target String</label>
        <input
          type="text"
          className="input-cyber"
          value={targetString}
          onChange={(e) => setTargetString(e.target.value)}
          placeholder="aabb"
        />
      </div>

      <button className="btn-cyber" onClick={onGenerate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Play size={18} /> GENERATE
      </button>

      {derivationsCount > 0 && (
        <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="input-label">Results</span>
            {isAmbiguous ? (
              <span className="badge badge-ambiguous" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> AMBIGUOUS
              </span>
            ) : (
              <span className="badge badge-success">Valid</span>
            )}
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Found {derivationsCount} distinct derivation(s).
          </p>

          <div className="view-toggle">
            <button 
              className={`toggle-btn ${derivationType === 'LMD' ? 'active' : ''}`}
              onClick={() => setDerivationType('LMD')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <AlignLeft size={16} /> LMD
            </button>
            <button 
              className={`toggle-btn ${derivationType === 'RMD' ? 'active' : ''}`}
              onClick={() => setDerivationType('RMD')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <AlignRight size={16} /> RMD
            </button>
          </div>
        </div>
      )}

      {/* Developer Credits Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Developed by
        </p>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-blue)', textShadow: '0 0 5px rgba(0, 240, 255, 0.4)', marginTop: '4px' }}>
          Ashutosh Naruka
        </p>
        <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          Roll no. 2024UCS1522
        </p>
      </div>
    </div>
  );
}
