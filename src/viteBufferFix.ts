// src/viteBufferFix.ts
import { Buffer } from 'buffer';
import process from 'process';

// If you ever SSR, guard for "window"
if (typeof window !== 'undefined') {
  const w = window as unknown as { Buffer?: typeof Buffer; process?: any };
  if (!w.Buffer) w.Buffer = Buffer;
  if (!w.process) w.process = { ...process, env: process?.env ?? {} };
}

// Some libs expect global === globalThis (Node-style)
const g = globalThis as any;
if (!g.global) g.global = g;
