'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // --- Campo de partículas (como "chispas" de taller) ---
    const particleCount = 1500
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      velocities[i] = 0.002 + Math.random() * 0.008
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xff6b35,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Segunda capa de partículas doradas más pequeñas
    const goldCount = 600
    const goldPositions = new Float32Array(goldCount * 3)
    for (let i = 0; i < goldCount; i++) {
      goldPositions[i * 3] = (Math.random() - 0.5) * 25
      goldPositions[i * 3 + 1] = (Math.random() - 0.5) * 18
      goldPositions[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    const goldGeo = new THREE.BufferGeometry()
    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPositions, 3))
    const goldMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    })
    const gold = new THREE.Points(goldGeo, goldMat)
    scene.add(gold)

    // --- Mouse parallax ---
    let mouseX = 0
    let mouseY = 0
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener('mousemove', handleMouse)

    const handleResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    let frameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Partículas flotan hacia arriba suavemente
      const pos = particleGeo.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += velocities[i]
        if (pos[i * 3 + 1] > 11) pos[i * 3 + 1] = -11
      }
      particleGeo.attributes.position.needsUpdate = true

      particles.rotation.y = t * 0.02 + mouseX * 0.5
      particles.rotation.x = mouseY * 0.3
      gold.rotation.y = -t * 0.015 + mouseX * 0.3
      gold.rotation.x = mouseY * 0.2

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      particleGeo.dispose()
      particleMat.dispose()
      goldGeo.dispose()
      goldMat.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />
}
