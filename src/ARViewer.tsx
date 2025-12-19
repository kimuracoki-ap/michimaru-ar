// src/ARViewer.tsx
import { type FC, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import "./ARViewer.css";

type ArStatus = "idle" | "initializing" | "running" | "error";

export const ARViewer: FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ArStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "initializing") return;
    if (!wrapperRef.current) return;

    const base = import.meta.env.BASE_URL; // dev: "/", GitHub Pages: "/michimaru-ar/"
    let mindarThree: any | null = null;
    let cancelled = false;

    const run = async () => {
      try {
        // wrapper配下に MindAR 用の container を作る
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";

        wrapperRef.current!.appendChild(container);

        mindarThree = new MindARThree({
          container,
          imageTargetSrc: `${base}targets/targets.mind`,
          uiScanning: "yes",
          uiLoading: "yes",
          uiError: "yes",
        });

        // とりあえず分かりやすい Plane を 1 枚だけ置く（動作確認用）
        const { renderer, scene, camera } = mindarThree;

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const plane = new THREE.Mesh(geometry, material);

        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(plane);

        const startPromise: Promise<void> = mindarThree.start();

        // レンダリングループ
        renderer.setAnimationLoop(() => {
          if (cancelled) return;
          renderer.render(scene, camera);
        });

        await startPromise;
        if (cancelled) {
          renderer.setAnimationLoop(null);
          mindarThree.stop();
          container.remove();
          return;
        }

        // MindAR が <video> を container 内に自動追加する
        console.log("MindAR started", mindarThree.video);
        setStatus("running");
      } catch (e) {
        console.error("MindAR start error", e);
        setErrorMessage(
          e instanceof Error ? e.message : "ARの初期化に失敗しました。"
        );
        setStatus("error");
      }
    };

    run();

    return () => {
      cancelled = true;
      try {
        if (mindarThree) {
          const { renderer } = mindarThree;
          renderer.setAnimationLoop(null);
          mindarThree.stop();
          // container は wrapperRef.current の中にあるので、まとめて消したければ:
          // wrapperRef.current!.innerHTML = "";
        }
      } catch (e) {
        console.warn("MindAR stop error:", e);
      }
    };
  }, [status]);

  const handleStart = () => {
    setErrorMessage(null);
    setStatus("initializing");
  };

  return (
    <div className="ar-root">
      {status !== "running" && (
        <button className="ar-start-button" onClick={handleStart}>
          ARを開始
        </button>
      )}

      {errorMessage && <div className="ar-error">{errorMessage}</div>}

      <div ref={wrapperRef} className="ar-wrapper" />
    </div>
  );
};