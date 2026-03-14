import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import Node from './Node'
import Edge from './Edge'

function CameraController({ activeNode, searchData, cameraMode, activeZoom, resetTrigger }) {
  const { camera, controls } = useThree()
  const vec = new THREE.Vector3()
  const targetVec = new THREE.Vector3()
  const animatingRef = useRef(false)
  const lastTargetIdRef = useRef(null)
  const zoomOffsetRef = useRef(0)

  // Hard Reset Logic
  useEffect(() => {
    if (resetTrigger > 0) {
      zoomOffsetRef.current = 0
      animatingRef.current = true
      // Snap to a safe position if things are really broken
      camera.position.set(0, 100, 200)
      controls.target.set(0, 0, 0)
    }
  }, [resetTrigger, camera, controls])

  useEffect(() => {
    // Detect when the user clicks a new target to trigger a fresh camera flight
    const currentId = activeNode ? activeNode.id : (searchData ? searchData.id : 'home')
    if (currentId !== lastTargetIdRef.current) {
      animatingRef.current = true
      lastTargetIdRef.current = currentId
      zoomOffsetRef.current = 0 // Reset zoom adjustment on flight
    }
  }, [activeNode, searchData])

  useEffect(() => {
    if (!controls) return
    const handleStart = () => {
      animatingRef.current = false
    }
    controls.addEventListener('start', handleStart)
    return () => controls.removeEventListener('start', handleStart)
  }, [controls])

  // Continuous Zoom logic handled in useFrame

  useFrame(() => {
    if (!controls) return

    const { width, height: viewHeight } = camera
    const aspect = window.innerWidth / window.innerHeight
    const isMobile = window.innerWidth <= 768
    const isPortrait = aspect < 1

    // Default target is the center
    targetVec.set(0, 0, 0)
    
    // Rotation compensation (SolarSystemGroup is rotated Math.PI / 8 on X)
    const planeRotationX = Math.PI / 8

    if (activeNode) {
      const nodePos = new THREE.Vector3(...activeNode.position)
      nodePos.applyAxisAngle(new THREE.Vector3(1, 0, 0), planeRotationX)
      
      let outwardDir = nodePos.clone()
      if (outwardDir.length() < 0.001) outwardDir.set(0, 0, 1)
      else outwardDir.normalize()
      
      // Pull back more on portrait/mobile to avoid clipping
      const mobileMultiplier = isPortrait ? 1.5 : 1.1
      const baseZoom = zoomOffsetRef.current * (isMobile ? 1.2 : 1.0)

      if (cameraMode === 'BIRDSEYE') {
        const h = ((isMobile ? 220 : 150) * mobileMultiplier) + baseZoom
        const upDir = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), planeRotationX)
        vec.copy(nodePos).add(upDir.multiplyScalar(h))
        targetVec.copy(nodePos)
      } else if (cameraMode === 'ORBIT') {
        const dist = (((isMobile ? 160 : 110) * mobileMultiplier) + baseZoom)
        vec.copy(nodePos).add(outwardDir.multiplyScalar(dist))
        vec.y += isMobile ? 80 : 60
        targetVec.copy(nodePos)
      } else {
        const dist = (((isMobile ? 100 : 70) * mobileMultiplier) + baseZoom)
        vec.copy(nodePos).add(outwardDir.multiplyScalar(dist))
        vec.y += isMobile ? 25 : 15
        targetVec.copy(nodePos)
      }

      // Offset target higher on mobile to clear bottom sheets
      if (isMobile && !isPortrait) targetVec.y -= 5
      if (isMobile && isPortrait) {
        // Move the node to the upper half of the screen
        const offset = new THREE.Vector3(0, -15, 0)
        targetVec.add(offset)
      }

    } else if (searchData) {
      const searchPos = new THREE.Vector3(...searchData.position)
      searchPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), planeRotationX)
      
      let outwardDir = searchPos.clone()
      if (outwardDir.length() < 0.001) outwardDir.set(0, 0, 1)
      else outwardDir.normalize()

      const dist = (isMobile ? 120 : 80) + zoomOffsetRef.current
      vec.copy(searchPos).add(outwardDir.multiplyScalar(dist))
      vec.y += isMobile ? 70 : 40
      targetVec.copy(searchPos)
      if (isMobile && isPortrait) targetVec.y -= 25

    } else {
      // Home state
      targetVec.set(0, 0, 0) // Gradually return to center
      
      let currentCamDir = new THREE.Vector3().subVectors(camera.position, controls.target)
      if (currentCamDir.length() < 0.001) currentCamDir.set(0, 0, 1)
      else currentCamDir.normalize()
      
      if (cameraMode === 'BIRDSEYE') {
        const h = (isPortrait ? 600 : 400) + zoomOffsetRef.current
        vec.set(0, h, 0.1)
      } else if (cameraMode === 'ORBIT') {
        const dist = (isPortrait ? 500 : 350) + zoomOffsetRef.current
        vec.addVectors(targetVec, currentCamDir.multiplyScalar(dist))
      } else {
        const dist = (isPortrait ? 350 : 220) + zoomOffsetRef.current
        vec.addVectors(targetVec, currentCamDir.multiplyScalar(dist))
      }
    }

    // Handle continuous zoom state with strict limits
    if (activeZoom) {
      const zoomSpeed = isMobile ? 1.5 : 2.5
      const prevOffset = zoomOffsetRef.current
      
      if (activeZoom === 'IN') zoomOffsetRef.current -= zoomSpeed
      if (activeZoom === 'OUT') zoomOffsetRef.current += zoomSpeed
      
      // Safety Limits
      // Don't let the offset get so small that base distances become negative
      // Minimum offset to prevent clipping (node-specific)
      const minOffset = -120 
      const maxOffset = 1000
      zoomOffsetRef.current = THREE.MathUtils.clamp(zoomOffsetRef.current, minOffset, maxOffset)
      
      animatingRef.current = true
    }

    if (animatingRef.current) {
      camera.position.lerp(vec, 0.12)
      controls.target.lerp(targetVec, 0.12)
      
      if (camera.position.distanceTo(vec) < 0.1 && controls.target.distanceTo(targetVec) < 0.1 && !activeZoom) {
        animatingRef.current = false
      }
    }
  })

  useEffect(() => {
     camera.position.set(0, 50, 150)
  }, [camera])

  return null
}

