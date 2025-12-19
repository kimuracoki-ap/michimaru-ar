// src/types/mind-ar.d.ts
declare module "mind-ar/dist/mindar-image-three.prod.js" {
  export class MindARThree {
    constructor(options: {
      container: HTMLElement;
      imageTargetSrc: string;
      uiLoading?: string;
      uiScanning?: string;
      uiError?: string;
    });

    scene: any;
    camera: any;
    renderer: any;

    start(): Promise<void>;
    stop(): Promise<void>;

    addAnchor(index: number): {
      group: any;
      onTargetFound?: () => void;
      onTargetLost?: () => void;
    };
  }
}