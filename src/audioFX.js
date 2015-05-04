"use strict";
/*global window,AudioContext,XMLHttpRequest */

class AudioFX {

  /**
   * Instantiates a new AudioFX instance, should be called after the window has loaded.
   * @constructor
   * @param {string} url - A URL where to load the file from.
   * @param {function} callback - A function that gets called once the buffer has been loaded and we are ready for playback.
   * @param {object} options - Custom options on instance level.
   */
  constructor(url, callback, options) {
    // set constants
    this.const = {
      QUALITY_MULTIPLIER: 30
    };
    // set defaultOptions
    let defaultOptions = {
      loop: false
    };
    // overwrite defaults with supplied options – if an object is supplied
    if(AudioFX.isObject(options)) {
      this.options = AudioFX.extend(defaultOptions, options);
    }
    // initialize the instance vars
    this.playing = false;
    // init context with prefixes
    try {
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      this.context = new AudioContext();
    }catch(e) {
      AudioFX.error('Web Audio API is not supported in this browser');
    }
    // register the supplied url, I'd say there's no valid-URL-check necessary
    this.url = url;
    // if the callback is really a function, register it
    if(AudioFX.isFunction(callback)) {
      this.onload = callback;
    }else{
      AudioFX.error("Supplied callback is not a function.");
    }
    // register empty buffer var
    this.buffer = null;
    // create empty buffer source var
    this.source = null;
    // normalize browser syntax
    if (!this.context.createGain) {
      this.context.createGain = this.context.createGainNode;
    }
    // create gain node
    this.gainNode = this.context.createGain();
    // create filter node
    this.filter = this.context.createBiquadFilter();
    // filter.type is defined as string type in the latest API. But this is defined as number type in old API.
    this.filter.type = (typeof this.filter.type === 'string') ? 'lowpass' : 0; // LOWPASS
    this.filter.frequency.value = this.options.filterFrequency || this.context.sampleRate;
    // if there's directly a url provided, the load it
    this.loadFile(url);
    // no return needed for constructor
  }

