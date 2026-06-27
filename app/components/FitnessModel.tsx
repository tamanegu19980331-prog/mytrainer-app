'use client'
import { useEffect, useRef } from 'react'

interface FitnessModelProps {
  animation: 'idle' | 'pushup' | 'situp' | 'plank' | 'squat'
  height?: number
}

export default function FitnessModel({ animation, height = 300 }: FitnessModelProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    let frameId: number
    let renderer: any
    let prevTime = performance.now()

    const init = async () => {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

      const w = mount.clientWidth
      const h = height

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1e1e26)

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(2, 1, 3)
      camera.lookAt(0, 1, 0)

      const ambient = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambient)
      const dirLight = new THREE.DirectionalLight(0x39ff14, 1.0)
      dirLight.position.set(1, 2, 1)
      scene.add(dirLight)
      const fillLight = new THREE.DirectionalLight(0x00c8ff, 0.5)
      fillLight.position.set(-1, 1, -1)
      scene.add(fillLight)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(window.devicePixelRatio)
      mount.appendChild(renderer.domElement)

      const loader = new GLTFLoader()

      loader.load(
        `/models/${animation}.glb`,
        (gltf: any) => {
          const model = gltf.scene
          scene.add(model)
          model.scale.setScalar(1.5)

          model.traverse((child: any) => {
            if (child.isMesh) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m: any) => { m.color = new THREE.Color(0x39ff14) })
              } else {
                child.material.color = new THREE.Color(0x39ff14)
              }
            }
          })

          const mixer = new THREE.AnimationMixer(model)

          console.log('animations:', gltf.animations.map((a:any) => a.name))
          if (gltf.animations.length > 0) {
            const action = mixer.clipAction(gltf.animations[0])
            action.play()
          }

          const animate = () => {
            frameId = requestAnimationFrame(animate)
            const now = performance.now()
            const delta = Math.min((now - prevTime) / 1000, 0.1)
            prevTime = now
            mixer.update(delta)
            renderer.render(scene, camera)
          }
          animate()
        },
        undefined,
        (error: any) => {
          console.error('GLB load error:', error)
        }
      )
    }

    init()

    return () => {
      cancelAnimationFrame(frameId)
      if (renderer) {
        renderer.dispose()
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement)
        }
      }
    }
  }, [animation, height])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: height,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #2a2a36',
      }}
    />
  )
}