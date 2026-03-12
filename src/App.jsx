import React, { useState } from 'react'
import Scene from './components/3d/Scene'
import Overlay from './components/ui/Overlay'
import DateSearch from './components/ui/DateSearch'
import NewsOverlay from './components/ui/NewsOverlay'
import { dataset } from './data/dataset'
import './index.css'

export default function App() {
  const [activeNode, setActiveNode] = useState(null)
  const [searchData, setSearchData] = useState(null)

  const handleSearch = (data) => {
    setActiveNode(null) // Clear active node details
    setSearchData(data)
  }

  const handleNodeSelect = (node) => {
    setSearchData(null) // clear news overlay on specific selection
    setActiveNode(node)
  }

  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Scene activeNode={activeNode} setActiveNode={handleNodeSelect} searchData={searchData} />
      </div>

      <Overlay activeNode={activeNode} setActiveNode={setActiveNode} />
      
      {/* Search Input overlay */}
      <DateSearch onSearch={handleSearch} onNodeSelect={handleNodeSelect} />
      
      {/* News Channel Overlay */}
      <NewsOverlay 
        newsData={searchData} 
        onClose={() => setSearchData(null)}
        onNodeSelect={handleNodeSelect} 
      />

      <div className="title-layer">
        <h1>Timeline Causality Map</h1>
        <p>Explore the timeline, search a year, or click a glowing node.</p>
        <button 
          className="start-journey-btn" 
          onClick={() => handleNodeSelect(dataset.nodes.find(n => n.id === 'bb'))}>
          ▶ Start Journey
        </button>
      </div>
    </div>
  )
}
