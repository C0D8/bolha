"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from "@clerk/nextjs";

const CaptureAndUpload: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const totalImages = 5;
  const captureInterval = 1500;
  const { user } = useUser();
  const router = require('next/navigation').useRouter ? require('next/navigation').useRouter() : null;

  // Novo: animação de círculo pulsante para UX de "reconhecimento facial"
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (isCapturing) {
      setPulse(true);
    } else {
      setPulse(false);
    }
  }, [isCapturing]);

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
      let localSuccess = 0;
      let localError = 0;

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

                  const res = await fetch('/api/faces', {
                    method: 'POST',
                    body: formData,
                  });
                  if (res.ok) {
                    localSuccess++;
                  } else {
                    localError++;
                  }
                  imagesCaptured++;
                  setProgress((imagesCaptured / totalImages) * 100);
                  setSuccessCount(localSuccess);
                  setErrorCount(localError);

                  if (imagesCaptured < totalImages) {
                    setTimeout(captureAndSendImage, captureInterval);
                  } else {
                    setDone(true);
                    // Redireciona se pelo menos metade das fotos deram certo
                    if (localSuccess >= Math.ceil(totalImages / 2)) {
                      if (router) router.push("/");
                    }
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
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Overlay escurecido */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 5,
        pointerEvents: 'none',
      }} />
      {/* Círculo central oval vazado com fundo ao redor (volta ao design anterior) */}
      <div className='w-full h-full absolute flex items-center justify-center z-10'>
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
      {/* Dica de posicionamento */}
      <div style={{
        position: 'fixed',
        top: 'calc(50% + 180px)',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontWeight: 500,
        fontSize: 20,
        textShadow: '0 2px 8px #000',
        zIndex: 12,
        pointerEvents: 'none',
      }}>
        {isCapturing ? 'Mantenha seu rosto dentro do círculo' : 'Posicione seu rosto no círculo'}
      </div>
      {/* Video e canvas */}
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
      {/* Botão de iniciar captura - monocromático, minimalista e moderno */}
      <button
        onClick={() => setIsCapturing(true)}
        disabled={isCapturing}
        style={{
          position: "fixed",
          bottom: "36px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
          padding: "12px 28px",
          fontSize: "16px",
          fontWeight: 600,
          background: isCapturing ? "#bdbdbd" : "#222",
          color: isCapturing ? "#eee" : "#fff",
          border: "none",
          borderRadius: "16px",
          boxShadow: isCapturing ? "none" : "0 2px 8px #0002",
          cursor: isCapturing ? "not-allowed" : "pointer",
          letterSpacing: 1,
          transition: "background 0.2s, box-shadow 0.2s, color 0.2s",
          outline: isCapturing ? "none" : "2px solid #444",
          outlineOffset: isCapturing ? 0 : 2,
          minWidth: 160,
        }}
      >
        {isCapturing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: '#444', display: 'inline-block', animation: 'dotPulse 1s infinite alternate', marginRight: 6
            }} />
            Capturando...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/></svg>
            Iniciar Captura
          </span>
        )}
      </button>
      <style>{`
        @keyframes dotPulse {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      {/* Barra de progresso e feedback - minimalista, monocromática */}
      <div style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "220px",
        zIndex: 15,
        borderRadius: "8px",
        display: done ? 'block' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'none',
        boxShadow: 'none',
        padding: 0,
      }}>
        <div style={{
          width: "100%",
          height: '6px',
          background: '#333',
          borderRadius: '6px',
          marginBottom: '8px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#fff',
              borderRadius: '6px',
              transition: 'width 0.3s cubic-bezier(.4,1.4,.6,1)',
            }}
          />
        </div>
        <div style={{ fontWeight: 500, fontSize: 13, color: '#fff', marginBottom: 2, textShadow: '0 1px 4px #0008', letterSpacing: 0.5 }}>
          {done ? (
            successCount >= Math.ceil(totalImages / 2)
              ? 'Cadastro realizado!'
              : 'Não foi possível cadastrar.'
          ) : (
            `Progresso: ${successCount} de ${totalImages}`
          )}
        </div>
        {done && successCount < Math.ceil(totalImages / 2) && (
          <button
            onClick={() => { setIsCapturing(false); setProgress(0); setSuccessCount(0); setErrorCount(0); setDone(false); }}
            style={{
              marginTop: 6,
              padding: '7px 16px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Tentar Novamente
          </button>
        )}
      </div>
      {/* Keyframes para animação pulsante */}
      <style>{`
        @keyframes pulseCircle {
          0% { box-shadow: 0 0 0 0 #4caf5055; }
          50% { box-shadow: 0 0 32px 16px #4caf5055; }
          100% { box-shadow: 0 0 0 0 #4caf5055; }
        }
      `}</style>
    </div>
  );
};

export default CaptureAndUpload;
