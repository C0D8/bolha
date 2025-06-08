"use client";

import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  FaceDetector,
} from "@mediapipe/tasks-vision";

export default function FaceDetectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

      // Função para enviar a imagem ao backend
      const sendImageToBackend = async () => {
        if (!canvas) return;
      
        canvas.toBlob(async (blob) => {
          if (!blob) return;
      
          const formData = new FormData();
          formData.append("imagem", blob, "canvas_image.jpg");
      
          try {
            const res = await fetch("/api/faces/recognition", {
              method: "POST",
              body: formData,
            });
      
            if (!res.ok) {
              throw new Error("Erro na resposta do servidor");
            }
      
            console.log("Imagem enviada com sucesso!");
          } catch (error) {
            console.error("Erro ao enviar imagem:", error);
          }
        }, "image/jpeg");
      };
      

      // Configura o intervalo para enviar a imagem a cada 5 segundos
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

        if (faces.detections.length) {
          for (const face of faces.detections) {
            if (face.boundingBox) {
              const boundingBox = face.boundingBox as unknown as {
                originX: number;
                originY: number;
                width: number;
                height: number;
              };

              const xOffset = boundingBox.originX + boundingBox.width + 10;
              const yOffset = boundingBox.originY;

              const fontSize = Math.max(
                12,
                Math.floor(boundingBox.height * 0.2)
              );
              ctx.font = `${fontSize}px Arial`;
              ctx.fillStyle = "black";
              ctx.fillText("Face Detectada", xOffset, yOffset);
            }
          }
        }

        animationFrameId = requestAnimationFrame(draw);
      };

      draw();
    };

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId); // Limpa o intervalo ao desmontar
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