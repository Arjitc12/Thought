import React, { useState } from 'react'
import { dataset } from '../../data/dataset'
import * as THREE from 'three'

export default function DateSearch({ onSearch, onNodeSelect }) {
  const [inputValue, setInputValue] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    
    // Check if it's a number (Year search)
    const targetDate = parseInt(inputValue, 10)
    
    if (isNaN(targetDate)) {
      // It's a text search. Try to find an event by title.
      if (!inputValue.trim() || !onNodeSelect) return;
      const query = inputValue.toLowerCase();
      // Find the closest matching title
      const matchedNode = dataset.nodes.find(n => n.title.toLowerCase().includes(query));
      if (matchedNode) {
        onNodeSelect(matchedNode);
        setInputValue(''); // clear after jumping
      }
      return;
    }

    // Find the nodes closest to this date to determine the camera position
    const sortedNodes = [...dataset.nodes].sort((a, b) => a.date - b.date)
    
    // Exact match or closest
    let closestNode = sortedNodes[0]
    let minDiff = Math.abs(sortedNodes[0].date - targetDate)

    const relevantEvents = []

    sortedNodes.forEach(node => {
      const diff = Math.abs(node.date - targetDate)
      if (diff < minDiff) {
        minDiff = diff
        closestNode = node
      }
      
      // Grabbing events within a reasonable range
      if (diff <= 50) {
        relevantEvents.push(node)
      }
    })

    // Sort relevant events by proximity to the target date
    relevantEvents.sort((a, b) => Math.abs(a.date - targetDate) - Math.abs(b.date - targetDate))

    // The Solar System Scene controller needs real 3D coordinates and orbitRadius to frame the shot
    onSearch({ 
      id: `search-${targetDate}`,
      targetDate, 
      events: relevantEvents, 
      position: [...closestNode.position],
      orbitRadius: closestNode.orbitRadius
    })
  }

  return (
    <div className="date-search-panel">
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="Search Year or Event..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="date-input"
        />
        <button type="submit" className="search-btn">Search / Travel</button>
      </form>
    </div>
  )
}
