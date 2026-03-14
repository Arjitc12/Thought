import React, { useState } from 'react'
import Scene from './components/3d/Scene'
import Overlay from './components/ui/Overlay'
import DateSearch from './components/ui/DateSearch'
import NewsOverlay from './components/ui/NewsOverlay'
import { dataset } from './data/dataset'
import { religionsDataset } from './data/religions'
import { haptics } from './utils/haptics'
import './index.css'

export default function App() {
  const [activeSection, setActiveSection] = useState('history')
  const [activeNode, setActiveNode] = useState(null)
  const [searchData, setSearchData] = useState(null)

  const currentDataset = activeSection === 'history' ? dataset : religionsDataset

  const handleSearch = (data) => {
    setActiveNode(null) 
    setSearchData(data)
  }

  const handleNodeSelect = (node) => {
    setSearchData(null)
    setActiveNode(node)
  }

  const switchSection = (section) => {
    haptics.medium()
    setActiveSection(section)
    setActiveNode(null)
    setSearchData(null)
  }

  // Global Escape key handler 
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveNode(null)
        setSearchData(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-container">
      {/* Global Visual Overlays */}
      <div className="scanline" />
      <div className="grain" />

      <div className="canvas-wrapper">
        <Scene 
          activeNode={activeNode} 
          setActiveNode={handleNodeSelect} 
          searchData={searchData} 
          dataset={currentDataset}
        />
      </div>

      <Overlay activeNode={activeNode} setActiveNode={handleNodeSelect} dataset={currentDataset} />
      
      <DateSearch onSearch={handleSearch} onNodeSelect={handleNodeSelect} dataset={currentDataset} />
      
      <NewsOverlay 
        newsData={searchData} 
        onClose={() => {
          haptics.light()
          setSearchData(null)
        }}
        onNodeSelect={handleNodeSelect} 
        dataset={currentDataset}
      />

      <div className="hud-layer">
        <div className="hud-corners" />
        <div className="section-switcher">
          <button 
            className={`switch-btn ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => switchSection('history')}
          >
            HISTORY
          </button>
          <button 
            className={`switch-btn ${activeSection === 'religions' ? 'active' : ''}`}
            onClick={() => switchSection('religions')}
          >
            RELIGIONS
          </button>
        </div>

        <div className="title-layer">
          <div className="metadata">
            <span>SECTOR: {activeSection.toUpperCase()}</span>
            <span>SYSTEM_ONLINE: TRUE</span>
          </div>
          <h1>Timeline Causality</h1>
          <div className="button-group">
            <button 
              className="start-journey-btn" 
              onClick={() => {
                haptics.heavy()
                const startNode = currentDataset.nodes[0];
                handleNodeSelect(startNode);
              }}>
               JOURNEY
            </button>
            
            {(activeNode || searchData) && (
              <button className="reset-btn" onClick={() => { 
                  haptics.medium();
                  setActiveNode(null); 
                  setSearchData(null); 
                }}>
                ↺ RESET_VIEW
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
