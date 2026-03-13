import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { dataset } from '../../data/dataset'
import MiniMap from './MiniMap'

export default function Overlay({ activeNode, setActiveNode }) {
  // Find causes highlighting this node
  const causes = activeNode 
    ? dataset.edges
        .filter(edge => edge.target === activeNode.id)
        .map(edge => dataset.nodes.find(n => n.id === edge.source))
    : []

  // Find consequences highlighting this node
  const consequences = activeNode
    ? dataset.edges
        .filter(edge => edge.source === activeNode.id)
        .map(edge => dataset.nodes.find(n => n.id === edge.target))
    : []

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <AnimatePresence>
      {activeNode && (
        <motion.div
          initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
          animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="overlay-panel"
        >
          <button className="close-btn" onClick={() => setActiveNode(null)}>✕</button>
          
          <div className="overlay-header">
            <span className={`tag type-${activeNode.type}`}>
              {activeNode.type.toUpperCase()}
            </span>
            <span className="date">
              {activeNode.date > 0 ? `${activeNode.date} AD` : `${Math.abs(activeNode.date)} BC`}
            </span>
          </div>

          <h2>{activeNode.title}</h2>
          <p className="description">{activeNode.description}</p>
          
          {!isMobile && <MiniMap lat={activeNode.lat} lng={activeNode.lng} />}

          {causes.length > 0 && (
            <div className="relations">
              <h3>Root Causes / Influences</h3>
              <div className="chain-links">
                {causes.map(c => (
                  <button key={c.id} className="chain-btn" onClick={() => setActiveNode(c)}>
                    ← {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {consequences.length > 0 && (
            <div className="relations">
              <h3>Consequences / Influenced</h3>
              <div className="chain-links">
                {consequences.map(c => (
                  <button key={c.id} className="chain-btn" onClick={() => setActiveNode(c)}>
                    {c.title} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {isMobile && <MiniMap lat={activeNode.lat} lng={activeNode.lng} />}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
