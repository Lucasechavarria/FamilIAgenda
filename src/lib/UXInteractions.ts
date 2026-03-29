/**
 * UXFeedback Service
 * Motor de síntesis de audio (Zero Assets) y Vibraciones Hhápticas.
 */

class UXFeedbackService {
  private audioCtx: AudioContext | null = null;

  /**
   * Inicializa el contexto de audio. Debe llamarse tras una interacción del usuario.
   */
  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Genera un sonido sutil programáticamente (Sine wave synth).
   */
  playSound(type: 'click' | 'success' | 'pop' | 'undo' | 'error') {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      switch (type) {
        case 'click':
          // Click sutil de baja frecuencia
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case 'pop':
          // Burbuja de chat suave
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case 'success':
          // Dos notas ascendentes dulces
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'undo':
          // Frecuencia descendente rápida
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;

        case 'error':
          // Nota baja y corta con vibrato simple
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(110, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
      }
    } catch (e) {
      console.warn("Audio Context not available", e);
    }
  }

  /**
   * Lógica de vibración (Haptic Feedback).
   */
  vibrate(pattern: 'light' | 'medium' | 'success' | 'error') {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10); // Un toque imperceptible (Tick)
          break;
        case 'medium':
          navigator.vibrate(30); 
          break;
        case 'success':
          navigator.vibrate([20, 40, 40]); // Doble pulso corto
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]); // Vibración pesada
          break;
      }
    }
  }
}

export const UXFeedback = new UXFeedbackService();
