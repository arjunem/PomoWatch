import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NoiseType } from '../models/session.model';
import { ToastService } from './toast.service';
import { TRACKS } from '../config/lofi-tracks';

export interface LofiProgress {
  currentTime: number;
  duration: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type NoiseRepeatMode = 'repeat-one' | 'advance';

const NOISE_BUFFER_SECONDS = 3;
const LOFI_MOUNT_ID = 'pomowatch-lofi-player';

/**
 * Generates and plays looping ambient noise (white/brown) via the Web Audio
 * API, or plays a Lo-fi YouTube video/playlist via the IFrame Player API.
 * Has no knowledge of timer/settings state - callers (TimerService, App)
 * are responsible for wiring session lifecycle and persisted preferences
 * into setType()/setVolume()/play()/pause().
 */
@Injectable({
  providedIn: 'root'
})
export class NoiseService {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private bufferSourceNode: AudioBufferSourceNode | null = null;

  private ytPlayer: any = null;
  private ytApiLoadPromise: Promise<void> | null = null;
  private lofiTrackIndex = 0;

  /** Track index/repeat-mode currently loaded into ytPlayer, so resuming from
   * pause can just call playVideo() instead of reloading (which would reset
   * playback position to 0). Null means nothing is loaded yet. */
  private loadedLofiTrackIndex: number | null = null;
  private loadedLofiRepeatMode: NoiseRepeatMode | null = null;

  private currentType: NoiseType = 'none';
  private currentVolume = 0.5;

  private playingSubject = new BehaviorSubject<boolean>(false);
  public playing$: Observable<boolean> = this.playingSubject.asObservable();

  private repeatModeSubject = new BehaviorSubject<NoiseRepeatMode>('advance');
  public repeatMode$: Observable<NoiseRepeatMode> = this.repeatModeSubject.asObservable();

  private lofiTrackIndexSubject = new BehaviorSubject<number>(0);
  public lofiTrackIndex$: Observable<number> = this.lofiTrackIndexSubject.asObservable();

  private lofiProgressSubject = new BehaviorSubject<LofiProgress>({ currentTime: 0, duration: 0 });
  public lofiProgress$: Observable<LofiProgress> = this.lofiProgressSubject.asObservable();
  private lofiProgressTimer: ReturnType<typeof setInterval> | null = null;

  public readonly lofiTracks = TRACKS;

  constructor(private toastService: ToastService) {}

  get hasLofiTracks(): boolean {
    return TRACKS.length > 0;
  }

  /**
   * Manually selects a specific Lo-fi track by index. If Lo-fi is currently
   * playing, switches to it immediately; otherwise just records the choice
   * for the next play().
   */
  selectLofiTrack(index: number): void {
    if (index < 0 || index >= TRACKS.length) {
      return;
    }
    this.lofiTrackIndex = index;
    this.lofiTrackIndexSubject.next(index);
    if (this.currentType === 'lofi' && this.playingSubject.value) {
      this.loadCurrentLofiTrack();
    }
  }

  /**
   * Records the active noise type. If noise is currently playing and the
   * type actually changed, seamlessly swaps the underlying engine.
   */
  setType(type: NoiseType): void {
    if (this.currentType === type) {
      return;
    }
    const wasPlaying = this.playingSubject.value;
    if (wasPlaying) {
      this.stopActiveEngine();
    }
    this.currentType = type;
    if (wasPlaying) {
      this.startActiveEngine();
    }
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.min(1, Math.max(0, volume));
    const gain = this.volumeToGain(this.currentVolume);
    if (this.gainNode) {
      this.gainNode.gain.value = gain;
    }
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(gain * 100);
    }
  }

  /**
   * Converts a linear 0-1 slider position into an audio gain using a
   * decibel taper, so the slider feels perceptually even across its range
   * instead of the low end doing nothing and the high end jumping sharply
   * (human loudness perception is roughly logarithmic, not linear).
   */
  private volumeToGain(volume: number): number {
    if (volume <= 0) {
      return 0;
    }
    const minDb = -40;
    const db = minDb * (1 - volume);
    return Math.pow(10, db / 20);
  }

  play(): void {
    if (this.currentType === 'none' || this.playingSubject.value) {
      return;
    }
    this.startActiveEngine();
  }

  pause(): void {
    if (!this.playingSubject.value) {
      return;
    }
    this.stopActiveEngine();
  }

  toggle(): void {
    this.playingSubject.value ? this.pause() : this.play();
  }

  /** Seeks the currently playing Lo-fi video to the given position, in seconds. */
  seekTo(seconds: number): void {
    this.ytPlayer?.seekTo?.(seconds, true);
  }

  toggleRepeatMode(): void {
    const next: NoiseRepeatMode = this.repeatModeSubject.value === 'advance' ? 'repeat-one' : 'advance';
    this.repeatModeSubject.next(next);
    if (this.currentType === 'lofi' && this.playingSubject.value) {
      this.loadCurrentLofiTrack();
    }
  }

