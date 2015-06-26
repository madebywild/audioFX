(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.AudioFX = factory();
  }
}(this, function() {
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/*global window,AudioFX,AudioContext,XMLHttpRequest */

var AudioFXGlobalClass = (function () {

  /**
   * Initializes the Global AudioFX object, is fired when the first AudioFX instance is created
   */

  function AudioFXGlobalClass() {
    _classCallCheck(this, AudioFXGlobalClass);

    // init empty cache
    this.cache = [];
    // init context with prefixes
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
    } catch (e) {
      AudioFX.error('Web Audio API Error: ' + e.message);
    }
    // normalize browser syntax
    if (!this.context.createGain) {
      this.context.createGain = this.context.createGainNode;
    }
  }

  _createClass(AudioFXGlobalClass, [{
    key: 'changeVolumeAll',

    /**
     * Changes the volume on **all** instances. Be aware that there obviously is no fine-grained control over which instances are affected. Useful if all have the same volume anyway and you want to quickly mute/unmute the website or have a global volume slider.
     * @param {number} volume - the volume (supply a fraction like 0.5 between 0 and 1)
     */
    value: function changeVolumeAll(volume) {
      // loop through all instances
      this.cache.forEach(function (instance) {
        // and call their destroy functions
        instance.volume(volume);
      });
      return this;
    }
  }, {
    key: 'destroyAll',

    /**
     * Destroys all AudioFX instances
     */
    value: function destroyAll() {
      // loop through all instances
      this.cache.forEach(function (instance) {
        // and call their destroy functions
        instance.destroy();
      });
      return this;
    }
  }]);

  return AudioFXGlobalClass;
})();

(function () {

  if (Array.prototype.find) return;

  var find = function find(predicate) {
    var list = Object(this);
    var length = list.length < 0 ? 0 : list.length >>> 0; // ES.ToUint32;
    if (length === 0) return undefined;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#find: predicate must be a function');
    }
    var thisArg = arguments[1];
    for (var i = 0, value; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) return value;
    }
    return undefined;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'find', {
        value: find, configurable: true, enumerable: false, writable: true
      });
    } catch (e) {}
  }

  if (!Array.prototype.find) {
    Array.prototype.find = find;
  }
})();

'use strict';
/*global window,AudioFXGlobal,AudioContext,XMLHttpRequest,AudioFXGlobalClass */

