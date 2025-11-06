// Jest tests for bgmManager
// We mock global Audio to avoid real playback in the test environment.

beforeEach(() => {
  // Reset modules so importing bgmManager picks up our mocked Audio
  jest.resetModules();
});

describe('bgmManager behavior', () => {
  test('setVolume updates audio.volume and does not call play', async () => {
    // Mock Audio
    class MockAudio {
      constructor() {
        this.loop = false;
        this.volume = 1;
        this.src = '';
        this.currentTime = 0;
        this._playCalls = 0;
        this._pauseCalls = 0;
      }
      play() {
        this._playCalls += 1;
        return Promise.resolve();
      }
      pause() {
        this._pauseCalls += 1;
      }
      load() {}
    }

    global.Audio = MockAudio;

    const { default: bgmManager } = require('../bgmManager');

    // initialize and ensure audio exists
    bgmManager.init();
    expect(bgmManager.audio).toBeInstanceOf(MockAudio);

    // Spy counts before
    const beforePlays = bgmManager.audio._playCalls || 0;

    // Call setVolume
    bgmManager.setVolume(0.12);

    // Should update stored value
    expect(bgmManager.volume).toBe(0.12);

    // Should update audio.volume but not cause play
    expect(bgmManager.audio.volume).toBe(0.12);
    const afterPlays = bgmManager.audio._playCalls || 0;
    expect(afterPlays).toBe(beforePlays);
  });

  test('pause toggles isPaused and resume calls play', async () => {
    class MockAudio2 {
      constructor() {
        this.loop = false;
        this.volume = 1;
        this.src = '';
        this.currentTime = 0;
        this._playCalls = 0;
        this._pauseCalls = 0;
      }
      play() {
        this._playCalls += 1;
        return Promise.resolve();
      }
      pause() {
        this._pauseCalls += 1;
      }
      load() {}
    }

    global.Audio = MockAudio2;
    const { default: bgmManager } = require('../bgmManager');

    // Initialize and force a track to be selected and played
    bgmManager.init();

    // Force play a new track
    bgmManager.play(true);

    // At this point isPlaying should be true
    expect(bgmManager.isPlaying).toBe(true);

    // Pause the music
    const paused = bgmManager.pause();
    expect(paused).toBe(true);
    expect(bgmManager.isPaused).toBe(true);
    expect(bgmManager.audio._pauseCalls).toBeGreaterThanOrEqual(1);

    // Resume the music
    const resumed = bgmManager.resume();
    // resume returns true when it started
    expect(resumed).toBe(true);
    expect(bgmManager.isPaused).toBe(false);
    expect(bgmManager.audio._playCalls).toBeGreaterThanOrEqual(1);
  });
});
