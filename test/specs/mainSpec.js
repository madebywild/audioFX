/*jshint ignore:start*/

var testAudioUrl = "/base/test/test.mp3";
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("When an instance is created", function() {

  afterEach(function(){
    //window.AudioFXGlobal.cache = [];
  });

  it("it works with a callback function", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        expect(this.buffer.toString()).toBe("[object AudioBuffer]");
        expect(this.const.toString()).toBe("[object Object]");
        if(window.AudioFXGlobal.context.toString() === "[object webkitAudioContext]"){
          expect(window.AudioFXGlobal.context.toString()).toBe("[object webkitAudioContext]");
        }else{
          expect(window.AudioFXGlobal.context.toString()).toBe("[object AudioContext]");
        }
        expect(typeof this.duration).toBe("number");
        expect(this.filterNode.toString()).toBe("[object BiquadFilterNode]");
        expect(this.gainNode.toString()).toBe("[object GainNode]");
        expect(typeof this.onload).toBe("function");
        expect(this.options.toString()).toBe("[object Object]");
        expect(this.playing).toBe(false);
        expect(this.request.toString()).toBe("[object XMLHttpRequest]");
        expect(typeof this.url).toBe("string");
        done();
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("it works loading from cache", function (done) {
    var prevLength = window.AudioFXGlobal.cache.length;
    function init() {
      new AudioFX(testAudioUrl, function () {
        expect(window.AudioFXGlobal.cache.length).toBeGreaterThan(prevLength);
        prevLength = window.AudioFXGlobal.cache.length;
        init2();
      });
    }
    function init2() {
      new AudioFX(testAudioUrl, function () {
        expect(this.buffer.toString()).toBe("[object AudioBuffer]");
        expect(this.const.toString()).toBe("[object Object]");
        if(window.AudioFXGlobal.context.toString() === "[object webkitAudioContext]"){
          expect(window.AudioFXGlobal.context.toString()).toBe("[object webkitAudioContext]");
        }else{
          expect(window.AudioFXGlobal.context.toString()).toBe("[object AudioContext]");
        }
        expect(typeof this.duration).toBe("number");
        expect(this.filterNode.toString()).toBe("[object BiquadFilterNode]");
        expect(this.gainNode.toString()).toBe("[object GainNode]");
        expect(typeof this.onload).toBe("function");
        expect(this.options.toString()).toBe("[object Object]");
        expect(this.playing).toBe(false);
        expect(typeof this.url).toBe("string");
        expect(window.AudioFXGlobal.cache.length).toBeGreaterThan(prevLength);
        done();
      });
    }
    init();
    expect(init).not.toThrow();
    expect(init2).not.toThrow();
  });

  it("it works with options", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        expect(this.options.loop).toBe(true);
        expect(this.options.autoplay).toBe(true);
        expect(this.playing).toBe(true);
        done();
      }, {
        loop: true,
        filterFrequency: 0.5,
        autoplay: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("play, toggle and stop are working", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        expect(this.source.toString()).toBe("[object AudioBufferSourceNode]"); // created on play!
        expect(this.playing).toBe(true);
        this.toggle();
        expect(this.playing).toBe(false);
        this.play();
        expect(this.playing).toBe(true);
        this.stop();
        expect(this.playing).toBe(false);
        this.toggle();
        expect(this.playing).toBe(true);
        done();
      }, {
        loop: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("changeVolume and changeFilter are working", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        expect(this.playing).toBe(true);
        this.changeVolume(0.5);
        expect(this.gainNode.gain.value).toBe(0.25); // = 0.5 * 0.5
        this.changeVolume(1.2);
        expect(this.gainNode.gain.value).toBe(1); // = 1 * 1
        this.volume(-0.5);
        expect(this.gainNode.gain.value).toBe(0); // = 0.5 * 0.5
        this.changeFilter(0.5, 0.5);
        expect(this.filterNode.frequency.value).toBe(979.7958984375);
        expect(this.filterNode.Q.value).toBe(15);
        this.changeFilter(0.75, 0.75);
        this.filter(0.5, 0.5);
        expect(this.filterNode.frequency.value).toBe(979.7958984375);
        expect(this.filterNode.Q.value).toBe(15);
        done();
      }, {
        loop: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("duration and currentTime are returned", function(done){
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        var self = this;
        setTimeout(function(){
          self.pause();
          expect(self.getCurrentTime()).toBeGreaterThan(0.08);
          expect(self.getCurrentTime()).toBeLessThan(0.17);
          expect(parseFloat(self.getDuration().toFixed(3))).toBe(32.021);
          self.play();
          setTimeout(function(){
            expect(self.getCurrentTime()).toBeGreaterThan(0.18);
            expect(self.getCurrentTime()).toBeLessThan(0.27);
            self.pause();
            done();
          },100);
        },100);
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("destroy is working", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        this.play();
        this.destroy();
        expect(this.playing).toBe(undefined);
        new AudioFX(testAudioUrl);
        done();
      }, {
        loop: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("kill is working", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        this.kill();
        expect(this.playing).toBe(undefined);
        done();
      }, {
        loop: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("remove is working", function (done) {
    var init = function () {
      new AudioFX(testAudioUrl, function () {
        this.play();
        this.remove();
        expect(this.playing).toBe(undefined);
        done();
      }, {
        loop: true
      });
    };
    init();
    expect(init).not.toThrow();
  });

  it("it doesn't work without a supplied url", function () {
    var AudioTest;
    var init = function () {
      AudioTest = new AudioFX();
    };
    expect(init).toThrow();
    expect(AudioTest).not.toBeDefined();
    // release for GC
    AudioTest = null;
  });

  it("it doesn't work with a non-function callback", function () {
    var AudioTest;
    var init = function () {
      AudioTest = new AudioFX(testAudioUrl, "bad");
    };
    expect(init).toThrow();
    expect(AudioTest).not.toBeDefined();
    // release for GC
    AudioTest = null;
  });

  // doesn't work for some reason. when they are logged, they're still functions and not null
  //it("throws an error when no Web Audio API is present", function(done){
  //  var init = function () {
  //    window.AudioContext = null;
  //    window.WebkitAudioContext = null;
  //    new AudioFX(testAudioUrl, function () {
  //      done();
  //    });
  //  };
  //  init();
  //  expect(init).toThrow();
  //})

});
