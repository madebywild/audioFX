"use strict";
/*global window,AudioFX,AudioContext,XMLHttpRequest */

class AudioFXGlobalClass {

  /**
   * Initializes the Global AudioFX object, is fired when the first AudioFX instance is created
   */
  constructor(){
    // init empty cache
    this.cache = [];
    // init context with prefixes
    try {
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      this.context = new AudioContext();
    }catch(e) {
      AudioFX.error('Web Audio API Error: '+e.message);
    }
    // normalize browser syntax
    if (!this.context.createGain) {
      this.context.createGain = this.context.createGainNode;
    }
  }

  /**
   * Changes the volume on **all** instances. Be aware that there obviously is no fine-grained control over which instances are affected. Useful if all have the same volume anyway and you want to quickly mute/unmute the website or have a global volume slider.
   * @param {number} volume - the volume (supply a fraction like 0.5 between 0 and 1)
   */
  changeVolumeAll(volume){
    // loop through all instances
    this.cache.forEach(function(instance){
      // and call their destroy functions
      instance.volume(volume);
    });
    return this;
  }

  /**
   * Destroys all AudioFX instances
   */
  destroyAll(){
    // loop through all instances
    this.cache.forEach(function(instance){
      // and call their destroy functions
      instance.destroy();
    });
    return this;
  }

}
