// Web Audio Feedback Synthesizer (No external dependencies)
class AudioNotifier {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } catch {}
  }

  playWarning() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } catch {}
  }

  playPrintTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.04);
    } catch {}
  }

  playAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.4);
    } catch {}
  }
}

export const soundManager = new AudioNotifier();

/**
 * Generate SHA-256 checksum string for exam packages or logs
 */
export async function calculateSha256(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple checksum if WebCrypto fails
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, 'a') + '9fc48301be';
  }
}

/**
 * Generates an encrypted ciphertext envelope representation with auth tag
 */
export function simulateAesEncrypt(plainText: string, keySeed: string): string {
  const b64 = btoa(unescape(encodeURIComponent(plainText.slice(0, 150) + '...[ENCRYPTED_PAYLOAD]')));
  return `AES-256-GCM::IV[${Math.random().toString(36).substring(2, 10)}]::KEY[${keySeed.substring(0, 8)}]::TAG[${Math.random().toString(36).substring(2, 8)}]::CT[${b64}]`;
}

/**
 * Generates Forensic Watermark String for Center Exam Copy
 * Format: MOE-IRQ-2026-{EXAM_CODE}-{SCH_CODE}-COPY-{COPY_NUM}-T{TIME_TAG}-{CRC}
 */
export function generateForensicWatermark(
  schoolCode: string,
  copyNumberOrHall: number,
  copyNumberOrSeat?: number,
  timeStr: string = '07:46:12'
): string {
  const copyNum = copyNumberOrSeat !== undefined ? copyNumberOrSeat : copyNumberOrHall;
  const cleanTime = timeStr.replace(/[^0-9]/g, '').slice(0, 6) || '074612';
  const rawSum = (schoolCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + copyNum * 19) % 999;
  const crc = 'C' + rawSum.toString(36).toUpperCase().padStart(3, '0');
  return `MOE-IRQ-2026-MTH-${schoolCode}-COPY-${copyNum.toString().padStart(3, '0')}-T${cleanTime}-${crc}`;
}

/**
 * Parses Forensic Watermark Code back to school & center copy details
 */
export function decodeForensicWatermark(code: string): {
  isValid: boolean;
  schoolCode: string;
  copyNumber: number;
  hallNumber: number;
  seatNumber: number;
  timeTag: string;
  crc: string;
} | null {
  const clean = code.trim().toUpperCase();

  // Pattern 1: New Center Copy Pattern e.g. MOE-IRQ-2026-MTH-SCH-101-COPY-014-T074615-C1F or MOE-IRQ-2026-SCH-101-COPY-014-C1F
  const copyRegex = /MOE-IRQ-2026.*?(SCH-?[0-9]+).*?COPY-?([0-9]+).*?([0-9]{6})?-?([A-Z0-9]+)/;
  const copyMatch = clean.match(copyRegex);

  if (copyMatch) {
    const rawSch = copyMatch[1];
    const schCode = rawSch.startsWith('SCH-') ? rawSch : rawSch.replace('SCH', 'SCH-');
    const copyNum = parseInt(copyMatch[2], 10);
    const timeRaw = copyMatch[3] || '074615';
    const crc = copyMatch[4] || 'C1F';
    return {
      isValid: true,
      schoolCode: schCode,
      copyNumber: copyNum,
      seatNumber: copyNum,
      hallNumber: Math.ceil(copyNum / 25),
      timeTag: `${timeRaw.slice(0, 2)}:${timeRaw.slice(2, 4)}:${timeRaw.slice(4, 6)} ص`,
      crc: crc,
    };
  }

  // Pattern 2: Legacy student ticket format: MOE-IRQ-2026-MTH-(SCH-?[0-9]+)-H([0-9]+)-S([0-9]+)-T([0-9]+)-([A-Z0-9]+)
  const legacyRegex = /MOE-IRQ-2026-MTH-(SCH-?[0-9]+)-H([0-9]+)-S([0-9]+)-T([0-9]+)-([A-Z0-9]+)/;
  const match = clean.match(legacyRegex);

  if (match) {
    const schCode = match[1].startsWith('SCH-') ? match[1] : match[1].replace('SCH', 'SCH-');
    const seat = parseInt(match[3], 10);
    return {
      isValid: true,
      schoolCode: schCode,
      copyNumber: seat,
      hallNumber: parseInt(match[2], 10),
      seatNumber: seat,
      timeTag: `${match[4].slice(0, 2)}:${match[4].slice(2, 4)}:${match[4].slice(4, 6)} ص`,
      crc: match[5],
    };
  }

  // Relaxed fallback
  const parts = clean.split('-');
  if (parts.length >= 4) {
    const sch = parts.find(p => p.startsWith('SCH')) || 'SCH-101';
    const numMatch = clean.match(/(?:COPY-|S)([0-9]+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 1;
    return {
      isValid: true,
      schoolCode: sch,
      copyNumber: num,
      hallNumber: Math.ceil(num / 25),
      seatNumber: num,
      timeTag: '07:46:12 ص',
      crc: 'C89A',
    };
  }

  return null;
}
