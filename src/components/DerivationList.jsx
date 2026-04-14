import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function DerivationList({ path, targetString, listWidth = '300px' }) {
  if (!path || path.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div style={{ padding: '24px 16px', width: listWidth, backgroundColor: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '16px' }}>Derivation Steps</h2>
      
      <motion.div 
        className="derivation-container"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {path.map((step, index) => {
          const isTarget = index === path.length - 1 && step.str === targetString;
          
          return (
            <motion.div 
              key={`${index}-${step.str}`} 
              variants={itemVariants}
              className={`derivation-step ${isTarget ? 'target-match' : ''}`}
            >
              {index > 0 && (
                <div className="rule-applied" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDown size={12} /> {step.ruleApplied}
                </div>
              )}
              <div style={{ color: isTarget ? '#00ffaa' : 'var(--text-main)', fontWeight: isTarget ? 'bold' : 'normal' }}>
                {step.str === '' ? 'ε' : step.str}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