  /**
   * Loads a file from an URL
   * @param {string} url - A URL where to load the file from.
   */
  loadFile(url){
    // Load buffer asynchronously
    this.request = new XMLHttpRequest();
    // issue a GET request to the url, the true flag makes it async
    this.request.open("GET", url, true);
    // set the responseType to Arraybuffer
    this.request.responseType = "arraybuffer";
    // create reference for the async onload function
    let instance = this;
    // define what happens when we get a response from the request
    this.request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      instance.context.decodeAudioData(
        // the arrayBuffer we received
        instance.request.response,
        // do this with it
        function(buffer) {
          // if we don't have a buffer, throw an error
          if (!buffer) {
            instance.error('Error decoding file data: ' + url);
            return;
          }
          // otherwise save the buffer
          instance.buffer = buffer;
          // and fire the callback
          instance.onload(instance);
        },
        // if you can't make it, tell me why
        function(error) {
          instance.error('Error at decodeAudioData', error);
        }
      );
    };
    // bind error function in case things go wrong
    this.request.onerror = function() {
      AudioFX.error("XMLHttpRequest errored.");
    };
    // actually send the request we created
    this.request.send();
  }

  /**
   * Creates a new BufferSource and connects the nodes after a buffer has loaded, has to be re-done everytime play gets called
   */
  createAndConnectNodes(){
    // create new Buffer Source
    this.source = this.context.createBufferSource();
    // assign buffer to source
    this.source.buffer = this.buffer;
    // connect source to filter
    this.source.connect(this.filter);
    // connect filter to gain
    this.filter.connect(this.gainNode);
    // connect gain to output
    this.gainNode.connect(this.context.destination);
  }

  /**
   * Plays the Audio
   * @param {number} when - The when parameter defines when the play will start. If when represents a time in the past, the play will start immediately.
   */
  play(when = 0){
    // if we were playing already, stop the previous instance, otherwise we can't control it anymore
    if(this.playing === true){
      this.stop();
    }
    // create new bufferSource and connect the nodes
    this.createAndConnectNodes();
    // set looping option
    if(this.options.loop){
      this.source.loop = true;
    }
    // normalize browser syntax
    if (!this.source.start) {
      this.source.start = this.source.noteOn;
    }
    // play
    this.source.start(when);
    this.playing = true;
    // return for chaining
    return this;
  }

  /**
   * Stops the audio
   * @param {number} when - The when parameter defines when the playback will stop. If it represents a time in the past, the playback will end immediately.
   */
  stop(when = 0){
    // if there is an old version of the API
    if (!this.source.stop) {
      // shim stop from noteOff
      this.source.stop = this.source.noteOff;
    }
    // now actually do it
    this.source.stop(when);
    this.playing = false;
    // return for chaining
    return this;
  }

  /**
   * Play/Pause toggles the audio
   */
  toggle(){
    // If we are playing
    if(this.playing === true){
      // then stop
      this.stop();
    }else{
      // otherwise we have stopped, so play
      this.play();
    }
    // return for chaining
    return this;
  }

  /**
   * Changes the volume of the instance
   * @param {number} volume - the volume (supply a fraction like 0.5 between 0 and 1)
   */
  changeVolume(volume){
    // parse the input to make sure we have a number to work with
    let fraction = parseFloat(volume);
    // make sure the number is between 0 and 1
    if(fraction > 1){
      fraction = 1;
    }else if(fraction < 0){
      fraction = 0;
    }
    // Let's use an x*x curve (x-squared) since simple linear (x) does not sound as good.
    this.gainNode.gain.value = fraction * fraction;
    // return for chaining
    return this;
  }

  /**
   * Changes the filter of the instance
   * @param {number} frequency - the frequency of the filter (supply a fraction like 0.5 between 0 and 1)
   * @param {number} quality - the volume (supply a fraction like 0.5 between 0 and 1)
   */
  changeFilter(frequency,quality){
    // Clamp the frequency between the minimum value (40 Hz) and half of the sampling rate.
    let minValue = 40;
    let maxValue = this.context.sampleRate / 2;
    // Logarithm (base 2) to compute how many octaves fall in the range.
    let numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
    // Compute a multiplier from 0 to 1 based on an exponential scale.
    let multiplier = Math.pow(2, numberOfOctaves * (frequency - 1.0));
    // Get back to the frequency value between min and max.
    this.filter.frequency.value = maxValue * multiplier;
    this.filter.Q.value = quality * this.const.QUALITY_MULTIPLIER;
    // return for chaining
    return this;
  }

  /**
   * Destroys the instance, make sure to clean all reference to it for Garbage Collection
   */
  destroy(){
    this.stop();
    let self = this;
    self = null;
  }

  // SYNTACTIC SUGAR

  /**
   * Just syntactic sugar over changeVolume
   */
  volume(v){
    return this.changeVolume(v);
  }

  /**
   * Just syntactic sugar over changeFilter
   */
  filter(f,q){
    return this.changeFilter(f,q);
  }

  /**
   * Just syntactic sugar over destroy
   */
  kill(){
    return this.destroy();
  }

  /**
   * Just syntactic sugar over destroy
   */
  remove(){
    return this.destroy();
  }

  // HELPER FUNCTIONS FOR INDEPENDENCE

  /**
   * Extends an object with values from a seconds object. Used for options overwriting
   * @param {object} a - the first object with default values
   * @param {object} b - the second object with values that should overwrite the first one
   */
  static extend(a, b){
    for(let key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  /**
   * Checks if the supplied argument is an object and not null
   * @param {object} obj - the argument to check
   */
  static isObject(obj){
    return obj !== null && typeof obj === 'object';
  }

  /**
   * Checks if the supplied argument is a function
   * @param {function} functionToCheck - the argument to check
   */
  static isFunction(functionToCheck) {
    let getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  }

  /**
   * Centralized error handling
   * @param {string} errorMessage - the message for output
   */
  static error(errorMessage){
    return console.error('AudioFX: Error! '+errorMessage);
  }

}
