import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export default function ParseTreeViewer({ treeData }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  // Setup D3 Zoom
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (e) => {
        d3.select(wrapperRef.current).attr('transform', e.transform);
      });
    
    d3.select(svgRef.current).call(zoom);
    d3.select(svgRef.current).call(zoom.translateTo, 0, -200);
  }, []);

  // Compute Layout Using D3
  const { nodes, links } = useMemo(() => {
    if (!treeData) return { nodes: [], links: [] };

    const hierarchy = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([60, 80]);
    const root = treeLayout(hierarchy);

    return {
      nodes: root.descendants(),
      links: root.links()
    };
  }, [treeData]);

  if (!treeData) {
    return (
      <div className="tree-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', opacity: 0.5 }}>No Parse Tree Available</p>
      </div>
    );
  }

  return (
    <div className="tree-canvas" style={{ position: 'relative', height: '100%', width: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }}>
        <g ref={wrapperRef}>
          {/* Links Layer */}
          <g>
            {links.map((link) => {
              const pathData = `M ${link.source.x},${link.source.y} C ${link.source.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${link.target.y}`;
              
              return (
                <motion.path
                  key={`link-${link.target.data.id}-${link.source.data.id}`}
                  d={pathData}
                  className="link-cyber"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g>
            {nodes.map((node, i) => {
              const isTerminal = !node.children;
              const isEpsilon = node.data.name === 'ε';

              return (
                <motion.g
                  key={`node-${node.data.id}`}
                  initial={{ x: node.parent ? node.parent.x : 0, y: node.parent ? node.parent.y : -50, scale: 0, opacity: 0 }}
                  animate={{ x: node.x, y: node.y, scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                    delay: i * 0.05
                  }}
                >
                  <circle
                    r={isTerminal ? 16 : 22}
                    fill={isEpsilon ? 'transparent' : (isTerminal ? 'var(--panel-bg)' : 'rgba(0, 240, 255, 0.1)')}
                    stroke={isEpsilon ? 'var(--text-muted)' : (isTerminal ? 'var(--accent-purple)' : 'var(--accent-blue)')}
                    strokeWidth={isEpsilon ? 1 : 2}
                    strokeDasharray={isEpsilon ? "4 4" : "none"}
                    style={{
                      boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
                    }}
                  />
                  <text
                    className="node-text"
                    textAnchor="middle"
                    dy=".3em"
                    fill={isEpsilon ? 'var(--text-muted)' : '#fff'}
                  >
                    {node.data.name}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </g>
      </svg>
      
      <div style={{ position: 'absolute', bottom: '24px', right: '24px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Scroll to Zoom • Drag to Pan
      </div>
    </div>
  );
}
