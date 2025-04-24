"use client";

import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  FaceDetector,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function FaceDetectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let detector: FaceDetector;
    let animationFrameId: number;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });

      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const drawingUtils = new DrawingUtils(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      const draw = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const faces = await detector.detectForVideo(video, performance.now());

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
       


        if (faces.detections.length) {
          for (const face of faces.detections) {
            if (face.boundingBox) {

              const boundingBox = face.boundingBox as unknown as { originX: number; originY: number; width: number; height: number };

                // Calcula a posição para o texto à direita do quadrado
                const xOffset = boundingBox.originX + boundingBox.width + 10; // 10px de margem
                const yOffset = boundingBox.originY; // 20px abaixo do topo da caixa
                console.log(boundingBox.originX, boundingBox.originY, boundingBox.width, boundingBox.height);

                // Define o estilo do texto
                const fontSize = Math.max(12, Math.floor(boundingBox.height * 0.2)); // Garante um tamanho mínimo de 12px
                // Define o estilo do texto
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = "black";

                // Desenha o texto ao lado do quadrado
                ctx.fillText("Face Detectada", xOffset, yOffset);
            
            }
          }
        }

        animationFrameId = requestAnimationFrame(draw);
      };

      draw();
    }

    init();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
      />
    </div>
  );
}
