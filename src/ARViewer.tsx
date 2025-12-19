// src/ARViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export const ARViewer: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [overlayHidden, setOverlayHidden] = useState(false); // ← 画面を隠すかどうか

  useEffect(() => {
    if (!wrapperRef.current) return;

    // ★ ここから下は「カメラが映っていたとき」と同じ構成
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    wrapperRef.current.appendChild(container);

    const base = import.meta.env.BASE_URL; // dev: "/", prod: "/michimaru-ar/"

    const mindarThree = new MindARThree({
      container,
      imageTargetSrc: `${base}targets/targets.mind`,
      uiLoading: "yes",
      uiScanning: "yes",
      uiError: "yes",
    });

    const { renderer, scene, camera } = mindarThree;

    // 環境光
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // 0番ターゲット用 Anchor
    const anchor = mindarThree.addAnchor(0);

    // 平面ジオメトリ（サイズは必要に応じて調整）
    const geometry = new THREE.PlaneGeometry(0.7, 0.7);

    // michimaru.svg をテクスチャとして読み込み
    const texture = new THREE.TextureLoader().load(`${base}ar/michimaru.svg`);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = Math.PI / 2 + 0.2;
    anchor.group.add(plane);

    const start = async () => {
      try {
        await mindarThree.start();

        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);

        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });

        console.log("MindAR started");
      } catch (e) {
        console.error("MindAR start failed", e);
      }
    };

    start();

    return () => {
      renderer.setAnimationLoop(null);
      try {
        mindarThree.stop();
      } catch (e) {
        console.warn("MindAR stop error", e);
      }
      container.remove();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ★ カメラは裏で常に動かしておき、オーバーレイだけ消す */}
      {!overlayHidden && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.95)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <button
            onClick={() => setOverlayHidden(true)}
            style={{
              padding: "14px 24px",
              borderRadius: 28,
              border: "none",
              fontSize: 18,
              fontWeight: 600,
              background: "#ffffff",
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            ARを開始
          </button>
          <div
            style={{
              color: "#fff",
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            カメラへのアクセスを許可してからお使いください。
          </div>
        </div>
      )}
    </div>
  );
};