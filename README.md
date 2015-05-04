# audioFX

High-Level Audio Effects using the Web Audio API in JavaScript, ~1-2 KB gzipped.

## Installation

### CDN

``<script src="//cdn.jsdelivr.net/audioFX/latest/audioFX.min.js"></script>``

### Bower

``bower install audioFX``

### NPM

``npm install audioFX``

## Instructions

Should be called after the window has loaded to ensure we have access to the Audio Context of the Browser.

Example:
```
var Audio = new audioFX("test.mp3", function(){
    this.play();
    document.addEventListener('mousemove', function(e){
      var f = e.pageX / window.innerWidth;
      var q = e.pageY / window.innerHeight;
      Audio.changeFilter(f,q);
    });
    document.addEventListener('mousedown', function(){
      Audio.toggle();
    });
  }, {loop:true});
```

## Dependencies

**None!** Drop it in as you please.

## Compatibility

This is the list of browsers that support the Web Audio API, that means it should work there, albeit not every version has been tested. Test reports are very welcome!

- Chrome 14+
- Firefox 23+
- Opera 15
- Safari 6
- **No Internet Explorer!**

## Todo / Roadmap

- [ ] Proper Docs
- [ ] Proper Tests, obviously
- [ ] HTML5 Audio Player fallback so there is progressive enhancement (sound playing, but no FX)
- [ ] ability to change options after init
- [ ] Global Volume Change across all filterBox instances
- [ ] Fade In / Fade Out
- [ ] Reverb
- [ ] AMD / Node Module Export

## License

(The MIT License)

Copyright (c) Thomas Strobl @tom2strobl tom@wild.as

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.