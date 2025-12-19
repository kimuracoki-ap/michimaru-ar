// src/ARViewer.tsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// MindARThree を three.js 用のビルドから import
// Vite + npm install の場合、この書き方で使えます
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export const ARViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started || !containerRef.current) return;

    let mindarThree: any;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.Camera;
    let cleanup = false;

    const start = async () => {
      // MindAR 初期化（QRマーカーの .mind ファイルを指定）
      mindarThree = new MindARThree({
        container: containerRef.current!,
        imageTargetSrc: "/targets/targets.mind", // 事前に public/targets/qr.mind を配置
      });

      const result = mindarThree;
      renderer = result.renderer;
      scene = result.scene;
      camera = result.camera;

      // 環境光
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // マーカー（ターゲット画像）起点の Anchor を追加（0番目のターゲット）
      const anchor = mindarThree.addAnchor(0);

      // 平面ジオメトリ（1m x 1m を想定。必要に応じて調整）
      const geometry = new THREE.PlaneGeometry(1, 1);

      // public/textures/overlay.png をテクスチャとして読み込み
      const texture = new THREE.TextureLoader().load("/ar/michimaru.svg");

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });

      const plane = new THREE.Mesh(geometry, material);

      // Anchor の group に追加 → マーカーに追従して表示される
      anchor.group.add(plane);

      // AR セッション開始
      await mindarThree.start();

      // コンテナサイズに合わせる
      const { clientWidth, clientHeight } = containerRef.current!;
      renderer.setSize(clientWidth, clientHeight);

      // 描画ループ
      renderer.setAnimationLoop(() => {
        if (cleanup) return;
        renderer.render(scene, camera);
      });
    };

    start();

    return () => {
      cleanup = true;
      try {
        if (mindarThree) {
          mindarThree.stop();
          mindarThree.renderer.setAnimationLoop(null);
        }
      } catch (e) {
        console.warn("MindAR cleanup error:", e);
      }
    };
  }, [started]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      {/* iOS Safari 対策：ユーザー操作からカメラ起動 */}
      {!started && (
        <button
          onClick={() => setStarted(true)}
          style={{
            position: "absolute",
            zIndex: 10,
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 24,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            background: "#ffffff",
          }}
        >
          ARを開始
        </button>
      )}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};
