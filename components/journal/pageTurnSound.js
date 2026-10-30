// A soft paper "swish" synthesised with Web Audio, so there's no audio file to ship
let audioContext = null;

export function playPageTurn() {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioContext;
    const duration = 0.45;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const envelope = Math.sin(Math.PI * t) ** 2 * (1 - t * 0.6);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.value = 0.22;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  } catch {
    // Audio is a nice-to-have; ignore browsers that block it
  }
}
