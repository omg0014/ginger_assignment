import React, { useState } from 'react';

const flowSteps = [
  { label: 'user browser',     highlight: false },
  { label: 'upload api',       highlight: true  },
  { label: 'postgres db',      highlight: false },
  { label: 'bullmq queue',     highlight: true  },
  { label: 'worker process',   highlight: false },
  { label: '8 checks',         highlight: true  },
  { label: 'complete',         highlight: false },
];

const layers = [
  { num: '01', name: 'blur detection',       desc: 'pixel std-dev sharpness analysis via sharp' },
  { num: '02', name: 'brightness analysis',  desc: 'mean channel luminance, flags dark/overexposed' },
  { num: '03', name: 'duplicate detection',  desc: 'md5 file hash matched against job history' },
  { num: '04', name: 'screenshot detection', desc: 'resolution heuristics + missing exif signals' },
  { num: '05', name: 'dimension validation', desc: 'width, height, and aspect ratio bounds check' },
  { num: '06', name: 'number plate ocr',     desc: 'tesseract.js dual-pass + indian plate regex' },
  { num: '07', name: 'metadata analysis',    desc: 'exif inspection for editing software + gps' },
  { num: '08', name: 'tamper detection',     desc: 'quadrant variance ratio for selective edits' },
];

const stack = [
  {
    name: 'Express + Node.js',
    tag: 'api',
    desc: 'REST api server with async middleware',
  },
  {
    name: 'BullMQ + Redis',
    tag: 'queue',
    desc: 'job queue with retries and concurrency control',
  },
  {
    name: 'PostgreSQL + Prisma',
    tag: 'database',
    desc: 'relational store with type-safe ORM',
  },
  {
    name: 'Sharp',
    tag: 'image processing',
    desc: 'high-performance pixel analysis and preprocessing',
  },
  {
    name: 'Tesseract.js',
    tag: 'ocr',
    desc: 'dual-pass text extraction with char whitelist',
  },
  {
    name: 'Docker Compose',
    tag: 'infrastructure',
    desc: 'one-command local deployment of all services',
  },
];

const decisions = [
  {
    q: 'why bullmq over a simple settimeout?',
    a: 'settimeout is not reliable for production — it lives in-memory and dies with the process. bullmq persists jobs in redis, survives server restarts, supports automatic retries with exponential backoff, and allows the worker to scale independently from the api server.',
  },
  {
    q: 'why per-check error isolation?',
    a: 'if one check throws (e.g. tesseract fails on a corrupt image), the other 7 checks should still complete and produce results. each check is wrapped in a try/catch that returns an error result object instead of throwing, so promise.all never rejects the whole batch.',
  },
  {
    q: 'why md5 for duplicate detection?',
    a: 'md5 is fast and produces a fixed 32-char hash — perfect for exact-match duplicate detection at the file level. it is not cryptographically secure, but that is not the requirement here. if perceptual similarity detection were needed (similar but not identical images), phash or ssim would be used instead.',
  },
  {
    q: 'what would you improve with more time?',
    a: 'perceptual hashing for near-duplicate images, a proper ml model for blur instead of std-dev heuristics, websockets instead of polling for real-time status, s3 for file storage instead of local disk, and a confidence calibration pass that tunes check weights based on labeled data.',
  },
];

