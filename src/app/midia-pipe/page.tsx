"use client";

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";
import { useRouter } from "next/navigation";

export default function FaceDetectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const MAX_ALLOWED_DISTANCE = 200;
  const [backendData, setBackendData] = useState<
    null | Array<{
      name: string;
      confidence: number;
      coords: [number, number, number, number];
      face: string;
      clerk_id: string;
    }>
  >(null);
  const backendDataRef = useRef<typeof backendData>(null);
  // Move boundingBoxesRef to the top level
  const boundingBoxesRef = useRef<
    Array<{
      boundingBox: { originX: number; originY: number; width: number; height: number };
      clerk_id: string;
      confidence: number;
    }>
  >([]);
  const router = useRouter();

  useEffect(() => {
    let detector: FaceDetector;
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;

    const canvas = canvasRef.current!;
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;

      for (const box of boundingBoxesRef.current) {
        const { originX, originY, width, height } = box.boundingBox;
        const { clerk_id, confidence } = box;
        if (
          clickX >= originX &&
          clickX <= originX + width &&
          clickY >= originY &&
          clickY <= originY + height &&
          confidence >= 0 &&
          confidence <= 0.8
        ) {
          router.push(`/users/${clerk_id}`);
          break;
        }
      }
    };

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
      const ctx = canvas.getContext("2d")!;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      canvas.addEventListener("click", handleCanvasClick);

      const sendImageToBackend = async () => {
        if (!canvas || !video) return;

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
            const recognitions = Array.isArray(data.recognitions) ? data.recognitions : data;
            backendDataRef.current = recognitions;
            setBackendData(recognitions);
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
        boundingBoxesRef.current = [];

        let scaleX = 4;
        let scaleY = 4;

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
              boundingBoxesRef.current.push({
                boundingBox,
                clerk_id: item.clerk_id,
                confidence: item.confidence,
              });

              const label = `${item.name} (${item.confidence.toFixed(2)})`;
              const fontSize = Math.max(16, Math.floor(boundingBox.height * 0.22));
              ctx.font = `${fontSize}px Arial`;
              ctx.textBaseline = "top";
              const labelWidth = ctx.measureText(label).width;
              const clerkWidth = ctx.measureText(item.clerk_id).width;
              const maxWidth = Math.max(labelWidth, clerkWidth);
              const padding = 6;
              const xText = boundingBox.originX + boundingBox.width / 2 - maxWidth / 2 - padding / 2;
              const yText = boundingBox.originY - 2;
              ctx.fillStyle = "#111";
              ctx.fillText(label, xText + padding / 2, yText + 2);
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
      if (canvas) canvas.removeEventListener("click", handleCanvasClick);
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