  /** Hard teardown - call from App.ngOnDestroy() for cleanup. */
  stop(): void {
    this.stopActiveEngine();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.gainNode = null;
    }
    if (this.ytPlayer) {
      this.ytPlayer.destroy();
      this.ytPlayer = null;
    }
    this.loadedLofiTrackIndex = null;
    this.loadedLofiRepeatMode = null;
  }

  private startLofiProgressPolling(): void {
    this.stopLofiProgressPolling();
    this.lofiProgressTimer = setInterval(() => {
      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        this.lofiProgressSubject.next({
          currentTime: this.ytPlayer.getCurrentTime(),
          duration: this.ytPlayer.getDuration()
        });
      }
    }, 500);
  }

  private stopLofiProgressPolling(): void {
    if (this.lofiProgressTimer) {
      clearInterval(this.lofiProgressTimer);
      this.lofiProgressTimer = null;
    }
  }

  // ===== Engine dispatch =====

  private startActiveEngine(): void {
    if (this.currentType === 'white' || this.currentType === 'brown') {
      this.startGeneratedNoise(this.currentType);
      this.playingSubject.next(true);
    } else if (this.currentType === 'lofi') {
      this.startLofi();
    }
  }

  private stopActiveEngine(): void {
    this.stopGeneratedSource();
    this.stopLofi();
    this.playingSubject.next(false);
  }

  // ===== White / brown noise (Web Audio API) =====

  private ensureContext(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.volumeToGain(this.currentVolume);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private createNoiseBuffer(type: 'white' | 'brown'): AudioBuffer {
    const ctx = this.audioCtx!;
    const frameCount = ctx.sampleRate * NOISE_BUFFER_SECONDS;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < frameCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      let lastOut = 0;
      for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }

    return buffer;
  }

  private startGeneratedNoise(type: 'white' | 'brown'): void {
    this.ensureContext();
    this.stopGeneratedSource();

    const source = this.audioCtx!.createBufferSource();
    source.buffer = this.createNoiseBuffer(type);
    source.loop = true;
    source.connect(this.gainNode!);
    source.start(0);
    this.bufferSourceNode = source;
  }

  private stopGeneratedSource(): void {
    if (this.bufferSourceNode) {
      try {
        this.bufferSourceNode.stop();
      } catch {
        // already stopped
      }
      this.bufferSourceNode.disconnect();
      this.bufferSourceNode = null;
    }
  }

  // ===== Lo-fi (YouTube IFrame Player API) =====

  private extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return match ? match[1] : null;
  }

  private loadYouTubeApi(): Promise<void> {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (this.ytApiLoadPromise) {
      return this.ytApiLoadPromise;
    }
    this.ytApiLoadPromise = new Promise<void>((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    });
    return this.ytApiLoadPromise;
  }

  private ensureLofiMount(): HTMLElement {
    let mount = document.getElementById(LOFI_MOUNT_ID);
    if (!mount) {
      mount = document.createElement('div');
      mount.id = LOFI_MOUNT_ID;
      mount.style.position = 'absolute';
      mount.style.width = '1px';
      mount.style.height = '1px';
      mount.style.opacity = '0';
      mount.style.pointerEvents = 'none';
      document.body.appendChild(mount);
    }
    return mount;
  }

  private async ensureYouTubePlayer(): Promise<any> {
    await this.loadYouTubeApi();
    if (!this.ytPlayer) {
      const mount = this.ensureLofiMount();
      this.ytPlayer = await new Promise((resolve) => {
        const player = new window.YT.Player(mount, {
          playerVars: { autoplay: 0, controls: 0 },
          events: {
            onReady: () => resolve(player),
            onStateChange: (event: any) => this.onYouTubeStateChange(event)
          }
        });
      });
      this.ytPlayer.setVolume(this.volumeToGain(this.currentVolume) * 100);
      this.loadedLofiTrackIndex = null;
      this.loadedLofiRepeatMode = null;
    }
    return this.ytPlayer;
  }

  private onYouTubeStateChange(event: any): void {
    if (
      event.data === window.YT.PlayerState.ENDED &&
      this.repeatModeSubject.value === 'advance' &&
      this.currentType === 'lofi'
    ) {
      this.lofiTrackIndex = (this.lofiTrackIndex + 1) % TRACKS.length;
      this.lofiTrackIndexSubject.next(this.lofiTrackIndex);
      this.loadCurrentLofiTrack();
    }
  }

  private loadCurrentLofiTrack(): void {
    if (!this.ytPlayer || !this.hasLofiTracks) {
      return;
    }
    const videoId = this.extractYouTubeId(TRACKS[this.lofiTrackIndex].url);
    if (!videoId) {
      return;
    }
    this.lofiProgressSubject.next({ currentTime: 0, duration: 0 });
    if (this.repeatModeSubject.value === 'repeat-one') {
      this.ytPlayer.loadPlaylist({ playlist: [videoId], loop: true });
    } else {
      this.ytPlayer.loadVideoById(videoId);
    }
    this.loadedLofiTrackIndex = this.lofiTrackIndex;
    this.loadedLofiRepeatMode = this.repeatModeSubject.value;
  }

  private async startLofi(): Promise<void> {
    if (!this.hasLofiTracks) {
      this.toastService.warning('Add YouTube URLs to lofi-tracks.ts to enable Tracks.');
      this.playingSubject.next(false);
      return;
    }
    await this.ensureYouTubePlayer();
    const alreadyLoaded =
      this.loadedLofiTrackIndex === this.lofiTrackIndex &&
      this.loadedLofiRepeatMode === this.repeatModeSubject.value;
    if (!alreadyLoaded) {
      this.loadCurrentLofiTrack();
    }
    this.ytPlayer.playVideo();
    this.playingSubject.next(true);
    this.startLofiProgressPolling();
  }

  private stopLofi(): void {
    this.ytPlayer?.pauseVideo?.();
    this.stopLofiProgressPolling();
  }
}
