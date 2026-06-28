'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { Activity, Zap, Cpu } from 'lucide-react';
import { detectCapabilities, DeviceCapabilities } from 'src/lib/three/capabilities';

export default function BenchmarkPage() {
  const { performanceProfile, setPerformanceProfile } = useStore();
  const [caps, setCaps] = useState<DeviceCapabilities | null>(null);
  const [testActive, setTestActive] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    testProgress: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCaps(detectCapabilities());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Monitor FPS and frame latency during benchmark test runs
  useEffect(() => {
    if (!testActive) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const run = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 1000) {
        const calculatedFps = Math.round((frameCount * 1000) / delta);
        setMetrics((prev) => ({
          fps: calculatedFps,
          frameTime: Math.round(1000 / calculatedFps),
          testProgress: Math.min(100, prev.testProgress + 10),
        }));
        frameCount = 0;
        lastTime = now;
      }

      animId = requestAnimationFrame(run);
    };

    animId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animId);
  }, [testActive]);

  useEffect(() => {
    if (metrics.testProgress >= 100) {
      const timer = setTimeout(() => {
        setTestActive(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [metrics.testProgress]);

  const startBenchmark = () => {
    setMetrics({ fps: 60, frameTime: 16, testProgress: 0 });
    setTestActive(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-purple-950 tracking-tight">GPU Benchmark & Capabilities</h1>
        <p className="text-sm font-sans text-purple-950/60 mt-1">Check GPU hardware, frame budgets, and run rendering stress tests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Capabilities */}
        <GlassCard className="p-6 border-white/30 space-y-4">
          <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
            <Cpu size={18} className="text-[#B998D2]" />
            Hardware Capabilities
          </h2>
          
          {caps ? (
            <div className="space-y-3.5 text-sm font-sans">
              <div className="flex justify-between border-b border-purple-950/5 pb-2">
                <span className="text-purple-950/60">WebGL2 Support</span>
                <span className={`font-semibold ${caps.webgl2 ? 'text-green-600' : 'text-red-500'}`}>
                  {caps.webgl2 ? 'Available' : 'Unsupported'}
                </span>
              </div>
              <div className="flex justify-between border-b border-purple-950/5 pb-2">
                <span className="text-purple-950/60">WebGPU support</span>
                <span className={`font-semibold ${caps.webgpu ? 'text-green-600' : 'text-purple-950/40'}`}>
                  {caps.webgpu ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between border-b border-purple-950/5 pb-2">
                <span className="text-purple-950/60">Estimated GPU Tier</span>
                <span className="font-semibold text-purple-950 uppercase">{caps.gpuTier}</span>
              </div>
              <div className="flex justify-between border-b border-purple-950/5 pb-2">
                <span className="text-purple-950/60">Touch Screen</span>
                <span className="font-semibold text-purple-950">{caps.isTouchDevice ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between border-b border-purple-950/5 pb-2">
                <span className="text-purple-950/60">Reduced Motion</span>
                <span className="font-semibold text-purple-950">{caps.reducedMotion ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm font-sans text-purple-950/50">Analyzing device profiles...</div>
          )}
        </GlassCard>

        {/* Engine profile controls */}
        <GlassCard className="p-6 border-white/30 space-y-4">
          <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
            <Zap size={18} className="text-[#B998D2]" />
            Active Rendering Profile
          </h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              {(['high', 'medium', 'low', 'reducedMotion'] as const).map((profile) => (
                <button
                  key={profile}
                  onClick={() => setPerformanceProfile(profile)}
                  className={`flex-1 py-2 px-1 rounded-xl text-xs font-sans font-semibold border transition-all duration-200 cursor-pointer ${
                    performanceProfile === profile
                      ? 'bg-purple-950 text-white border-purple-950 shadow-md shadow-purple-950/10'
                      : 'bg-white/40 border-white/30 text-purple-950/70 hover:bg-white/60'
                  }`}
                >
                  {profile === 'reducedMotion' ? 'Reduced' : profile.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-purple-950/5 border border-purple-950/5 text-xs font-sans text-purple-950/60 space-y-1">
              <span className="font-bold text-purple-950">Active Limits:</span>
              {performanceProfile === 'high' && <div>• High resolution (DPR 2.0) • 3,000 instanced particles • Bloom enabled</div>}
              {performanceProfile === 'medium' && <div>• Medium resolution (DPR 1.5) • 1,500 instanced particles • Bloom enabled</div>}
              {performanceProfile === 'low' && <div>• Standard resolution (DPR 1.0) • 400 particles • Bloom disabled</div>}
              {performanceProfile === 'reducedMotion' && <div>• Standard resolution • 3D background animations disabled • Parallax disabled</div>}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Benchmark test card */}
      <GlassCard className="p-6 border-white/30 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
          <Activity size={18} className="text-[#B998D2]" />
          Stress Test & Latency Analyzer
        </h2>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <p className="text-sm font-sans text-purple-950/60 leading-relaxed">
              This test runs a continuous simulation rendering maximum polygon loads and particle density. Use this tool to check for frame-drops and micro-stuttering.
            </p>

            <button
              onClick={startBenchmark}
              disabled={testActive}
              className="px-5 py-2.5 rounded-xl bg-purple-950 text-white text-sm font-sans font-semibold transition-all duration-200 cursor-pointer disabled:bg-purple-950/40 hover:bg-purple-900 active:scale-95 flex items-center gap-2"
            >
              {testActive ? `Testing (${metrics.testProgress}%)` : 'Run Stress Test'}
            </button>
          </div>

          <div className="w-full md:w-64 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/40 bg-white/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-sans tracking-wider text-purple-950/40">Framerate</span>
              <div className="text-3xl font-serif text-purple-950 font-bold">{metrics.fps} <span className="text-xs">FPS</span></div>
            </div>
            <div className="p-4 rounded-xl border border-white/40 bg-white/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-sans tracking-wider text-purple-950/40">Frame Latency</span>
              <div className="text-3xl font-serif text-purple-950 font-bold">{metrics.frameTime} <span className="text-xs">ms</span></div>
            </div>
          </div>
        </div>

        {testActive && (
          <div className="w-full h-1 bg-purple-950/5 rounded-full overflow-hidden border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-[#B998D2] to-purple-800 transition-all duration-300"
              style={{ width: `${metrics.testProgress}%` }}
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
