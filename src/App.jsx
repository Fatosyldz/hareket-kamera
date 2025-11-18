// src/App.jsx
import { useRef, useState, useEffect } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const prevFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [fps, setFps] = useState(0);
  const [cpuLoad, setCpuLoad] = useState(0);

  const THRESHOLD = 28;
  const MIN_AREA = 600;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('tr-TR'));
      setCpuLoad(Math.round(45 + Math.random() * 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fpsTimer = setInterval(() => {
      const now = performance.now();
      if (lastTimeRef.current) {
        const delta = now - lastTimeRef.current;
        const currentFps = Math.round(1000 / delta * frameCountRef.current);
        setFps(currentFps);
      }
      lastTimeRef.current = now;
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsTimer);
  }, []);

  const startCamera = async () => {
    if (isStreaming) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
          setIsStreaming(true);
          startMotionDetection();
        };
      }
    } catch (err) {
      alert('Kamera açılamadı: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsStreaming(false);
    setMotionDetected(false);
    prevFrameRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '36px Orbitron';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'center';
      ctx.fillText('KAMERA KAPALI', canvas.width / 2, canvas.height / 2);
    }
  };

  const startMotionDetection = () => {
    const detect = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      frameCountRef.current++;
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 720, 480);
      const frame = ctx.getImageData(0, 0, 720, 480);

      if (prevFrameRef.current) {
        const motion = compareFrames(prevFrameRef.current, frame);
        if (motion > MIN_AREA) {
          setMotionDetected(true);
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjV...');
          audio.play().catch(() => {});
        } else {
          setMotionDetected(false);
        }
      }
      prevFrameRef.current = frame;

      animationRef.current = requestAnimationFrame(detect);
    };
    animationRef.current = requestAnimationFrame(detect);
  };

  const compareFrames = (prev, curr) => {
    let count = 0;
    for (let i = 0; i < prev.data.length; i += 4) {
      const diff = Math.abs(prev.data[i] - curr.data[i]) +
                   Math.abs(prev.data[i+1] - curr.data[i+1]) +
                   Math.abs(prev.data[i+2] - curr.data[i+2]);
      if (diff > THRESHOLD * 3) count++;
    }
    return count;
  };

  return (
    <div className="app">
      <div className="top-bar">
        <div className="system-name">SECURECAM v2.1</div>
        <div className="time-display">{currentTime}</div>
        <div className="status-lights">
          <div className="light">
            <div className={`light-dot ${isStreaming ? 'online' : ''}`}></div>
            <span>{isStreaming ? 'CANLI' : 'KAPALI'}</span>
          </div>
          <div className="light">
            <div className={`light-dot ${motionDetected ? 'motion' : ''}`}></div>
            <span>HAREKET</span>
          </div>
        </div>
      </div>

      <div className="main-feed">
        <div className={`camera-box ${motionDetected ? 'motion-active' : ''}`}>
          <div className="camera-id">KAMERA 01 - GİRİŞ</div>
          <div className="scan-line"></div>
          
          <video ref={videoRef} width="720" height="480" playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} width="720" height="480" className="video-canvas" />

          {motionDetected && (
            <div className="motion-alert">
              <div className="alert-icon">!</div>
              <div>HAREKET</div>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-panel">
        <div className="control-buttons">
          <button onClick={isStreaming ? stopCamera : startCamera} className="btn-3d">
            {isStreaming ? 'DURDUR' : 'BAŞLAT'}
          </button>
        </div>

        <div className="data-stream">
          <div className="data-item">
            <div className="data-label">FPS</div>
            <div className="data-value">{fps}</div>
          </div>
          <div className="data-item">
            <div className="data-label">CPU</div>
            <div className="data-value">{cpuLoad}%</div>
          </div>
          <div className="data-item">
            <div className="data-label">AĞ</div>
            <div className="data-value">1.2 Mbps</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;