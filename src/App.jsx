import React, { useState, useMemo, useEffect } from 'react';
import { FastForward, Pause, Play, StepBack, StepForward, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import DerivationList from './components/DerivationList';
import ParseTreeViewer from './components/ParseTreeViewer';
import GrammarLibrary from './components/GrammarLibrary';
import PracticeMode from './components/PracticeMode';
import { parseGrammar, generateDerivations, buildParseTreeFromPath, disambiguateGrammar, grammarToText } from './utils/parser';

export default function App() {
  const [currentTab, setCurrentTab] = useState('visualizer');
  
  const [grammarText, setGrammarText] = useState("S -> a S b | epsilon");
  const [targetString, setTargetString] = useState("aabb");
  
  // Results State
  const [hasGenerated, setHasGenerated] = useState(false);
  const [grammarObj, setGrammarObj] = useState(null);
  
  // View Toggle State
  const [derivationType, setDerivationType] = useState('LMD');

  // Animation Stepper State
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Disambiguation State
  const [disambigSteps, setDisambigSteps] = useState([]);
  const [disambigVisible, setDisambigVisible] = useState(false);
  const [isDisambiguating, setIsDisambiguating] = useState(false);

  const handleGenerate = () => {
    const grammar = parseGrammar(grammarText);
    setGrammarObj(grammar);
    setHasGenerated(true);
    setCurrentStep(0);
    setIsPlaying(true);
    setDisambigSteps([]);
    setDisambigVisible(false);
    setIsDisambiguating(false);
  };

  const handleDisambiguate = () => {
    if (!grammarObj) return;
    setIsDisambiguating(true);
    setDisambigVisible(false);

    setTimeout(() => {
      const { newGrammar, steps } = disambiguateGrammar(grammarObj);
      const newText = grammarToText(newGrammar);
      setDisambigSteps(steps);
      setIsDisambiguating(false);
      setDisambigVisible(true);
      setTimeout(() => {
        setGrammarText(newText);
        const reparsed = parseGrammar(newText);
        setGrammarObj(reparsed);
        setCurrentStep(0);
        setIsPlaying(true);
      }, 1800);
    }, 1400);
  };

  const handleSelectGrammar = (rulesText) => {
    setGrammarText(rulesText);
    setCurrentTab('visualizer');
  };

  // Derive Results Dynamically
  const { pathsLMD, pathsRMD, isAmbiguous } = useMemo(() => {
    if (!hasGenerated || !grammarObj) return { pathsLMD: [], pathsRMD: [], isAmbiguous: false };
    
    const lmdResults = generateDerivations(grammarObj, targetString, 'LMD');
    const rmdResults = generateDerivations(grammarObj, targetString, 'RMD');
    
    const ambiguous = lmdResults.length > 1;

    return {
      pathsLMD: lmdResults,
      pathsRMD: rmdResults,
      isAmbiguous: ambiguous
    };
  }, [hasGenerated, grammarObj, targetString]);

  const activePaths = derivationType === 'LMD' ? pathsLMD : pathsRMD;
  const activePath = activePaths.length > 0 ? activePaths[0] : [];

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, [derivationType]);

  useEffect(() => {
    if (isPlaying && activePath.length > 0) {
      if (currentStep < activePath.length - 1) {
        const timer = setTimeout(() => {
          setCurrentStep(c => c + 1);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, currentStep, activePath]);

  const displayedPath = activePath.slice(0, currentStep + 1);
  const displayedPath1 = activePaths.length > 0 ? activePaths[0].slice(0, currentStep + 1) : [];
  const displayedPath2 = activePaths.length > 1 ? activePaths[1].slice(0, currentStep + 1) : [];
  
  const treeData = useMemo(() => {
    if (!grammarObj || displayedPath.length === 0) return null;
    return buildParseTreeFromPath(displayedPath, derivationType, grammarObj.nonTerminals);
  }, [displayedPath, derivationType, grammarObj]);

  const treeData1 = useMemo(() => {
    if (!grammarObj || displayedPath1.length === 0) return null;
    return buildParseTreeFromPath(displayedPath1, derivationType, grammarObj.nonTerminals);
  }, [displayedPath1, derivationType, grammarObj]);

  const treeData2 = useMemo(() => {
    if (!grammarObj || displayedPath2.length === 0) return null;
    return buildParseTreeFromPath(displayedPath2, derivationType, grammarObj.nonTerminals);
  }, [displayedPath2, derivationType, grammarObj]);

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        grammarText={grammarText}
        setGrammarText={setGrammarText}
        targetString={targetString}
        setTargetString={setTargetString}
        onGenerate={handleGenerate}
        derivationsCount={activePaths.length}
        isAmbiguous={isAmbiguous}
        derivationType={derivationType}
        setDerivationType={setDerivationType}
        onDisambiguate={handleDisambiguate}
        isDisambiguating={isDisambiguating}
        disambigSteps={disambigSteps}
        disambigVisible={disambigVisible}
      />
      
      <div className="main-content">
        {currentTab === 'library' && <GrammarLibrary onSelectGrammar={handleSelectGrammar} />}
        
        {currentTab === 'practice' && <PracticeMode grammarObj={grammarObj} targetString={targetString} />}
        
        {currentTab === 'visualizer' && (
          <React.Fragment>
            {hasGenerated && activePath.length > 0 && (
              <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-neon)', alignItems: 'center', boxShadow: '0 4px 20px rgba(0, 240, 255, 0.15)' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '16px', fontWeight: 600 }}>
                   Step {currentStep + 1} / {activePath.length}
                 </span>
                 
                 <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} className="toggle-btn" style={{ padding: '6px' }} title="Restart">
                   <StepBack size={16} />
                 </button>
                 
                 <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)); }} className="toggle-btn" style={{ padding: '6px' }}>
                   <FastForward size={16} style={{ transform: 'rotate(180deg)' }} />
                 </button>

                 <button onClick={() => setIsPlaying(!isPlaying)} className="toggle-btn active" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                   {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                 </button>

                 <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(activePath.length - 1, currentStep + 1)); }} className="toggle-btn" style={{ padding: '6px' }}>
                   <FastForward size={16} />
                 </button>
                 
                 <button onClick={() => { setIsPlaying(false); setCurrentStep(activePath.length - 1); }} className="toggle-btn" style={{ padding: '6px' }} title="Skip to End">
                   <StepForward size={16} />
                 </button>
              </div>
            )}

            {hasGenerated && activePath.length > 0 ? (
              <div style={{ display: 'flex', height: '100%', width: '100%', paddingTop: '60px', position: 'relative' }}>
                {/* Ambiguous Overlay Warning */}
                {isAmbiguous && activePaths.length > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [1, 0.5, 1], scale: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ position: 'absolute', top: 76, right: '50%', transform: 'translateX(50%)', zIndex: 100, background: 'rgba(255,50,50,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '6px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 15px rgba(255,50,50,0.4)', fontWeight: 'bold' }}
                  >
                    <AlertTriangle size={18} /> AMBIGUOUS
                  </motion.div>
                )}

                <AnimatePresence>
                  {isAmbiguous && activePaths.length > 1 ? (
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flex: 1, height: '100%' }}>
                      <motion.div layout style={{ flex: 1, display: 'flex', borderRight: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                           <p style={{ position: 'absolute', top: 16, left: 16, zIndex: 10,  color: 'var(--text-muted)', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>Parse Tree 1</p>
                           <ParseTreeViewer treeData={treeData1} />
                        </div>
                        <DerivationList path={displayedPath1} targetString={targetString} listWidth="240px" />
                      </motion.div>
                      <motion.div layout style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                           <p style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>Parse Tree 2</p>
                           <ParseTreeViewer treeData={treeData2} />
                        </div>
                        <DerivationList path={displayedPath2} targetString={targetString} listWidth="240px" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flex: 1, height: '100%' }}>
                      <motion.div layout style={{ flex: 1, position: 'relative' }}>
                         <ParseTreeViewer treeData={treeData} />
                      </motion.div>
                      <motion.div layout style={{ width: '300px', height: '100%' }}>
                        <DerivationList path={displayedPath} targetString={targetString} listWidth="300px" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="tree-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasGenerated ? (
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#ff4444', marginBottom: '8px' }}>No Derivation Found</h2>
                    <p style={{ color: 'var(--text-muted)' }}>The string "{targetString}" is not accepted by the given grammar.</p>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', opacity: 0.5 }}>
                    Enter grammar rules and a target string, then generate.
                  </p>
                )}
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
