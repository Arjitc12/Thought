import React, { useState } from 'react'
import Scene from './components/3d/Scene'
import Overlay from './components/ui/Overlay'
import DateSearch from './components/ui/DateSearch'
import NewsOverlay from './components/ui/NewsOverlay'
import { dataset } from './data/dataset'
import { haptics } from './utils/haptics'
import './index.css'

export default function App() {
  const [activeNode, setActiveNode] = useState(null)
  const [searchData, setSearchData] = useState(null)

  const handleSearch = (data) => {
    setActiveNode(null) 
    setSearchData(data)
  }

  const handleNodeSelect = (node) => {
    setSearchData(null)
    setActiveNode(node)
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
      <div className="canvas-wrapper">
        <Scene activeNode={activeNode} setActiveNode={handleNodeSelect} searchData={searchData} />
      </div>

      <Overlay activeNode={activeNode} setActiveNode={handleNodeSelect} />
      
      <DateSearch onSearch={handleSearch} onNodeSelect={handleNodeSelect} />
      
      <NewsOverlay 
        newsData={searchData} 
        onClose={() => {
          haptics.light()
          setSearchData(null)
        }}
        onNodeSelect={handleNodeSelect} 
      />

      <div className="title-layer">
        <h1>Timeline Causality Map</h1>
        <div className="button-group">
          <button 
            className="start-journey-btn" 
            onClick={() => {
              haptics.heavy()
              const bbNode = dataset.nodes.find(n => n.id === 'bb');
              handleNodeSelect(bbNode);
              
              if (window.innerWidth <= 768) {
                const elem = document.documentElement;
                if (elem.requestFullscreen) elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
              }
            }}>
            ▶ Start Journey
          </button>
          
          {(activeNode || searchData) && (
            <button className="reset-btn" onClick={() => { 
                haptics.medium();
                setActiveNode(null); 
                setSearchData(null); 
              }}>
              ↺ Reset View
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
