import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const systemLayers = [
  {
    name: 'Layer 1: Blur Detection (Sharp)',
    desc: 'Analyzes pixel standard deviation to detect blurry or out-of-focus vehicle images.',
  },
  {
    name: 'Layer 2: Brightness Analysis (Sharp)',
    desc: 'Checks mean channel brightness to flag underexposed (low light) or overexposed images.',
  },
  {
    name: 'Layer 3: Duplicate Detection (MD5)',
    desc: 'Computes a file hash and checks the database for exact duplicate uploads.',
  },
  {
    name: 'Layer 4: Screenshot Detection (Heuristics)',
    desc: 'Detects screen resolution patterns, missing EXIF camera data, and UI aspect ratios.',
  },
  {
    name: 'Layer 5: Dimension Validation',
    desc: 'Validates image width, height, and aspect ratio against acceptable vehicle photo ranges.',
  },
  {
    name: 'Layer 6: Number Plate OCR (Tesseract.js)',
    desc: 'Extracts text from the image and validates against Indian number plate format (XX00XX0000).',
  },
  {
    name: 'Layer 7: Metadata Analysis (EXIF)',
    desc: 'Inspects EXIF data for editing software traces, missing GPS, and timestamp inconsistencies.',
  },
  {
    name: 'Layer 8: Tamper Detection (Heuristics)',
    desc: 'Compares per-quadrant pixel variance to detect signs of selective image editing.',
  },
  {
    name: 'Risk Scoring',
    desc: 'Combines all 8 check scores using a weighted formula to produce a final 0–100% risk score. Risk levels: LOW (0–20%) · MEDIUM (20–23%) · HIGH (23–100%)',
  },
];

function SystemOverviewCard() {
  return (
    <div style={{
      background: '#ffffff',
      border: '2px solid #111111',
      boxShadow: '4px 4px 0px #111111',
      borderRadius: 0,
      marginTop: '16px',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 32px 20px',
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '26px',
          textTransform: 'lowercase',
          letterSpacing: '-0.01em',
          color: '#111111',
        }}>
          system overview
        </span>
        <span style={{
          fontSize: '22px',
          color: '#111111',
          lineHeight: 1,
        }}>
          ↗
        </span>
      </div>

      {/* Layers List */}
      <div style={{ padding: '0 32px 28px' }}>
        {systemLayers.map((layer, index) => (
          <div
            key={index}
            style={{
              paddingTop: '18px',
              paddingBottom: '18px',
              borderBottom: index < systemLayers.length - 1
                ? '1px solid #E8E5E0'
                : 'none',
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              color: '#111111',
              marginBottom: '6px',
              letterSpacing: '0.01em',
            }}>
              {layer.name}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px',
              color: '#666666',
              lineHeight: 1.6,
            }}>
              {layer.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/analytics/summary`);
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 font-body lowercase">loading system metrics...</div>;

  return (
    <div className="page-enter">
      <div className="hero-card">
        <h1 className="hero-title">Vehicle Scope</h1>
        <p className="hero-subtitle">
          Intelligent media processing pipeline for automated vehicle inspection and authenticity verification.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">total uploads</div>
          <div className="stat-value">{analytics?.totalJobs || 0}</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-label">high risk detected</div>
          <div className="stat-value">{analytics?.highRiskCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">low + medium risk</div>
          <div className="stat-value">{analytics?.lowMediumRiskCount || 0}</div>
        </div>
      </div>
      <SystemOverviewCard />
    </div>
  );
}
