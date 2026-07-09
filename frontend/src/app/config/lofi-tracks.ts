export interface Track {
  /** Display name shown in the track selector - defaults to the URL itself, rename freely */
  name: string;
  /** Full YouTube video/livestream URL */
  url: string;
}

/**
 * YouTube tracks for the Lo-fi noise option. Add entries with a friendly
 * `name` and the full YouTube URL. When this list is empty, the Lo-fi
 * option is disabled in the UI.
 */
export const TRACKS: Track[] = [
  { name: '2 Hour Pomodoro | 25 Minute Intervals | with BROWN NOISE for ADHD Focus', url: 'https://www.youtube.com/watch?v=UXQQ25sIU4g' },
  { name: 'Sitar Music to Start Your Morning Right | 1.5 Hours', url: 'https://www.youtube.com/watch?v=95NmnEaWJGw' },
  { name: 'Joyful Music | Positive Vibes Music with Santoor | 1 Hour', url: 'https://www.youtube.com/watch?v=KeEFFkaCMRk' },
  { name: 'Playlist | Start Your Work with This 😎 Light Focus, Solid Rhythm 🎧| JAZZHOP · CHILLHOP | Cafe · Work', url: 'https://www.youtube.com/watch?v=wsB8ej3Jon4' },
];
