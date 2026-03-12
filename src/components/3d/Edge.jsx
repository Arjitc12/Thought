import { extend, useFrame } from '@react-three/fiber'
import { QuadraticBezierLine } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

extend({ QuadraticBezierLine })

export default function Edge({ sourceNode, targetNode, isCause }) {
  const lineRef = useRef()
  
  // Pre-allocate vectors and objects
  const { startVec, endVec, midVec, curve, pArray } = useMemo(() => ({
      startVec: new THREE.Vector3(),
      endVec: new THREE.Vector3(),
      midVec: new THREE.Vector3(),
      curve: new THREE.QuadraticBezierCurve3(),
      pArray: new Float32Array(21 * 3) // 20 segments = 21 points
  }), [])

  useFrame(() => {
    if (lineRef.current && sourceNode && targetNode) {
      startVec.set(sourceNode.position[0], sourceNode.position[1], sourceNode.position[2])
      endVec.set(targetNode.position[0], targetNode.position[1], targetNode.position[2])
      
      midVec.addVectors(startVec, endVec).multiplyScalar(0.5)
      const distance = startVec.distanceTo(endVec)
      
      midVec.y += distance * 0.2
      midVec.z -= distance * 0.1
      
      // Update curve
      curve.v0.copy(startVec)
      curve.v1.copy(midVec)
      curve.v2.copy(endVec)
      
      // Create points array 
      const points = curve.getPoints(20)
      for (let i = 0; i < points.length; i++) {
        pArray[i * 3] = points[i].x
        pArray[i * 3 + 1] = points[i].y
        pArray[i * 3 + 2] = points[i].z
      }
      
      // Line2 geometry uses setPositions
      if (lineRef.current.geometry.setPositions) {
        lineRef.current.geometry.setPositions(pArray)
      }
    }
  })

  // Color logic based on relationship
  // isCause = True means this edge is connecting an upstream parent node
  const edgeColor = isCause ? "#ff8800" : "#00ff88"

  if (!sourceNode || !targetNode) return null

  // Initial draw fallback to prevent FOUC 
  startVec.set(sourceNode.position[0], sourceNode.position[1], sourceNode.position[2])
  endVec.set(targetNode.position[0], targetNode.position[1], targetNode.position[2])
  midVec.addVectors(startVec, endVec).multiplyScalar(0.5)
  midVec.y += startVec.distanceTo(endVec) * 0.2
  midVec.z -= startVec.distanceTo(endVec) * 0.1

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={startVec}
      end={endVec}
      mid={midVec}
      color={edgeColor}
      lineWidth={1.5}
      transparent
      opacity={0.4}
    />
  )
}
