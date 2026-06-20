// Pitch detection Web Worker using YIN-inspired autocorrelation
// Optimized for real-time sub-20ms latency

function freqToNote(freq) {
  if (!freq || freq <= 0) return { note: '', octave: 0, cents: 0 };
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const totalSemitones = Math.round(semitones) + 57;
  const octave = Math.floor(totalSemitones / 12) - 1;
  const noteIndex = ((totalSemitones % 12) + 12) % 12;
  const note = `${noteNames[noteIndex]}${octave}`;
  
  // Calculate cents deviation from nearest note
  const roundedSemitones = Math.round(semitones);
  const targetFreq = A4 * Math.pow(2, roundedSemitones / 12);
  const cents = 1200 * Math.log2(freq / targetFreq);
  
  return { note, octave, cents };
}

function differenceFunction(samples, tauMax) {
  const n = samples.length;
  const diff = new Float32Array(tauMax);
  for (let tau = 0; tau < tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < n - tau; i++) {
      const d = samples[i] - samples[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }
  return diff;
}

function cumulativeMeanNormalizedDifference(diff) {
  const tauMax = diff.length;
  const cmnd = new Float32Array(tauMax);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < tauMax; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = diff[tau] / ((runningSum / tau) || 1);
  }
  return cmnd;
}

function absoluteThreshold(cmnd, threshold = 0.1) {
  let tau = 2;
  while (tau < cmnd.length) {
    if (cmnd[tau] < threshold) {
      // Ensure it's a local minimum
      while (tau + 1 < cmnd.length && cmnd[tau + 1] < cmnd[tau]) {
        tau++;
      }
      return tau;
    }
    tau++;
  }
  return -1;
}

function parabolicInterpolation(cmnd, tau) {
  if (tau <= 0 || tau >= cmnd.length - 1) return tau;
  const alpha = cmnd[tau - 1];
  const beta = cmnd[tau];
  const gamma = cmnd[tau + 1];
  const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
  return tau + p;
}

function detectPitch(samples, sampleRate) {
  const n = samples.length;
  const tauMax = Math.floor(n / 2);
  
  // RMS check for silence
  let rms = 0;
  for (let i = 0; i < n; i++) {
    rms += samples[i] * samples[i];
  }
  rms = Math.sqrt(rms / n);
  if (rms < 0.005) return 0;
  
  const diff = differenceFunction(samples, tauMax);
  const cmnd = cumulativeMeanNormalizedDifference(diff);
  const tau = absoluteThreshold(cmnd, 0.15);
  
  if (tau < 0) return 0;
  
  const refinedTau = parabolicInterpolation(cmnd, tau);
  const freq = sampleRate / refinedTau;
  
  // Sanity check frequency range (human voice: ~80Hz - ~1100Hz)
  if (freq < 60 || freq > 1200) return 0;
  
  return freq;
}

self.onmessage = function(e) {
  const { samples, sampleRate } = e.data;
  const freq = detectPitch(samples, sampleRate);
  
  if (freq > 0) {
    const { note, cents } = freqToNote(freq);
    self.postMessage({ 
      frequency: freq, 
      note, 
      cents,
      timestamp: Date.now()
    });
  } else {
    self.postMessage({ 
      frequency: 0, 
      note: '', 
      cents: 0,
      timestamp: Date.now()
    });
  }
};
