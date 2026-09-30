export const SAMPLE_RATE = 24000;
export const CHUNK_DURATION_MS = 100;

export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Decodes base64 PCM16 audio and plays it via the Web Audio API.
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: Float32Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private activeSource: AudioBufferSourceNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    return this.audioContext;
  }

  addAudio(base64: string) {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    this.queue.push(float32);
    if (!this.isPlaying) {
      this.flush();
    }
  }

  private flush() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.activeSource = null;
      return;
    }
    this.isPlaying = true;
    const samples = this.queue.shift()!;
    const audioContext = this.getAudioContext();
    const buffer = audioContext.createBuffer(1, samples.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const now = audioContext.currentTime;
    const start = Math.max(now, this.nextStartTime);
    source.start(start);
    this.nextStartTime = start + buffer.duration;
    this.activeSource = source;
    source.onended = () => this.flush();
  }

  stop() {
    // Stop currently playing audio immediately
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Already stopped or disconnected
      }
      this.activeSource = null;
    }

    // Clear the queue
    this.queue = [];
    this.isPlaying = false;
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  close() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Records microphone audio, resamples to 24 kHz PCM16, and streams base64 chunks.
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private audioBuffer: Float32Array[] = [];
  private totalSamples = 0;
  private onChunk: ((base64: string) => void) | null = null;

  async start(onChunk: (base64: string) => void) {
    this.onChunk = onChunk;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    const chunkSizeSamples =
      (this.audioContext.sampleRate * CHUNK_DURATION_MS) / 1000;
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // Buffer the audio data instead of immediately processing
      this.audioBuffer.push(new Float32Array(inputData));
      this.totalSamples += inputData.length;

      // Only send when we have enough for a proper chunk (~100ms)
      while (this.totalSamples >= chunkSizeSamples) {
        const chunk = new Float32Array(chunkSizeSamples);
        let offset = 0;

        // Build chunk from buffers
        while (offset < chunkSizeSamples && this.audioBuffer.length > 0) {
          const buffer = this.audioBuffer[0];
          const needed = chunkSizeSamples - offset;
          const available = buffer.length;

          if (available <= needed) {
            chunk.set(buffer, offset);
            offset += available;
            this.totalSamples -= available;
            this.audioBuffer.shift();
          } else {
            chunk.set(buffer.subarray(0, needed), offset);
            this.audioBuffer[0] = buffer.subarray(needed);
            offset += needed;
            this.totalSamples -= needed;
          }
        }

        // Convert to base64 (no resampling needed)
        const int16 = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const sample = Math.max(-1, Math.min(1, chunk[i]));
          int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }

        const bytes = new Uint8Array(int16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        if (this.onChunk) {
          this.onChunk(btoa(binary));
        }
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = [];
    this.totalSamples = 0;
    this.onChunk = null;
  }
}
