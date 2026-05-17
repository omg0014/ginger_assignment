import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VerifyImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const uploadImage = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData);
      setJobId(res.data.jobId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const { data: jobStatus } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => axios.get(`${API_URL}/api/jobs/${jobId}`).then(res => res.data),
    enabled: !!jobId,
    refetchInterval: (query: any) => {
      const data = query.state.data;
      return (data?.status === 'completed' || data?.status === 'failed') ? false : 2000;
    }
  });

  const { data: result } = useQuery({
    queryKey: ['result', jobId],
    queryFn: () => axios.get(`${API_URL}/api/jobs/${jobId}/result`).then(res => res.data),
    enabled: jobStatus?.status === 'completed'
  });

  return (
    <div className="page-enter space-y-6">
      <div className="hero-card">
        <h1 className="hero-title">Verify Image</h1>
        <p className="hero-subtitle">Upload and analyze vehicle photos for authenticity and risk assessment.</p>
      </div>

      {!jobId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="upload-icon mx-auto" />
              <p className="upload-title">drag image here</p>
              <p className="upload-hint">or click to browse files</p>
              <p className="mt-4 text-[10px] font-body text-muted uppercase tracking-widest">supported: jpg · png · webp · max 10mb</p>
            </div>

            {preview && (
              <div className="upload-preview">
                <img src={preview} alt="Preview" className="preview-image" />
                <div className="preview-meta">
                  <p className="preview-filename">{file?.name}</p>
                  <p className="preview-detail">{(file!.size / (1024 * 1024)).toFixed(2)} MB · {file?.type}</p>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={uploadImage}
                      disabled={isUploading}
                      className="btn-primary"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'analyze image'}
                    </button>
                    <button onClick={() => { setFile(null); setPreview(null); }} className="btn-secondary">clear</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card h-fit">
            <h3 className="card-title mb-4">upload instructions</h3>
            <ul className="space-y-4 font-body text-xs text-muted list-disc pl-4 lowercase">
              <li>ensure vehicle plate is clearly visible</li>
              <li>avoid extreme angles or heavy shadows</li>
              <li>system detects blur, brightness, and tampering</li>
              <li>average processing time: 3-5 seconds</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed' && (
            <div className="status-card">
              <p className="result-job-id">job id: {jobId}</p>
              <h2 className="text-3xl font-display uppercase mt-2 mb-6">analyzing image...</h2>
              <div className="progress-bar-track">
                <div className="progress-bar-fill active w-[65%]" />
              </div>
              <p className="font-body text-xs text-muted mt-4 lowercase italic">running 8 detection layers in parallel</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="result-header">
                <div>
                  <p className="result-job-id">job id: {jobId}</p>
                  <h1 className="result-title">analysis complete</h1>
                </div>
                <div className={`risk-badge-lg ${result.riskLevel.toLowerCase()}`}>
                  {result.riskLevel} RISK
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card md:col-span-2">
                  <div className="card-header">
                    <h2 className="card-title">risk score</h2>
                  </div>
                  <div className="risk-score-display">{Math.round(result.overallRiskScore * 100)}%</div>
                  <div className="risk-score-bar-track">
                    <div
                      className={`risk-score-bar-fill ${result.riskLevel.toLowerCase()}`}
                      style={{ width: `${result.overallRiskScore * 100}%` }}
                    />
                  </div>
                  <div className="risk-score-labels mt-2">
                    <span>safe (0%)</span>
                    <span>risk (100%)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="card bg-black text-white py-8 text-center">
                    <div className="font-body text-[10px] uppercase text-gray-400 mb-2">detected plate</div>
                    <div className="plate-display">{result.numberPlate || 'NO PLATE'}</div>
                  </div>
                  <div className="card">
                    <h3 className="card-title text-sm mb-2">image dimensions</h3>
                    <p className="font-body text-xl font-bold">{result.imageDimensions.width} × {result.imageDimensions.height}px</p>
                  </div>
                </div>
              </div>

              <div className="checks-grid">
                {result.checks.map((check: any) => (
                  <div key={check.name} className={`check-card ${check.passed ? 'pass' : 'fail'}`}>
                    <div className="check-card-header">
                      <span className="check-name">{check.label}</span>
                      <span className={`check-badge ${check.passed ? 'pass' : 'fail'}`}>
                        {check.passed ? 'PASS' : 'FAIL'} · {check.severity}
                      </span>
                    </div>
                    <div className="check-score-bar-track">
                      <div
                        className={`check-score-bar-fill ${check.passed ? 'bg-green' : 'bg-pink'}`}
                        style={{ width: `${check.score * 100}%`, backgroundColor: check.passed ? '#2D6A4F' : '#F4737A' }}
                      />
                    </div>
                    <p className="check-detail">{check.detail}</p>
                    <p className="check-confidence">confidence: {Math.round(check.confidence * 100)}%</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setJobId(null)} className="btn-primary">analyze another image</button>
                <button className="btn-secondary">view in history →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
