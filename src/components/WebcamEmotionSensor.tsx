"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { usePulse } from '@/store/pulseStore';

export default function WebcamEmotionSensor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState<string>('—');
  const [emoji, setEmoji] = useState<string>('📷');
  const [scores, setScores] = useState<{ happy: number; angry: number; sad: number; neutral: number }>({ happy: 0, angry: 0, sad: 0, neutral: 0 });
  const updateSignal = usePulse((s) => s.updateSignal);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        const CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN),
          faceapi.nets.faceExpressionNet.loadFromUri(CDN),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN),
        ]);
        setReady(true);
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
    if (!ready || !active) return;
    let handle: number;
    const loop = async () => {
      const video = videoRef.current as HTMLVideoElement | null;
      if (video) {
        const det = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        if (det?.expressions) {
          const exp: any = det.expressions;
          const happiness = exp.happy ?? 0;
          const anger = exp.angry ?? 0;
          const sad = exp.sad ?? 0;
          const neutral = exp.neutral ?? 0;
          updateSignal('face_happiness', happiness);
          updateSignal('face_anger', anger);
          updateSignal('face_sad', sad);
          setScores({ happy: happiness, angry: anger, sad, neutral });
          const top = topLabel({ happiness, anger, sad, neutral });
          setLabel(top.label);
          setEmoji(top.emoji);
        }
      }
      handle = window.setTimeout(loop, 1200);
    };
    loop();
    return () => clearTimeout(handle);
  }, [ready, active, updateSignal]);

  async function toggleCamera() {
    if (!active) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream as any;
          await (videoRef.current as HTMLVideoElement).play();
          setActive(true);
        }
      } catch (e) {
        console.warn('User denied camera');
      }
    } else {
      const tracks = (videoRef.current?.srcObject as MediaStream | undefined)?.getTracks() || [];
      tracks.forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
    }
  }

  return (
    <div className="card">
      <h3>Webcam Emotion</h3>
      <video ref={videoRef} muted playsInline />
      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={toggleCamera}>{active ? 'Stop Camera' : 'Start Camera'}</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <b>Detected: {label}</b>
        <small style={{ opacity: 0.8 }}>H:{(scores.happy*100|0)}% A:{(scores.angry*100|0)}% S:{(scores.sad*100|0)}%</small>
      </div>
      <small>On-device emotion estimation (face-api.js)</small>
    </div>
  );
}

function topLabel(v: { happiness: number; anger: number; sad: number; neutral: number }) {
  const entries: [string, number, string][] = [
    ['Happy', v.happiness, '😊'],
    ['Frustrated', v.anger, '😠'],
    ['Sad', v.sad, '😔'],
    ['Neutral', v.neutral, '😐'],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return { label: entries[0][0], emoji: entries[0][2] };
}


