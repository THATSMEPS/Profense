"use client";
import React, { useEffect, useRef, useState } from 'react';
import { usePulse } from '@/store/pulseStore';

export default function VoiceSensor() {
  const [recording, setRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const updateSignal = usePulse((s) => s.updateSignal);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function toggleRecording() {
    if (recording) {
      setRecording(false);
      recorderRef.current?.stop();
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    mediaStreamRef.current = stream;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];
      const fd = new FormData();
      fd.append('file', blob, 'audio.webm');
      try {
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.text) {
          updateSignal('speech_len', Math.min(1, data.text.length / 120));
        }
      } catch (e) {
        // ignore
      }
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);

    // Metering loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let raf: number;
    const loop = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length); // 0..~1
      updateSignal('voice_rms', Math.min(1, rms * 3));
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  return (
    <div className="card">
      <h3>Voice Sensor</h3>
      <button className="button" onClick={toggleRecording}>{recording ? 'Stop Mic' : 'Start Mic'}</button>
      <div style={{ height: 32, marginTop: 8, background: '#11162a', border: '1px solid #2a2f55', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        {/* Simple RMS-based bar */}
        {/* We can't read state here directly; a full waveform needs a canvas. Keeping MVP lightweight. */}
        <div id="voice-bar" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'transparent' }} />
      </div>
      <p><small>Measures voice intensity; transcription is optional.</small></p>
    </div>
  );
}