export default function Scene({ activeNode, setActiveNode, searchData, dataset, cameraMode, activeZoom, resetTrigger }) {
  // If there's an active node, compute its entire causal chain (forward and backward)
  let activeEdgesWithNodes = []
  
  if (activeNode) {
    // A simple recursive finder to accumulate all forward and backward edges
    const connectedEdges = new Map()
    
    // Helper to find all downstream effects (Consequences)
    const findConsequences = (nodeId) => {
      const edges = dataset.edges.filter(e => e.source === nodeId)
      edges.forEach(e => {
        if (!connectedEdges.has(e.source + '-' + e.target)) {
          // Add relationship metadata
          const edgeData = { ...e, isCause: false }
          connectedEdges.set(e.source + '-' + e.target, edgeData)
          findConsequences(e.target) // recurse
        }
      })
    }

    // Helper to find all upstream causes (Roots)
    const findCauses = (nodeId) => {
        const edges = dataset.edges.filter(e => e.target === nodeId)
        edges.forEach(e => {
            if (!connectedEdges.has(e.source + '-' + e.target)) {
                // Add relationship metadata
                const edgeData = { ...e, isCause: true }
                connectedEdges.set(e.source + '-' + e.target, edgeData)
                findCauses(e.source) // recurse
            }
        })
    }

    findConsequences(activeNode.id)
    findCauses(activeNode.id)
    
    // Map dataset links to actual node objects for the Edge components
    activeEdgesWithNodes = Array.from(connectedEdges.values()).map(edge => {
      const sourceNode = dataset.nodes.find(n => n.id === edge.source)
      const targetNode = dataset.nodes.find(n => n.id === edge.target)
      return { ...edge, sourceNode, targetNode }
    }).filter(e => e.sourceNode && e.targetNode)
  }
  // Calculate the set of active node IDs (the causal chain)
  const activeNodeIds = new Set()
  if (activeNode) {
    activeNodeIds.add(activeNode.id)
    activeEdgesWithNodes.forEach(edge => {
      activeNodeIds.add(edge.source)
      activeNodeIds.add(edge.target)
    })
  }

  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
      {/* Dynamic dark space environment */}
      <color attach="background" args={['#050814']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <OrbitControls 
        makeDefault 
        enableDamping 
        dampingFactor={0.05}
        rotateSpeed={window.innerWidth <= 768 ? 0.6 : 1.0} // Slower rotation on mobile for control
        minDistance={5}
        maxDistance={1000}
      />
      
      <CameraController 
        activeNode={activeNode} 
        searchData={searchData} 
        cameraMode={cameraMode}
        activeZoom={activeZoom}
        resetTrigger={resetTrigger}
      />

      <SolarSystemGroup 
        dataset={dataset}
        activeEdgesWithNodes={activeEdgesWithNodes} 
        setActiveNode={setActiveNode} 
        activeNode={activeNode}
        activeNodeIds={activeNodeIds}
      />
    </Canvas>
  )
}

