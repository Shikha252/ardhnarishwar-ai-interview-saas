// High-Performance Canvas Radar Chart for 9 AI Evaluation Metrics
import React, { useEffect, useRef } from 'react';

export default function RadarChart({ metrics = {}, width = 340, height = 300 }) {
  const canvasRef = useRef(null);

  const keys = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'knowledge', label: 'Knowledge' },
    { key: 'technicalCompetency', label: 'Technical' },
    { key: 'communication', label: 'Communication' },
    { key: 'problemSolving', label: 'Problem Solving' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'completeness', label: 'Completeness' },
    { key: 'roleSpecific', label: 'Role Fit' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 42;
    const totalPoints = keys.length;
    const angleStep = (Math.PI * 2) / totalPoints;

    // 1. Draw Background Concentric Polygons (Rings)
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(level => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < totalPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius * level);
        const y = centerY + Math.sin(angle) * (radius * level);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // 2. Draw Spokes and Labels
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < totalPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Spoke line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label
      const labelX = centerX + Math.cos(angle) * (radius + 24);
      const labelY = centerY + Math.sin(angle) * (radius + 24);
      ctx.fillText(keys[i].label, labelX, labelY);
    }

    // 3. Draw Data Polygon
    ctx.beginPath();
    keys.forEach((k, i) => {
      const val = (metrics[k.key] !== undefined ? metrics[k.key] : 70) / 100;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * Math.max(0.15, val));
      const y = centerY + Math.sin(angle) * (radius * Math.max(0.15, val));

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill with glowing gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Draw Vertex Dots
    keys.forEach((k, i) => {
      const val = (metrics[k.key] !== undefined ? metrics[k.key] : 70) / 100;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * Math.max(0.15, val));
      const y = centerY + Math.sin(angle) * (radius * Math.max(0.15, val));

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#080c14';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

  }, [metrics, width, height]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ width, height }} />
    </div>
  );
}
