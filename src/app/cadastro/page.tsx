"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from "@clerk/nextjs"; // Importa o hook do Clerk

const CaptureAndUpload: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const totalImages = 20;
  const captureInterval = 1500;
  const { user } = useUser(); // Obtem dados do usuário Clerk

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          startCapturing();
        }
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
      }
    };

    const startCapturing = () => {
      let imagesCaptured = 0;

      const captureAndSendImage = async () => {
        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && user?.id) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append('imagem', blob, `image_${imagesCaptured}.jpg`);
                  formData.append('clerk_id', user.id); // Inclui o ID do usuário Clerk

                  // Enviar para o backend
                  await fetch('/api/faces', {
                    method: 'POST',
                    body: formData,
                  });

                  imagesCaptured++;
                  setProgress((imagesCaptured / totalImages) * 100);

                  if (imagesCaptured < totalImages) {
                    setTimeout(captureAndSendImage, captureInterval);
                  } else {
                    console.log('Captura concluída.');
                  }
                }
              }, 'image/jpeg');
            }
          }
        } catch (error) {
          console.error('Erro ao capturar ou enviar a imagem:', error);
        }
      };

      setTimeout(captureAndSendImage, captureInterval);
    };

    if (user) startCamera();
  }, [user]);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline width="640" height="480" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ width: '100%', backgroundColor: '#ddd', marginTop: '10px' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '30px',
            backgroundColor: '#4caf50',
            textAlign: 'center',
            lineHeight: '30px',
            color: 'white',
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default CaptureAndUpload;
