"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from "@clerk/nextjs";

const CaptureAndUpload: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const totalImages = 5;
  const captureInterval = 1500;
  const { user } = useUser();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
      }
    };

    if (user) {
      startCamera();
    }
  }, [user]);

  useEffect(() => {
    if (isCapturing) {
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
                  formData.append('clerk_id', user.id);

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
    }
  }, [isCapturing, user]);

  return (
    <div style={{ margin: 0, padding: 0 }}>

<div className='w-full h-full absolute flex items-center justify-center z-10'>
  {/* Janela oval vazada com fundo ao redor */}
  <div
    style={{
      width: '20rem',
      height: '26rem',
      borderRadius: '50%',
      outline: '9999px solid rgba(248, 250, 252, 0.72)',
      backgroundColor: 'transparent',
    }}
  ></div>
</div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 2,
        }}
      />
      <button
        onClick={() => setIsCapturing(true)}
        disabled={isCapturing}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 15,
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isCapturing ? "not-allowed" : "pointer"
        }}
      >
        {isCapturing ? 'Capturando...' : 'Iniciar'}
      </button>
      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "200px",
        backgroundColor: "#ddd",
        zIndex: 15,
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <div
          style={{
            width: `${progress}%`,
            height: '30px',
            backgroundColor: '#4caf50',
            textAlign: 'center',
            lineHeight: '30px',
            color: 'white',
            transition: 'width 0.3s ease'
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default CaptureAndUpload;