var AudioFX = (function () {

  /**
   * Instantiates a new AudioFX instance, should be called after the window has loaded.
   * @constructor
   * @param {string} url - A URL where to load the file from.
   * @param {function} callback - A function that gets called once the buffer has been loaded and we are ready for playback.
   * @param {object} options - Custom options on instance level.
   */

  function AudioFX(url, callback, options) {
    _classCallCheck(this, AudioFX);

    // set constants
    this['const'] = {
      QUALITY_MULTIPLIER: 30
    };
    // set defaultOptions
    var defaultOptions = {
      // if the audio should loop
      loop: false,
      // starting volume
      volume: 1,
      // the frequency of the filter, null means no filter
      filterFrequency: null,
      // if it should play immediately after loading
      autoplay: false,
      // function to be called when the buffersource has naturally ended
      onEnded: null
    };
    // overwrite defaults with supplied options – if an object is supplied
    if (AudioFX.isObject(options)) {
      this.options = AudioFX.extend(defaultOptions, options);
    } else {
      this.options = defaultOptions;
    }
    // initialize the instance vars
    this.playing = false;
    this.hasLoaded = false;
    // init global audioFX if hasn't been already
    if (!window.AudioFXGlobal) {
      window.AudioFXGlobal = new AudioFXGlobalClass();
    }
    // register the supplied url, I'd say there's no valid-URL-check necessary
    if (typeof url !== 'string') {
      AudioFX.error('You have to provide a valid url string.');
    } else {
      this.url = url;
    }
    // if a callback was provided
    if (callback) {
      // if the callback is really a function, register it
      if (AudioFX.isFunction(callback)) {
        this.onload = callback;
      } else {
        AudioFX.error('Supplied callback is not a function.');
      }
    }
    // register empty buffer var
    this.buffer = null;
    // we don't know the duration yet
    this.duration = 0;
    // create empty buffer source var
    this.source = null;
    // create gain node
    this.gainNode = window.AudioFXGlobal.context.createGain();
    // set the option volume
    this.gainNode.gain.value = this.options.volume;
    // create filter node
    this.filterNode = window.AudioFXGlobal.context.createBiquadFilter();
    // filter.type is defined as string type in the latest API. But this is defined as number type in old API.
    this.filterNode.type = typeof this.filterNode.type === 'string' ? 'lowpass' : 0; // LOWPASS
    // if a filter frequency was set in the options, use it, otherwise fall back to the sampleRate, which is the maximum
    if (this.options.filterFrequency) {
      this.filterNode.frequency.value = this.options.filterFrequency;
    } else {
      this.filterNode.frequency.value = window.AudioFXGlobal.context.sampleRate;
    }
    // set the pauseTime to 0, so we can add to it
    this._pauseTime = 0;
    // set unique id
    this.id = window.AudioFXGlobal.cache.length + 1;
    // if there's directly a url provided and it's not in the cache, then load it
    var cached = window.AudioFXGlobal.cache.find(function (item) {
      return item.url === url;
    });
    // check if a cached version of that url has been found
    if (window.AudioFXGlobal.cache.length > 0 && cached) {
      // if so, manually set that it's loaded
      this.hasLoaded = true;
      // and make a deep copy of the buffer
      this.setBuffer(cached.buffer);
    } else {
      // nothing found in the cache, so we issue a XHR request
      this.loadFile(url);
    }
    // no return needed for constructor
  }

  _createClass(AudioFX, [{
    key: 'loadFile',

    /**
     * Loads a file from an URL
     * @param {string} url - A URL where to load the file from.
     */
    value: function loadFile(url) {
      // Load buffer asynchronously
      this.request = new XMLHttpRequest();
      // issue a GET request to the url, the true flag makes it async
      this.request.open('GET', url, true);
      // set the responseType to Arraybuffer
      this.request.responseType = 'arraybuffer';
      // create reference for the async onload function
      var instance = this;
      // define what happens when we get a response from the request
      this.request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        window.AudioFXGlobal.context.decodeAudioData(
        // the arrayBuffer we received
        instance.request.response,
        // do this with it
        function (buffer) {
          instance.setBuffer(buffer);
        },
        // if you can't make it, tell me why
        function (error) {
          AudioFX.error('Error at decodeAudioData' + error);
        });
      };
      // bind error function in case things go wrong
      this.request.onerror = function () {
        AudioFX.error('XMLHttpRequest errored. Readystate: ' + this.readyState + '. Status: ' + this.status);
      };
      // actually send the request we created
      this.request.send();
    }
  }, {
    key: 'setBuffer',

    /**
     * After decoding a buffer or loading an already decoded buffer, set it to the instance
     * @param buffer - a decoded AudioBuffer
     * @returns {AudioFX} - Return the current instance for chaining
     */
    value: function setBuffer(buffer) {
      // if we don't have a buffer, throw an error
      if (!buffer) {
        AudioFX.error('No Buffer found.');
      }
      // save the url to the cache
      window.AudioFXGlobal.cache.push(this);
      // otherwise save the buffer
      this.buffer = AudioFX.clone(buffer);
      //this.buffer = buffer;
      // save the duration information to the instance
      this.duration = parseFloat(buffer.duration);
      // set hasLoaded
      this.hasLoaded = true;
      // autoplay if set
      if (this.options.autoplay === true) {
        this.play();
      }
      // and fire the callback if we have one
      if (AudioFX.isFunction(this.onload)) {
        this.onload(this);
      }
      return this;
    }
  }, {
    key: 'bufferEnded',

    /**
     * The ended event is fired when playback has stopped because the end of the media was reached.
     */
    value: function bufferEnded() {
      // set playing to false
      this.playing = false;
      if (this.options.onEnded !== null) {
        this.options.onEnded();
      }
    }
  }, {
    key: 'createAndConnectNodes',

    /**
     * Creates a new BufferSource and connects the nodes after a buffer has loaded, has to be re-done everytime play gets called
     */
    value: function createAndConnectNodes() {
      // create new Buffer Source
      this.source = window.AudioFXGlobal.context.createBufferSource();
      // assign buffer to source
      this.source.buffer = this.buffer;
      // hook up the ended event
      this.source.onended = this.bufferEnded.bind(this);
      // connect source to filter
      this.source.connect(this.filterNode);
      // connect filter to gain
      this.filterNode.connect(this.gainNode);
      // connect gain to output
      this.gainNode.connect(window.AudioFXGlobal.context.destination);
    }
  }, {
    key: 'play',

    /**
     * Plays the Audio
     * @param {number} offset - The offset parameter describes the offset time in the buffer (in seconds) where playback will begin. If 0 is passed in for this value, then playback will start from the beginning of the buffer.
     */
    value: function play() {
      var offset = arguments[0] === undefined ? 0 : arguments[0];

      // if we were playing already, stop the previous instance, otherwise we can't control it anymore
      if (this.playing === true) {
        this.stop();
      }
      // create new bufferSource and connect the nodes
      this.createAndConnectNodes();
      // set looping option
      if (this.options.loop) {
        this.source.loop = true;
      }
      // normalize browser syntax
      if (!this.source.start) {
        this.source.start = this.source.noteOn;
      }
      // if previously was paused
      if (this._pauseTime) {
        // play from where was paused last time
        this.source.start(0, this._pauseTime);
      } else {
        // play from beginning or offset
        this.source.start(0, offset);
      }
      // set new play start time
      this._playTime = window.AudioFXGlobal.context.currentTime;
      // we are now playing
      this.playing = true;
      // return for chaining
      return this;
    }
  }, {
    key: 'pause',

    /**
     * Pauses the audio at the current position
     */
    value: function pause() {
      // only if it has been started
      if (this._playTime) {
        // playTime is always when play is pressed, calculate the time between the last play
        var addedTime = window.AudioFXGlobal.context.currentTime - this._playTime;
        // add that time
        this._pauseTime = this._pauseTime + addedTime;
        // if there is an old version of the API
        if (!this.source.stop) {
          // shim stop from noteOff
          this.source.stop = this.source.noteOff;
        }
        // now stop
        this.source.stop();
        // we're not playing anymore
        this.playing = false;
      }
    }
  }, {
    key: 'stop',

    /**
     * Stops the audio
     * @param {number} when - The when parameter defines when the playback will stop. If it represents a time in the past, the playback will end immediately.
     */
    value: function stop() {
      var when = arguments[0] === undefined ? 0 : arguments[0];

      // if there is an old version of the API
      if (!this.source.stop) {
        // shim stop from noteOff
        this.source.stop = this.source.noteOff;
      }
      // reset the paused time because we're at 0 again
      this._pauseTime = null;
      // now actually do it
      this.source.stop(when);
      this.playing = false;
      // return for chaining
      return this;
    }
  }, {
    key: 'toggle',

    /**
     * Play/Pause toggles the audio
     */
    value: function toggle() {
      // If we are playing
      if (this.playing === true) {
        // then stop
        this.pause();
      } else {
        // otherwise we have stopped, so play
        this.play();
      }
      // return for chaining
      return this;
    }
  }, {
    key: 'changeVolume',

    /**
     * Changes the volume of the instance
     * @param {number} volume - the volume (supply a fraction like 0.5 between 0 and 1)
     */
    value: function changeVolume(volume) {
      // parse the input to make sure we have a number to work with
      var fraction = parseFloat(volume);
      // make sure the number is between 0 and 1
      if (fraction > 1) {
        fraction = 1;
      } else if (fraction < 0) {
        fraction = 0;
      }
      // Let's use an x*x curve (x-squared) since simple linear (x) does not sound as good.
      this.gainNode.gain.value = fraction * fraction;
      // return for chaining
      return this;
    }
  }, {
    key: 'changeFilter',

    /**
     * Changes the filter of the instance
     * @param {number} frequency - the frequency of the filter (supply a fraction like 0.5 between 0 and 1)
     * @param {number} quality - the volume (supply a fraction like 0.5 between 0 and 1)
     */
    value: function changeFilter(frequency, quality) {
      // Clamp the frequency between the minimum value (40 Hz) and half of the sampling rate.
      var minValue = 40;
      var maxValue = window.AudioFXGlobal.context.sampleRate / 2;
      // Logarithm (base 2) to compute how many octaves fall in the range.
      var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
      // Compute a multiplier from 0 to 1 based on an exponential scale.
      var multiplier = Math.pow(2, numberOfOctaves * (frequency - 1));
      // Get back to the frequency value between min and max.
      this.filterNode.frequency.value = maxValue * multiplier;
      this.filterNode.Q.value = quality * this['const'].QUALITY_MULTIPLIER;
      // return for chaining
      return this;
    }
  }, {
    key: 'getCurrentTime',

    /**
     * Gets the current playhead of the AudioFX instance
     * @returns {*}
     */
    value: function getCurrentTime() {
      if (this.playing) {
        return this._pauseTime + (window.AudioFXGlobal.context.currentTime - this._playTime);
      } else {
        return this._pauseTime;
      }
    }
  }, {
    key: 'getDuration',

    /**
     * Gets the duration of the AudioFX instance
     * @returns {Number|*|AudioFX.duration}
     */
    value: function getDuration() {
      return this.duration;
    }
  }, {
    key: 'destroy',

    /**
     * Destroys the instance, make sure to clean all reference to it for Garbage Collection
     */
    value: function destroy() {
      // stop if we're playing
      if (this.playing) {
        this.stop();
      }
      // kill reference in cache
      window.AudioFXGlobal.cache.splice(window.AudioFXGlobal.cache.indexOf(this), 1);
      // memory cleanup
      for (var prop in this) {
        if (this.hasOwnProperty(prop)) {
          delete this[prop];
        }
      }
    }
  }, {
    key: 'volume',

    // SYNTACTIC SUGAR

    /**
     * Just syntactic sugar over changeVolume
     */
    value: function volume(v) {
      return this.changeVolume(v);
    }
  }, {
    key: 'filter',

    /**
     * Just syntactic sugar over changeFilter
     */
    value: function filter(f, q) {
      return this.changeFilter(f, q);
    }
  }, {
    key: 'kill',

    /**
     * Just syntactic sugar over destroy
     */
    value: function kill() {
      return this.destroy();
    }
  }, {
    key: 'remove',

    /**
     * Just syntactic sugar over destroy
     */
    value: function remove() {
      return this.destroy();
    }
  }], [{
    key: 'extend',

    // HELPER FUNCTIONS FOR INDEPENDENCE

    /**
     * Extends an object with values from a seconds object. Used for options overwriting
     * @param {object} a - the first object with default values
     * @param {object} b - the second object with values that should overwrite the first one
     */
    value: function extend(a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }
  }, {
    key: 'clone',

    /**
     * Clones a AudioBuffer
     * @param inBuffer - the buffer to clone
     * @returns {object} - the cloned buffer
     */
    value: function clone(inBuffer) {
      var outBuffer = window.AudioFXGlobal.context.createBuffer(inBuffer.numberOfChannels, inBuffer.length, inBuffer.sampleRate);
      for (var i = 0, c = inBuffer.numberOfChannels; i < c; ++i) {
        var od = outBuffer.getChannelData(i),
            id = inBuffer.getChannelData(i);
        od.set(id, 0);
      }
      return outBuffer;
    }
  }, {
    key: 'isObject',

    /**
     * Checks if the supplied argument is an object and not null
     * @param {object} obj - the argument to check
     */
    value: function isObject(obj) {
      return obj !== null && typeof obj === 'object';
    }
  }, {
    key: 'isFunction',

    /**
     * Checks if the supplied argument is a function
     * @param {function} functionToCheck - the argument to check
     */
    value: function isFunction(functionToCheck) {
      var getType = {};
      return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
  }, {
    key: 'error',

    /**
     * Centralized error handling
     * @param {string} errorMessage - the message for output
     */
    value: function error(errorMessage) {
      throw new Error('AudioFX: Error! ' + errorMessage);
    }
  }]);

  return AudioFX;
})();
return AudioFX;
}));
