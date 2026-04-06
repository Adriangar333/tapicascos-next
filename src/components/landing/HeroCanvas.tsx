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
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // --- Casco estilizado (ícosaedro con wireframe y glow) ---
    const helmetGroup = new THREE.Group()

    const helmetGeo = new THREE.IcosahedronGeometry(1.6, 1)
    const helmetMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    })
    const helmet = new THREE.Mesh(helmetGeo, helmetMat)
    helmetGroup.add(helmet)

    // Capa interna sólida con glow sutil
    const innerGeo = new THREE.IcosahedronGeometry(1.55, 1)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.06,
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    helmetGroup.add(inner)

    // Halo exterior
    const haloGeo = new THREE.IcosahedronGeometry(1.85, 1)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    helmetGroup.add(halo)

    scene.add(helmetGroup)

    // --- Partículas de fondo ---
    const particleCount = 1200
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xff6b35,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // --- Mouse parallax ---
    let mouseX = 0
    let mouseY = 0
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.6
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.6
    }
    window.addEventListener('mousemove', handleMouse)

    // --- Resize ---
    const handleResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // --- Animation loop ---
    let frameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      helmetGroup.rotation.y = t * 0.25 + mouseX * 0.5
      helmetGroup.rotation.x = Math.sin(t * 0.5) * 0.15 + mouseY * 0.3
      helmetGroup.position.y = Math.sin(t * 1.2) * 0.15

      halo.rotation.y = -t * 0.15
      halo.rotation.z = t * 0.1

      particles.rotation.y = t * 0.03
      particles.rotation.x = t * 0.015

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      helmetGeo.dispose()
      helmetMat.dispose()
      innerGeo.dispose()
      innerMat.dispose()
      haloGeo.dispose()
      haloMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />
}
