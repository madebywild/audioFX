"use strict";

class audioFX {

  /*
    Instantiates a new audioFX instance, should be called after the window has loaded
    @param url: A url where to load the file from
    @param callback: A function that gets called once the buffer has been loaded and we are ready for playback
   */
  constructor(url, callback) {
    // initialize the instance vars
    this.playing = false;
    // init context with prefixes
    try {
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      this.context = new AudioContext();
    }catch(e) {
      this.error('Web Audio API is not supported in this browser');
    }
    // register the supplied url, I'd say there's no valid-URL-check necessary
    this.url = url;
    // if the callback is really a function, register it
    if(isFunction(callback)) {
      this.onload = callback;
    }else{
      this.error("Supplied callback is not a function.")
    }
    // instantiate the buffer for filling up later
    this.buffer = null;
    // if there's directly a url provided, the load it
    this.loadFile(url);
    // no return needed for constructor
  }

  loadFile(url){
    // Load buffer asynchronously
    this.request = new XMLHttpRequest();
    // issue a GET request to the url, the true flag makes it async
    this.request.open("GET", url, true);
    // set the responseType to Arraybuffer
    this.request.responseType = "arraybuffer";
    // create reference for the async onload function
    var instance = this;
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
          instance.onload(instance.bufferList);
        },
        // if you can't make it, tell me why
        function(error) {
          instance.error('Error at decodeAudioData', error);
        }
      );
    };
    // bind error function in case things go wrong
    this.request.onerror = function() {
      this.error("XMLHttpRequest errored.");
    };
    // actually send the request we created
    this.request.send();
  }

  // plays the audio
  play(){
    var source = context.createBufferSource(); // creates a sound source
    source.buffer = buffer;                    // tell the source which sound to play
    source.connect(context.destination);       // connect the source to the context's destination (the speakers)
    source.start(0);                           // play the source now
                                               // note: on older systems, may have to use deprecated noteOn(time);
  }

  // pauses the audio
  pause(){

  }

  // play/pause toggles the audio
  toggle(){
    if(this.playing === true){
      return this.pause();
    }else{
      return this.play();
    }
  }

  // changes the volume
  changeVolume(volume){

  }

  // changes the filter
  changeFilter(frequency,quality){

  }

  // destroys the instance
  destroy(){
    return delete this;
  }

  // SYNTACTIC SUGAR

  // just syntactic sugar over changeVolume
  volume(v){
    return this.changeVolume(v);
  }
  // just syntactic sugar over changeFilter
  filter(f,q){
    return this.changeFilter(f,q);
  }
  // just syntactic sugar over destroy
  kill(){
    return this.destroy();
  }
  // just syntactic sugar over destroy
  remove(){
    return this.destroy();
  }

  // HELPER FUNCTIONS FOR INDEPENDENCE

  static isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  }
  static error(errorMessage){
    return console.error('audioFX: Error! '+errorMessage);
  }

}
