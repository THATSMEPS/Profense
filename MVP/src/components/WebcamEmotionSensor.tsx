"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { usePulse } from '@/store/pulseStore';

export default function WebcamEmotionSensor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const updateSignal = usePulse((s) => s.updateSignal);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream as any;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        console.warn('Webcam setup failed', e);
      }
    }
    setup();
    return () => {
      cancelled = true;
      const tracks = (videoRef.current?.srcObject as MediaStream | undefined)?.getTracks() || [];
      tracks.forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let handle: number;
    const loop = async () => {
      const video = videoRef.current;
      if (video) {
        const det = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        if (det?.expressions) {
          const exp = det.expressions as any;
          const happiness = exp.happy ?? 0;
          const anger = exp.angry ?? 0;
          const sad = exp.sad ?? 0;
          updateSignal('face_happiness', happiness);
          updateSignal('face_anger', anger);
          updateSignal('face_sad', sad);
        }
      }
      handle = window.setTimeout(loop, 1200);
    };
    loop();
    return () => clearTimeout(handle);
  }, [ready, updateSignal]);

  return (
    <div className="card">
      <h3>Webcam Emotion</h3>
      <video ref={videoRef} muted playsInline />
      <small>On-device emotion estimation (face-api.js)</small>
    </div>
  );
}




