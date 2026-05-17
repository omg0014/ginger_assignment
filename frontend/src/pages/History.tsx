import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ErrorState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '32px', marginBottom: '12px' }}>✕</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '16px',
        textTransform: 'lowercase',
        marginBottom: '8px',
      }}>
        could not load result
      </div>
      <div style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#888' }}>
        this job may still be processing or may have failed.
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ height: '28px', width: '60%', background: '#E8E5E0', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: '14px', width: '80%', background: '#E8E5E0', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: '80px', background: '#E8E5E0', border: '2px solid #D0CDCA', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ height: '40px', background: '#E8E5E0', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

function CheckRow({ check, isLast }: { check: any; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const passColor  = '#2D6A4F';
  const failColor  = '#F4737A';
  const checkColor = check.passed ? passColor : failColor;

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '1px solid #E8E5E0',
        padding: '14px 0',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(prev => !prev)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: '13px',
          flex: 1,
          textTransform: 'lowercase',
          color: '#111',
        }}>
          {check.label}
        </span>
        <span style={{
          fontFamily: 'DM Mono',
          fontSize: '10px',
          fontWeight: 500,
          padding: '2px 8px',
          border: `1.5px solid ${checkColor}`,
          color: checkColor,
          background: check.passed ? '#D8F3DC' : '#FFE8E8',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {check.passed ? 'PASS' : 'FAIL'}
        </span>
        <span style={{
          fontFamily: 'DM Mono',
          fontSize: '11px',
          color: '#888',
          width: '36px',
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {check.score?.toFixed(2)}
        </span>
        <span style={{
          fontFamily: 'DM Mono',
          fontSize: '12px',
          color: '#888',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}>
          ▾
        </span>
      </div>
      <div style={{
        height: '4px',
        background: '#E0DEDA',
        marginTop: '8px',
        border: '1px solid #D0CDCA',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.round((check.score || 0) * 100)}%`,
          background: check.passed ? passColor : failColor,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      {expanded && (
        <div style={{
          marginTop: '10px',
          fontFamily: 'DM Mono',
          fontSize: '12px',
          color: '#555',
          lineHeight: 1.6,
          padding: '10px 12px',
          background: '#F7F5F2',
          border: '1px solid #E0DEDA',
        }}>
          <div style={{ marginBottom: '4px' }}>
            {check.detail}
          </div>
          <div style={{ color: '#999', fontSize: '11px' }}>
            confidence: {check.confidence ? `${Math.round(check.confidence * 100)}%` : '—'} ·
            severity: {check.severity ?? '—'}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultContent({ result }: { result: any }) {
  const riskColor =
    result.riskLevel === 'HIGH'   ? '#F4737A' :
    result.riskLevel === 'MEDIUM' ? '#E9A84C' : '#2D6A4F';

  return (
    <div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '22px',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        marginBottom: '4px',
      }}>
        ANALYSIS RESULT
      </div>
      <div style={{
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#888',
        marginBottom: '20px',
      }}>
        {result.originalName}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '24px',
      }}>
        <div style={{
          border: '2px solid #111',
          padding: '14px 16px',
          background: result.riskLevel === 'HIGH' ? '#F4737A' : '#fff',
          boxShadow: '3px 3px 0px #111',
        }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'lowercase' }}>
            risk level
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '32px',
            color: '#111',
            lineHeight: 1,
          }}>
            {result.riskLevel}
          </div>
        </div>
        <div style={{
          border: '2px solid #111',
          padding: '14px 16px',
          boxShadow: '3px 3px 0px #111',
        }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'lowercase' }}>
            risk score
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '32px',
            color: '#111',
            lineHeight: 1,
          }}>
            {Math.round(result.overallRiskScore * 100)}%
          </div>
          <div style={{ height: '4px', background: '#E0DEDA', marginTop: '8px', border: '1px solid #CCC' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(result.overallRiskScore * 100)}%`,
              background: riskColor,
            }} />
          </div>
        </div>
        <div style={{
          border: '2px solid #111',
          padding: '14px 16px',
          boxShadow: '3px 3px 0px #111',
        }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#555', marginBottom: '6px', textTransform: 'lowercase' }}>
            processed in
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '32px',
            color: '#111',
            lineHeight: 1,
          }}>
            {result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(1)}s` : '—'}
          </div>
        </div>
        <div style={{
          border: '2px solid #111',
          padding: '14px 16px',
          boxShadow: '3px 3px 0px #111',
          background: result.numberPlate ? '#111' : '#fff',
        }}>
          <div style={{
            fontFamily: 'DM Mono',
            fontSize: '10px',
            color: result.numberPlate ? '#aaa' : '#555',
            marginBottom: '6px',
            textTransform: 'lowercase',
          }}>
            number plate
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: result.numberPlate ? '26px' : '32px',
            color: result.numberPlate ? '#fff' : '#111',
            lineHeight: 1,
            letterSpacing: result.numberPlate ? '0.08em' : 0,
          }}>
            {result.numberPlate ?? '—'}
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '13px',
        textTransform: 'lowercase',
        letterSpacing: '0.04em',
        marginBottom: '12px',
      }}>
        detection checks
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {result.checks?.map((check: any, i: number) => (
          <CheckRow key={check.name} check={check} isLast={i === result.checks.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  isOpen,
  onClose,
  result,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  isLoading: boolean;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '520px',
          maxWidth: '95vw',
          height: '100vh',
          background: '#fff',
          border: '2px solid #111',
          borderRight: 'none',
          boxShadow: '-6px 0px 0px #111',
          zIndex: 201,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid #111',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 10,
        }}>
          <span style={{
            fontFamily: 'DM Mono',
            fontSize: '11px',
            color: '#888',
          }}>
            #{result?.jobId?.slice(0, 8) || '...'}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #111',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'DM Mono',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #111',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.transform = 'translate(-1px,-1px)';
              (e.target as HTMLElement).style.boxShadow = '3px 3px 0px #111';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.transform = 'translate(0,0)';
              (e.target as HTMLElement).style.boxShadow = '2px 2px 0px #111';
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px', flex: 1 }}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : result ? (
            <ResultContent result={result} />
          ) : (
            <ErrorState />
          )}
        </div>
      </div>
    </>
  );
}

export default function History() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all status');
  const [riskFilter, setRiskFilter] = useState('all risk');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen]         = useState(false);

  function handleRowClick(jobId: string) {
    setSelectedJobId(jobId);
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setTimeout(() => setSelectedJobId(null), 300); // clear after slide-out animation
  }

  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', page, search, statusFilter, riskFilter],
    queryFn: () => axios.get(`${API_URL}/api/history`, { 
      params: { 
        page, 
        search, 
        status: statusFilter, 
        risk: riskFilter, 
        limit: 10 
      } 
    }).then(res => res.data),
    placeholderData: (previousData) => previousData
  });

  const { data: result, isLoading: isResultLoading } = useQuery({
    queryKey: ['result', selectedJobId],
    queryFn: () =>
      axios.get(`${API_URL}/api/jobs/${selectedJobId}/result`)
        .then(res => res.data),
    enabled: !!selectedJobId && panelOpen,
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });

  return (
    <div className="page-enter space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display uppercase">Analysis History</h1>
          <p className="font-body text-xs text-muted lowercase mt-1">{history?.total || 0} total records indexed</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="search by job id or plate..."
            className="search-input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option>all status</option>
          <option>completed</option>
          <option>failed</option>
          <option>processing</option>
        </select>
        <select 
          className="filter-select"
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
        >
          <option>all risk</option>
          <option>high</option>
          <option>medium</option>
          <option>low</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>job id</th>
              <th>file name</th>
              <th>status</th>
              <th>risk</th>
              <th>plate</th>
              <th>time</th>
              <th className="text-right">date</th>
            </tr>
          </thead>
          <tbody className="font-body text-xs">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12">loading records...</td></tr>
            ) : history?.data.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12">no records found.</td></tr>
            ) : (
              history?.data.map((job: any) => (
                <tr 
                  key={job.jobId} 
                  className="group"
                  onClick={() => handleRowClick(job.jobId)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = job.riskLevel === 'HIGH' ? '#FFF0F0' : '#F5F3F0';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  <td className="cell-id">#{job.jobId.slice(0, 8)}...</td>
                  <td className="lowercase">{job.originalName}</td>
                  <td>
                    <span className={`status-badge ${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className={`cell-score ${job.riskLevel?.toLowerCase()}`}>
                    {job.riskLevel || '—'}
                  </td>
                  <td className="font-bold tracking-widest">{job.numberPlate || '—'}</td>
                  <td>{job.processingTimeMs ? `${(job.processingTimeMs / 1000).toFixed(1)}s` : '—'}</td>
                  <td className="text-right text-muted">{new Date(job.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="page-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {[...Array(history?.totalPages || 1)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`page-btn ${page === i + 1 ? 'active' : ''}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPage(p => Math.min(history?.totalPages || 1, p + 1))}
          disabled={page === history?.totalPages}
          className="page-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ResultPanel 
        isOpen={panelOpen}
        onClose={handleClose}
        result={result}
        isLoading={isResultLoading}
      />
    </div>
  );
}
