import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDerivations } from '../utils/parser';

export default function PracticeMode({ grammarObj, targetString }) {
  const [targetPath, setTargetPath] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [wrongShakeId, setWrongShakeId] = useState(null);

  useEffect(() => {
    if (grammarObj) {
      const paths = generateDerivations(grammarObj, targetString, 'LMD');
      if (paths.length > 0) {
        setTargetPath(paths[0]); // Use first successful path as the "correct" sequence
        setCurrentStepIdx(0);
      } else {
        setTargetPath([]);
      }
    }
  }, [grammarObj, targetString]);

  useEffect(() => {
    // Generate options based on current step
    if (targetPath.length > 0 && currentStepIdx < targetPath.length - 1) {
      const currentStep = targetPath[currentStepIdx];
      const nextStep = targetPath[currentStepIdx + 1];
      const correctRule = nextStep.ruleApplied;

      // Collect some random valid-looking rules for decoy
      const decoys = new Set();
      Object.entries(grammarObj.rules).forEach(([lhs, prods]) => {
        prods.forEach(p => {
          const rule = `${lhs} -> ${p === '' ? 'ε' : p}`;
          if (rule !== correctRule) decoys.add(rule);
        });
      });

      // Pick up to 3 random decoys
      const optionsArray = Array.from(decoys).sort(() => 0.5 - Math.random()).slice(0, 3);
      optionsArray.push(correctRule);
      optionsArray.sort(() => 0.5 - Math.random()); // Shuffle

      setOptions(optionsArray.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, isCorrect: opt === correctRule })));
    }
  }, [targetPath, currentStepIdx, grammarObj]);

  const handleSelectOption = (opt) => {
    if (opt.isCorrect) {
      setCurrentStepIdx(c => c + 1);
      setWrongShakeId(null);
    } else {
      setWrongShakeId(opt.id);
      setTimeout(() => setWrongShakeId(null), 500); // Reset shake after 500ms
    }
  };

  if (!grammarObj || targetPath.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Practice Mode</h2>
        <p>Please enter a valid grammar and a target string that can be derived.</p>
      </div>
    );
  }

  const isComplete = currentStepIdx === targetPath.length - 1;

  return (
    <div style={{ padding: '40px', display: 'flex', gap: '40px', height: '100%', overflowY: 'auto' }}>
      {/* Derivation Area */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-neon)', overflowY: 'auto' }}>
        <h2 style={{ color: 'var(--accent-purple)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Derivation</span>
          {isComplete && <span style={{ color: '#00ffaa' }}>Success! 🎉</span>}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {targetPath.slice(0, currentStepIdx + 1).map((step, idx) => (
              <motion.div
                layoutId={`step-${idx}`}
                key={`step-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--accent-purple)',
                  fontFamily: 'monospace',
                  fontSize: '1.2rem'
                }}
              >
                {idx > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{step.ruleApplied}</div>}
                <div style={{ color: idx === targetPath.length - 1 ? '#00ffaa' : '#fff' }}>
                  {step.str === '' ? 'ε' : step.str}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Options Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'var(--accent-blue)', marginBottom: '24px' }}>Select Next Rule</h2>
        
        {!isComplete ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AnimatePresence>
              {options.map((opt) => {
                const isShaking = wrongShakeId === opt.id;
                
                return (
                  <motion.button
                    layoutId={opt.isCorrect ? `step-${currentStepIdx + 1}` : undefined}
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={
                      isShaking 
                        ? { x: [-10, 10, -10, 10, 0], scale: 1, opacity: 1, borderColor: '#ff4444', backgroundColor: 'rgba(255,0,0,0.1)', boxShadow: '0 0 15px rgba(255,0,0,0.5)' } 
                        : { y: [0, -4, 0], scale: 1, opacity: 1, borderColor: 'var(--border-neon)', backgroundColor: 'rgba(0,0,0,0.5)', boxShadow: '0 0 5px rgba(0, 240, 255, 0.2)' }
                    }
                    transition={isShaking ? { duration: 0.4 } : { y: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}
                    style={{
                      padding: '16px 24px',
                      borderRadius: '30px',
                      border: '1px solid',
                      color: isShaking ? '#ff4444' : '#fff',
                      fontSize: '1.2rem',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {opt.text}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ padding: '24px', background: 'rgba(0, 255, 170, 0.1)', border: '1px solid #00ffaa', borderRadius: '16px', textAlign: 'center' }}
          >
            <h3 style={{ color: '#00ffaa', fontSize: '1.5rem', marginBottom: '8px' }}>Perfect!</h3>
            <p style={{ color: 'var(--text-muted)' }}>You've successfully derived the string manually.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
