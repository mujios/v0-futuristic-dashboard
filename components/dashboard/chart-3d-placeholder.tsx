"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

interface Chart3DProps {
  chartType: "bar" | "pie" | "line" | "column" | "radar"
  data: number[]
  labels?: string[]
}

export default function Chart3D({ chartType, data, labels }: Chart3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current || data.length === 0) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b) // slate-800

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 50, 100)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    mountRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    scene.add(ambientLight, directionalLight)

    // Chart types
    switch (chartType) {
      case "bar":
      case "column": {
        const barWidth = 2
        const gap = 1
        data.forEach((value, i) => {
          const geometry = new THREE.BoxGeometry(barWidth, value, barWidth)
          const material = new THREE.MeshStandardMaterial({ color: 0x0fffcf })
          const bar = new THREE.Mesh(geometry, material)
          bar.position.x = i * (barWidth + gap)
          bar.position.y = value / 2
          scene.add(bar)
        })
        break
      }
      case "pie": {
        const total = data.reduce((a, b) => a + b, 0)
        let startAngle = 0
        data.forEach((value, i) => {
          const sliceAngle = (value / total) * Math.PI * 2
          const shape = new THREE.Shape()
          shape.moveTo(0, 0)
          shape.absarc(0, 0, 10, startAngle, startAngle + sliceAngle, false)
          shape.lineTo(0, 0)

          const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false })
          const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.rotation.x = -Math.PI / 2
          scene.add(mesh)

          startAngle += sliceAngle
        })
        break
      }
      case "line": {
        const points = data.map((value, i) => new THREE.Vector3(i * 2, value, 0))
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        break
      }
      case "radar": {
        const radius = 10
        const points: THREE.Vector3[] = []
        const segments = data.length
        data.forEach((v, i) => {
          const angle = (i / segments) * Math.PI * 2
          points.push(new THREE.Vector3(Math.cos(angle) * v, 0, Math.sin(angle) * v))
        })
        points.push(points[0]) // close loop
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
        const line = new THREE.LineLoop(geometry, material)
        scene.add(line)
        break
      }
    }

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [chartType, data])

  return <div ref={mountRef} className="w-full h-64 rounded-lg border border-slate-700" />
}
