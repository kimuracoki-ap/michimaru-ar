// src/ARViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

export const ARViewer: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mindarThreeRef = useRef<MindARThree | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // MindARの初期化（start()は呼ばない）
  useEffect(() => {
    if (!wrapperRef.current) return;

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    wrapperRef.current.appendChild(container);
    containerRef.current = container;

    const base = import.meta.env.BASE_URL; // dev: "/", prod: "/michimaru-ar/"

    try {
      const mindarThree = new MindARThree({
        container,
        imageTargetSrc: `${base}targets/targets.mind`,
        uiLoading: "yes",
        uiScanning: "yes",
        uiError: "yes",
      });

      mindarThreeRef.current = mindarThree;

      const { scene } = mindarThree;

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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("MindAR initialization failed", e);
      setError(`初期化エラー: ${errorMessage}`);
    }

    return () => {
      if (mindarThreeRef.current) {
        const { renderer } = mindarThreeRef.current;
        renderer.setAnimationLoop(null);
        try {
          mindarThreeRef.current.stop();
        } catch (e) {
          console.warn("MindAR stop error", e);
        }
      }
      if (containerRef.current) {
        containerRef.current.remove();
      }
    };
  }, []);

  // AR開始処理（ボタンクリック時に実行）
  const handleStartAR = async () => {
    if (!mindarThreeRef.current || !containerRef.current) {
      setError("MindARが初期化されていません");
      return;
    }

    setError(null);
    setOverlayHidden(true);

    try {
      const mindarThree = mindarThreeRef.current;
      const container = containerRef.current;

      // カメラアクセスの確認
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // カメラアクセスが成功したら、ストリームを停止してからMindARを開始
        stream.getTracks().forEach((track) => track.stop());
      } catch (cameraError) {
        const errorMessage =
          cameraError instanceof Error
            ? cameraError.message
            : "カメラへのアクセスが拒否されました";
        console.error("Camera access denied", cameraError);
        setError(`カメラアクセスエラー: ${errorMessage}`);
        setOverlayHidden(false);
        return;
      }

      await mindarThree.start();

      const { clientWidth, clientHeight } = container;
      const { renderer, scene, camera } = mindarThree;
      renderer.setSize(clientWidth, clientHeight);

      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      console.log("MindAR started successfully");
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : e instanceof DOMException
            ? e.message
            : String(e) || "不明なエラー";
      console.error("MindAR start failed", e);
      setError(`AR開始エラー: ${errorMessage}`);
      setOverlayHidden(false);
    }
  };

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
            onClick={handleStartAR}
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
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "rgba(220, 38, 38, 0.9)",
            color: "#fff",
            fontSize: 14,
            borderRadius: 8,
            zIndex: 20,
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};