function DetectionLayersCard() {
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #111',
      boxShadow: '4px 4px 0px #111',
      padding: '28px 28px',
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '18px',
        textTransform: 'lowercase',
        marginBottom: '4px',
      }}>
        detection layers
      </div>
      <div style={{
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#888',
        marginBottom: '20px',
      }}>
        8 checks · run concurrently via promise.all
      </div>

      {layers.map((layer, i) => (
        <div key={layer.num} style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          paddingTop: '14px',
          paddingBottom: '14px',
          borderBottom: i < layers.length - 1 ? '1px solid #E8E5E0' : 'none',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: '#111',
            color: '#fff',
            fontFamily: 'DM Mono',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
          }}>
            {layer.num}
          </div>

          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'lowercase',
              color: '#111',
              marginBottom: '3px',
            }}>
              {layer.name}
            </div>
            <div style={{
              fontFamily: 'DM Mono',
              fontSize: '11px',
              color: '#888',
              lineHeight: 1.5,
            }}>
              {layer.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TechStackCard() {
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #111',
      boxShadow: '4px 4px 0px #111',
      padding: '28px 28px',
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '18px',
        textTransform: 'lowercase',
        marginBottom: '4px',
      }}>
        tech stack
      </div>
      <div style={{
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#888',
        marginBottom: '20px',
      }}>
        6 core technologies
      </div>

      {stack.map((item, i) => (
        <div key={item.name} style={{
          paddingTop: '14px',
          paddingBottom: '14px',
          borderBottom: i < stack.length - 1 ? '1px solid #E8E5E0' : 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              color: '#111',
            }}>
              {item.name}
            </span>

            <span style={{
              fontFamily: 'DM Mono',
              fontSize: '9px',
              padding: '2px 7px',
              border: '1.5px solid #111',
              color: '#111',
              textTransform: 'lowercase',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}>
              {item.tag}
            </span>
          </div>

          <div style={{
            fontFamily: 'DM Mono',
            fontSize: '11px',
            color: '#888',
            lineHeight: 1.5,
          }}>
            {item.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

function DesignDecisions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #111',
      boxShadow: '4px 4px 0px #111',
      marginTop: '16px',
      marginBottom: '16px',
    }}>
      <div style={{
        padding: '28px 32px 20px',
        borderBottom: '2px solid #111',
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          textTransform: 'lowercase',
        }}>
          design decisions
        </div>
        <div style={{
          fontFamily: 'DM Mono',
          fontSize: '11px',
          color: '#888',
          marginTop: '4px',
        }}>
          trade-offs and reasoning · click to expand
        </div>
      </div>

      {decisions.map((d, i) => (
        <div
          key={i}
          style={{ borderBottom: i < decisions.length - 1 ? '1px solid #E8E5E0' : 'none' }}
        >
          <div
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 32px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'lowercase',
              color: '#111',
            }}>
              {d.q}
            </span>
            <span style={{
              fontFamily: 'DM Mono',
              fontSize: '18px',
              color: '#888',
              flexShrink: 0,
              marginLeft: '16px',
              transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
            }}>
              +
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateRows: openIndex === i ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                padding: '0 32px 20px',
                fontFamily: 'DM Mono',
                fontSize: '12px',
                color: '#555',
                lineHeight: 1.8,
                background: '#FAFAF8',
                borderTop: '1px solid #E8E5E0',
                paddingTop: '16px',
              }}>
                {d.a}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Architecture() {
  return (
    <div className="page-enter">
      <div style={{
        background: 'linear-gradient(135deg, #FAC0C2 0%, #F4737A 100%)',
        border: '2px solid #111',
        boxShadow: '4px 4px 0px #111',
        padding: '40px 40px',
        marginBottom: '16px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(48px, 8vw, 80px)',
          color: '#111',
          letterSpacing: '0.03em',
          lineHeight: 1,
          marginBottom: '12px',
        }}>
          ARCHITECTURE
        </div>
        <div style={{
          fontFamily: 'DM Mono',
          fontSize: '13px',
          color: '#111',
          opacity: 0.75,
          textTransform: 'lowercase',
        }}>
          how vehiclescope processes and analyzes vehicle images under the hood.
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '2px solid #111',
        boxShadow: '4px 4px 0px #111',
        padding: '28px 32px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '18px',
            textTransform: 'lowercase',
          }}>
            system flow
          </span>
          <span style={{ fontSize: '18px' }}>↗</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {flowSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div style={{
                padding: '10px 18px',
                border: '2px solid #111',
                background: step.highlight ? '#FAC0C2' : '#fff',
                boxShadow: '2px 2px 0px #111',
                fontFamily: 'DM Mono',
                fontSize: '12px',
                textTransform: 'lowercase',
                whiteSpace: 'nowrap',
                color: '#111',
              }}>
                {step.label}
              </div>
              {i < flowSteps.length - 1 && (
                <span style={{
                  fontFamily: 'DM Mono',
                  fontSize: '18px',
                  color: '#888',
                  flexShrink: 0,
                }}>
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #E0DEDA',
          fontFamily: 'DM Mono',
          fontSize: '12px',
          color: '#666',
          lineHeight: 1.7,
        }}>
          images are uploaded via the REST api, stored to disk, and a job is created in postgres with
          status <strong>pending</strong>. the job is pushed to a bullmq queue backed by redis.
          a separate worker process picks it up, runs all 8 checks concurrently using promise.all,
          saves the analysis result, and marks the job <strong>completed</strong>.
          the frontend polls every 2 seconds until the status changes.
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <DetectionLayersCard />
        <TechStackCard />
      </div>

      <DesignDecisions />
    </div>
  );
}
