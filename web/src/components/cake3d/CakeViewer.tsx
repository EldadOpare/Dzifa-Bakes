import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Cake, cakeBaseRadius, cakeHeight, type CakeDesign } from './Cake';

// Studio lighting built from soft boxes, so there's no HDR file to download.
function Studio() {
  return (
    <Environment resolution={512} frames={1}>
      <Lightformer form="rect" intensity={1.8} position={[0, 6, 3]} scale={[12, 6, 1]} rotation-x={Math.PI / 2.4} />
      <Lightformer form="rect" intensity={0.9} position={[-6, 2, 2]} scale={[5, 6, 1]} rotation-y={Math.PI / 2.2} />
      <Lightformer form="rect" intensity={0.7} position={[6, 2, -1]} scale={[5, 6, 1]} rotation-y={-Math.PI / 2.2} />
      <Lightformer form="ring" intensity={1.5} position={[0, 3, -6]} scale={8} color="#fff4e6" />
      <mesh scale={50}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#8d8f99" side={THREE.BackSide} />
      </mesh>
    </Environment>
  );
}

export default function CakeViewer({ design }: { design: CakeDesign }) {
  const [interacted, setInteracted] = useState(false);
  const height = cakeHeight(design);
  const radius = cakeBaseRadius(design);
  const distance = Math.max(7.2, radius * 4.6 + height * 1.1);
  const target = useRef(new THREE.Vector3()).current;
  target.set(0, height * 0.4, 0);

  return (
    <Canvas
      shadows
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
      dpr={[1, 2]}
      camera={{ position: [distance * 0.5, height * 0.6 + distance * 0.32, distance * 0.82], fov: 32 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, preserveDrawingBuffer: false }}
    >
      <Suspense fallback={null}>
        <Studio />
        <directionalLight castShadow position={[4, 7, 5]} intensity={1.6} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}>
          <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 20]} />
        </directionalLight>
        <ambientLight intensity={0.06} />
        <Cake design={design} />
        <ContactShadows position={[0, -0.16, 0]} opacity={0.4} scale={12} blur={2.8} far={2.5} resolution={1024} />
      </Suspense>
      <OrbitControls
        target={target}
        enablePan={false}
        enableDamping
        autoRotate={!interacted && !design.slice && design.visible}
        autoRotateSpeed={0.9}
        minDistance={distance * 0.55}
        maxDistance={distance * 1.5}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.04}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}
