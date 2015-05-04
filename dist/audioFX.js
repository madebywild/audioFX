(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.AudioFX = factory();
  }
}(this, function() {
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*global window,AudioContext,XMLHttpRequest */

var AudioFX = (function () {

  /**
   * Instantiates a new AudioFX instance, should be called after the window has loaded.
   * @constructor
   * @param {string} url - A URL where to load the file from.
   * @param {object} options - Custom options on instance level.
   * @param {function} callback - A function that gets called once the buffer has been loaded and we are ready for playback.
   */

  function AudioFX(url, callback, options) {
    _classCallCheck(this, AudioFX);

    // set constants
    this["const"] = {
      QUALITY_MULTIPLIER: 30
    };
    // set defaultOptions
    var defaultOptions = {
      loop: false
    };
    // overwrite defaults with supplied options – if an object is supplied
    if (AudioFX.isObject(options)) {
      this.options = AudioFX.extend(defaultOptions, options);
    }
    // initialize the instance vars
    this.playing = false;
    // init context with prefixes
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
    } catch (e) {
      AudioFX.error("Web Audio API is not supported in this browser");
    }
    // register the supplied url, I'd say there's no valid-URL-check necessary
    this.url = url;
    // if the callback is really a function, register it
    if (AudioFX.isFunction(callback)) {
      this.onload = callback;
    } else {
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
    this.filter.type = typeof this.filter.type === "string" ? "lowpass" : 0; // LOWPASS
    this.filter.frequency.value = this.options.filterFrequency || this.context.sampleRate;
    // if there's directly a url provided, the load it
    this.loadFile(url);
    // no return needed for constructor
  }

  _createClass(AudioFX, [{
    key: "loadFile",

    /**
     * Loads a file from an URL
     * @param {string} url - A URL where to load the file from.
     */
    value: function loadFile(url) {
      // Load buffer asynchronously
      this.request = new XMLHttpRequest();
      // issue a GET request to the url, the true flag makes it async
      this.request.open("GET", url, true);
      // set the responseType to Arraybuffer
      this.request.responseType = "arraybuffer";
      // create reference for the async onload function
      var instance = this;
      // define what happens when we get a response from the request
      this.request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        instance.context.decodeAudioData(
        // the arrayBuffer we received
        instance.request.response,
        // do this with it
        function (buffer) {
          // if we don't have a buffer, throw an error
          if (!buffer) {
            instance.error("Error decoding file data: " + url);
            return;
          }
          // otherwise save the buffer
          instance.buffer = buffer;
          // and fire the callback
          instance.onload(instance);
        },
        // if you can't make it, tell me why
        function (error) {
          instance.error("Error at decodeAudioData", error);
        });
      };
      // bind error function in case things go wrong
      this.request.onerror = function () {
        AudioFX.error("XMLHttpRequest errored.");
      };
      // actually send the request we created
      this.request.send();
    }
  }, {
    key: "createAndConnectNodes",

    /**
     * Creates a new BufferSource and connects the nodes after a buffer has loaded, has to be re-done everytime play gets called
     */
    value: function createAndConnectNodes() {
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
  }, {
    key: "play",

    /**
     * Plays the Audio
     * @param {number} when - The when parameter defines when the play will start. If when represents a time in the past, the play will start immediately.
     */
    value: function play() {
      var when = arguments[0] === undefined ? 0 : arguments[0];

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
      // play
      this.source.start(when);
      this.playing = true;
      // return for chaining
      return this;
    }
  }, {
    key: "stop",

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
      // now actually do it
      this.source.stop(when);
      this.playing = false;
      // return for chaining
      return this;
    }
  }, {
    key: "toggle",

    /**
     * Play/Pause toggles the audio
     */
    value: function toggle() {
      // If we are playing
      if (this.playing === true) {
        // then stop
        this.stop();
      } else {
        // otherwise we have stopped, so play
        this.play();
      }
      // return for chaining
      return this;
    }
  }, {
    key: "changeVolume",

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
    key: "changeFilter",

    /**
     * Changes the filter of the instance
     * @param {number} frequency - the frequency of the filter (supply a fraction like 0.5 between 0 and 1)
     * @param {number} quality - the volume (supply a fraction like 0.5 between 0 and 1)
     */
    value: function changeFilter(frequency, quality) {
      // Clamp the frequency between the minimum value (40 Hz) and half of the sampling rate.
      var minValue = 40;
      var maxValue = this.context.sampleRate / 2;
      // Logarithm (base 2) to compute how many octaves fall in the range.
      var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
      // Compute a multiplier from 0 to 1 based on an exponential scale.
      var multiplier = Math.pow(2, numberOfOctaves * (frequency - 1));
      // Get back to the frequency value between min and max.
      this.filter.frequency.value = maxValue * multiplier;
      this.filter.Q.value = quality * this["const"].QUALITY_MULTIPLIER;
      // return for chaining
      return this;
    }
  }, {
    key: "destroy",

    /**
     * Destroys the instance, make sure to clean all reference to it for Garbage Collection
     */
    value: function destroy() {
      var self = this;
      self = null;
    }
  }, {
    key: "volume",

    // SYNTACTIC SUGAR

    /**
     * Just syntactic sugar over changeVolume
     */
    value: function volume(v) {
      return this.changeVolume(v);
    }
  }, {
    key: "filter",

    /**
     * Just syntactic sugar over changeFilter
     */
    value: function filter(f, q) {
      return this.changeFilter(f, q);
    }
  }, {
    key: "kill",

    /**
     * Just syntactic sugar over destroy
     */
    value: function kill() {
      return this.destroy();
    }
  }, {
    key: "remove",

    /**
     * Just syntactic sugar over destroy
     */
    value: function remove() {
      return this.destroy();
    }
  }], [{
    key: "extend",

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
    key: "isObject",

    /**
     * Checks if the supplied argument is an object and not null
     * @param {object} obj - the argument to check
     */
    value: function isObject(obj) {
      return obj !== null && typeof obj === "object";
    }
  }, {
    key: "isFunction",

    /**
     * Checks if the supplied argument is a function
     * @param {function} functionToCheck - the argument to check
     */
    value: function isFunction(functionToCheck) {
      var getType = {};
      return functionToCheck && getType.toString.call(functionToCheck) === "[object Function]";
    }
  }, {
    key: "error",

    /**
     * Centralized error handling
     * @param {string} errorMessage - the message for output
     */
    value: function error(errorMessage) {
      return console.error("AudioFX: Error! " + errorMessage);
    }
  }]);

  return AudioFX;
})();
return AudioFX;
}));
