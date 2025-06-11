"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceDetector,
} from "@mediapipe/tasks-vision";

export default function FaceDetectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const MAX_ALLOWED_DISTANCE = 200;
  // Novo tipo para backendData
  const [backendData, setBackendData] = useState<null | Array<{
    name: string;
    confidence: number;
    coords: [number, number, number, number];
    face: string;
    clerk_id: string;
  }>>(null);

  const backendDataRef = useRef<typeof backendData>(null);

  useEffect(() => {
    let detector: FaceDetector;
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });

      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      const sendImageToBackend = async () => {
        if (!canvas || !video) return;

        // Desenhar apenas o frame do vídeo no canvas (sem overlays)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) return;

          const formData = new FormData();
          formData.append("imagem", blob, "canvas_image.jpg");

          try {
            const res = await fetch("/api/faces/recognition", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) throw new Error("Erro na resposta do servidor");

            const data = await res.json();
            // Se vier data.recognitions, use isso como backendData
            const recognitions = Array.isArray(data.recognitions) ? data.recognitions : data;
            backendDataRef.current = recognitions;
            setBackendData(recognitions); // Garante atualização do estado
          } catch (error) {
            console.error("Erro ao enviar imagem:", error);
          }
        }, "image/jpeg");
      };

      intervalId = setInterval(sendImageToBackend, 2000);

      const draw = async () => {
        if (!video || video.readyState < 2) {
          animationFrameId = requestAnimationFrame(draw);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const faces = await detector.detectForVideo(video, performance.now());

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const backendData = backendDataRef.current;
        console.log("Backend Data:", backendData);

        // Calcular fatores de escala
        let scaleX = 4;
        let scaleY = 4;
        // Supondo que a imagem do backend tem o mesmo tamanho do canvas
        // Se precisar de ajuste, adicione imageWidth/imageHeight ao objeto do backend
        // ...existing code...

        // TESTE: Desenhar um retângulo e texto fixo para garantir que o canvas está desenhando
        ctx.save();
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 200, 100);
        ctx.font = "32px Arial";
        ctx.fillStyle = "#00f";
        ctx.fillText("DEBUG CANVAS", 30, 80);
        ctx.restore();

        // Desenhar retângulos do backend
        if (backendData && Array.isArray(backendData)) {
          ctx.save();
          for (const item of backendData) {
            const [x, y, w, h] = item.coords;
            let x1 = x * scaleX;
            let y1 = y * scaleY;
            let x2 = (x + w) * scaleX;
            let y2 = (y + h) * scaleY;

            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            const width = maxX - minX;
            const height = maxY - minY;

            if (
              isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY) ||
              width <= 0 || height <= 0
            ) {
              continue;
            }

            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(minX, minY, width, height);

            // Desenhar nome e confiança
            const label = `${item.name} (${item.confidence.toFixed(2)})`;
            const fontSize = Math.max(12, Math.floor(height * 0.2));
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = "black";
            ctx.fillText(label, minX, minY - 4);
            ctx.fillText(item.clerk_id, minX, minY + fontSize + 2);
          }
          ctx.restore();
        }

        // Desenhar detecções do frontend e corresponder com backend
        if (faces.detections.length && backendData && Array.isArray(backendData)) {
          ctx.save();
          for (const face of faces.detections) {
            const boundingBox = face.boundingBox as {
              originX: number;
              originY: number;
              width: number;
              height: number;
            };

            const frontendCenterX = boundingBox.originX + boundingBox.width / 2;
            const frontendCenterY = boundingBox.originY + boundingBox.height / 2;

            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.strokeRect(
              boundingBox.originX,
              boundingBox.originY,
              boundingBox.width,
              boundingBox.height
            );

            let closestIdx = -1;
            let minDistance = Infinity;

            backendData.forEach((item, index) => {
              const [x, y, w, h] = item.coords;
              const x1 = x * scaleX;
              const y1 = y * scaleY;
              const x2 = (x + w) * scaleX;
              const y2 = (y + h) * scaleY;
              const backendCenterX = (x1 + x2) / 2;
              const backendCenterY = (y1 + y2) / 2;

              const dist = Math.hypot(
                frontendCenterX - backendCenterX,
                frontendCenterY - backendCenterY
              );

              if (dist < minDistance) {
                minDistance = dist;
                closestIdx = index;
              }
            });

            if (
              closestIdx !== -1 &&
              minDistance < MAX_ALLOWED_DISTANCE &&
              backendData[closestIdx].confidence >= 0 &&
              backendData[closestIdx].confidence <= 0.8
            ) {
              const item = backendData[closestIdx];
              const label = `${item.name} (${item.confidence.toFixed(2)})`;
              const fontSize = Math.max(16, Math.floor(boundingBox.height * 0.22));
              ctx.font = `${fontSize}px Arial`;
              ctx.textBaseline = "top";
              // Fundo branco translúcido dentro do quadrado verde
              const labelWidth = ctx.measureText(label).width;
              const clerkWidth = ctx.measureText(item.clerk_id).width;
              const maxWidth = Math.max(labelWidth, clerkWidth);
              const padding = 6;
              // Centralizar dentro do quadrado verde
              const xText = boundingBox.originX + boundingBox.width / 2 - maxWidth / 2 - padding / 2;
              const yText = boundingBox.originY + 2; // um pouco abaixo do topo do quadrado verde
              ctx.fillStyle = "rgba(255,255,255,0.85)";
              ctx.fillRect(xText, yText, maxWidth + padding, fontSize * 2 + 8);
              ctx.fillStyle = "#111";
              ctx.fillText(label, xText + padding / 2, yText + 2);
              ctx.fillText(item.clerk_id, xText + padding / 2, yText + fontSize + 4);
            }
          }
          ctx.restore();
        }

        animationFrameId = requestAnimationFrame(draw);
      };

      draw();
    };

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
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