function OrbitRings({ eras }) {
  if (!eras) return null;

  return (
    <group>
      {eras.map((era, index) => {
        if (era.radiusBase === 0) return null; // Skip Big Bang point

        // Generate points for a clean circle
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(theta) * era.radiusBase, 0, Math.sin(theta) * era.radiusBase));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <group key={era.name}>
            <line geometry={geometry}>
              <lineBasicMaterial color="cyan" transparent opacity={0.15} />
            </line>
            
            {/* The Label identifying the Era Ring */}
            <Billboard
              position={[
                Math.cos(index) * era.radiusBase,
                0,
                Math.sin(index) * era.radiusBase
              ]}
              follow={true}
            >
              <Text
                // Scale the text slightly based on the radius so larger outer rings have bigger labels
                fontSize={Math.max(0.8, era.radiusBase * 0.02)}
                color="#88ccff"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.02}
                outlineColor="black"
              >
                {era.name} ({era.start > 0 ? era.start + ' AD' : Math.abs(era.start) + ' BC'})
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

function SolarSystemGroup({ dataset, activeEdgesWithNodes, setActiveNode, activeNode, activeNodeIds }) {
  return (
    <group rotation={[Math.PI / 8, 0, 0]}>
      <OrbitRings eras={dataset.eras} />
      {dataset.nodes.map(node => {
        const isActive = activeNode?.id === node.id;
        const isBbGlowFallback = !activeNode && node.id === 'bb';
        
        // A node's label is visible if no node is selected, 
        // OR if it's the active node, or part of its causal chain
        const isLabelVisible = !activeNode || activeNodeIds.has(node.id);

        return (
          <Node 
            key={node.id} 
            data={node} 
            onClickNode={(clickedNode) => {
              // Only select if not currently dragging (OrbitControls specific)
              if (activeNode?.id === clickedNode.id) return
              setActiveNode(clickedNode)
            }} 
            isGlowing={isActive || isBbGlowFallback}
            isLabelVisible={isLabelVisible}
          />
        );
      })}

      {/* Only render edges if an active node is selected, revealing the isolated chain */}
      {activeEdgesWithNodes.map((edge, i) => (
        <Edge 
          key={`${edge.source}-${edge.target}-${i}`} 
          sourceNode={edge.sourceNode}
          targetNode={edge.targetNode}
          isCause={edge.isCause}
        />
      ))}
    </group>
  )
}
