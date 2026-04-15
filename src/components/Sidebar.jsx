import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, AlignRight, Play, AlertTriangle, Wand2, Loader, CheckCircle, Database, BookOpen, GitGraph, Table2 } from 'lucide-react';

export default function Sidebar({
  grammarText,
  setGrammarText,
  targetString,
  setTargetString,
  onGenerate,
  derivationsCount,
  isAmbiguous,
  derivationType,
  setDerivationType,
  onDisambiguate,
  isDisambiguating,
  disambigSteps,
  disambigVisible,
  currentTab,
  setCurrentTab,
}) {
  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          CFG <span className="text-gradient">Visualizer</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Context-Free Grammar Derivation & Parse Tree Generator
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <button className={`nav-btn ${currentTab === 'visualizer' ? 'active' : ''}`} onClick={() => setCurrentTab('visualizer')}>
          <GitGraph size={18} /> Visualizer
        </button>
        <button className={`nav-btn ${currentTab === 'practice' ? 'active' : ''}`} onClick={() => setCurrentTab('practice')}>
          <BookOpen size={18} /> Practice Mode
        </button>
        <button className={`nav-btn ${currentTab === 'library' ? 'active' : ''}`} onClick={() => setCurrentTab('library')}>
          <Database size={18} /> Grammar Library
        </button>
      </div>

      <div className="input-group" style={{ marginTop: '1rem' }}>
        <label className="input-label">Production Rules</label>
        <textarea
          className="textarea-cyber"
          rows={5}
          value={grammarText}
          onChange={(e) => setGrammarText(e.target.value)}
          placeholder={"S -> aSb\nS -> epsilon"}
        />
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '-4px' }}>
          Format: S {"->"} aSb | epsilon
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
              <motion.span
                className="badge badge-ambiguous"
                animate={{ boxShadow: ['0 0 5px rgba(255,50,50,0.3)', '0 0 18px rgba(255,50,50,0.7)', '0 0 5px rgba(255,50,50,0.3)'] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <AlertTriangle size={12} /> AMBIGUOUS
              </motion.span>
            ) : (
              <span className="badge badge-success">Valid</span>
            )}
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Found {derivationsCount} distinct derivation(s).
          </p>

          {/* ── DISAMBIGUATE BUTTON ── */}
          <AnimatePresence>
            {isAmbiguous && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <button
                  className="btn-disambig"
                  onClick={onDisambiguate}
                  disabled={isDisambiguating}
                >
                  {isDisambiguating ? (
                    <motion.span
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Loader size={16} className="spin" /> Analyzing Grammar…
                    </motion.span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wand2 size={16} /> Remove Ambiguity
                    </span>
                  )}
                </button>

                {/* ── STEP-BY-STEP TRANSFORMATION REVEAL ── */}
                <AnimatePresence>
                  {disambigVisible && disambigSteps.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      style={{ marginTop: '10px', background: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: '8px', padding: '10px', overflow: 'hidden' }}
                    >
                      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-blue)', marginBottom: '8px', fontWeight: 700 }}>
                        Transformations Applied:
                      </p>
                      {disambigSteps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.25, duration: 0.35 }}
                          style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'flex-start' }}
                        >
                          <CheckCircle size={13} style={{ color: '#00ffaa', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.5', fontFamily: 'monospace' }}>
                            {step}
                          </span>
                        </motion.div>
                      ))}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: disambigSteps.length * 0.25 + 0.3 }}
                        style={{ fontSize: '0.7rem', color: '#00ffaa', marginTop: '8px', textAlign: 'center' }}
                      >
                        ✓ Grammar updated & re-generated!
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

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
