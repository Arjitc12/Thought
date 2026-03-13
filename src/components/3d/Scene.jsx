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

  useFrame(() => {
    if (!controls) return

    if (activeNode) {
      // Collect all points we want to frame
      const points = [new THREE.Vector3(...activeNode.position)]
      
      // If we have active edges, add the other side of those connections
      if (activeEdgesWithNodes && activeEdgesWithNodes.length > 0) {
        activeEdgesWithNodes.forEach(edge => {
          if (edge.sourceNode) points.push(new THREE.Vector3(...edge.sourceNode.position))
          if (edge.targetNode) points.push(new THREE.Vector3(...edge.targetNode.position))
        })
      }

      // Calculate the center point of all these nodes
      const center = new THREE.Vector3()
      points.forEach(p => center.add(p))
      center.divideScalar(points.length)
      
      targetVec.copy(center)

      // Calculate how far back we need to be to see all points
      // We'll find the point furthest from the center
      let maxRadius = 0
      points.forEach(p => {
        const d = p.distanceTo(center)
        if (d > maxRadius) maxRadius = d
      })

      // Adjust camera position based on the spread of nodes
      // If points are clustered (maxRadius small), we zoom in move. 
      // If spread out, we pull back.
      const zoomFactor = Math.max(30, maxRadius * 2.5) 
      
      const nodePos = new THREE.Vector3(...activeNode.position)
      if (nodePos.length() < 0.1) {
        // Fallback for nodes at the very center (Big Bang)
        vec.set(0, 15, 40)
      } else {
        const outwardDir = nodePos.clone().normalize()
        vec.copy(center).add(outwardDir.multiplyScalar(zoomFactor))
        vec.y += zoomFactor * 0.4
      }

    } else if (searchData) {
      const angle = Math.atan2(searchData.position[2], searchData.position[0])
      const dist = searchData.orbitRadius + 60
      
      vec.set(
        Math.cos(angle) * dist,
        searchData.position[1] + 40,
        Math.sin(angle) * dist
      )
      targetVec.set(searchData.position[0], searchData.position[1], searchData.position[2])

    } else {
        vec.set(0, 50, 150)
        targetVec.set(0, 0, 0)
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

function SolarSystemGroup({ activeEdgesWithNodes, setActiveNode, activeNode }) {
  return (
    <group>
      <OrbitRings eras={dataset.eras} />
      {dataset.nodes.map(node => {
        const isActive = activeNode?.id === node.id;
        const isBbGlowFallback = !activeNode && node.id === 'bb';
        
        return (
          <Node 
            key={node.id} 
            data={node} 
            onClickNode={setActiveNode} 
            isGlowing={isActive || isBbGlowFallback}
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
