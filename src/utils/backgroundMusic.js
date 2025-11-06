// Adapter to forward existing backgroundMusic imports to the centralized bgmManager
import { bgmManager } from './bgmManager.js';

// Provide the older API surface expected by modules that import this file
const adapter = {
  init: (...args) => { try { return bgmManager.init(...args); } catch (e) {} },
  playRandom: (...args) => { try { return bgmManager.playRandom(...args); } catch (e) {} },
  play: (...args) => { try { return bgmManager.play(...args); } catch (e) {} },
  stop: (...args) => { try { return bgmManager.stop(...args); } catch (e) {} },
  pause: (...args) => { try { return bgmManager.pause(...args); } catch (e) {} },
  resume: (...args) => { try { return bgmManager.resume(...args); } catch (e) {} },
  setVolume: (...args) => { try { return bgmManager.setVolume(...args); } catch (e) {} },
  toggleMute: (...args) => { try { return bgmManager.toggleMute(...args); } catch (e) {} },
  updateMasterGain: (...args) => { try { return bgmManager.updateMasterGain(...args); } catch (e) {} },
  setPlaylist: (...args) => { try { return bgmManager.setPlaylist(...args); } catch (e) {} },
  nextTrack: (...args) => { try { return bgmManager.nextTrack(...args); } catch (e) {} },
  // expose current state for compatibility
  get isMuted() { return bgmManager.getCurrentState().isMuted; },
  getCurrentState: () => bgmManager.getCurrentState(),
  // allow direct access if needed
  _internal: bgmManager
};

export default adapter;
