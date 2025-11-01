"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

interface Chart3DProps {
  chartType: "bar" | "pie" | "line" | "column" | "radar"
  data: number[]
  labels?: string[]
}

// Helper function to create a text label using a Sprite and CanvasTexture
const createTextSprite = (message: string, position: THREE.Vector3) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const fontSize = 32;
    context.font = `Bold ${fontSize}px Arial`;
    const padding = 10;
    const metrics = context.measureText(message);
    const textWidth = metrics.width;
    
    // Set canvas dimensions based on text size
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding;

    // Clear and redraw with correct dimensions
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = 'rgba(255, 255, 255, 1.0)';
    context.fillText(message, padding, fontSize - 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale sprite based on canvas size for correct aspect ratio
    sprite.scale.set(canvas.width / 15, canvas.height / 15, 1); 
    sprite.position.copy(position);

    return sprite;
};

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
    
    // Adjust camera position based on data length for better view of bar/column charts
    if (data.length > 0 && (chartType === "bar" || chartType === "column")) {
      const centerX = (data.length - 1) * 2 / 2;
      camera.position.set(centerX, 50, data.length * 5);
      camera.lookAt(new THREE.Vector3(centerX, 0, 0));
    }


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
    
    // Add a basic grid plane for context
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    plane.position.y = -0.01;
    scene.add(plane);


    // Chart types
    switch (chartType) {
      case "bar":
      case "column": {
        const barWidth = 2
        const gap = 1
        data.forEach((value, i) => {
          // 1. Bar Mesh creation
          const geometry = new THREE.BoxGeometry(barWidth, value, barWidth)
          const color = new THREE.Color().setHSL(i / data.length, 1.0, 0.5); 
          const material = new THREE.MeshStandardMaterial({ color: color })
          const bar = new THREE.Mesh(geometry, material)
          
          bar.position.x = i * (barWidth + gap)
          bar.position.y = value / 2
          scene.add(bar)

          // 2. Add Numerical Label (Sprite) on top of the bar
          const labelPosition = new THREE.Vector3(bar.position.x, value + 2, bar.position.z);
          const labelSprite = createTextSprite(value.toFixed(0), labelPosition);
          if (labelSprite) {
            scene.add(labelSprite);
          }
          
          // 3. Add Axis Label (Bottom Sprite for name/index)
          const axisLabelText = labels && labels[i] ? labels[i] : `#${i + 1}`;
          const axisLabelPosition = new THREE.Vector3(bar.position.x, -5, bar.position.z);
          const axisLabelSprite = createTextSprite(axisLabelText, axisLabelPosition);
          if (axisLabelSprite) {
              scene.add(axisLabelSprite);
          }
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
          const color = new THREE.Color().setHSL(i / data.length, 1.0, 0.5);
          const material = new THREE.MeshStandardMaterial({ color: color })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.rotation.x = -Math.PI / 2
          scene.add(mesh)
          
          // Add label to the center of the arc section, slightly outside the pie
          const midAngle = startAngle + sliceAngle / 2;
          const labelPosition = new THREE.Vector3(
              Math.cos(midAngle) * 12, 
              0, 
              Math.sin(midAngle) * 12
          );
          
          const labelText = labels && labels[i] ? `${labels[i]}: ${value.toFixed(0)}` : value.toFixed(0);
          const labelSprite = createTextSprite(labelText, labelPosition);
          if (labelSprite) {
              scene.add(labelSprite);
          }

          startAngle += sliceAngle
        })
        // Adjust camera for pie chart
        camera.position.set(0, 40, 40);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        break
      }
      case "line": {
        const scaleFactor = 1;
        const points = data.map((value, i) => {
            const xPos = i * 4 - (data.length * 4) / 2;
            const yPos = value * scaleFactor;
            
            // 1. Add Point Label (Sprite)
            const labelPosition = new THREE.Vector3(xPos, yPos + 3, 0);
            const labelSprite = createTextSprite(value.toFixed(0), labelPosition);
            if (labelSprite) {
                scene.add(labelSprite);
            }

            // 2. Add data points (spheres)
            const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(xPos, yPos, 0);
            scene.add(sphere);

            return new THREE.Vector3(xPos, yPos, 0);
        });

        // 3. Draw the line
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        
        // Adjust camera for line chart
        camera.position.set(0, 30, 80);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        break
      }
      case "radar": {
        const radius = 10
        const points: THREE.Vector3[] = []
        const segments = data.length
        data.forEach((v, i) => {
          const angle = (i / segments) * Math.PI * 2
          const maxVal = Math.max(...data);
          const scaledV = (v / maxVal) * radius; // Scale value to fit the radar radius
          
          points.push(new THREE.Vector3(
            Math.cos(angle) * scaledV, 
            0, 
            Math.sin(angle) * scaledV
          ));

          // Add numerical label, outside the max radius
          const labelPosition = new THREE.Vector3(
              Math.cos(angle) * (radius + 4), 
              0, 
              Math.sin(angle) * (radius + 4)
          );
          
          const labelText = labels && labels[i] ? `${labels[i]}: ${v.toFixed(0)}` : v.toFixed(0);
          const labelSprite = createTextSprite(labelText, labelPosition);
          if (labelSprite) {
             scene.add(labelSprite);
          }
        })
        points.push(points[0]) // close loop
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
        const line = new THREE.LineLoop(geometry, material)
        scene.add(line)
        
        // Add a central point to ground the chart
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        scene.add(center);

        // Adjust camera for radar chart
        camera.position.set(0, 40, 40);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

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
      // Clean up Three.js elements
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [chartType, data, labels])

  return <div ref={mountRef} className="w-full h-64 rounded-lg border border-slate-700" />
}
