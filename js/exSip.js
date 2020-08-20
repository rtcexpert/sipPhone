/*!
 * Includes SIP version 0.11.4
 * Copyright (c) 2014-2018 Junction Networks, Inc <http://www.onsip.com>
 * Homepage: https://sipjs.com
 * License: https://sipjs.com/license/
 *
 * Date: "Fri Oct 19 2018 13:11:31 GMT+0530 (India Standard Time)"
 */

(function( global, factory ) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {

    module.exports = global.document ?
      factory( global, true ) :
      function( w ) {
        if ( !w.document ) {
          throw new Error( "exSip requires a window with a document" );
        }
        return factory( w );
      };
  } else {
    factory( global );
  }

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

  /* Polyfill indexOf. */
var indexOf;

  if (typeof Array.prototype.indexOf === 'function') {
      indexOf = function (haystack, needle) {
          return haystack.indexOf(needle);
      };
  } else {
      indexOf = function (haystack, needle) {
          var i = 0, length = haystack.length, idx = -1, found = false;

          while (i < length && !found) {
              if (haystack[i] === needle) {
                  idx = i;
                  found = true;
              }

              i++;
          }

          return idx;
      };
  };

  var version       = "0.0.1",
      configuration = {},
      media         = {},
      sipEvents     = {},
      _this         = null,
      sipSimple     = null,
      sipPhone      = null;

  var exSip = function Simple( options, media ) {

    _this = this;
    this.events = {};

    configuration = options;
    media         = media;

    sipSimple   = this.init( options, media );
    sipPhone    = sipSimple.ua;;
    sipSession  = null;

    this.attachEvent( sipSimple, sipPhone );
  }

  exSip.prototype.getConfig = function() {

    return this.options;
  };

  exSip.prototype.mute = function() {

    sipSimple.mute();
    console.log("mute");
  };

  exSip.prototype.unmute = function() {

    sipSimple.unmute();
    console.log("unmute");
  };

  exSip.prototype.stop = function() {

    sipPhone.stop();
  };

  exSip.prototype.call = function( phoneNumber, callType, gateway, conferenceId, groupId, options = {} ) {

    options = options || {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false
        },
      }
    };

    let extraHeaders = [];
    if( callType ){
      extraHeaders.push(`CallType: ${callType}`);
    }
    if( gateway ){
      extraHeaders.push(`Gateway: ${gateway}`);
    }
    if( conferenceId ){
      extraHeaders.push(`ConferenceId: ${conferenceId}`);
    }
    if( groupId ){
      extraHeaders.push(`GroupId: ${groupId}`);
    }
    try {
      var rtcSession = sipPhone.invite( phoneNumber, { extraHeaders : extraHeaders } );
      this.attachSessionEvent( rtcSession );
      return {"output": true,"message":"call initiate successfully", "rtcSession": rtcSession};
    } catch (error) {
      console.error();
      return {"output": false,"message":"call initiate failed", "error" : error};
    }
  };


  exSip.prototype.answer = function() {

    console.log("answer");
    sipSession.accept({sessionDescriptionHandlerOptions : { constraints : { audio : true, video : false } }});
  };

  exSip.prototype.terminate = function() {

    sipSession.terminate();
    sipSession.bye();
  };

  exSip.prototype.dtmf = function( dtmfNo ) {

    sipSession.dtmf( dtmfNo );
  };

  exSip.prototype.init = function( options, media ) {

    return new SIP.Web.Simple({ media: media, ua: options });
  };

  exSip.prototype.getVersion = function() {

    return version;
  }

  exSip.prototype.on = function (event, listener) {
      if (typeof sipEvents[event] !== 'object') {
          sipEvents[event] = [];
      }

      sipEvents[event].push(listener);
  };

  exSip.prototype.removeListener = function (event, listener) {
      var idx;

      if (typeof sipEvents[event] === 'object') {
          idx = indexOf(sipEvents[event], listener);

          if (idx > -1) {
              sipEvents[event].splice(idx, 1);
          }
      }
  };

  exSip.prototype.emit = function (event) {
      var i, listeners, length, args = [].slice.call(arguments, 1);
      if (typeof sipEvents[event] === 'object') {
          listeners = sipEvents[event].slice();
          length = listeners.length;

          for (i = 0; i < length; i++) {
              listeners[i].apply(_this, args);
          }
      }
  };

  exSip.prototype.once = function (event, listener) {
      _this.on(event, function g () {
          _this.removeListener(event, g);
          listener.apply(_this, arguments);
      });
  };


  exSip.prototype.attachEvent = function ( sipSimple, sipPhone ) {  

    sipPhone.on('registered', function( response, cause ) {

      exSip.prototype.emit("registered", response, cause );
    });

    sipPhone.on('unregistered', function( response, cause ) {

      exSip.prototype.emit("unregistered", response, cause );
    });

    sipPhone.on('registrationFailed', function( response, cause ) {

      exSip.prototype.emit("registrationFailed", response, cause );
    });

    sipPhone.on('invite', function( session ) {

      sipSession = session;
      exSip.prototype.emit("invite", session );
      this.attachSessionEvent( session );
      // session.accept({sessionDescriptionHandlerOptions : { constraints : { audio : true, video : false } }});
    });

    sipPhone.on('outOfDialogReferRequested', function(referServerContext) {

      exSip.prototype.emit("outOfDialogReferRequested",referServerContext);
    });

    sipPhone.on('transportCreated', function(transport) {

      exSip.prototype.emit("transportCreated",transport);
    });
  };

  exSip.prototype.attachSessionEvent = function ( rtcSession ) {

    rtcSession.on('new', function() {

      exSip.prototype.emit("new");
    });

    rtcSession.on('ringing', function() {

      exSip.prototype.emit("ringing");
    });

    rtcSession.on('connecting', function() {

      exSip.prototype.emit("connecting");
    });
    rtcSession.on('accepted', function() {

      exSip.prototype.emit("accepted");

      console.log("accepted data", rtcSession)
      // const remoteStream = new MediaStream();
      // rtcSession.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
      //   if (receiver.track && receiver.kind && receiver.kind == "audio" ) {
      //     remoteStream.addTrack(receiver.track);
      //   }
      // });
      onAccepted( rtcSession );
      // var mediaElement = document.getElementById('remoteView');
      // if (typeof mediaElement.srcObject !== 'undefined') {
      //   mediaElement.srcObject = remoteStream;
      // } else if (typeof mediaElement.mozSrcObject !== 'undefined') {
      //   mediaElement.mozSrcObject = remoteStream;
      // } else if (typeof mediaElement.src !== 'undefined') {
      //   mediaElement.src = URL.createObjectURL(remoteStream);
      // } else {
      //   console.log('Error attaching stream to element.');
      // }

      // mediaElement.play();
    });

    rtcSession.on('connected', function() {

      exSip.prototype.emit("connected");
    });

    rtcSession.on('ended', function() {

      exSip.prototype.emit("ended");
    });

    rtcSession.on('hold', function() {

      exSip.prototype.emit("hold");
    });

    rtcSession.on('unhold', function() {

      exSip.prototype.emit("unhold");
    });

    rtcSession.on('mute', function() {

      exSip.prototype.emit("mute");
    });

    rtcSession.on('unmute', function() {

      exSip.prototype.emit("unmute");
    });

    rtcSession.on('dtmf', function() {

      exSip.prototype.emit("dtmf");
    });

    rtcSession.on('message', function() {

      exSip.prototype.emit("message");
    });
  }
  function onAccepted ( session ) {
    session.sessionDescriptionHandler.peerConnection.getRemoteStreams().forEach(
      attachMediaStream.bind(null, document.getElementById('remoteView'))
    );
  }

  function attachMediaStream (element, stream) {

    if (typeof element.srcObject !== 'undefined') {
        element.srcObject = stream;
      } else if (typeof element.mozSrcObject !== 'undefined') {
        element.mozSrcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        console.log('Error attaching stream to element.');
        return false;
      }
    // if (typeof element.src !== 'undefined') {
    //   URL.revokeObjectURL(element.src);
    //   element.src = URL.createObjectURL(stream);
    // } else if (typeof element.srcObject !== 'undefined'
    //      || typeof element.mozSrcObject !== 'undefined') {
    //   element.srcObject = element.mozSrcObject = stream;
    // } else {
    //   console.log('Error attaching stream to element.');
    //   return false;
    // }

    ensureMediaPlaying(element);
    return true;
  }

  function ensureMediaPlaying (mediaElement) {
    var interval = 100;
    mediaElement.ensurePlayingIntervalId = setInterval(function () {
      if (mediaElement.paused) {
        mediaElement.play()
      }
      else {
        clearInterval(mediaElement.ensurePlayingIntervalId);
      }
    }, interval);
}
  window.exSip =  exSip;
}));