# audioFX

High-Level Audio Effects using the Web Audio API in JavaScript, ~1-2 KB gzipped.

Currently only a lowpass-filter is available and things are still very **alpha**. API **will probably** change in the future. Currently 93% test coverage in latest Chrome, FF and Safari.

Features caching, so repeated loadings to the same url result in only one request and deep copies of the cached AudioBuffers for the following loads.

[Demo](http://madebywild.github.io/audioFX/)

## Installation

### CDN

``<script src="//cdn.jsdelivr.net/audiofx/latest/AudioFX.min.js"></script>``

### Bower

``bower install AudioFX``

### NPM

``npm install audiofx``

## Usage Instructions

*Note:* **AudioFX** should be called after the window has loaded to ensure we have access to the Audio Context of the Browser.

### new AudioFX(url, [callback], [options])

Creates a new AudioFX instance that represents one loaded Audio file. If you store it in a variable for later use, make sure to ``null`` the variable so it's fully eligible to garbage collection.
 
- ``url`` {string} - A URL where to load the file from.
- ``callback`` {function} - A function that gets called once the buffer has been loaded and we are ready for playback. *optional*
- ``options`` {object} - Custom options on instance level. *optional*

#### options

- ``loop`` {boolean} - If the audio file should loop upon playing (Default: false)
- ``volume`` {float} - A fraction between 0 and 1, representing the starting volume of the instance
- ``filterFrequency`` {float} - A fraction between 0 and 1, representing the set filter frequency from start. If ``null`` is specified, the filter is set to the samplerate and therefore not hearable (Default: null)
- ``autoplay`` {boolean} - If set to true (Default: false)

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    // do something
}, {
    loop: true,
    volume: 0.85,
    filterFrequency: 0.5,
    autoplay: true
});
```

### play(offset)

- ``offset`` {number} - From how far into the audio file playback should start. 0 means it starts from the beginning (default: 0)

Plays the ``AudioFX`` instance from the supplied offset and re-evaluates the options of the instance before playing (in case they were changed in the meantime).
You can only play an instance once its file has been loaded, so its the best to use inside the constructor callback function.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play(0);
});
```

### pause()

Pauses the ``AudioFX`` instance at the current position. When now play()'ed again, it will start where we paused from.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
});
```

### stop()

Stops the ``AudioFX`` instance immediately and resets the pause timer.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    setTimeout(function(){
      TestAudio.stop();
    },1000);
});
```

### toggle()

Toggles the play/pause state of the ``AudioFX`` instance.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    document.addEventListener('mousedown', function(){
      TestAudio.toggle();
    });
});
```

### changeVolume(volume)

- ``volume`` {number} - the new volume to set (supply a fraction like 0.5 between 0 and 1)

You can also use ``volume()`` which is simply syntactic sugar for the ``changeVolume()`` function.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    TestAudio.changeVolume(0.8);
});
```

### changeFilter(frequency, quality)

- ``frequency`` {number} - the frequency of when the filter cuts off (supply a fraction like 0.5 between 0 and 1) for more info see http://en.wikipedia.org/wiki/Low-pass_filter
- ``quality`` {number} - the quality of the filter (supply a fraction like 0.5 between 0 and 1) for more info see: http://en.wikipedia.org/wiki/Q_factor

You can also use ``filter()`` which is simply syntactic sugar for the ``changeFilter()`` function.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    document.addEventListener('mousemove', function(e){
      var f = e.pageX / window.innerWidth;
      var q = e.pageY / window.innerHeight;
      TestAudio.changeFilter(f,q);
    });
}, {loop:true});
```

### getDuration()

Returns the duration of the ``AudioFX`` instance.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    console.log(this.getDuration());
});
```

### getCurrentTime()

Returns the current position of the ``AudioFX`` instance playhead.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    console.log(this.getCurrentTime());
});
```

### destroy()

Stops and destroys the ``AudioFX`` instance, be sure to ``null`` the variable/references to completely get rid of it in the memory.

You can also use ``remove()`` and ``kill()`` which is simply syntactic sugar for the ``destroy()`` function.

Example:
```javascript
var TestAudio = new AudioFX("test.mp3", function(){
    this.play();
    setTimeout(function(){
      TestAudio.destroy();
    },1000);
});
```

## Dependencies

**None!** Drop it in as you please.

## Compatibility

It uses ``UMD`` and therefore is compatible with ``AMD``, ``CommonJS`` and returns a global ``AudioFX``.
This is the list of browsers that support the Web Audio API, that means it should work there, albeit not every version has been tested. Test reports are very welcome!

- Chrome 14+
- Firefox 23+
- Opera 15
- Safari 6
- **No Internet Explorer!**

## Roadmap

- [ ] Global Volume Change across all audioFX instances
- [ ] all Filter types (highpass etc.)
- [ ] Reverb (Convolver)
- [ ] Delay
- [ ] AnalyzerNode
- [ ] HTML5 Audio Player fallback so there is progressive enhancement (sound playing, but no FX)
- [ ] Fade In / Fade Out (non-linear)
- [ ] panning position with panner.setPosition(x, y, z);

## License

(The MIT License)

Copyright (c) 2015 Thomas Strobl @tom2strobl tom@wild.as

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
