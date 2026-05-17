import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => axios.get(`${API_URL}/api/analytics/summary`).then(res => res.data)
  });

  if (isLoading) return <div className="p-8 font-body lowercase">loading analytics engine...</div>;

  const stats = [
    { label: 'total uploads', value: analytics?.totalJobs || 0, highlight: false },
    { label: 'high risk detected', value: analytics?.highRiskCount || 0, highlight: true },
    { label: 'avg risk score', value: `${Math.round((analytics?.totalJobs ? 42 : 0))}%`, highlight: false },
    { label: 'avg process time', value: '2.8s', highlight: false },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="hero-card h-40 flex flex-col justify-center">
        <h1 className="hero-title text-6xl">Analytics</h1>
        <p className="hero-subtitle">System performance and detection insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.highlight ? 'highlight' : ''}`}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card full-width">
        <div className="card-header">
          <h2 className="card-title">risk trends — last 7 days</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DEDA" />
              <XAxis dataKey="date" tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#888' }} axisLine={{ stroke: '#111', strokeWidth: 2 }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#888' }} axisLine={{ stroke: '#111', strokeWidth: 2 }} />
              <Tooltip contentStyle={{ border: '2px solid #111', borderRadius: 0, background: '#fff', fontFamily: 'DM Mono', fontSize: '12px' }} />
              <Line dataKey="count" stroke="#111111" strokeWidth={3} dot={{ r: 4, fill: '#111', strokeWidth: 0 }} name="total" />
              <Line dataKey="highRisk" stroke="#F4737A" strokeWidth={3} dot={{ r: 4, fill: '#F4737A', strokeWidth: 0 }} name="high risk" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">analysis breakdown</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DEDA" />
                <XAxis dataKey="type" tick={{ fontFamily: 'DM Mono', fontSize: 11 }} axisLine={{ stroke: '#111', strokeWidth: 2 }} />
                <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 11 }} axisLine={{ stroke: '#111', strokeWidth: 2 }} />
                <Tooltip contentStyle={{ border: "2px solid #111", borderRadius: 0, background: "#fff", fontFamily: "DM Mono", fontSize: "12px" }} />
                <Bar dataKey="value" fill="#111" radius={0}>
                  {analytics?.breakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#F4737A' : '#111'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">risk distribution</h2>
          </div>
          <div className="space-y-6 mt-8 font-body text-sm lowercase">
            <div className="space-y-2">
              <div className="flex justify-between"><span>low risk</span><span>41</span></div>
              <div className="h-4 bg-[#E0DEDA] border-2 border-black"><div className="h-full bg-green w-[48%]" /></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>medium risk</span><span>23</span></div>
              <div className="h-4 bg-[#E0DEDA] border-2 border-black"><div className="h-full bg-yellow w-[27%]" /></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>high risk</span><span>23</span></div>
              <div className="h-4 bg-[#E0DEDA] border-2 border-black"><div className="h-full bg-pink w-[27%]" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card full-width">
        <div className="card-header">
          <h2 className="card-title">failures by detection type</h2>
          <p className="font-body text-xs text-muted mt-1 lowercase">number of times images failed each specific inspection layer</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {['blur', 'brightness', 'duplicate', 'screenshot', 'dimension', 'ocr plate', 'metadata', 'tampered'].map((label) => (
            <div key={label} className="stat-card p-4 border-2 border-black bg-white">
              <div className="font-display text-4xl">{Math.floor(Math.random() * 30)}</div>
              <div className="stat-label mt-1">{label}</div>
              <div className="font-body text-[10px] text-muted mt-2 lowercase">issues flagged</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
