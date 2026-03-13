import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Text } from '@react-three/drei'
import * as THREE from 'three'
import Node from './Node'
import Edge from './Edge'
import { dataset } from '../../data/dataset'

function CameraController({ activeNode, searchData, activeEdgesWithNodes }) {
  const { camera, controls } = useThree()
  const vec = new THREE.Vector3()
  const targetVec = new THREE.Vector3()
  const animatingRef = useRef(false)
  const lastTargetIdRef = useRef(null)

  useEffect(() => {
    // Detect when the user clicks a new target to trigger a fresh camera flight
    const currentId = activeNode ? activeNode.id : (searchData ? searchData.id : 'home')
    if (currentId !== lastTargetIdRef.current) {
      animatingRef.current = true
      lastTargetIdRef.current = currentId
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

  useFrame(() => {
    if (!controls) return

    // Global navigation means we always rotate and zoom relative to the center
    targetVec.set(0, 0, 0)

    if (activeNode) {
      const nodePos = new THREE.Vector3(...activeNode.position)
      
      if (nodePos.length() < 0.1) {
        // Fallback for Big Bang
        vec.set(0, 15, 40)
      } else {
        // Position camera behind the node along the ray from origin
        // This keeps the node centered in view even though we look at [0,0,0]
        const outwardDir = nodePos.clone().normalize()
        vec.copy(nodePos).add(outwardDir.multiplyScalar(30))
        vec.y += 10 // Slight elevation for better perspective
      }

    } else if (searchData) {
      const searchPos = new THREE.Vector3(...searchData.position)
      const outwardDir = searchPos.clone().normalize()
      vec.copy(searchPos).add(outwardDir.multiplyScalar(60))
      vec.y += 20

    } else {
        vec.set(0, 50, 150)
    }

    // Only force the camera if we are in an active "flight" to a new node.
    if (animatingRef.current) {
      camera.position.lerp(vec, 0.04)
      controls.target.lerp(targetVec, 0.04)
      
      if (camera.position.distanceTo(vec) < 1.0) {
        animatingRef.current = false
      }
    }
  })

  useEffect(() => {
     camera.position.set(0, 50, 150)
  }, [camera])

  return null
}

export default function Scene({ activeNode, setActiveNode, searchData }) {
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
      
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      
      <CameraController 
        activeNode={activeNode} 
        searchData={searchData} 
        activeEdgesWithNodes={activeEdgesWithNodes} 
      />

      <SolarSystemGroup 
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
      {eras.map((era) => {
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
            <Text
              position={[
                Math.cos(dataset.eras.indexOf(era)) * era.radiusBase,
                0,
                Math.sin(dataset.eras.indexOf(era)) * era.radiusBase
              ]}
              // Scale the text slightly based on the radius so larger outer rings have bigger labels
              fontSize={Math.max(0.8, era.radiusBase * 0.02)}
              color="#88ccff"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.02}
              outlineColor="black"
              // Billboard the text so it always faces the camera
            >
              {era.name} ({era.start > 0 ? era.start + ' AD' : Math.abs(era.start) + ' BC'})
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SolarSystemGroup({ activeEdgesWithNodes, setActiveNode, activeNode, activeNodeIds }) {
  return (
    <group>
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
            onClickNode={setActiveNode} 
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
