// src/ARViewer.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export const ARViewer: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // MindAR 用コンテナを作成
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    wrapperRef.current.appendChild(container);

    const base = import.meta.env.BASE_URL; // dev: "/", GitHub Pages: "/michimaru-ar/"

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

    // 0番ターゲット用の Anchor
    const anchor = mindarThree.addAnchor(0);

    // 平面ジオメトリ（サイズは 1m×1m。大きければ 0.5 などに調整）
    const geometry = new THREE.PlaneGeometry(1, 1);

    // public/ar/overlay.png をテクスチャとして読み込み
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`${base}ar/michimaru.svg`);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    anchor.group.add(plane);

    const start = async () => {
      try {
        await mindarThree.start();

        // コンテナサイズに合わせる
        const { clientWidth, clientHeight } = container;
        renderer.setSize(clientWidth, clientHeight);

        // 描画ループ
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });

        console.log("MindAR started");
      } catch (e) {
        console.error("MindAR start failed", e);
      }
    };

    start();

    // クリーンアップ
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
        overflow: "hidden",
        // 背景はカメラが出るので特に指定不要
      }}
    />
  );
};