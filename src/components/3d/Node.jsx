import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

export default function Node({ data, onClickNode }) {
  const groupRef = useRef()
  const textRef = useRef()
  const subTextRef = useRef()
  const [hovered, setHover] = useState(false)

  // Subtle floating and Orbit animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      
      // Calculate orbital position
      // Speed multiplier of 0.05 keeps things majestic
      const currentAngle = data.orbitAngle + (time * data.orbitSpeed * 0.05)
      
      const x = Math.cos(currentAngle) * data.orbitRadius
      const z = Math.sin(currentAngle) * data.orbitRadius
      const y = data.orbitRadius === 0 ? 0 : Math.sin(time + data.orbitAngle) * 0.5

      groupRef.current.position.set(x, y, z)

      // Mutate the original data reference so edges and camera know where we are dynamically
      data.position[0] = x
      data.position[1] = y
      data.position[2] = z

      // Dynamically scale text to remain visible when zooming out
      if (textRef.current && subTextRef.current) {
        // Calculate distance from camera to this node
        const dist = state.camera.position.distanceTo(groupRef.current.position)
        
        // Base scale at distance 10 is 1. If we zoom out to 100, scale becomes 4
        // Adding Math.max to prevent it shrinking too small when zoomed in close
        const scale = Math.max(1, dist * 0.04)
        
        textRef.current.scale.set(scale, scale, scale)
        subTextRef.current.scale.set(scale, scale, scale)
        
        // Push text higher dynamically so it clears the sphere 
        textRef.current.position.y = 0.5 * scale
        subTextRef.current.position.y = 0.25 * scale
      }
    }
  })

  // Color logic based on type
  let color = '#4a90e2' // Event: Blue
  if (data.type === 'person') color = '#e2a34a' // Person: Orange/Gold
  if (data.type === 'thought') color = '#4ae293' // Thought: Green

  return (
    <group 
      ref={groupRef}
      position={new THREE.Vector3(...data.position)}
      onClick={(e) => {
        e.stopPropagation()
        onClickNode(data)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        setHover(false)
        document.body.style.cursor = 'default'
      }}
    >
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hovered ? 2 : 1}
          toneMapped={false}
        />
      </mesh>

      <Text
        ref={textRef}
        position={[0, 0.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {data.title}
      </Text>
      
      <Text
        ref={subTextRef}
        position={[0, 0.25, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {data.date > 0 ? `${data.date} AD` : `${Math.abs(data.date)} BC`}
      </Text>
    </group>
  )
}
