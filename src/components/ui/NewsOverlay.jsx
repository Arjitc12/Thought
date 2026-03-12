import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NewsOverlay({ newsData, onClose, onNodeSelect }) {
  if (!newsData || !newsData.events || newsData.events.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="news-overlay"
      >
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="news-header">
          <div className="live-indicator"></div>
          <h2>
            Breaking History: {newsData.targetDate > 0 ? `${newsData.targetDate} AD` : `${Math.abs(newsData.targetDate)} BC`} Era
          </h2>
        </div>

        <div className="news-ticker">
          {newsData.events.map(event => (
            <div 
              key={event.id} 
              className={`news-item news-type-${event.type}`}
              onClick={() => onNodeSelect(event)}
            >
              <div className="news-meta">
                <span className="news-date">
                  {event.date > 0 ? `${event.date} AD` : `${Math.abs(event.date)} BC`}
                </span>
                <span className="news-tag">{event.type.toUpperCase()}</span>
              </div>
              <h4>{event.title}</h4>
              <p>{event.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
