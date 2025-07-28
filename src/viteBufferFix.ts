import { Buffer } from 'buffer';
import process from 'process';

if (!window.Buffer) window.Buffer = Buffer;
if (!window.process) window.process = process;
if (!globalThis.global) globalThis.global = globalThis;
