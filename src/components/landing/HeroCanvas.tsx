'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 6.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // --- Luces ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const keyLight = new THREE.DirectionalLight(0xff6b35, 2)
    keyLight.position.set(4, 4, 5)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0xffd700, 1.2)
    rimLight.position.set(-4, 2, -3)
    scene.add(rimLight)
    const fillLight = new THREE.PointLight(0xffffff, 0.6)
    fillLight.position.set(0, -3, 4)
    scene.add(fillLight)

    // --- Grupo del casco ---
    const helmet = new THREE.Group()

    // Domo superior (esfera truncada en la parte baja)
    const shellGeo = new THREE.SphereGeometry(1.5, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.62)
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e1a,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0xff6b35,
      emissiveIntensity: 0.08,
    })
    const shell = new THREE.Mesh(shellGeo, shellMat)
    shell.position.y = 0.1
    helmet.add(shell)

    // Parte trasera/baja del casco (otra esfera un poco más grande y aplanada)
    const backGeo = new THREE.SphereGeometry(1.52, 48, 48, Math.PI * 0.4, Math.PI * 1.2, Math.PI * 0.35, Math.PI * 0.55)
    const back = new THREE.Mesh(backGeo, shellMat)
    back.position.y = 0.1
    helmet.add(back)

    // Mentonera (torus aplanado al frente del casco)
    const chinGeo = new THREE.TorusGeometry(1.15, 0.38, 24, 48, Math.PI)
    const chinMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e1a,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xff6b35,
      emissiveIntensity: 0.1,
    })
    const chin = new THREE.Mesh(chinGeo, chinMat)
    chin.position.set(0, -0.35, 0.1)
    chin.rotation.x = Math.PI * 0.08
    chin.rotation.z = Math.PI
    helmet.add(chin)

    // Visor (esfera segmentada, tinted)
    const visorGeo = new THREE.SphereGeometry(1.46, 48, 32, Math.PI * 0.7, Math.PI * 0.6, Math.PI * 0.32, Math.PI * 0.28)
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      metalness: 0.9,
      roughness: 0.05,
      emissive: 0xff6b35,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    })
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.y = 0.1
    helmet.add(visor)

    // Borde del visor (torus delgado)
    const visorFrameGeo = new THREE.TorusGeometry(1.1, 0.04, 16, 64, Math.PI * 1.1)
    const visorFrameMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1,
      roughness: 0.1,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
    })
    const visorFrame = new THREE.Mesh(visorFrameGeo, visorFrameMat)
    visorFrame.position.set(0, 0.35, 0)
    visorFrame.rotation.x = Math.PI * 0.15
    visorFrame.rotation.z = Math.PI * 0.95
    helmet.add(visorFrame)

    // Wireframe glow envolvente (efecto futurista)
    const wireGeo = new THREE.SphereGeometry(1.58, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    wire.position.y = 0.1
    helmet.add(wire)

    helmet.position.y = -0.2
    scene.add(helmet)

    // --- Partículas de fondo ---
    const particleCount = 900
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const r = 8 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi) - 5
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xff6b35,
      size: 0.04,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // --- Mouse parallax ---
    let mouseX = 0
    let mouseY = 0
    let targetRotY = 0
    let targetRotX = 0
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
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

      // Rotación base + parallax suave
      targetRotY += (mouseX * 0.6 - targetRotY) * 0.05
      targetRotX += (mouseY * 0.3 - targetRotX) * 0.05

      helmet.rotation.y = Math.sin(t * 0.4) * 0.35 + targetRotY
      helmet.rotation.x = Math.sin(t * 0.6) * 0.08 + targetRotX
      helmet.position.y = -0.2 + Math.sin(t * 1.3) * 0.12

      // Pulso de glow del visor
      visorMat.emissiveIntensity = 0.55 + Math.sin(t * 2) * 0.15

      particles.rotation.y = t * 0.02

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      shellGeo.dispose()
      shellMat.dispose()
      backGeo.dispose()
      chinGeo.dispose()
      chinMat.dispose()
      visorGeo.dispose()
      visorMat.dispose()
      visorFrameGeo.dispose()
      visorFrameMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />
}
