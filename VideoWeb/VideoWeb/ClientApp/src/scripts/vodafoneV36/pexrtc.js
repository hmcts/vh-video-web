/* global window, navigator, WebSocket, console, URL, setTimeout, setInterval, clearInterval, EventSource */

var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;

/*
License for Base64.js,
retrieved from https://code.google.com/p/javascriptbase64

Copyright (c) 2008 Fred Palmer fred.palmer_at_gmail.com

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
function StringBuffer() {
    this.buffer = [];
}

StringBuffer.prototype.append = function append(string) {
    this.buffer.push(string);
    return this;
};

StringBuffer.prototype.toString = function toString() {
    return this.buffer.join('');
};

var Base64 = {
    codex: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    encode: function (input) {
        var output = new StringBuffer();

        var enumerator = new Utf8EncodeEnumerator(input);
        while (enumerator.moveNext()) {
            var chr1 = enumerator.current;

            enumerator.moveNext();
            var chr2 = enumerator.current;

            enumerator.moveNext();
            var chr3 = enumerator.current;

            var enc1 = chr1 >> 2;
            var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            var enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
        }

        return output.toString();
    },

    decode: function (input) {
        var output = new StringBuffer();

        var enumerator = new Base64DecodeEnumerator(input);
        while (enumerator.moveNext()) {
            var charCode = enumerator.current;

            if (charCode < 128) output.append(String.fromCharCode(charCode));
            else if (charCode > 191 && charCode < 224) {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
            } else {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                enumerator.moveNext();
                var charCode3 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
            }
        }

        return output.toString();
    }
};

function Utf8EncodeEnumerator(input) {
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Utf8EncodeEnumerator.prototype = {
    current: Number.NaN,

    moveNext: function () {
        if (this._buffer.length > 0) {
            this.current = this._buffer.shift();
            return true;
        } else if (this._index >= this._input.length - 1) {
            this.current = Number.NaN;
            return false;
        } else {
            var charCode = this._input.charCodeAt(++this._index);

            // "\r\n" -> "\n"
            //
            if (charCode == 13 && this._input.charCodeAt(this._index + 1) == 10) {
                charCode = 10;
                this._index += 2;
            }

            if (charCode < 128) {
                this.current = charCode;
            } else if (charCode > 127 && charCode < 2048) {
                this.current = (charCode >> 6) | 192;
                this._buffer.push((charCode & 63) | 128);
            } else {
                this.current = (charCode >> 12) | 224;
                this._buffer.push(((charCode >> 6) & 63) | 128);
                this._buffer.push((charCode & 63) | 128);
            }

            return true;
        }
    }
};

function Base64DecodeEnumerator(input) {
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Base64DecodeEnumerator.prototype = {
    current: 64,

    moveNext: function () {
        if (this._buffer.length > 0) {
            this.current = this._buffer.shift();
            return true;
        } else if (this._index >= this._input.length - 1) {
            this.current = 64;
            return false;
        } else {
            var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));

            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;

            this.current = chr1;

            if (enc3 != 64) this._buffer.push(chr2);

            if (enc4 != 64) this._buffer.push(chr3);

            return true;
        }
    }
};
/* End of base64 code */

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function t2b(text) {
    return text == 'YES' || text == 'ALLOW' ? true : false;
}

function b2t(val) {
    return val ? 'YES' : 'NO';
}
function b2p(val) {
    return val ? 'ALLOW' : 'DENY';
}

function PexRTCMedia(parent) {
    var self = this;

    self.parent = parent;
    self.legacy_screenshare = false;

    self.onUserMedia = null;
    self.onDisplayMedia = null;
    self.onError = null;

    if (self.parent.force_hd !== false) {
        if (!self.parent.bandwidth_out || self.parent.bandwidth_out >= 1600) {
            self.force_hd = 1080;
        } else {
            self.force_hd = 720;
        }
    } else {
        self.force_hd = false;
    }
}

PexRTCMedia.prototype.getUserMedia = function () {
    var self = this;

    var audioConstraints = true;
    if (self.parent.gum_audio_source === false) {
        audioConstraints = false;
    } else if (self.parent.gum_audio_source) {
        if (
            (self.parent.chrome_ver > 56 && self.parent.chrome_ver < 66 && !self.parent.is_android) ||
            self.parent.firefox_ver > 43 ||
            self.edge_ver > 10527
        ) {
            audioConstraints = { deviceId: self.parent.gum_audio_source };
        } else if (self.parent.safari_ver >= 11 || self.parent.chrome_ver > 65) {
            audioConstraints = { deviceId: { exact: self.parent.gum_audio_source } };
        } else if (self.parent.chrome_ver > 49) {
            audioConstraints = { mandatory: { sourceId: self.parent.gum_audio_source }, optional: [] };
        } else {
            audioConstraints = { optional: [{ sourceId: self.parent.gum_audio_source }] };
        }
    }

    if (self.parent.chrome_ver > 67) {
        if (audioConstraints === true) {
            audioConstraints = { deviceId: 'default' };
        }
        if (audioConstraints) {
            audioConstraints['autoGainControl'] = self.parent.autoGainControl;
            audioConstraints['echoCancellation'] = self.parent.echoCancellation;
            audioConstraints['noiseSuppression'] = self.parent.noiseSuppression;
            if (self.parent.sampleRate) {
                audioConstraints['sampleRate'] = self.parent.sampleRate;
                audioConstraints['sampleSize'] = 16;
            }
        }
    }

    var videoConstraints = {};
    if (self.parent.firefox_ver > 43 || self.parent.edge_ver > 10527) {
        videoConstraints.frameRate = { ideal: 30, max: 30 };
        if (self.force_hd > 0 && navigator.userAgent.indexOf('OS X') != -1) {
            videoConstraints.width = { min: 1280 };
            videoConstraints.height = { min: 720 };
            if (self.force_hd == 1080) {
                videoConstraints.width.ideal = 1920;
                videoConstraints.height.ideal = 1080;
            }
        } else {
            videoConstraints.width = { ideal: 1280 };
            videoConstraints.height = { ideal: 720 };
            if (self.force_hd == 1080) {
                videoConstraints.width.max = 1920;
                videoConstraints.height.max = 1080;
            }
        }
    } else if (self.parent.chrome_ver > 56 && !self.parent.is_android) {
        if (self.force_hd == 1080) {
            videoConstraints.width = { min: 1920 };
            videoConstraints.height = { min: 1080 };
            videoConstraints.frameRate = { ideal: 30, max: 30 };
        } else if (self.force_hd == 720) {
            videoConstraints.width = { min: 1280 };
            videoConstraints.height = { min: 720 };
            videoConstraints.frameRate = { ideal: 30, max: 30 };
        } else if (self.force_hd !== false) {
            videoConstraints.width = { ideal: 1280 };
            videoConstraints.height = { ideal: 720 };
        }
    } else if (self.parent.safari_ver >= 11) {
        if (self.force_hd == 1080) {
            videoConstraints.width = 1920;
            videoConstraints.height = 1080;
        } else if (self.force_hd == 720) {
            videoConstraints.width = 1280;
            videoConstraints.height = 720;
        }
    } else if (self.force_hd == 1080 && self.parent.chrome_ver >= 34) {
        videoConstraints.minWidth = '1920';
        videoConstraints.minHeight = '1080';
    } else if (self.force_hd == 720) {
        videoConstraints.minWidth = '1280';
        videoConstraints.minHeight = '720';
    }

    var constraints = { audio: audioConstraints };

    if (self.parent.gum_video_source === false) {
        constraints.video = false;
    } else if (
        (self.parent.chrome_ver > 56 && !self.parent.is_android) ||
        self.parent.firefox_ver > 32 ||
        self.parent.edge_ver > 10527 ||
        self.parent.safari_ver >= 11
    ) {
        constraints.video = videoConstraints;
    } else {
        constraints.video = { mandatory: videoConstraints, optional: [] };
    }

    if (self.parent.gum_video_source) {
        if (
            (self.parent.chrome_ver > 56 && self.parent.chrome_ver < 66 && !self.parent.is_android) ||
            self.parent.firefox_ver > 43 ||
            self.parent.edge_ver > 10527
        ) {
            constraints.video.deviceId = self.parent.gum_video_source;
        } else if (self.parent.safari_ver >= 11 || (self.parent.chrome_ver > 65 && !self.parent.is_android)) {
            constraints.video.deviceId = { exact: self.parent.gum_video_source };
        } else if (self.parent.chrome_ver > 49) {
            constraints.video.mandatory.sourceId = self.parent.gum_video_source;
        } else {
            constraints.video.optional = [{ sourceId: self.parent.gum_video_source }];
        }
    }

    self.parent.onLog('constraints', constraints);

    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(function (stream) {
                    self.gotUserMedia(stream);
                })
                .catch(function (err) {
                    self.gumError(err);
                });
        } else if (navigator.getMedia) {
            navigator.getMedia(
                constraints,
                function (stream) {
                    self.gotUserMedia(stream);
                },
                function (err) {
                    self.gumError(err);
                }
            );
        } else {
            return self.onError(self.parent.trans.ERROR_WEBRTC_SUPPORT);
        }
    } catch (error) {
        self.gumError(error);
    }
};

PexRTCMedia.prototype.gumError = function (err) {
    var self = this;

    self.parent.onLog('getUserMedia error', err);

    if (self.force_hd == 1080) {
        self.force_hd = 720;
        return self.getUserMedia();
    } else if (self.force_hd == 720) {
        self.force_hd = 0;
        return self.getUserMedia();
    } else {
        if (err) {
            self.parent.error = err.name;
        }
        self.onError(self.parent.trans.ERROR_USER_MEDIA);
    }
};

PexRTCMedia.prototype.gotUserMedia = function (stream) {
    var self = this;

    self.onUserMedia(stream);
};

PexRTCMedia.prototype.getDisplayMedia = function () {
    var self = this;

    if (self.parent.is_electron) {
        var pending = window.setTimeout(function () {
            self.legacyDisplayMedia();
        }, 2000);
        self.parent.event_listener = function (event) {
            if (event.origin != window.location.origin) {
                return;
            }
            if (event.data.type == 'pexGetScreenDone') {
                if (event.data.sourceId) {
                    self.legacyDisplayMedia(event.data.sourceId);
                } else {
                    self.gdmError();
                }
            } else if (event.data.type == 'pexGetScreenPending') {
                window.clearTimeout(event.data.id);
            }
        };
        window.addEventListener('message', self.parent.event_listener);
        window.postMessage({ type: 'pexGetScreen', id: +pending }, '*');
    } else {
        var constraints = { audio: self.parent.gum_audio_source !== false, video: {} };
        constraints.video.width = { max: window.screen.width };
        constraints.video.height = { max: window.screen.height };
        constraints.video.frameRate = { ideal: self.parent.screenshare_fps, max: 30 };

        try {
            navigator.mediaDevices
                .getDisplayMedia(constraints)
                .then(function (stream) {
                    self.gotDisplayMedia(stream);
                })
                .catch(function (err) {
                    self.gdmError(err);
                });
        } catch (error) {
            self.gdmError(error);
        }
    }
};

PexRTCMedia.prototype.gdmError = function (err) {
    var self = this;

    self.parent.onLog('getDisplayMedia error', err);
    self.parent.screenshareStopped(self.parent.trans.ERROR_SCREENSHARE_CANCELLED);
};

PexRTCMedia.prototype.gotDisplayMedia = function (stream) {
    var self = this;

    self.onDisplayMedia(stream);
};

PexRTCMedia.prototype.legacyDisplayMedia = function (sourceId) {
    var self = this;

    var videoConstraints = {};
    if (sourceId) {
        videoConstraints.chromeMediaSource = 'desktop';
        videoConstraints.chromeMediaSourceId = sourceId;
    } else {
        videoConstraints.chromeMediaSource = 'screen';
    }
    videoConstraints.maxWidth = window.screen.width;
    videoConstraints.maxHeight = window.screen.height;

    var constraints = { audio: false };
    constraints.video = { mandatory: videoConstraints, optional: [] };

    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(function (stream) {
                    self.gotDisplayMedia(stream);
                })
                .catch(function (err) {
                    self.gdmError(err);
                });
        } else if (navigator.getMedia) {
            navigator.getMedia(
                constraints,
                function (stream) {
                    self.gotDisplayMedia(stream);
                },
                function (err) {
                    self.gdmError(err);
                }
            );
        } else {
            return self.onError(self.parent.trans.ERROR_WEBRTC_SUPPORT);
        }
    } catch (error) {
        self.gdmError(error);
    }
};

function PexRTCConn(parent) {
    // Wrap everything about SDP handling and peer connections
    var self = this;

    self.parent = parent;
    self.mediaStream = null;
    self.presoStream = null;
    self.stream = null;
    self.state = 'INIT';

    self.audioTransceiver = null;
    self.videoTransceiver = null;
    self.presoTransceiver = null;
    self.presoAudioContext = null;
    self.dataChannel = null;

    self.mutedAudio = false;
    self.mutedVideo = false;
    self.previousIceConnectionState = '';
    self.incoming_ice_candidates = [];
    self.outgoing_ice_candidates = [];
    self.iceRestartTimer = null;
    self.ice_credentials = {};
    self.mid_to_type = {};
    self.mids_with_local_candidates = new Set();
    self.ssrcs = {};
    self.turn_config = null;
    self.previous_fecc_supported = null;
    self.presentation_mid = -1;

    self.local_fingerprints = '';
    self.remote_fingerprints = '';
    self.secure_check_code = 'INVALID';

    self.client_ivr_theme = null;
}

PexRTCConn.prototype.sendRequest = function (request, params, cb, retries, timeout) {
    var self = this;

    var url = self.parent.breakout_prefix + 'participants/' + self.parent.uuid + '/' + request;
    return self.parent.sendRequest(url, params, cb, 'POST', retries, timeout);
};

PexRTCConn.prototype.chooseVideoPTs = function (sdplines) {
    // Return an ordered list of PTs to include
    var self = this;

    if (self.parent.direct_media) {
        return null;
    }

    var state = 'notinvideo';
    var videolines = [];
    for (var i = 0; i < sdplines.length; i++) {
        if (state === 'notinvideo') {
            if (sdplines[i].lastIndexOf('m=video', 0) === 0) {
                state = 'invideo';
            }
        } else if (state === 'invideo') {
            videolines.push(sdplines[i]);
        }
    }

    var rtpmap = {};
    for (var i = 0; i < videolines.length; i++) {
        if (videolines[i].lastIndexOf('a=rtpmap:', 0) === 0) {
            var fields = videolines[i].split(' ');
            var pt = fields[0].substr(fields[0].indexOf(':') + 1);
            var codec = fields[1].substr(0, fields[1].indexOf('/'));
            rtpmap[pt] = { name: codec };
        }
    }

    for (var i = 0; i < videolines.length; i++) {
        if (videolines[i].lastIndexOf('a=fmtp:', 0) === 0) {
            var fields = videolines[i].split(' ');
            var pt = fields[0].substr(fields[0].indexOf(':') + 1);
            var params = fields[1].split(';');
            for (var j = 0; j < params.length; j++) {
                var pair = params[j].split('=');
                if (pair[0] == 'apt') {
                    rtpmap[pt].apt = pair[1];
                } else if (pair[0] == 'packetization-mode') {
                    rtpmap[pt].mode = pair[1];
                } else if (pair[0] == 'profile-level-id') {
                    var idc = pair[1].substr(0, 2);
                    var iop = pair[1].substr(2, 2);
                    rtpmap[pt].idc = idc;
                    if (parseInt('0x' + iop) & 0x40) {
                        rtpmap[pt].iop = 'CB';
                    } else {
                        rtpmap[pt].iop = 'B';
                    }
                }
            }
        }
    }

    var PTs = [];

    if (self.h264_enabled) {
        var done = false;
        Object.keys(rtpmap).forEach(function (key) {
            // Step 1. Add all H264 B/CB keys unless we find CB_1 in which case, just have that
            if (rtpmap[key].name == 'H264') {
                if (rtpmap[key].idc == '42') {
                    if (rtpmap[key].iop == 'CB' && rtpmap[key].mode == '1') {
                        PTs = [key];
                        done = true;
                    } else if (!done) {
                        PTs.push(key);
                    }
                }
            }
        });
    }

    if (self.vp9_enabled) {
        Object.keys(rtpmap).forEach(function (key) {
            // Step 2. Add VP9 if enabled
            if (rtpmap[key].name == 'VP9') {
                PTs.push(key);
            }
        });
    }

    Object.keys(rtpmap).forEach(function (key) {
        // Step 3. Add other standard codecs
        if ((rtpmap[key].name == 'VP8' && self.vp8_enabled) || rtpmap[key].name == 'red' || rtpmap[key].name == 'ulpfec') {
            PTs.push(key);
        }
    });

    Object.keys(rtpmap).forEach(function (key) {
        // Step 4. Add RTX for other codecs
        if (rtpmap[key].name == 'rtx' && PTs.includes(rtpmap[key].apt)) {
            PTs.push(key);
        }
    });

    return PTs;
};

PexRTCConn.prototype.updateMids = function (description) {
    var self = this;

    if (self.audioTransceiver && self.audioTransceiver.mid) {
        self.mid_to_type[self.audioTransceiver.mid] = 'audio';
    }
    if (self.videoTransceiver && self.videoTransceiver.mid) {
        self.mid_to_type[self.videoTransceiver.mid] = 'video';
    }
    if (self.presoTransceiver && self.presoTransceiver.mid) {
        self.mid_to_type[self.presoTransceiver.mid] = 'preso';
        self.presentation_mid = self.presoTransceiver.mid;
    }

    var transceivers = self.pc.getTransceivers();
    for (var i = 0; i < transceivers.length; i++) {
        if (transceivers[i].mid === self.presentation_mid) {
            self.presoTransceiver = transceivers[i];
            self.presoTransceiver.direction = 'sendrecv';
        }
    }
};

PexRTCConn.prototype.sdpMutateOffer = function (description) {
    var self = this;
    var state = null;
    var newlines = [];

    var sdplines = description.sdp.split('\r\n');

    self.updateMids();
    var videoPTs = self.chooseVideoPTs(sdplines);

    var ufrag;
    var pwd;
    var local_fingerprints = [];
    self.mids_with_local_candidates = new Set();

    var mcount = 0;
    var line_to_type = {};

    for (var i = 0; i < sdplines.length; i++) {
        if (sdplines[i].lastIndexOf('m=', 0) === 0) {
            mcount++;
            ufrag = null;
            pwd = null;
        }

        if (sdplines[i].lastIndexOf('a=ice-ufrag:', 0) === 0) {
            ufrag = sdplines[i].split(':')[1];
        } else if (sdplines[i].lastIndexOf('a=ice-pwd:', 0) === 0) {
            pwd = sdplines[i].split(':')[1];
        } else if (sdplines[i].lastIndexOf('a=mid:', 0) === 0) {
            var mid = sdplines[i].split(':')[1];
            line_to_type[mcount] = self.mid_to_type[mid];
        } else if (sdplines[i].lastIndexOf('a=fingerprint:', 0) === 0) {
            local_fingerprints.push(self._extractFingerprints(sdplines[i]));
        }

        if ((sdplines[i + 1] === undefined || sdplines[i + 1].lastIndexOf('m=', 0) === 0) && ufrag && pwd) {
            self.ice_credentials[ufrag] = pwd;
        }
    }

    self.setLocalFingerprints(local_fingerprints);

    mcount = 0;
    for (var i = 0; i < sdplines.length; i++) {
        var sdpline = sdplines[i];

        if (sdpline.lastIndexOf('m=', 0) === 0) {
            state = line_to_type[++mcount];
        }

        if (sdpline.lastIndexOf('a=ssrc:', 0) === 0) {
            self.ssrcs[sdplines[i].split(':')[1].split(' ')[0]] = state;
        }

        if (sdpline.lastIndexOf('a=msid:-', 0) === 0 && state !== 'preso') {
            var msids = sdpline.split(' ');
            newlines.push('a=msid:' + self.mediaStream.id + ' ' + msids[1]);
            continue;
        }

        if (!state || state === 'audio') {
            newlines.push(sdpline);
        } else if (state === 'video' || state === 'preso') {
            if (
                sdplines[i].lastIndexOf('a=rtpmap:', 0) === 0 ||
                sdplines[i].lastIndexOf('a=fmtp:', 0) === 0 ||
                sdplines[i].lastIndexOf('a=rtcp-fb:', 0) === 0
            ) {
                var fields = sdplines[i].split(' ');
                var pt = fields[0].substr(fields[0].indexOf(':') + 1);
                if (videoPTs && !videoPTs.includes(pt)) {
                    continue;
                }
            }

            newlines.push(sdpline);

            if (
                (self.parent.chrome_ver > 0 || self.parent.safari_ver >= 11) &&
                (self.parent.allow_1080p || state === 'preso') &&
                sdplines[i].lastIndexOf('a=rtpmap:', 0) === 0
            ) {
                var fields = sdplines[i].split(' ');
                var pt = fields[0].substr(fields[0].indexOf(':') + 1);
                if (sdplines[i].lastIndexOf('VP8') > 0 || sdplines[i].lastIndexOf('VP9') > 0) {
                    if (self.parent.direct_media && state === 'preso') {
                        newlines.push('a=fmtp:' + pt + ' max-fs=36864;max-fr=30');
                    } else {
                        newlines.push('a=fmtp:' + pt + ' max-fs=8160;max-fr=30');
                    }
                } else if (sdplines[i].lastIndexOf('H264') > 0) {
                    while (sdplines[i + 1].lastIndexOf('a=rtcp-fb:' + pt, 0) === 0) {
                        newlines.push(sdplines[++i]);
                    }
                    if (sdplines[i + 1].lastIndexOf('a=fmtp:' + pt, 0) === 0 && sdplines[i + 1].lastIndexOf('max-fs') === -1) {
                        if (self.parent.direct_media && state === 'preso') {
                            newlines.push(
                                sdplines[++i] + ';max-br=32768;max-mbps=2073600;max-fs=36864;max-smbps=2073600;max-fps=6000;max-fr=30'
                            );
                        } else {
                            newlines.push(
                                sdplines[++i] + ';max-br=3732;max-mbps=245760;max-fs=8192;max-smbps=245760;max-fps=3000;max-fr=30'
                            );
                        }
                    }
                }
            }

            if (
                self.parent.firefox_ver > 65 &&
                (self.parent.allow_1080p || state === 'preso') &&
                sdplines[i].lastIndexOf('a=rtpmap:', 0) === 0 &&
                sdplines[i].lastIndexOf('H264') > 0
            ) {
                var fields = sdplines[i].split(' ');
                var pt = fields[0].substr(fields[0].indexOf(':') + 1);
                for (var j = 0; j < newlines.length; j++) {
                    if (newlines[j].lastIndexOf('a=fmtp:' + pt, 0) === 0 && newlines[j].lastIndexOf('max-fs') === -1) {
                        newlines[j] += ';max-br=3732;max-mbps=245760;max-fs=8192;max-smbps=245760;max-fps=3000;max-fr=30';
                    }
                }
            }

            if (sdplines[i].lastIndexOf('a=mid:', 0) === 0 && state === 'preso') {
                newlines.push('a=content:slides');
            }

            if (sdplines[i].lastIndexOf('c=', 0) === 0 && self.bandwidth_in) {
                newlines.push('b=AS:' + self.bandwidth_in);
            }
        }
    }

    var sdp = newlines.join('\r\n');
    self.parent.onLog('Mutated offer', sdp);

    return new SessionDescription({ type: 'offer', sdp: sdp });
};

PexRTCConn.prototype.sdpMutateAnswer = function (sdplines) {
    var self = this;
    var state = '';
    var remote_fingerprints = [];
    var newlines = [];
    var mcount = 0;
    var line_to_type = {};

    self.updateMids();
    var videoPTs = self.chooseVideoPTs(sdplines);

    for (var i = 0; i < sdplines.length; i++) {
        if (sdplines[i].lastIndexOf('m=', 0) === 0) {
            mcount++;
            if (sdplines[i].lastIndexOf('m=video', 0) === 0) {
                state = 'video';
            } else {
                state = 'notvideo';
            }
        }

        if (sdplines[i].lastIndexOf('a=mid:', 0) === 0) {
            var mid = sdplines[i].split(':')[1];
            line_to_type[mcount] = self.mid_to_type[mid];
        } else if (sdplines[i].lastIndexOf('a=fingerprint:', 0) === 0) {
            remote_fingerprints.push(self._extractFingerprints(sdplines[i]));
        }

        if (state === 'video' && self.bandwidth_out) {
            if (sdplines[i].lastIndexOf('b=AS:', 0) === 0) {
                var oldbw = sdplines[i];
                oldbw = oldbw.substr(oldbw.indexOf(':') + 1);
                if (parseInt(oldbw) < self.bandwidth_out) {
                    self.bandwidth_out = oldbw;
                }
            } else if (sdplines[i].lastIndexOf('b=TIAS:', 0) === 0) {
                var oldbw = sdplines[i];
                oldbw = oldbw.substr(oldbw.indexOf(':') + 1);
                oldbw = parseInt(oldbw / 1000);
                if (oldbw < self.bandwidth_out) {
                    self.bandwidth_out = oldbw.toString();
                }
            }
        }
    }

    self.setRemoteFingerprints(remote_fingerprints);

    state = '';
    mcount = 0;
    var zeroed = false;
    for (var i = 0; i < sdplines.length; i++) {
        if (sdplines[i].lastIndexOf('m=', 0) === 0) {
            state = line_to_type[++mcount];
            var fields = sdplines[i].split(' ');
            zeroed = fields[1] === '0';
        }

        if (sdplines[i].lastIndexOf('a=ssrc:', 0) === 0) {
            self.ssrcs[sdplines[i].split(':')[1].split(' ')[0]] = state;
        }

        if (sdplines[i].lastIndexOf('a=msid:-', 0) === 0 && state !== 'preso') {
            var msids = sdplines[i].split(' ');
            newlines.push('a=msid:' + self.mediaStream.id + ' ' + msids[1]);
            continue;
        }

        if (videoPTs && videoPTs.length > 0 && sdplines[i].lastIndexOf('m=video', 0) === 0) {
            var fields = sdplines[i].split(' ');
            var line = fields.slice(0, 3).join(' ');
            line += ' ' + videoPTs.join(' ');
            newlines.push(line);
            continue;
        } else if (state === 'video' || state === 'preso') {
            if (sdplines[i].lastIndexOf('c=', 0) === 0) {
                newlines.push(sdplines[i]);
                if (self.bandwidth_out) {
                    newlines.push('b=AS:' + self.bandwidth_out);
                    newlines.push('b=TIAS:' + self.bandwidth_out * 1000);
                }
                continue;
            } else if (sdplines[i].lastIndexOf('b=', 0) === 0 && self.bandwidth_out) {
                continue;
            }
        }

        newlines.push(sdplines[i]);

        if (zeroed && sdplines[i].lastIndexOf('a=mid:', 0) === 0) {
            newlines.push('a=inactive');
        }
    }

    var sdp = newlines.join('\r\n');
    self.parent.onLog('Mutated answer', sdp);

    return newlines;
};

PexRTCConn.prototype.getBandwidth = function () {
    var self = this;

    self.h264_enabled = self.parent.h264_enabled;
    self.vp8_enabled = self.parent.vp8_enabled;
    self.vp9_enabled = self.parent.vp9_enabled;
    self.allow_1080p = self.parent.allow_1080p;

    self.bandwidth_in = self.parent.bandwidth_in;
    self.bandwidth_out = self.parent.bandwidth_out;
    if (self.bandwidth_in && self.parent.set_bandwidth_in < self.bandwidth_in) {
        self.bandwidth_in = self.parent.set_bandwidth_in;
    }
    if (self.bandwidth_out && self.parent.set_bandwidth_out < self.bandwidth_out) {
        self.bandwidth_out = self.parent.set_bandwidth_out;
    }
    if (self.bandwidth_in && self.vp9_enabled) {
        if (self.bandwidth_in < 960) {
            self.bandwidth_in = Math.round(self.bandwidth_in * 0.75);
        } else if (self.bandwidth_in < 1800 || !self.allow_1080p) {
            self.bandwidth_in = Math.round(self.bandwidth_in * 0.67);
        }
    }

    if (self.bandwidth_out && self.bandwidth_out < 384) {
        self.bandwidth_out = 384;
    }
};

PexRTCConn.prototype.pcIceCandidate = function (evt) {
    var self = this;

    // Do not gather candidates again if turn config is provided so we wait for an iceRestart
    if (self.turn_config) {
        return;
    }

    self.parent.onLog('Ice Gathering State', self.pc.iceGatheringState);
    if (evt.candidate) {
        self.parent.onLog('Gathered ICE candidate', evt.candidate.candidate);
        self.mids_with_local_candidates.add(evt.candidate.sdpMid);
        var candidate = {
            candidate: evt.candidate.candidate,
            mid: evt.candidate.sdpMid,
            ufrag: evt.candidate.usernameFragment,
            pwd: self.ice_credentials[evt.candidate.usernameFragment] || ''
        };
        if (self.call_uuid && self.state !== 'UPDATING') {
            self.sendRequest('calls/' + self.call_uuid + '/new_candidate', candidate);
        } else {
            self.outgoing_ice_candidates.push(candidate);
        }
    } else if (self.pc.iceGatheringState == 'complete') {
        var mid_list;
        if (self.mids_with_local_candidates.size > 0) {
            mid_list = Array.from(self.mids_with_local_candidates);
        } else {
            mid_list = Object.keys(self.mid_to_type);
        }
        for (var i = 0; i < mid_list.length; i++) {
            var candidate = { candidate: '', mid: mid_list[i] };
            if (self.call_uuid && self.state !== 'UPDATING') {
                self.sendRequest('calls/' + self.call_uuid + '/new_candidate', candidate);
            } else {
                self.outgoing_ice_candidates.push(candidate);
            }
        }
    }
};

PexRTCConn.prototype.pcIceConnectionStateChanged = function (evt) {
    var self = this;

    self.parent.onLog('Ice Connection State', self.pc.iceConnectionState);
    if (self.iceRestartTimer) {
        clearTimeout(self.iceRestartTimer);
        self.iceRestartTimer = null;
    }
    if (self.pc.iceConnectionState == 'failed' && self.state == 'CONNECTED') {
        if (self.previousIceConnectionState == 'checking') {
            self.parent.onLog('ICE Failed at start of call.');
            return self.handleError(self.parent.trans.ERROR_ICE_FAILED);
        } else if (self.parent.chrome_ver > 0) {
            self.parent.onLog('ICE Failed mid-call; triggering ICE restart.');
            self.doIceRestart();
        }
    } else if (self.pc.iceConnectionState == 'disconnected' && self.state == 'CONNECTED') {
        if (self.previousIceConnectionState == 'disconnected') {
            self.parent.onLog('ICE Disconnected mid-call; triggering ICE restart.');
            if (self.parent.chrome_ver > 0) {
                self.parent.event_source.close();
                self.parent.event_source = null;
                self.parent.createEventSource();
            }
            self.doIceRestart();
        } else {
            self.iceRestartTimer = setTimeout(function () {
                self.pcIceConnectionStateChanged(evt);
            }, 2000);
        }
    }
    self.previousIceConnectionState = self.pc.iceConnectionState;
};

PexRTCConn.prototype.doIceRestart = function () {
    var self = this;

    if (self.parent.onIceRestart) {
        self.parent.onIceRestart();
    }
    self.state = 'UPDATING';
    self.getBandwidth();

    if (self.parent.direct_media) {
        var transceivers = self.pc.getTransceivers();
        for (var i = 0; i < transceivers.length; i++) {
            if (transceivers[i].mid === null) {
                transceivers[i].stop();
            }
        }
    }

    self.pcCreateOffer({ iceRestart: true });
};

PexRTCConn.prototype.connect = function () {
    var self = this;

    if (self.state == 'UPDATING' && self.pc) {
        if (self.setMediaTracks()) {
            return self.doIceRestart();
        } else {
            return self.ackReceived();
        }
    }

    if (self.state != 'UPDATING') {
        self.state = 'CONNECTING';
    }

    self.pc = new PeerConnection(self.parent.pcConfig);

    self.pc.onicecandidate = function (evt) {
        self.pcIceCandidate(evt);
    };
    self.pc.oniceconnectionstatechange = function (evt) {
        self.pcIceConnectionStateChanged(evt);
    };
    self.pc.ontrack = function (evt) {
        if (evt.track.kind == 'audio') {
            evt.transceiver.direction = self.audioTransceiver.direction;
            if (self.audioTransceiver.sender) {
                evt.transceiver.sender.replaceTrack(self.audioTransceiver.sender.track);
            }
            self.audioTransceiver = evt.transceiver;
            if (self.mediaStream && self.parent.chrome_ver > 78 && typeof self.audioTransceiver.sender.setStreams === 'function') {
                self.audioTransceiver.sender.setStreams(self.mediaStream);
            }
        } else if (evt.track.kind == 'video') {
            if (evt.transceiver.mid == self.presentation_mid) {
                evt.transceiver.direction = self.presoTransceiver.direction;
                if (self.presoTransceiver.sender) {
                    evt.transceiver.sender.replaceTrack(self.presoTransceiver.sender.track);
                }
                self.presoTransceiver = evt.transceiver;
            } else {
                evt.transceiver.direction = self.videoTransceiver.direction;
                if (self.videoTransceiver.sender) {
                    evt.transceiver.sender.replaceTrack(self.videoTransceiver.sender.track);
                }
                self.videoTransceiver = evt.transceiver;
                if (self.mediaStream && self.parent.chrome_ver > 78 && typeof self.videoTransceiver.sender.setStreams === 'function') {
                    self.videoTransceiver.sender.setStreams(self.mediaStream);
                }
            }
        }
    };

    if (self.parent.recv_audio) {
        if (self.parent.gum_audio_source === false) {
            self.audioTransceiver = self.pc.addTransceiver('audio', { direction: 'recvonly' });
        } else {
            self.audioTransceiver = self.pc.addTransceiver('audio', { direction: 'sendrecv' });
        }
    } else {
        if (self.parent.gum_audio_source !== false) {
            self.audioTransceiver = self.pc.addTransceiver('audio', { direction: 'sendonly' });
        } else if (self.parent.direct_media) {
            self.audioTransceiver = self.pc.addTransceiver('audio', { direction: 'inactive' });
        }
    }

    if (self.parent.recv_video) {
        if (self.parent.gum_video_source === false) {
            self.videoTransceiver = self.pc.addTransceiver('video', { direction: 'recvonly' });
        } else {
            self.videoTransceiver = self.pc.addTransceiver('video', { direction: 'sendrecv' });
        }
    } else {
        if (self.parent.gum_video_source !== false) {
            self.videoTransceiver = self.pc.addTransceiver('video', { direction: 'sendonly' });
        } else if (self.parent.direct_media) {
            self.videoTransceiver = self.pc.addTransceiver('video', { direction: 'inactive' });
        }
    }

    if (self.parent.presentation_in_main) {
        self.presoTransceiver = self.pc.addTransceiver('video', { direction: 'sendonly' });
    } else {
        self.presoTransceiver = self.pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    if (self.parent.direct_media) {
        self.dataChannel = self.pc.createDataChannel('pexChannel', { negotiated: true, id: self.parent.pex_datachannel_id });
        self.dataChannel.onmessage = function (event) {
            self.parent.dataChannelMessage(event);
        };
    }

    if (!self.stats_interval) {
        self.stats = new PexRTCStatistics(self);

        var pollMediaStatistics = function () {
            if (self.pc.getStats) {
                if (
                    (self.parent.chrome_ver > 78 && !self.parent.is_electron) ||
                    (self.parent.chrome_ver > 108 && self.parent.is_electron)
                ) {
                    self.pc.getStats(null).then(function (rawStats) {
                        self.stats.updateStatsNew(rawStats);
                    });
                } else if (self.parent.chrome_ver > 0) {
                    self.pc.getStats(function (rawStats) {
                        self.stats.updateStats(rawStats.result());
                    });
                } else if (self.parent.firefox_ver >= 73) {
                    self.pc.getStats(null).then(function (rawStats) {
                        self.stats.updateStatsNew(rawStats);
                    });
                } else if (self.parent.safari_ver >= 13) {
                    self.pc.getStats(null).then(function (rawStats) {
                        self.stats.updateStatsNew(rawStats);
                    });
                }
            }
        };

        self.stats_interval = setInterval(pollMediaStatistics, 1000);
    }

    if (self.parent.direct_media && !self.push_stats_interval) {
        var pushMediaStatistics = function () {
            var statistics = {
                audio: {
                    tx_codec: self.stats.audio_out.info['codec'],
                    tx_bitrate: self.stats.audio_out.rawInfo['bitrate'],
                    tx_packets_sent: self.stats.audio_out.info['packets-sent'],
                    tx_rb_packetslost: self.stats.audio_out.info['packets-lost'],
                    tx_rb_jitter: self.stats.audio_out.rawInfo['jitter'],
                    tx_windowed_packet_loss: self.stats.audio_out.rawInfo['percentage-lost-recent'],
                    tx_historic_packet_loss: self.stats.audio_out.rawInfo['percentage-lost'],
                    rx_codec: self.stats.audio_in.info['codec'],
                    rx_bitrate: self.stats.audio_in.rawInfo['bitrate'],
                    rx_packets_received: self.stats.audio_in.info['packets-received'],
                    rx_packets_lost: self.stats.audio_in.info['packets-lost'],
                    rx_jitter: self.stats.audio_in.rawInfo['jitter'],
                    rx_windowed_packet_loss: self.stats.audio_in.rawInfo['percentage-lost-recent'],
                    rx_historic_packet_loss: self.stats.audio_in.rawInfo['percentage-lost']
                },
                video: {
                    tx_codec: self.stats.video_out.info['codec'],
                    tx_bitrate: self.stats.video_out.rawInfo['bitrate'],
                    tx_resolution: self.stats.video_out.info['resolution'],
                    tx_fps: self.stats.video_out.info['framerate'],
                    tx_packets_sent: self.stats.video_out.info['packets-sent'],
                    tx_rb_packetslost: self.stats.video_out.info['packets-lost'],
                    tx_rb_jitter: self.stats.video_out.rawInfo['jitter'],
                    tx_windowed_packet_loss: self.stats.video_out.rawInfo['percentage-lost-recent'],
                    tx_historic_packet_loss: self.stats.video_out.rawInfo['percentage-lost'],
                    rx_codec: self.stats.video_in.info['codec'],
                    rx_bitrate: self.stats.video_in.rawInfo['bitrate'],
                    rx_resolution: self.stats.video_in.info['resolution'],
                    rx_fps: self.stats.video_in.info['framerate'],
                    rx_packets_received: self.stats.video_in.info['packets-received'],
                    rx_packets_lost: self.stats.video_in.info['packets-lost'],
                    rx_jitter: self.stats.video_in.rawInfo['jitter'],
                    rx_windowed_packet_loss: self.stats.video_in.rawInfo['percentage-lost-recent'],
                    rx_historic_packet_loss: self.stats.video_in.rawInfo['percentage-lost']
                },
                presentation: {
                    tx_codec: self.stats.preso_out.info['codec'],
                    tx_bitrate: self.stats.preso_out.rawInfo['bitrate'],
                    tx_resolution: self.stats.preso_out.info['resolution'],
                    tx_fps: self.stats.preso_out.info['framerate'],
                    tx_packets_sent: self.stats.preso_out.info['packets-sent'],
                    tx_rb_packetslost: self.stats.preso_out.info['packets-lost'],
                    tx_rb_jitter: self.stats.preso_out.rawInfo['jitter'],
                    tx_windowed_packet_loss: self.stats.preso_out.rawInfo['percentage-lost-recent'],
                    tx_historic_packet_loss: self.stats.preso_out.rawInfo['percentage-lost'],
                    rx_codec: self.stats.preso_in.info['codec'],
                    rx_bitrate: self.stats.preso_in.rawInfo['bitrate'],
                    rx_resolution: self.stats.preso_in.info['resolution'],
                    rx_fps: self.stats.preso_in.info['framerate'],
                    rx_packets_received: self.stats.preso_in.info['packets-received'],
                    rx_packets_lost: self.stats.preso_in.info['packets-lost'],
                    rx_jitter: self.stats.preso_in.rawInfo['jitter'],
                    rx_windowed_packet_loss: self.stats.preso_in.rawInfo['percentage-lost-recent'],
                    rx_historic_packet_loss: self.stats.preso_in.rawInfo['percentage-lost']
                }
            };
            self.sendRequest('calls/' + self.call_uuid + '/statistics', statistics);
        };

        self.push_stats_interval = setInterval(pushMediaStatistics, self.parent.client_stats_update_interval);
    }

    self.requestTheme();
    self.setMediaTracks();
    self.getBandwidth();
    self.pcCreateOffer();
};

PexRTCConn.prototype.setMediaTracks = function () {
    var self = this;

    self.parent.onLog('setMediaTracks');

    if (self.audioTransceiver && self.audioTransceiver.sender.track) {
        self.audioTransceiver.sender.track.stop();
        if (self.presoAudioContext) {
            self.presoAudioContext.close();
            self.presoAudioContext = null;
        }
    }
    if (self.videoTransceiver && self.videoTransceiver.sender.track) {
        self.videoTransceiver.sender.track.stop();
    }

    var renegotiate = false;
    var setDirection = function (transceiver, send, recv) {
        var direction = '';
        if (recv && send) {
            direction = 'sendrecv';
        } else if (recv && !send) {
            direction = 'recvonly';
        } else if (!recv && send) {
            direction = 'sendonly';
        } else if (!recv && !send) {
            direction = 'inactive';
        }

        if (transceiver.direction != direction) {
            transceiver.direction = direction;
            renegotiate = true;
        }
    };

    if (!self.audioTransceiver && (self.parent.gum_audio_source !== false || self.parent.recv_audio)) {
        self.audioTransceiver = self.pc.addTransceiver('audio');
        renegotiate = true;
    }
    if (!self.videoTransceiver && (self.parent.gum_video_source !== false || self.parent.recv_video)) {
        self.videoTransceiver = self.pc.addTransceiver('video');
        renegotiate = true;
    }

    if (self.audioTransceiver) {
        setDirection(self.audioTransceiver, self.parent.gum_audio_source !== false, self.parent.recv_audio);
    }
    if (self.videoTransceiver) {
        setDirection(self.videoTransceiver, self.parent.gum_video_source !== false, self.parent.recv_video);
    }

    if (self.mediaStream) {
        var audioTracks = self.mediaStream.getAudioTracks();
        if (self.mutedAudio) {
            for (var i = 0; i < audioTracks.length; i++) {
                audioTracks[i].enabled = false;
            }
        }

        var videoTracks = self.mediaStream.getVideoTracks();
        if (self.mutedVideo) {
            for (var i = 0; i < videoTracks.length; i++) {
                videoTracks[i].enabled = false;
            }
        }

        if (self.audioTransceiver) {
            if (self.presoStream && self.presoStream.getAudioTracks().length > 0 && typeof AudioContext === 'function') {
                self.presoAudioContext = new AudioContext();
                var mainInput = self.presoAudioContext.createMediaStreamSource(self.mediaStream);
                var presoInput = self.presoAudioContext.createMediaStreamSource(self.presoStream);
                var mixed = self.presoAudioContext.createMediaStreamDestination();
                mainInput.connect(mixed);
                presoInput.connect(mixed);
                var track = mixed.stream.getAudioTracks()[0];
                track.contentHint = 'music';
                self.audioTransceiver.sender.replaceTrack(track);
            } else {
                self.audioTransceiver.sender.replaceTrack(self.mediaStream.getAudioTracks()[0]);
            }
            if (self.mediaStream && self.parent.chrome_ver > 78 && typeof self.audioTransceiver.sender.setStreams === 'function') {
                self.audioTransceiver.sender.setStreams(self.mediaStream);
            }
        }

        if (self.videoTransceiver) {
            if (videoTracks.length > 0) {
                self.videoTransceiver.sender.replaceTrack(self.mediaStream.getVideoTracks()[0]);
            } else {
                self.videoTransceiver.sender.replaceTrack(null);
            }
            if (self.mediaStream && self.parent.chrome_ver > 78 && typeof self.videoTransceiver.sender.setStreams === 'function') {
                self.videoTransceiver.sender.setStreams(self.mediaStream);
            }
        }

        if (self.presoTransceiver) {
            if (self.presoStream && self.presoStream.getVideoTracks().length > 0) {
                self.presoTransceiver.sender.replaceTrack(self.presoStream.getVideoTracks()[0]);
                if (self.parent.chrome_ver > 78 && typeof self.audioTransceiver.sender.setStreams === 'function') {
                    self.audioTransceiver.sender.setStreams(self.presoStream);
                }
            } else {
                self.presoTransceiver.sender.replaceTrack(null);
            }
        }
    }

    return renegotiate;
};

PexRTCConn.prototype.requestTheme = function () {
    var self = this;
    return self.parent.sendRequest(
        'theme/',
        {},
        function (e) {
            self.processThemeAnswer(e);
        },
        'GET',
        0,
        60000
    );
};

PexRTCConn.prototype.processThemeAnswer = function (answer) {
    var self = this;
    if (answer.target.status == 200) {
        /* NB: There is a theoretical race between setting this theme variable and
           sending splash screen events, but currently the theme request is sent so much
           in advance that this should not be a problem in practce. */
        self.client_ivr_theme = JSON.parse(answer.target.response).result;
    }
};

PexRTCConn.prototype.pcCreateOffer = function (constraints) {
    var self = this;

    self.parent.onLog('RTCOfferOptions', constraints);

    self.pc
        .createOffer(constraints)
        .then(function (sdp) {
            self.parent.onLog('Local offer generated', sdp);
            self.pc
                .setLocalDescription(sdp)
                .then(function () {
                    self.parent.onLog('Local description active');
                    self.sendOffer(sdp);
                })
                .catch(function (err) {
                    self.handleError('Local description failed', err);
                });
        })
        .catch(function (err) {
            self.handleError(err);
        });
};

PexRTCConn.prototype.sendOffer = function (sdp) {
    var self = this;

    var mutatedOffer = {
        call_type: 'WEBRTC',
        sdp: self.sdpMutateOffer(sdp).sdp,
        fecc_supported: self.parent.fecc_supported,
        media_type: self.parent.recv_video || self.parent.gum_video_source !== false ? 'video' : 'audio'
    };
    self.previous_fecc_supported = self.parent.fecc_supported;

    if (self.parent.presentation_in_main) {
        mutatedOffer.present = 'main';
    }

    var request = self.state == 'UPDATING' ? 'calls/' + self.call_uuid + '/update' : 'calls';
    self.sendRequest(
        request,
        mutatedOffer,
        function (e) {
            self.processAnswer(e);
        },
        0,
        -1
    );
};

PexRTCConn.prototype.processAnswer = function (e) {
    var self = this;

    var msg;
    try {
        msg = JSON.parse(e.target.responseText);
    } catch (SyntaxError) {
        return self.handleError(e.target.status + ' ' + e.target.statusText);
    }
    if (e.target.status != 200) {
        return self.handleError(msg.result || msg.reason);
    }

    self.parent.onLog('Received answer', msg.result);
    if (msg.result.call_uuid) {
        self.call_uuid = msg.result.call_uuid;
    }

    for (var i = 0; i < self.outgoing_ice_candidates.length; i++) {
        self.sendRequest('calls/' + self.call_uuid + '/new_candidate', self.outgoing_ice_candidates[i]);
    }
    self.outgoing_ice_candidates = [];

    if (msg.result.turn && (self.parent.safari_ver == 0 || self.parent.safari_ver >= 14)) {
        self.turn_config = msg.result.turn;
    }

    var lines;
    if (msg.result.sdp) {
        lines = msg.result.sdp.split('\r\n');
    } else if (msg.result.indexOf && msg.result.indexOf('v=0') === 0) {
        lines = msg.result.split('\r\n');
    }

    if (self.state != 'DISCONNECTING' && lines) {
        lines = self.sdpMutateAnswer(lines);

        var sdp = lines.join('\r\n');
        self.pc
            .setRemoteDescription(new SessionDescription({ type: 'answer', sdp: sdp }))
            .then(function () {
                self.parent.onLog('Remote description active');
                self.sendRequest('calls/' + self.call_uuid + '/ack', null, function () {
                    self.ackReceived();
                });
            })
            .catch(function (err) {
                self.parent.onLog('Remote description failed', err);
                self.handleError(err.message);
            });
    }
};

PexRTCConn.prototype._extractFingerprints = function (sdpline) {
    return sdpline.split('a=fingerprint:')[1].replace(/\s/g, '');
};

PexRTCConn.prototype.setLocalFingerprints = function (local_fingerprint_list) {
    var self = this;

    // concat & sort the local fingerprints alphabetically to be deterministic
    var local_fingerprints = local_fingerprint_list.sort().join('');
    if (self.local_fingerprints !== local_fingerprints) {
        self.parent.onLog('Set local fingerprints:', local_fingerprints);
        self.local_fingerprints = local_fingerprints;
        self.calculateSecureCheckCode();
    }
};

PexRTCConn.prototype.setRemoteFingerprints = function (remote_fingerprint_list) {
    var self = this;

    // concat & sort the remote fingerprints alphabetically to be deterministic
    var remote_fingerprints = remote_fingerprint_list.sort().join('');
    if (self.remote_fingerprints !== remote_fingerprints) {
        self.parent.onLog('Set remote fingerprints:', remote_fingerprints);
        self.remote_fingerprints = remote_fingerprints;
        self.calculateSecureCheckCode();
    }
};

PexRTCConn.prototype.calculateSecureCheckCode = function () {
    var self = this;

    // Sort the local and remote fingerprints alphabetically to be deterministic
    var fingerprints = [self.local_fingerprints, self.remote_fingerprints].sort().join('');
    if (fingerprints.length !== 0) {
        digestMessage(fingerprints).then(function (digest) {
            self.secure_check_code = digest;
            self.parent.onLog('Secure Check Code:', self.secure_check_code);
        });
    } else {
        self.secure_check_code = 'INVALID';
        self.parent.onLog('Secure Check Code:', self.secure_check_code);
    }
};

PexRTCConn.prototype.receiveOffer = function (sdp) {
    var self = this;

    // Calling the Mutate functions here to update SSRCs and Fingerprints
    self.pc
        .setRemoteDescription({ type: 'offer', sdp: sdp })
        .then(() => {
            var lines = sdp.split('\r\n');
            self.sdpMutateAnswer(lines);
            self.pc.setLocalDescription().then(() => {
                self.sendRequest(
                    'calls/' + self.call_uuid + '/ack',
                    self.sdpMutateOffer({ sdp: self.pc.localDescription.sdp }),
                    function () {
                        self.ackReceived();
                    }
                );
            });
        })
        .catch(function (err) {
            self.parent.onLog('Remote description failed', err);
            self.sendRequest('calls/' + self.call_uuid + '/ack', { sdp: '' });
            self.handleError(err.message);
        });
};

PexRTCConn.prototype.receiveCandidate = function (msg) {
    var self = this;

    var candidate = new RTCIceCandidate({
        candidate: msg['candidate'],
        sdpMid: msg['mid'],
        usernameFragment: msg['ufrag']
    });
    if (self.pc && self.pc.remoteDescription) {
        self.pc.addIceCandidate(candidate);
    } else {
        self.incoming_ice_candidates.push(candidate);
    }
};

PexRTCConn.prototype.ackReceived = function () {
    var self = this;

    if (self.state == 'DISCONNECTING') {
        self.parent.onLog('ackReceived while disconnecting');
        return;
    }

    for (var i = 0; i < self.incoming_ice_candidates.length; i++) {
        self.pc.addIceCandidate(self.incoming_ice_candidates[i]);
    }
    self.incoming_ice_candidates = [];

    self.stream = new MediaStream();
    if (self.audioTransceiver) {
        self.stream.addTrack(self.audioTransceiver.receiver.track);
    }
    if (self.videoTransceiver) {
        self.stream.addTrack(self.videoTransceiver.receiver.track);
    }

    self.parent.onLog('ackReceived', self.stream);
    self.onConnect(self.stream, self.call_uuid);
    if (self.parent.presentation_requested) {
        self.parent.onPresentationConnected(self.getPresentation());
    }

    if (self.turn_config) {
        self.state = 'UPDATING';
        for (var i = 0; i < self.turn_config.length; i++) {
            self.parent.pcConfig.iceServers.push(self.turn_config[i]);
        }
        self.turn_config = null;
        if (self.parent.firefox_ver > 0 || self.parent.safari_ver > 0) {
            self.pc.close();
            self.pc = null;
            self.connect();
        } else {
            self.pc.setConfiguration(self.parent.pcConfig);
            self.pcCreateOffer({ iceRestart: true });
        }
    } else {
        self.state = 'CONNECTED';
    }
};

PexRTCConn.prototype.sendDataChannel = function (type, body) {
    var self = this;

    if (!self.dataChannel || self.dataChannel.readyState != 'open') {
        return false;
    }

    self.dataChannel.send(JSON.stringify({ type: type, body: body }));
    return true;
};

PexRTCConn.prototype.getPresentation = function () {
    var self = this;

    var presentation_stream = new MediaStream();
    presentation_stream.addTrack(self.presoTransceiver.receiver.track);
    return presentation_stream;
};

PexRTCConn.prototype.present = function (stream) {
    var self = this;

    if (stream) {
        self.presoStream = stream;
        var track = stream.getVideoTracks()[0];
        stream.oninactive = function () {
            self.present();
        };
        track.onended = function () {
            self.present();
        };
        self.presoTransceiver.sender.replaceTrack(track);

        self.sendRequest('take_floor', null, function (e) {
            if (e.target.status != 200) {
                self.presoTransceiver.sender.track.stop();
                self.presoTransceiver.sender.replaceTrack(null);
                self.presoStream = null;
                return self.parent.screenshareStopped(self.parent.trans.ERROR_SCREENSHARE_REJECTED);
            } else {
                var presoParams = self.presoTransceiver.sender.getParameters();
                if (presoParams.encodings.length > 0) {
                    presoParams.encodings[0].priority = 'high';
                }

                var audioTracks = stream.getAudioTracks();

                if (self.presoTransceiver.sender.track) {
                    // Deliberately leave it unspecified for 15fps - the default
                    if (audioTracks.length > 0 || self.parent.screenshare_fps > 15) {
                        self.presoTransceiver.sender.track.contentHint = 'motion';
                        presoParams.degradationPreference = 'maintain-framerate';
                    } else if (self.parent.screenshare_fps < 15) {
                        self.presoTransceiver.sender.track.contentHint = 'detail';
                        presoParams.degradationPreference = 'maintain-resolution';
                    }
                }

                self.presoTransceiver.sender.setParameters(presoParams);

                if (audioTracks.length > 0 && typeof AudioContext === 'function') {
                    if (self.mediaStream) {
                        self.presoAudioContext = new AudioContext();
                        var mainInput = self.presoAudioContext.createMediaStreamSource(self.mediaStream);
                        var presoInput = self.presoAudioContext.createMediaStreamSource(stream);
                        var mixed = self.presoAudioContext.createMediaStreamDestination();
                        mainInput.connect(mixed);
                        presoInput.connect(mixed);
                        var track = mixed.stream.getAudioTracks()[0];
                        track.contentHint = 'music';
                        self.audioTransceiver.sender.replaceTrack(track);
                    } else {
                        audioTracks[0].contentHint = 'music';
                        self.audioTransceiver.sender.replaceTrack(audioTracks[0]);
                    }
                }

                if (self.parent.onScreenshareConnected) {
                    self.parent.onScreenshareConnected(stream);
                }
            }
        });
    } else if (self.presoStream) {
        // Note some clients expect screenshare to stop before they present
        self.sendRequest('release_floor');
        var tracks = self.presoStream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
        if (self.presoAudioContext) {
            self.audioTransceiver.sender.replaceTrack(self.mediaStream.getAudioTracks()[0]);
            self.presoAudioContext.close();
            self.presoAudioContext = null;
        } else if (self.presoStream.getAudioTracks().length > 0 && typeof AudioContext === 'function') {
            self.audioTransceiver.sender.replaceTrack(null);
        }
        self.presoTransceiver.sender.replaceTrack(null);
        self.presoStream = null;
        self.parent.screenshareStopped(self.parent.trans.ERROR_PRESENTATION_ENDED);
    } else if (self.parent.screen_http) {
        self.sendRequest('release_floor');
        self.parent.screen_http = null;
        self.parent.screenshareStopped(self.parent.trans.ERROR_PRESENTATION_ENDED);
    }
};

PexRTCConn.prototype.muteAudio = function (setting) {
    //mutedAudio is a toggle, opposite to enabled value, so toggle at end
    var self = this;

    self.parent.onLog('muteAudio from', self.mutedAudio, 'to', setting);

    if (setting === self.mutedAudio) {
        return self.mutedAudio;
    }

    if (self.mediaStream) {
        var audioTracks = self.mediaStream.getAudioTracks();
        for (var i = 0; i < audioTracks.length; i++) {
            audioTracks[i].enabled = self.mutedAudio;
        }
        self.mutedAudio = !self.mutedAudio;
    }

    return self.mutedAudio;
};

PexRTCConn.prototype.muteVideo = function (setting) {
    //mutedVideo is a toggle, opposite to enabled value, so toggle at end
    var self = this;

    self.parent.onLog('muteVideo from', self.mutedVideo, 'to', setting);

    if (setting === self.mutedVideo) {
        return self.mutedVideo;
    }

    if (self.mediaStream) {
        var videoTracks = self.mediaStream.getVideoTracks();
        for (var i = 0; i < videoTracks.length; i++) {
            videoTracks[i].enabled = self.mutedVideo;
        }
        self.mutedVideo = !self.mutedVideo;
    }

    return self.mutedVideo;
};

PexRTCConn.prototype.cleanup = function (save_media) {
    var self = this;

    if (self.parent.event_listener) {
        window.removeEventListener('message', self.parent.event_listener);
        self.parent.event_listener = null;
    }

    if (self.stats_interval) {
        clearInterval(self.stats_interval);
        self.stats_interval = null;
    }

    if (self.push_stats_interval) {
        clearInterval(self.push_stats_interval);
        self.push_stats_interval = null;
    }

    if (!save_media) {
        self.parent.onLog('Releasing user media');
        if (self.presoStream) {
            // No better way to validate we're not messing with a user-provided stream
            if (self.presoStream && !self.parent.user_presentation_stream) {
                var tracks = self.presoStream.getTracks();
                for (var i = 0; i < tracks.length; i++) {
                    tracks[i].stop();
                }
            }
            self.presoStream = null;
        }

        if (self.mediaStream) {
            if (self.parent && !self.parent.user_media_stream) {
                var tracks = self.mediaStream.getTracks();
                for (var i = 0; i < tracks.length; i++) {
                    tracks[i].stop();
                }
            }
            self.mediaStream = null;
        }
    }

    if (self.pc && self.pc.signalingState != 'closed') {
        self.pc.close();
        self.pc = null;
    }
};

PexRTCConn.prototype.handleError = function (err) {
    var self = this;

    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        self.cleanup();
        if (self.onError) {
            if (err && err.hasOwnProperty('message')) {
                err = err.message;
            }
            if (err) {
                self.onError(self.parent.trans.ERROR_CALL_FAILED + err);
            } else {
                self.onError(self.parent.trans.ERROR_CALL_FAILED);
            }
        }
    }
};

PexRTCConn.prototype.getMediaStatistics = function () {
    var self = this;

    return self.stats ? self.stats.getStats() : {};
};

PexRTCConn.prototype.disconnect = function (cb, save_call) {
    var self = this;

    self.cleanup(save_call);

    if (self.state != 'DISCONNECTING') {
        self.state = 'DISCONNECTING';
        self.parent.onLog('Sending disconnect');
        if (self.parent.token) {
            self.sendRequest('calls/' + self.call_uuid + '/disconnect', {}, cb);
        }
    }
};

function PexJPEGPresentation(parent) {
    var self = this;
    self.parent = parent;

    self.onConnect = null;
    self.onDisconnect = null;
}

PexJPEGPresentation.prototype.connect = function () {
    var self = this;

    var floorRequest = { jpegs: true };
    self.parent.sendRequest('participants/' + self.parent.uuid + '/take_floor', floorRequest, function (e) {
        if (e.target.status != 200) {
            return self.onDisconnect(self.parent.trans.ERROR_SCREENSHARE_REJECTED);
        } else {
            self.onConnect();
        }
    });
};

PexJPEGPresentation.prototype.sendFile = function (files) {
    var self = this;

    var xhr = new XMLHttpRequest();
    var xhrUrl = 'https://' + self.parent.node + '/api/client/v2/conferences/' + self.parent.conference_uri + '/presentation';

    self.parent.onLog('PexJPEGPresentation.sendFile');
    xhr.open('POST', xhrUrl, true);

    if (self.parent.token) {
        xhr.setRequestHeader('token', self.parent.token);
    }
    if (self.parent.basic_username && self.parent.basic_password) {
        xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.parent.basic_username + ':' + self.parent.basic_password));
    }

    xhr.send(files);
    return xhr;
};

PexJPEGPresentation.prototype.sendPresentationImageFile = function (file_element) {
    var self = this;
    if (!file_element || !file_element.files.length) {
        self.parent.onLog('PexJPEGPresentation.sendPresentationImageFile error:', 'Element not given');
    }
    return self.sendPresentationImage(file_element.files[0]);
};

PexJPEGPresentation.prototype.sendPresentationImage = function (image) {
    var self = this;
    var blob = new Blob([image], { type: 'image/jpeg' });

    if (self.parent.direct_media) {
        var reader = new FileReader();
        self.parent.onLog('PexJPEGPresentation: Loading blob');
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            self.parent.onLog('PexJPEGPresentation: Blob loaded');
            var base64data = reader.result;
            var chunk_size = 64000;
            var total = Math.floor(base64data.length / chunk_size);
            for (var i = 0; i <= total; i++) {
                self.parent.onLog('PexJPEGPresentation: Sending chunk', i);
                self.parent.call.sendDataChannel('image', {
                    fragment: i,
                    total: total,
                    data: base64data.substr(i * chunk_size, chunk_size)
                });
            }
        };
    } else {
        var formdata = new FormData();
        formdata.append('frame', blob);
        self.parent.onLog('PexJPEGPresentation.sendPresentationImage', formdata);
        return self.sendFile(formdata);
    }
};

PexJPEGPresentation.prototype.disconnect = function () {
    var self = this;

    if (self.parent.token) {
        self.parent.sendRequest('participants/' + self.parent.uuid + '/release_floor');
    }
};

function PexRTC() {
    var self = this;
    self.state = 'IDLE';
    self.conference = null;
    self.conference_uri = '';
    self.role = null;
    self.version = null;
    self.display_name = null;
    self.bandwidth_in = null;
    self.bandwidth_out = null;
    self.oneTimeToken = null;
    self.conference_extension = null;
    self.node = null;
    self.socket = null;
    self.uuid = null;
    self.onHold = false;
    self.last_ping = null;
    self.pc = null;
    self.pcConfig = {};
    self.default_stun = null;
    self.turn_server = null;
    self.pin = null;
    self.pin_status = 'none';
    self.chosen_idp_uuid = null;
    self.chosen_idp_name = null;
    self.idp_choices = null;
    self.sso_token = null;
    self.sso_redirect_target = null;
    self.call_type = '';
    self.mutedAudio = false;
    self.mutedVideo = false;
    self.audio_source = null;
    self.video_source = null;
    self.gum_audio_source = null;
    self.gum_video_source = null;
    self.recv_audio = true;
    self.recv_video = true;
    self.event_listener = null;
    self.screenshare_api = 'pexGetScreen';
    self.screenshare_fps = 15;
    self.screenshare_width = window.screen.width;
    self.screenshare_height = window.screen.height;
    self.powerLineFrequency = 0;
    self.token = null;
    self.token_refresh = null;
    self.registration_token = null;
    self.event_source = null;
    self.event_source_timeout = 0;
    self.xhr_timeout = 10000;
    self.rosterList = {};
    self.oldRosterList = {};
    self.presentation_msg = { status: '' };
    self.presentation_event_id = null;
    self.chat_enabled = false;
    self.fecc_enabled = false;
    self.rtmp_enabled = true;
    self.rtsp_enabled = false;
    self.live_captions_available = false;
    self.direct_media = false;
    self.pex_datachannel_id = null;
    self.client_stats_update_interval = null;
    self.analytics_enabled = false;
    self.allow_1080p = false;
    self.force_hd = 720;
    self.service_type = null;
    self.current_service_type = null;
    self.remote_call_type = null;
    self.guests_can_present = true;
    self.conference_name = null;
    self.call_tag = null;
    self.client_id = 'PexRTC';
    self.presentation_requested = false;
    self.screenshare_requested = false;

    self.dtmf_queue = {};
    self.fecc_queue = {};
    self.h264_enabled = true;
    self.vp8_enabled = true;
    self.vp9_enabled = true;
    self.png_presentation = false;
    self.basic_username = null;
    self.basic_password = null;
    self.user_media_stream = null;
    self.user_presentation_stream = null;
    self.saved_media_stream = null;
    self.return_media_stream = false;
    self.ice_timeout = 10;
    self.use_trickle_ice = true;
    self.fecc_supported = false;
    self.autoGainControl = true;
    self.echoCancellation = true;
    self.noiseSuppression = true;

    self.call = null;
    self.screen_http = null;
    self.error = null;

    self.onError = null;
    self.onSetup = null;
    self.onConnect = null;
    self.onHoldResume = null;
    self.onDisconnect = null;
    self.onPresentation = null;
    self.onPresentationReload = null;
    self.onPresentationConnected = null;
    self.onPresentationDisconnected = null;
    self.onRosterList = null;
    self.onScreenshareStopped = null;
    self.onScreenshareMissing = null;
    self.onCallTransfer = null;
    self.onCallDisconnect = null;
    self.onIceFailure = null;
    self.onAuth = null;
    self.onSplashScreen = null;
    self.onQualityLimitation = null;

    self.onParticipantCreate = null;
    self.onParticipantUpdate = null;
    self.onParticipantDelete = null;
    self.onSyncBegin = null;
    self.onSyncEnd = null;
    self.onApplicationMessage = null;
    self.onChatMessage = null;
    self.onDirectMessage = null;
    self.onStageUpdate = null;
    self.onMicActivity = null;
    self.onLog = function () {
        console.log.apply(console, arguments);
    };
    self.outstanding_requests = {};
    self.imageData = '';

    self.breakout_rooms = false;
    self.breakout_prefix = '';
    self.breakout_uuid = 'main';
    self.breakout_roster = { main: {} };
    self.breakout_map = {};
    self.breakout_buzz = {};
    self.onBreakoutEnd = null;
    self.onBreakoutHelp = null;
    self.onBreakoutUpdate = null;
    self.onBreakoutParticipant = null;

    self.is_android = navigator.userAgent.indexOf('Android') != -1;
    self.is_electron = navigator.userAgent.indexOf('Electron') != -1;
    self.is_mobile = navigator.userAgent.indexOf('Mobile') != -1;

    if (navigator.userAgent.indexOf('Chrome') != -1) {
        self.chrome_ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
    } else {
        self.chrome_ver = 0;
    }

    if (navigator.userAgent.indexOf('Firefox') != -1) {
        self.firefox_ver = parseInt(window.navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);
        if (self.firefox_ver < 38) {
            self.h264_enabled = false;
        }
    } else {
        self.firefox_ver = 0;
    }

    if (navigator.userAgent.indexOf('Edge') != -1) {
        self.edge_ver = parseInt(window.navigator.userAgent.match(/Edge\/\d+\.(\d+)/)[1], 10);
        self.chrome_ver = 0;
    } else {
        self.edge_ver = 0;
    }

    self.safari_ver = 0;
    if (self.chrome_ver == 0 && self.edge_ver == 0 && navigator.userAgent.indexOf('Safari') != -1) {
        var ver_fields = window.navigator.appVersion.match(/Version\/(\d+\.\d+)(\.(\d+))?/);
        if (ver_fields) {
            self.safari_ver = parseFloat(ver_fields[1]);
            if (ver_fields[3]) {
                self.safari_ver += ver_fields[3] / 100;
            }
        } else if (
            navigator.userAgent.indexOf('AppleWebKit') != -1 &&
            navigator.userAgent.indexOf('Mobile') != -1 &&
            navigator.userAgent.indexOf(' OS ') != -1
        ) {
            ver_fields = window.navigator.appVersion.match(/ OS (\d\d)\_(\d)/);
            var ios_ver = parseFloat(ver_fields[1] + '.' + ver_fields[2]);
            if (ios_ver >= 14.1) {
                self.safari_ver = ios_ver;
            }
        }
    }

    if (self.safari_ver == 14.1 || self.safari_ver == 15.1) {
        self.h264_enabled = false;
    }

    if (self.safari_ver >= 11 || self.chrome_ver > 65 || self.firefox_ver > 59) {
        self.return_media_stream = true;
    }

    self.trans = {
        ERROR_SCREENSHARE_CANCELLED: 'Screenshare cancelled',
        ERROR_SCREENSHARE_DENIED: 'Screenshare denied',
        ERROR_SCREENSHARE_REJECTED: 'Screenshare rejected',
        ERROR_CALL_FAILED: 'Call Failed: ',
        ERROR_WEBRTC_SUPPORT: 'Error: WebRTC not supported by this browser',
        ERROR_SCREENSHARE_EXTENSION:
            'Error: Screenshare extension not found.\n\nHave you installed it from http://www.pexip.com/extension/?',
        ERROR_USER_MEDIA:
            'Error: Could not get access to camera/microphone.\n\nHave you allowed access? Has any other application locked the camera?',
        ERROR_ICE_CANDIDATES: 'Failed to gather IP addresses',
        ERROR_ICE_FAILED: 'Failed to establish media.\n\nEnsure required firewall ports are permitted.',
        ERROR_PRESENTATION_ENDED: 'Presentation ended',
        ERROR_DISCONNECTED_PRESENTATION: 'Presentation stream remotely disconnected',
        ERROR_DISCONNECTED_SCREENSHARE: 'Screenshare remotely disconnected',
        ERROR_DISCONNECTED: 'You have been remotely disconnected from this conference',
        ERROR_CONNECTING_PRESENTATION: 'Presentation stream unavailable',
        ERROR_CONNECTING_SCREENSHARE: 'Screenshare error',
        ERROR_CONNECTING_EXTENSION: 'Conference extension not found',
        ERROR_CONNECTING: 'Error connecting to conference',
        ERROR_SSO_AUTHENTICATION: 'SSO Authentication Failed',
        ERROR_SSO_NO_IDENTITY_PROVIDERS: 'SSO enabled but no Identity Providers configured',
        ERROR_SSO_POPUP_FAILED: 'Unable to open window for SSO authentication. This may have been prevented by a pop-up blocker.',
        ERROR_SSO_AUTHENTICATION_MAINTENANCE: 'SSO Authentication Failed. The system is in Maintenance mode.'
    };
}

PexRTC.prototype.makeCall = function (node, conf, name, bw, call_type) {
    var self = this;

    self.state = 'ACTIVE';
    self.node = node;
    self.conference = conf;
    self.conference_uri = encodeURIComponent(conf);
    self.display_name = name;
    if (bw) {
        self.bandwidth_in = parseInt(bw);
        self.bandwidth_out = self.bandwidth_in;
    }

    self.requestToken(function () {
        self.createEventSource();
        if (self.state != 'DISCONNECTING') {
            if (call_type != 'none') {
                self.addCall(call_type);
            } else {
                self.call_type = call_type;
                self.onSetup(null, self.pin_status, self.conference_extension, self.idp_choices);
            }
        }
    });
};

PexRTC.prototype.sendRequest = function (request, params, cb, req_method, retries, timeout) {
    var self = this;

    // Only do sync if explicitly asked
    var async = cb === false ? false : true;
    var method = req_method || 'POST';
    var xhr_timeout = timeout || self.xhr_timeout;
    var xhr = new XMLHttpRequest();
    var xhrUrl = 'https://' + self.node + '/api/client/v2/conferences/' + self.conference_uri + '/' + request;
    self.onLog('PexRTC.sendRequest', request, params, method, xhrUrl);
    if (request in self.outstanding_requests) {
        clearTimeout(self.outstanding_requests[request]);
        delete self.outstanding_requests[request];
    }
    xhr.open(method, xhrUrl, async);
    if (retries === undefined) {
        retries = 0;
    }
    if (cb) {
        xhr.onload = function (e) {
            if (e.target.status == 502 || e.target.status == 504) {
                if (++retries > 10) {
                    self.error = e.target.status + ' ' + e.target.statusText + ' sending request: ' + request;
                    self.onError(self.trans.ERROR_CONNECTING);
                } else {
                    self.outstanding_requests[request] = setTimeout(function () {
                        self.sendRequest(request, params, cb, method, retries, xhr_timeout);
                    }, retries * 500);
                }
            } else {
                cb(e);
            }
        };
    }
    xhr.onerror = function () {
        if (++retries > 10 || cb === false) {
            self.error = 'Error sending request: ' + request;
            self.onError(self.trans.ERROR_CONNECTING);
        } else {
            self.outstanding_requests[request] = setTimeout(function () {
                self.sendRequest(request, params, cb, method, retries, xhr_timeout);
            }, retries * 500);
        }
    };
    xhr.onabort = xhr.onerror;
    if (async && xhr_timeout > 0) {
        xhr.timeout = xhr_timeout;
        xhr.ontimeout = function () {
            if (++retries > 10 || cb === false) {
                self.error = 'Timeout sending request: ' + request;
                self.onError(self.trans.ERROR_CONNECTING);
            } else {
                self.outstanding_requests[request] = setTimeout(function () {
                    self.sendRequest(request, params, cb, method, retries, xhr_timeout);
                }, retries * 500);
            }
        };
    }
    if (self.token) {
        xhr.setRequestHeader('token', self.token);
    } else if (self.pin !== null) {
        xhr.setRequestHeader('pin', self.pin);
    }
    if (self.basic_username && self.basic_password) {
        xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(self.basic_username + ':' + self.basic_password));
    }
    try {
        if (params) {
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify(params));
        } else {
            xhr.send();
        }
    } catch (error) {
        // This should only happen on a synchronous call, so retry immediately
        if (++retries < 5) {
            return self.sendRequest(request, params, cb, method, retries, xhr_timeout);
        }
    }
    if (cb === false) {
        self.onLog('PexRTC.sendRequest response', xhr.responseText);
        var msg = {};
        try {
            msg = JSON.parse(xhr.responseText);
        } catch (error) {
            msg.reason = xhr.status + ' ' + xhr.statusText;
        }
        msg.http_status = xhr.status;
        return msg;
    }
};

PexRTC.prototype.requestToken = function (cb) {
    var self = this;
    var chosen_idp_uuid = self.chosen_idp_uuid;
    var sso_token = self.sso_token;

    if (!self.token) {
        if (chosen_idp_uuid == '' || chosen_idp_uuid == 'undefined' || chosen_idp_uuid === null) {
            chosen_idp_uuid = 'none';
        }

        if (sso_token == '' || sso_token == 'undefined' || sso_token === null) {
            sso_token = 'none';
        }

        var params = {
            display_name: self.display_name,
            chosen_idp: chosen_idp_uuid,
            sso_token: sso_token,
            direct_media: true,
            client_id: self.client_id
        };

        if (self.registration_token) {
            params.registration_token = self.registration_token;
        }
        if (self.oneTimeToken) {
            params.token = self.oneTimeToken;
            self.oneTimeToken = null;
        }
        if (self.conference_extension) {
            params.conference_extension = self.conference_extension;
        }
        if (self.call_tag) {
            params.call_tag = self.call_tag;
        }

        // Include self.node so that the API has knowledge of the FQDN/address the client
        // is connecting to, to reach the node. This helps with some SSO flows.
        if (self.node) {
            params.node = self.node;
        }

        // Provide a target for the redirect only (i.e. disabled pop-up) SSO flows
        if (self.is_electron) {
            // Cannot use redirect SSO flow in Electron
        } else {
            // Require application to have set up the redirect target for us
            if (self.sso_redirect_target !== null) {
                params.sso_redirect_target = self.sso_redirect_target;
            }
        }

        self.sendRequest(
            'request_token',
            params,
            function (evt) {
                self.tokenRequested(evt, cb);
            },
            'POST',
            10,
            60000
        );
    } else if (cb) {
        cb();
    }
};

PexRTC.prototype.tokenRequested = function (e, cb) {
    var self = this;

    var msg = {};
    try {
        msg = JSON.parse(e.target.responseText);
        msg.http_status = e.target.status;
    } catch (error) {
        msg.reason = e.target.status + ' ' + e.target.statusText;
    }

    self.onLog('PexRTC.tokenRequested response', e.target.responseText);

    if (msg.http_status == 200) {
        self.vp9_enabled = self.vp9_enabled && msg.result.vp9_enabled && (self.chrome_ver > 29 || self.firefox_ver > 28);
        self.token = msg.result.token;
        self.uuid = msg.result.participant_uuid;
        self.breakout_map['main'] = msg.result.participant_uuid;
        self.role = msg.result.role;
        self.version = msg.result.version;
        self.chat_enabled = msg.result.chat_enabled;
        self.fecc_enabled = msg.result.fecc_enabled;
        self.rtmp_enabled = msg.result.rtmp_enabled;
        self.rtsp_enabled = msg.result.rtsp_enabled;
        self.breakout_rooms = msg.result.breakout_rooms;
        self.live_captions_available = msg.result.live_captions_available;
        self.analytics_enabled = msg.result.analytics_enabled;
        self.allow_1080p = msg.result.allow_1080p;
        self.service_type = msg.result.service_type;
        self.current_service_type = msg.result.current_service_type;
        self.remote_call_type = msg.result.call_type;
        self.guests_can_present = msg.result.guests_can_present;
        self.conference_name = msg.result.conference_name;
        self.direct_media = msg.result.direct_media;
        self.pex_datachannel_id = msg.result.pex_datachannel_id;
        self.client_stats_update_interval = msg.result.client_stats_update_interval;
        self.use_trickle_ice =
            self.use_trickle_ice &&
            msg.result.trickle_ice_enabled &&
            (self.chrome_ver > 71 || self.firefox_ver > 65 || self.safari_ver >= 12);

        self.pcConfig.bundlePolicy = 'max-bundle';

        if (msg.result.use_relay_candidates_only) {
            self.pcConfig.iceTransportPolicy = 'relay';
        }

        self.pcConfig.iceServers = [];
        if (self.default_stun) {
            if (self.firefox_ver > 43 || self.edge_ver > 10527 || self.safari_ver >= 11 || self.chrome_ver > 71) {
                self.pcConfig.iceServers.push({ urls: [self.default_stun] });
            } else {
                self.pcConfig.iceServers.push({ url: self.default_stun });
            }
        }
        if (self.turn_server && self.edge_ver == 0) {
            var turn_servers = [];
            if (self.turn_server instanceof Array) {
                turn_servers = self.turn_server;
            } else {
                turn_servers.push(self.turn_server);
            }

            for (var i = 0; i < turn_servers.length; i++) {
                if (self.safari_ver >= 11 && self.safari_ver < 14) {
                    var is_tcp = false;
                    if (turn_servers[i].hasOwnProperty('url') && turn_servers[i].url.indexOf('transport=tcp') != -1) {
                        is_tcp = true;
                    } else if (turn_servers[i].hasOwnProperty('urls')) {
                        for (var j = 0; j < turn_servers[i].urls.length; j++) {
                            if (turn_servers[i].urls[j].indexOf('transport=tcp') != -1) {
                                is_tcp = true;
                            }
                        }
                    }

                    if (is_tcp) {
                        continue;
                    }
                }

                if (self.firefox_ver > 43 || self.safari_ver >= 11 || self.chrome_ver > 71) {
                    if (turn_servers[i].hasOwnProperty('url')) {
                        turn_servers[i].urls = [turn_servers[i].url];
                        delete turn_servers[i].url;
                    }
                }

                self.pcConfig.iceServers.push(turn_servers[i]);
            }
        }
        if ('stun' in msg.result && self.edge_ver == 0) {
            for (var i = 0; i < msg.result.stun.length; i++) {
                if (self.firefox_ver > 43 || self.safari_ver >= 11 || self.chrome_ver > 71) {
                    self.pcConfig.iceServers.push({ urls: [msg.result.stun[i].url] });
                } else {
                    self.pcConfig.iceServers.push(msg.result.stun[i]);
                }
            }
        }
        if ('turn' in msg.result && self.edge_ver == 0 && (self.safari_ver == 0 || self.safari_ver >= 14)) {
            for (var i = 0; i < msg.result.turn.length; i++) {
                self.pcConfig.iceServers.push(msg.result.turn[i]);
            }
        }
        self.onLog('ICE Servers:', self.pcConfig);

        self.orig_bandwidth_in = self.bandwidth_in;
        self.orig_bandwidth_out = self.bandwidth_out;
        if ('bandwidth_in' in msg.result) {
            self.set_bandwidth_in = msg.result.bandwidth_in - 64;
            if (self.set_bandwidth_in < self.bandwidth_in) {
                self.bandwidth_in = self.set_bandwidth_in;
            }
        }
        if ('bandwidth_out' in msg.result) {
            self.set_bandwidth_out = msg.result.bandwidth_out - 64;
            if (!self.bandwidth_out || self.set_bandwidth_out < self.bandwidth_out) {
                self.bandwidth_out = self.set_bandwidth_out;
            }
        }
    } else if (msg.http_status == 403 && msg.status === 'success') {
        if ('pin' in msg.result) {
            if (msg.result.guest_pin == 'none') {
                self.pin_status = 'optional';
            } else {
                self.pin_status = 'required';
            }
        } else if ('idp' in msg.result) {
            // Store the list of Identity Providers we've just been sent
            self.idp_choices = msg.result.idp;
            if (self.idp_choices.length == 0) {
                return self.onError(self.trans.ERROR_SSO_NO_IDENTITY_PROVIDERS);
            }
        } else if ('redirect_url' in msg.result) {
            self.redirect_url = msg.result.redirect_url;
            self.chosen_idp_uuid = msg.result.redirect_idp.uuid;
            self.chosen_idp_name = msg.result.redirect_idp.name;
            self.disable_popup_flow = msg.result.disable_popup_flow;

            // API consumer provides custom login
            if (self.onAuth) {
                return self.onAuth(self.redirect_url, self.chosen_idp_uuid, self.chosen_idp_name, self.disable_popup_flow);
            }

            if (self.disable_popup_flow === true) {
                // Pop-ups have been disabled so we need to do a simple redirect
                window.location = msg.result.redirect_url;
            } else {
                // Open a login pop-up for the chosen IdP
                auth_popup = window.open(msg.result.redirect_url, '', 'width=800,height=900');

                if (auth_popup === null) {
                    return self.onError(self.trans.ERROR_SSO_POPUP_FAILED);
                }

                // Track if we've received an event from the pop-up
                var auth_popup_event_received = false;

                // Define the message event handler
                var message_listener = function (event) {
                    if (event.source === auth_popup) {
                        window.removeEventListener('message', message_listener);

                        auth_popup.close();

                        if (!auth_popup_event_received) {
                            auth_popup_event_received = true;
                            if (event && event.data) {
                                if (event.data.result && event.data.result === 'success') {
                                    self.sso_token = event.data.token;
                                    self.requestToken(cb);
                                } else {
                                    if (event.data.code && event.data.code === 503) {
                                        return self.onError(self.trans.ERROR_SSO_AUTHENTICATION_MAINTENANCE);
                                    } else {
                                        return self.onError(self.trans.ERROR_SSO_AUTHENTICATION);
                                    }
                                }
                            } else {
                                return self.onError(self.trans.ERROR_SSO_AUTHENTICATION);
                            }
                        }
                    }
                };

                // Register handler for the expected message event from the pop-up
                window.addEventListener('message', message_listener, false);

                // Monitor the pop-up in case it is closed before it's done
                const isWeb = self.firefox_ver > 0 || self.chrome_ver > 0 || self.edge_ver > 0 || self.safari_ver > 0;
                if (isWeb) {
                    var auth_popup_tick = setInterval(function () {
                        if (auth_popup.closed) {
                            clearInterval(auth_popup_tick);
                            if (!auth_popup_event_received) {
                                window.removeEventListener('message', message_listener);
                                return self.onError(self.trans.ERROR_SSO_AUTHENTICATION);
                            }
                        }
                    }, 500);
                }
            }
            return;
        }
        if ('conference_extension' in msg.result) {
            self.conference_extension = msg.result.conference_extension_type;
        }
    } else if (msg.http_status == 404 && self.conference_extension) {
        return self.onError(self.trans.ERROR_CONNECTING_EXTENSION);
    } else {
        return self.handleError(msg.result || msg.reason);
    }

    if (self.token) {
        if (self.state == 'DISCONNECTING') {
            self.disconnect();
        } else if (!self.token_refresh) {
            var expires = msg.result.expires || 120;
            self.token_refresh = setInterval(self.refreshToken.bind(this), (expires * 1000) / 3);

            self.sendRequest(
                'conference_status',
                null,
                function (e) {
                    if (e.target.status == 200 && self.onConferenceUpdate) {
                        var msg = JSON.parse(e.target.responseText);
                        self.onLog('conference_status', msg);
                        self.processConferenceUpdate(msg.result);
                    }
                },
                'GET'
            );
        }
    }

    if (cb) {
        cb();
    }
};

PexRTC.prototype.refreshToken = function () {
    var self = this;

    var old_token = self.token;
    self.sendRequest('refresh_token', null, function (e) {
        self.onLog('PexRTC.refreshToken response', e.target.responseText);
        if (self.state != 'DISCONNECTING' && self.state != 'IDLE') {
            var msg = {};
            try {
                msg = JSON.parse(e.target.responseText);
            } catch (error) {
                msg.reason = e.target.status + ' ' + e.target.statusText;
            }
            if (e.target.status == 200) {
                self.token = msg.result.token;
                if (msg.result.role != self.role) {
                    self.onLog('Role has changed from', self.role, 'to', msg.result.role);
                    self.role = msg.result.role;
                    if (self.onRoleUpdate) {
                        self.onRoleUpdate(self.role);
                    }
                    self.getParticipants(function (e2) {
                        if (e2.target.status == 200) {
                            var msg2 = JSON.parse(e2.target.responseText);
                            for (var i = 0; i < msg2.result.length; i++) {
                                var participant = msg2.result[i];
                                self.rosterList[participant.uuid] = participant;
                                self.onParticipantUpdate(participant);
                            }
                        }
                    });
                }
            } else if (old_token == self.token) {
                // Only error out if the token hasn't changed under us
                return self.handleError(msg.result || msg.reason);
            }
        } else {
            self.onLog('PexRTC.refreshToken not updating token');
        }
    });
};

PexRTC.prototype.createEventSource = function () {
    var self = this;

    if (!self.event_source && self.token) {
        self.event_source = new EventSource(
            'https://' + self.node + '/api/client/v2/conferences/' + self.conference_uri + '/events?token=' + self.token
        );
        self.event_source.addEventListener(
            'presentation_start',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('presentation_start', msg);
                self.processEvent('presentation_start', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'presentation_stop',
            function (e) {
                var msg = { status: 'stop' };
                self.onLog('presentation_stop', msg);
                self.processEvent('presentation_stop', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'presentation_frame',
            function (e) {
                self.presentation_event_id = e.lastEventId;
                if (self.onPresentationReload && !self.onHold) {
                    self.onPresentationReload(self.getPresentationURL());
                }
            },
            false
        );
        self.event_source.addEventListener(
            'participant_create',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('participant_create', msg);
                self.processEvent('participant_create', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'participant_update',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('participant_update', msg);
                self.processEvent('participant_update', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'participant_delete',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('participant_delete', msg);
                self.processEvent('participant_delete', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'message_received',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('message_received', msg);
                self.processEvent('message_received', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'participant_sync_begin',
            function (e) {
                self.onLog('participant_sync_begin');
                self.processEvent('participant_sync_begin');
            },
            false
        );
        self.event_source.addEventListener(
            'participant_sync_end',
            function (e) {
                self.onLog('participant_sync_end', self.rosterList);
                self.processEvent('participant_sync_end');
            },
            false
        );
        self.event_source.addEventListener(
            'call_disconnected',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('call_disconnected', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'disconnect',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('disconnect', msg);
                self.processEvent('disconnect', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'conference_update',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('conference_update', msg);
                self.processEvent('conference_update', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'refer',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('refer', msg);
                self.processEvent('refer', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'on_hold',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('call_hold', msg);
                self.processEvent('call_hold', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'stage',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('stage', msg);
                self.processEvent('stage', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'layout',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('layout', msg);
                self.processEvent('layout', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'fecc',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('fecc', msg);
                self.processEvent('fecc', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'live_captions',
            function (e) {
                var msg = JSON.parse(e.data);
                self.processEvent('live_captions', msg);
            },
            false
        );
        self.event_source.addEventListener(
            'refresh_token',
            function (e) {
                self.onLog('refresh_token');
                self.refreshToken();
            },
            false
        );
        self.event_source.addEventListener(
            'peer_disconnect',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('peer_disconnect', msg);
                if (self.call && self.call.call_uuid) {
                    self.call.disconnect(function () {
                        if (self.state != 'DISCONNECTING') {
                            self.call.connect();
                        }
                    }, true);
                }
            },
            false
        );
        self.event_source.addEventListener(
            'new_offer',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('new_offer', msg);
                self.call.receiveOffer(msg.sdp);
            },
            false
        );
        self.event_source.addEventListener(
            'update_sdp',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('update_sdp', msg);
                self.call.receiveOffer(msg.sdp);
            },
            false
        );
        self.event_source.addEventListener(
            'new_candidate',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('new_candidate', msg);
                if (self.call) {
                    self.call.receiveCandidate(msg);
                }
            },
            false
        );
        self.event_source.addEventListener(
            'splash_screen',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('splash_screen', msg);
                if (self.onSplashScreen) {
                    if (msg == null) {
                        self.onSplashScreen();
                    } else {
                        var screen_key = msg.screen_key;
                        var theme_spec = self.call.client_ivr_theme[screen_key];
                        var background_uri =
                            'https://' +
                            self.node +
                            '/api/client/v2/conferences/' +
                            self.conference_uri +
                            '/theme/' +
                            theme_spec.background.path +
                            '?token=' +
                            self.token;
                        var display_duration = msg.display_duration;
                        self.onSplashScreen({
                            text: theme_spec.elements[0].text,
                            background: background_uri,
                            screen_key: screen_key,
                            display_duration: display_duration
                        });
                    }
                }
            },
            false
        );
        self.event_source.addEventListener(
            'breakout_begin',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('breakout_begin', msg);
                self.breakout_roster[msg.breakout_uuid] = {};
                self.breakout_map[msg.breakout_uuid] = msg.participant_uuid;
            },
            false
        );
        self.event_source.addEventListener(
            'breakout_end',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('breakout_end', msg);
                delete self.breakout_map[msg.breakout_uuid];
                delete self.breakout_roster[msg.breakout_uuid];
                if (self.onBreakoutEnd) {
                    self.onBreakoutEnd(msg.breakout_uuid);
                }
            },
            false
        );
        self.event_source.addEventListener(
            'breakout_refer',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('breakout_refer', msg);
                self.moveToBreakout(msg.breakout_uuid, msg.breakout_name);
            },
            false
        );
        self.event_source.addEventListener(
            'breakout_event',
            function (e) {
                var msg = JSON.parse(e.data);
                self.onLog('breakout_event', msg);
                self.processBreakoutEvent(msg);
            },
            false
        );
        self.event_source.onopen = function (e) {
            self.onLog('event source open');
            self.event_source_timeout = 10;
        };
        self.event_source.onerror = function (e) {
            self.onLog('event source error', e);
            if (self.state != 'DISCONNECTING') {
                self.onLog('reconnecting...');
                self.event_source.close();
                self.event_source = null;
                if (self.event_source_timeout > 15000) {
                    self.error = 'Error connecting to EventSource';
                    return self.onError(self.trans.ERROR_CONNECTING);
                }
                setTimeout(function () {
                    self.createEventSource();
                }, self.event_source_timeout);
                self.event_source_timeout += 1000;
            }
        };
    }
};

PexRTC.prototype.processEvent = function (event_name, msg, breakout_uuid) {
    var self = this;
    breakout_uuid ||= 'main';

    if (event_name == 'presentation_start') {
        msg.status = 'start';
        if (self.presentation_msg.status != 'start' || self.presentation_msg.presenter_uuid != msg.presenter_uuid) {
            self.processPresentation(msg);
        }
        self.presentation_msg = msg;
    } else if (event_name == 'presentation_stop') {
        if (self.presentation_msg.status != 'stop') {
            self.processPresentation(msg);
        }
        self.presentation_msg = msg;
    } else if (event_name == 'presentation_frame') {
        self.presentation_event_id = e.lastEventId;
        if (self.onPresentationReload && !self.onHold) {
            self.onPresentationReload(self.getPresentationURL());
        }
    } else if (event_name == 'participant_create') {
        self.breakout_roster[breakout_uuid][msg.uuid] = msg;
        if (msg.uuid == self.uuid && self.current_service_type && msg.service_type) {
            self.current_service_type = msg.service_type;
        }
        if (breakout_uuid == self.breakout_uuid) {
            self.rosterList[msg.uuid] = msg;
            if (!(breakout_uuid in self.oldRosterList)) {
                if (self.onParticipantCreate) {
                    self.onParticipantCreate(msg);
                }
                if (self.onRosterList) {
                    self.onRosterList(self.getRosterList());
                }
            }
        } else if (self.onBreakoutParticipant) {
            self.onBreakoutParticipant(breakout_uuid, 'participant_create', msg);
        }
    } else if (event_name == 'participant_update') {
        self.breakout_roster[breakout_uuid][msg.uuid] = msg;
        if (msg.uuid == self.uuid && self.current_service_type && msg.service_type) {
            self.current_service_type = msg.service_type;
        }
        if (breakout_uuid == self.breakout_uuid) {
            self.rosterList[msg.uuid] = msg;
            if (!(breakout_uuid in self.oldRosterList)) {
                if (self.onParticipantUpdate) {
                    self.onParticipantUpdate(msg);
                }
                if (self.onRosterList) {
                    self.onRosterList(self.getRosterList());
                }
            }
        } else if (self.onBreakoutParticipant) {
            self.onBreakoutParticipant(breakout_uuid, 'participant_update', msg);
        }
    } else if (event_name == 'participant_delete') {
        delete self.breakout_roster[breakout_uuid][msg.uuid];
        if (breakout_uuid == self.breakout_uuid) {
            delete self.rosterList[msg.uuid];
            if (!(breakout_uuid in self.oldRosterList)) {
                if (self.onParticipantDelete) {
                    self.onParticipantDelete(msg);
                }
                if (self.onRosterList) {
                    self.onRosterList(self.getRosterList());
                }
            }
        } else if (self.onBreakoutParticipant) {
            self.onBreakoutParticipant(breakout_uuid, 'participant_delete', msg);
        }
    } else if (event_name == 'participant_sync_begin') {
        if (!(breakout_uuid in self.oldRosterList)) {
            if (!(breakout_uuid in self.breakout_roster)) {
                self.oldRosterList[breakout_uuid] = self.breakout_roster[breakout_uuid];
            } else {
                self.oldRosterList[breakout_uuid] = {};
            }
        }
        self.breakout_roster[breakout_uuid] = {};
        if (breakout_uuid == self.breakout_uuid) {
            self.rosterList = {};
            if (self.onSyncBegin) {
                self.onSyncBegin();
            }
        } else if (self.onBreakoutParticipant) {
            self.onBreakoutParticipant(breakout_uuid, 'participant_sync_begin', {});
        }
    } else if (event_name == 'participant_sync_end') {
        for (var uuid in self.breakout_roster[breakout_uuid]) {
            if (!(uuid in self.oldRosterList[breakout_uuid])) {
                if (breakout_uuid == self.breakout_uuid) {
                    if (self.onParticipantCreate) {
                        self.onParticipantCreate(self.breakout_roster[breakout_uuid][uuid]);
                    }
                } else if (self.onBreakoutParticipant) {
                    self.onBreakoutParticipant(breakout_uuid, 'participant_create', msg);
                }
            } else {
                if (breakout_uuid == self.breakout_uuid) {
                    if (self.onParticipantUpdate) {
                        self.onParticipantUpdate(self.rosterList[uuid]);
                    }
                } else if (self.onBreakoutParticipant) {
                    self.onBreakoutParticipant(breakout_uuid, 'participant_update', msg);
                }
                delete self.oldRosterList[breakout_uuid][uuid];
            }
        }

        for (uuid in self.oldRosterList[breakout_uuid]) {
            var old_uuid = { uuid: uuid };
            if (breakout_uuid == self.breakout_uuid) {
                if (self.onParticipantDelete) {
                    self.onParticipantDelete(old_uuid);
                }
            } else if (self.onBreakoutParticipant) {
                self.onBreakoutParticipant(breakout_uuid, 'participant_delete', old_uuid);
            }
        }

        delete self.oldRosterList[breakout_uuid];

        if (breakout_uuid == self.breakout_uuid) {
            if (self.onRosterList) {
                self.onRosterList(self.getRosterList());
            }
            if (self.onSyncEnd) {
                self.onSyncEnd();
            }
        } else if (self.onBreakoutParticipant) {
            self.onBreakoutParticipant(breakout_uuid, 'participant_sync_end', {});
        }
    } else if (event_name == 'message_received') {
        if (msg.type.split(';')[0] == 'text/plain' && !msg.direct && self.onChatMessage) {
            self.onChatMessage(msg);
        } else if (msg.type.split(';')[0] == 'text/plain' && msg.direct && self.onDirectMessage) {
            self.onDirectMessage(msg);
        } else if (self.onApplicationMessage) {
            self.onApplicationMessage(msg);
        }
    } else if (event_name == 'disconnect') {
        var reason = self.trans.ERROR_DISCONNECTED;
        if ('reason' in msg) {
            reason = msg.reason;
        }
        if (self.state != 'DISCONNECTING') {
            self.disconnect();
            if (self.onDisconnect) {
                self.onDisconnect(reason);
            }
        }
    } else if (event_name == 'conference_update') {
        self.processConferenceUpdate(msg);
    } else if (event_name == 'refer') {
        self.processRefer(msg);
    } else if (event_name == 'on_hold') {
        self.holdresume(msg.setting);
    } else if (event_name == 'stage') {
        if (self.onStageUpdate) {
            self.onStageUpdate(msg);
        }
    } else if (event_name == 'layout') {
        if (self.onLayoutUpdate) {
            self.onLayoutUpdate(msg);
        }
    } else if (event_name == 'fecc') {
        if (self.onFECC && self.fecc_supported) {
            self.onFECC(msg);
        }
    } else if (event_name == 'live_captions') {
        if (self.onLiveCaptions) {
            self.onLiveCaptions(msg);
        }
    }
};

PexRTC.prototype.setConferenceLock = function (setting) {
    var self = this;

    var command = setting ? 'lock' : 'unlock';
    self.sendRequest(self.breakout_prefix + command);
};

PexRTC.prototype.sendChatMessage = function (message, uuid, payload_type) {
    var self = this;

    var type = payload_type || 'text/plain';
    if (self.direct_media) {
        if (self.call && self.chat_enabled) {
            self.call.sendDataChannel('message', { origin: self.display_name, type: type, payload: message, uuid: self.uuid });
        }
    } else {
        var command = uuid ? 'participants/' + uuid + '/message' : 'message';
        var params = { type: type, payload: message };
        self.sendRequest(self.breakout_prefix + command, params);
    }
};

PexRTC.prototype.sendApplicationMessage = function (obj, uuid) {
    var self = this;

    var message = JSON.stringify(obj);
    self.sendChatMessage(message, uuid, 'application/json');
};

PexRTC.prototype.setMuteAllGuests = function (setting) {
    var self = this;

    var command = setting ? 'muteguests' : 'unmuteguests';
    self.sendRequest(self.breakout_prefix + command);
};

PexRTC.prototype.startConference = function () {
    var self = this;

    var command = 'start_conference';
    self.sendRequest(self.breakout_prefix + command);
};

PexRTC.prototype.dialOut = function (destination, protocol, role, cb, user_params) {
    var self = this;

    if (!destination) {
        return;
    }

    var command = self.breakout_prefix + 'dial';
    var params = { destination: destination, protocol: protocol ? protocol : 'auto' };
    var streaming = false;

    if (typeof user_params == 'string') {
        // Legacy: is in fact the presentationUri
        params.presentation_uri = user_params;
    } else if (user_params !== null && typeof user_params == 'object') {
        if ('call_type' in user_params) {
            params.call_type = user_params.call_type;
        }

        if ('dtmf_sequence' in user_params) {
            params.dtmf_sequence = user_params.dtmf_sequence;
        }

        if ('presentation_uri' in user_params) {
            params.presentation_url = user_params.presentation_uri;
        }

        if ('keep_conference_alive' in user_params) {
            params.keep_conference_alive = user_params.keep_conference_alive;
        }

        if ('remote_display_name' in user_params) {
            params.remote_display_name = user_params.remote_display_name;
        }

        if ('overlay_text' in user_params) {
            params.text = user_params.overlay_text;
        }

        if ('prefer_ipv6' in user_params && user_params.prefer_ipv6) {
            params.prefer_ipv6 = user_params.prefer_ipv6;
        }

        if ('streaming' in user_params) {
            streaming = user_params.streaming;
        }

        if ('source' in user_params) {
            params.source = user_params.source;
        }

        if ('source_display_name' in user_params) {
            params.source_display_name = user_params.source_display_name;
        }

        if ('custom_sip_headers' in user_params) {
            params.custom_sip_headers = user_params.custom_sip_headers;
        }
    }

    if (protocol === 'rtmp' || streaming) {
        params.streaming = 'yes';
    }

    if (role && role.toUpperCase() == 'GUEST') {
        params.role = 'GUEST';
    }

    if (cb) {
        self.sendRequest(command, params, function (e) {
            var msg;
            try {
                msg = JSON.parse(e.target.responseText);
            } catch (SyntaxError) {
                return cb({ status: 'failed', result: [], detail: e.target.status + ' ' + e.target.statusText });
            }
            if (e.target.status != 200) {
                return cb({ status: 'failed', result: [], detail: msg.result || msg.reason });
            }
            cb(msg);
        });
    } else {
        var msg = self.sendRequest(command, params, false);
        return msg;
    }
};

PexRTC.prototype.disconnectAll = function () {
    var self = this;

    var command = 'disconnect';
    self.sendRequest(self.breakout_prefix + command);
};

PexRTC.prototype.getParticipants = function (cb) {
    var self = this;

    var command = 'participants';
    self.sendRequest(self.breakout_prefix + command, {}, cb, 'GET');
};

PexRTC.prototype.setParticipantMute = function (uuid, setting) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/';
    command += setting ? 'mute' : 'unmute';
    self.sendRequest(command);
};

PexRTC.prototype.setParticipantRxPresentation = function (uuid, setting) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/';
    command += setting ? 'allowrxpresentation' : 'denyrxpresentation';
    self.sendRequest(command);
};

PexRTC.prototype.setParticipantStudioSound = function (uuid, setting) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/studiosound';
    var params = { enabled: setting };
    self.sendRequest(command, params);
};

PexRTC.prototype.unlockParticipant = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/unlock';
    self.sendRequest(command);
};

PexRTC.prototype.holdParticipant = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/hold';
    self.sendRequest(command);
};

PexRTC.prototype.resumeParticipant = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/resume';
    self.sendRequest(command);
};

PexRTC.prototype.disconnectParticipant = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/disconnect';
    self.sendRequest(command);
};

PexRTC.prototype.transferParticipant = function (uuid, destination, role, pin, cb) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/transfer';
    var params = { conference_alias: destination };
    if (role) {
        params.role = role;
        if (pin) {
            params.pin = pin;
        }
    }

    if (cb) {
        self.sendRequest(command, params, function (e) {
            if (e.target.status == 200) {
                var msg = JSON.parse(e.target.responseText);
                self.onLog(msg);
                cb(msg.result);
            } else {
                cb(false);
            }
        });
    } else {
        self.sendRequest(command, params);
    }
};

PexRTC.prototype.setParticipantSpotlight = function (uuid, setting) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/';
    command += setting ? 'spotlighton' : 'spotlightoff';
    self.sendRequest(command);
};

PexRTC.prototype.clearSpotlights = function () {
    var self = this;

    var command = self.breakout_prefix + 'clearspotlights';
    self.sendRequest(command);
};

PexRTC.prototype.overrideLayout = function (new_layout) {
    var self = this;

    var command = self.breakout_prefix + 'override_layout';
    self.sendRequest(command, new_layout);
};

PexRTC.prototype.transformLayout = function (transforms, cb) {
    var self = this;

    var command = self.breakout_prefix + 'transform_layout';
    self.sendRequest(command, { transforms: transforms }, cb);
};

PexRTC.prototype.setClassificationLevel = function (level, cb) {
    var self = this;

    var command = self.breakout_prefix + 'set_classification_level';
    self.sendRequest(command, { level: level }, cb);
};

PexRTC.prototype.getClassificationLevel = function (cb) {
    var self = this;

    var command = self.breakout_prefix + 'get_classification_level';
    self.sendRequest(command, {}, cb, 'GET');
};

PexRTC.prototype.getAvailableLayouts = function (cb) {
    var self = this;

    var command = self.breakout_prefix + 'available_layouts';
    self.sendRequest(command, {}, cb, 'GET');
};

PexRTC.prototype.setParticipantText = function (uuid, text) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/overlaytext';
    var params = { text: text };
    self.sendRequest(command, params);
};

PexRTC.prototype.setRole = function (uuid, role) {
    var self = this;

    if (role !== 'chair' && role !== 'guest') {
        throw new Error('Role must be chair or guest');
    }
    var command = self.breakout_prefix + 'participants/' + uuid + '/role';
    var params = { role: role };
    self.sendRequest(command, params, function () {});
};

PexRTC.prototype.setBuzz = function () {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + self.uuid + '/buzz';
    self.sendRequest(command);
};

PexRTC.prototype.clearBuzz = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/clearbuzz';
    self.sendRequest(command);
};

PexRTC.prototype.clearAllBuzz = function () {
    var self = this;

    var command = self.breakout_prefix + 'clearallbuzz';
    self.sendRequest(command);
};

PexRTC.prototype.videoMuted = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/video_muted';
    self.sendRequest(command);
};

PexRTC.prototype.videoUnmuted = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/video_unmuted';
    self.sendRequest(command);
};

PexRTC.prototype.clientMute = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/client_mute';
    self.sendRequest(command);
};

PexRTC.prototype.clientUnmute = function (uuid) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/client_unmute';
    self.sendRequest(command);
};

PexRTC.prototype.notifyNotAFK = function () {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + self.uuid + '/notify_not_afk';
    self.sendRequest(command);
};

PexRTC.prototype.setPresentationInMix = function (state, uuid) {
    var self = this;

    var params = { state: state };
    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/pres_in_mix';
    self.sendRequest(command, params);
};

PexRTC.prototype.showLiveCaptions = function () {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + self.uuid + '/show_live_captions';
    self.sendRequest(command);
};

PexRTC.prototype.hideLiveCaptions = function () {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + self.uuid + '/hide_live_captions';
    self.sendRequest(command);
};

PexRTC.prototype.requestAspectRatio = function (aspect, uuid) {
    var self = this;

    var params = { aspect_ratio: aspect };
    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/preferred_aspect_ratio';
    self.sendRequest(command, params);
};

PexRTC.prototype.setParticipantLayoutGroup = function (uuid, layoutGroup, cb) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/layout_group';
    var params = { layout_group: layoutGroup };

    self.sendRequest(command, params, cb);
};

PexRTC.prototype.getPinningConfig = function (cb) {
    var self = this;

    var command = self.breakout_prefix + 'get_pinning_config';
    self.sendRequest(command, {}, cb, 'GET');
};

PexRTC.prototype.setPinningConfig = function (configName, cb) {
    var self = this;

    var command = self.breakout_prefix + 'set_pinning_config';
    self.sendRequest(command, { pinning_config: configName }, cb);
};

PexRTC.prototype.getMessageText = function (cb) {
    var self = this;

    var command = self.breakout_prefix + 'get_message_text';
    self.sendRequest(command, {}, cb, 'GET');
};

PexRTC.prototype.setMessageText = function (messageText, cb) {
    var self = this;

    var command = self.breakout_prefix + 'set_message_text';
    self.sendRequest(command, { text: messageText }, cb);
};

PexRTC.prototype.setParticipantTxMute = function (uuid, setting) {
    var self = this;

    var command = self.breakout_prefix + 'participants/' + uuid + '/';
    command += setting ? 'tx_mute' : 'tx_unmute';
    self.sendRequest(command);
};

PexRTC.prototype.setSendToAudioMixes = function (mixes, uuid) {
    var self = this;

    var params = { mixes: mixes };
    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/send_to_audio_mixes';
    self.sendRequest(command, params);
};

PexRTC.prototype.setReceiveFromAudioMix = function (mix, uuid) {
    var self = this;

    var params = { mix_name: mix };
    var command = self.breakout_prefix + 'participants/' + (uuid ? uuid : self.uuid) + '/receive_from_audio_mix';
    self.sendRequest(command, params);
};

PexRTC.prototype.setGuestsCanUnmute = function (setting, cb) {
    var self = this;

    var command = self.breakout_prefix + 'set_guests_can_unmute';
    self.sendRequest(command, { setting: setting }, cb);
};

PexRTC.prototype.handleError = function (err) {
    var self = this;

    if (self.state != 'DISCONNECTING') {
        if (err.hasOwnProperty('message')) {
            self.error = err.message;
        } else {
            self.error = err;
        }
        self.disconnect();
        if (self.onError) {
            if (self.call_type == 'presentation' || self.call_type == 'screen') {
                self.onError(err);
            } else {
                if (err && err.hasOwnProperty('message')) {
                    err = err.message;
                }
                if (err) {
                    self.onError(self.trans.ERROR_CALL_FAILED + err);
                } else {
                    self.onError(self.trans.ERROR_CALL_FAILED);
                }
            }
        }
    }
};

PexRTC.prototype.connect = function (pin, extension, idp_uuid, sso_token) {
    var self = this;

    var doConnect = function () {
        if (self.state != 'DISCONNECTING') {
            if (self.call) {
                self.call.connect();
            } else {
                self.onConnect();
            }
        }
    };

    var doNext = function () {
        if (self.idp_choices === null && self.chosen_idp_uuid === null) {
            // No indication of a SSO flow so connect
            doConnect();
        } else {
            // Indication of a SSO flow so continue
            self.onSetup(null, self.pin_status, null, self.idp_choices);
        }
    };

    if (self.pin_status != 'none') {
        self.pin_status = 'none';
        self.pin = pin || 'none';
        self.requestToken(function () {
            self.createEventSource();
            doNext();
        });
    } else if (idp_uuid) {
        self.chosen_idp_uuid = idp_uuid || null;
        self.requestToken(function () {
            self.createEventSource();
            doNext();
        });
    } else if (sso_token) {
        self.sso_token = sso_token || null;
        self.requestToken(function () {
            self.createEventSource();
            doConnect();
        });
    } else if (extension) {
        self.conference_extension = extension;
        self.requestToken(function () {
            self.createEventSource();
            self.onSetup(null, self.pin_status, null, self.idp_choices);
        });
    } else {
        doConnect();
    }
};

PexRTC.prototype.addCall = function (call_type) {
    var self = this;

    self.onLog('addCall', call_type);

    self.call_type = call_type;
    if (call_type == 'audioonly') {
        self.recv_audio = true;
        self.recv_video = false;
        self.gum_audio_source = self.audio_source;
        self.gum_video_source = false;
    } else if (call_type == 'presentation' || call_type == 'screen') {
        self.recv_audio = false;
        self.recv_video = false;
        self.gum_audio_source = false;
        self.gum_video_source = false;
    } else if (call_type == 'video') {
        self.recv_audio = true;
        self.recv_video = true;
        self.gum_audio_source = self.audio_source;
        self.gum_video_source = self.video_source;
    } else if (call_type && call_type.indexOf('recvonly') === 0) {
        self.recv_audio = call_type != 'recvonlyvideo';
        self.recv_video = true;
        self.audio_source = false;
        self.video_source = false;
        self.gum_audio_source = false;
        self.gum_video_source = false;
    } else {
        self.gum_audio_source = self.audio_source;
        self.gum_video_source = self.video_source;
    }

    if (!self.call) {
        if (!self.media) {
            self.media = new PexRTCMedia(self);
            self.media.onError = function (reason) {
                self.onError(reason);
            };
        }

        self.call = new PexRTCConn(self);
        self.call.onConnect = function (stream) {
            if (self.mutedAudio) {
                self.muteAudio(self.mutedAudio);
            }
            if (self.video_source === false) {
                self.videoMuted();
            } else if (self.mutedVideo) {
                self.muteVideo(self.mutedVideo);
            } else {
                self.videoUnmuted();
            }
            if (self.call_type == 'presentation') {
                self.getPresentation();
            } else if (self.call_type == 'screen') {
                self.present('screen');
            } else {
                self.onConnect(stream);
            }
        };
        self.call.onDisconnect = function (reason) {
            if (self.call && self.state != 'DISCONNECTING') {
                self.call = null;
                if (self.onCallDisconnect) {
                    self.onCallDisconnect(reason);
                } else {
                    self.disconnect(reason);
                    self.onDisconnect(reason);
                }
            }
        };
        self.call.onError = function (reason) {
            if (self.call && self.state != 'DISCONNECTING') {
                self.call = null;
                self.onError(reason);
            }
        };
    } else {
        self.call.state = 'UPDATING';
    }

    self.setMedia();
};

PexRTC.prototype.setMedia = function () {
    var self = this;

    if (self.user_media_stream) {
        self.call.mediaStream = self.user_media_stream;
        self.onSetup(self.user_media_stream, self.pin_status, self.conference_extension, self.idp_choices);
    } else if (self.gum_audio_source === false && self.gum_video_source === false) {
        self.onSetup(undefined, self.pin_status, self.conference_extension, self.idp_choices);
    } else if (self.saved_media_stream) {
        self.call.mediaStream = self.saved_media_stream;
        self.saved_media_stream = null;
        self.onSetup(self.call.mediaStream, self.pin_status, self.conference_extension, self.idp_choices);
    } else {
        if (self.call.mediaStream) {
            var tracks = self.call.mediaStream.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                tracks[i].stop();
            }
        }

        self.media.onUserMedia = function (stream) {
            self.call.mediaStream = stream;
            self.onSetup(stream, self.pin_status, self.conference_extension, self.idp_choices);
        };
        self.media.getUserMedia();
    }
};

PexRTC.prototype.disconnectCall = function (referral) {
    var self = this;

    if (self.call) {
        self.call.disconnect(false, referral);
        if (referral && !self.user_media_stream) {
            self.saved_media_stream = self.call.mediaStream;
        }
        self.call = null;
    }
};

PexRTC.prototype.renegotiate = function (send_update) {
    var self = this;

    if (self.call) {
        if (send_update) {
            self.call.doIceRestart();
        } else {
            self.gum_audio_source = self.audio_source;
            self.gum_video_source = self.video_source;
            self.call.state = 'UPDATING';
            self.setMedia();
        }
    }
};

PexRTC.prototype.clearLocalStream = function () {
    var self = this;

    if (self.call && self.call.pc) {
        var streams = [];
        if (self.call.pc.getLocalStreams) {
            streams = self.call.pc.getLocalStreams();
        } else {
            streams = [self.call.mediaStream];
        }
        for (var i = 0; i < streams.length; i++) {
            self.call.pc.removeStream(streams[i]);
        }
        self.call.mediaStream = null;
    }
    self.user_media_stream = null;
};

PexRTC.prototype.present = function (call_type) {
    var self = this;

    if (call_type == 'screen_http' && !self.screen_http) {
        self.screen_http = new PexJPEGPresentation(self);
        self.screen_http.onDisconnect = function (reason) {
            self.onScreenshareStopped(reason);
            self.screen_http = null;
        };
        self.screen_http.onConnect = function () {
            self.onScreenshareConnected({});
        };
        return self.screen_http.connect();
    } else if (self.screen_http && !call_type) {
        self.screen_http.disconnect();
        self.screen_http = null;
        return self.onScreenshareStopped(self.trans.ERROR_PRESENTATION_ENDED);
    }

    if (self.call) {
        if (call_type && !self.screenshare_requested) {
            self.screenshare_requested = true;
            if (self.user_presentation_stream) {
                self.call.present(self.user_presentation_stream);
            } else {
                self.media.onDisplayMedia = function (stream) {
                    self.call.present(stream);
                };
                self.media.getDisplayMedia();
            }
        } else if (!call_type) {
            self.call.present();
        }
    } else if (call_type) {
        self.addCall('screen');
    }
};

PexRTC.prototype.screenshareStopped = function (reason) {
    var self = this;

    self.screenshare_requested = false;
    if (reason == self.trans.ERROR_SCREENSHARE_DENIED) {
        self.onError(reason);
    } else if (self.onScreenshareStopped) {
        self.onScreenshareStopped(reason);
    }
};

PexRTC.prototype.muteAudio = function (setting) {
    var self = this;

    if (self.call && self.uuid) {
        self.mutedAudio = self.call.muteAudio(setting);

        if (self.mutedAudio) {
            self.clientMute();
        } else {
            self.clientUnmute();
        }
    } else if (setting !== undefined) {
        self.mutedAudio = setting;
    } else {
        self.mutedAudio = !self.mutedAudio;
    }

    return self.mutedAudio;
};

PexRTC.prototype.muteVideo = function (setting) {
    var self = this;

    if (self.call && self.uuid) {
        self.mutedVideo = self.call.muteVideo(setting);

        if (self.mutedVideo) {
            self.videoMuted();
        } else {
            self.videoUnmuted();
        }
    } else if (setting !== undefined) {
        self.mutedVideo = setting;
    } else {
        self.mutedVideo = !self.mutedVideo;
    }

    return self.mutedVideo;
};

PexRTC.prototype.sendDTMFRequest = function (digits, target) {
    var self = this;

    if (target == 'call') {
        self.sendRequest(
            self.breakout_prefix + 'participants/' + self.uuid + '/calls/' + self.call.call_uuid + '/dtmf',
            { digits: digits },
            function () {
                self.dtmfSent(target);
            }
        );
    } else {
        self.sendRequest(self.breakout_prefix + 'participants/' + target + '/dtmf', { digits: digits }, function () {
            self.dtmfSent(target);
        });
    }
};

PexRTC.prototype.sendDTMF = function (digits, target) {
    var self = this;

    target = target || 'call';
    if (target == 'call' && !self.call) {
        return false;
    }

    if (self.dtmf_queue[target] === undefined) {
        self.dtmf_queue[target] = [];
        self.sendDTMFRequest(digits, target);
    } else {
        self.dtmf_queue[target].push(digits);
    }
};

PexRTC.prototype.dtmfSent = function (target) {
    var self = this;

    if (self.dtmf_queue[target].length === 0) {
        delete self.dtmf_queue[target];
    } else {
        self.sendDTMFRequest(self.dtmf_queue[target].shift(), target);
    }
};

PexRTC.prototype.sendFECCRequest = function (data, target) {
    var self = this;

    if (target == 'call') {
        self.sendRequest(self.breakout_prefix + 'participants/' + self.uuid + '/calls/' + self.call.call_uuid + '/fecc', data, function () {
            self.feccSent(target);
        });
    } else {
        self.sendRequest(self.breakout_prefix + 'participants/' + target + '/fecc', data, function () {
            self.feccSent(target);
        });
    }
};

PexRTC.prototype.sendFECC = function (action, axis, direction, target, timeout) {
    var self = this;

    target = target || 'call';
    if (target == 'call' && !self.call) {
        return false;
    }

    data = { action: action, movement: [{ axis: axis, direction: direction }], timeout: timeout };

    if (self.direct_media) {
        if (target == self.uuid) {
            if (self.onFECC && self.fecc_supported) {
                self.onFECC(data);
            }
        } else if (self.call) {
            self.call.sendDataChannel('fecc', data);
        }
    } else {
        if (self.fecc_queue[target] === undefined) {
            self.fecc_queue[target] = [];
            self.sendFECCRequest(data, target);
        } else {
            self.fecc_queue[target].push(data);
        }
    }
};

PexRTC.prototype.feccSent = function (target) {
    var self = this;

    if (self.fecc_queue[target].length === 0) {
        delete self.fecc_queue[target];
    } else {
        self.sendFECCRequest(self.fecc_queue[target].shift(), target);
    }
};

PexRTC.prototype.holdresume = function (setting) {
    var self = this;

    if (self.onHoldResume) {
        self.onHoldResume(setting);
    }
};

PexRTC.prototype.getRosterList = function () {
    var self = this;

    var roster = [];
    for (var uuid in self.rosterList) {
        roster.push(self.rosterList[uuid]);
    }
    return roster;
};

PexRTC.prototype.processRoster = function (msg) {
    var self = this;

    if (self.onRosterList) {
        self.onRosterList(msg.roster);
    }
};

PexRTC.prototype.getPresentationURL = function () {
    var self = this;
    var url = null;
    var presentation_image = 'presentation.jpeg';
    if (self.presentation_event_id) {
        if (self.png_presentation) {
            url =
                'https://' +
                self.node +
                '/api/client/v2/conferences/' +
                self.conference_uri +
                '/presentation.png?id=' +
                self.presentation_event_id +
                '&token=' +
                self.token;
        } else {
            if (!self.bandwidth_in || self.bandwidth_in > 384) {
                presentation_image = 'presentation_high.jpeg';
            }
            url =
                'https://' +
                self.node +
                '/api/client/v2/conferences/' +
                self.conference_uri +
                '/' +
                presentation_image +
                '?id=' +
                self.presentation_event_id +
                '&token=' +
                self.token;
        }
    }
    return url;
};

PexRTC.prototype.getPresentation = function () {
    var self = this;

    self.presentation_requested = true;
    if (self.onPresentationConnected && self.call) {
        var presentation_stream = self.call.getPresentation();
        if (self.return_media_stream) {
            setTimeout(function () {
                self.onPresentationConnected(presentation_stream);
            }, 1000);
        } else {
            var url = window.URL || window.webkitURL || window.mozURL;
            self.onPresentationConnected(url.createObjectURL(presentation_stream));
        }
    } else {
        self.addCall('presentation');
    }
};

PexRTC.prototype.stopPresentation = function () {
    var self = this;

    // No longer used. Future could maybe toggle inactive/recv on preso channel.
};

PexRTC.prototype.processPresentation = function (msg) {
    var self = this;

    if (msg.status == 'newframe') {
        if (self.onPresentationReload && !self.onHold) {
            self.onPresentationReload(self.getPresentationURL());
        }
    } else {
        if (self.onPresentation) {
            if (msg.status == 'start') {
                var presenter;
                if (msg.presenter_name !== '') {
                    presenter = msg.presenter_name + ' <' + msg.presenter_uri + '>';
                } else {
                    presenter = msg.presenter_uri;
                }
                if (self.call) {
                    self.call.present();
                }
                const isPresentationRevoked = msg.presenter_name === '' && msg.presenter_uri === '' && msg.presenter_uuid === '';
                if (!isPresentationRevoked) {
                    self.onPresentation(true, presenter, msg.presenter_uuid, msg.presenter_source);
                }
            } else if (msg.status == 'stop') {
                if (self.presentation_requested) {
                    self.onPresentationDisconnected(self.trans.ERROR_PRESENTATION_ENDED);
                }
                self.presentation_requested = false;
                self.onPresentation(false, null);
            }
        }
    }
};

PexRTC.prototype.moveToBreakout = function (breakout_uuid, breakout_name, is_retry) {
    var self = this;

    if (breakout_uuid != 'main' && !self.breakout_map[breakout_uuid]) {
        self.onLog('ERROR: Breakout UUID not found; not transferring');
        if (!is_retry) {
            self.onLog('Retrying in 2 seconds');
            setTimeout(function () {
                self.moveToBreakout(breakout_uuid, breakout_name, true);
            }, 1000);
        }
        return;
    }

    self.disconnectCall(true);

    if (self.onCallTransfer) {
        self.onCallTransfer(self.conference_uri);
    }

    self.bandwidth_in = self.orig_bandwidth_in;
    self.bandwidth_out = self.orig_bandwidth_out;

    var call_type = self.call_type;
    if (call_type == 'presentation' || call_type == 'screen') {
        call_type = 'none';
    }

    self.uuid = self.breakout_map[breakout_uuid];
    self.breakout_uuid = breakout_uuid;
    if (breakout_uuid == 'main') {
        self.breakout_prefix = '';
    } else {
        self.breakout_prefix = 'breakouts/' + breakout_uuid + '/';
    }

    for (var uuid in self.rosterList) {
        var old_uuid = { uuid: uuid };
        if (self.onParticipantDelete) {
            self.onParticipantDelete(old_uuid);
        }
    }
    self.rosterList = self.breakout_roster[breakout_uuid];
    for (var uuid in self.rosterList) {
        if (self.onParticipantCreate) {
            self.onParticipantCreate(self.rosterList[uuid]);
        }
    }

    if (self.state != 'DISCONNECTING') {
        setTimeout(function () {
            self.addCall(self.call_type);
        }, 500);
    }
};

PexRTC.prototype.createBreakout = function (name, duration, end_action, participants, guests_allowed_to_leave, cb) {
    var self = this;

    var params = { name: name };
    if (duration) {
        params['duration'] = duration;
    }
    if (end_action) {
        params['end_action'] = end_action;
    }
    if (participants) {
        params['participants'] = participants;
    }
    if (guests_allowed_to_leave) {
        params['guests_allowed_to_leave'] = guests_allowed_to_leave;
    }

    self.sendRequest('breakouts', params, cb);
};

PexRTC.prototype.moveParticipantsFromBreakout = function (from_breakout, to_breakout, participants) {
    var self = this;

    var params = { breakout_uuid: to_breakout, participants: participants };
    self.sendRequest('breakouts/' + from_breakout + '/participants/breakout', params);
};

PexRTC.prototype.closeBreakout = function (breakout_uuid) {
    var self = this;

    self.sendRequest('breakouts/' + breakout_uuid + '/disconnect');
};

PexRTC.prototype.setBreakoutHand = function (setting) {
    var self = this;

    var command = setting ? 'breakoutbuzz' : 'clearbreakoutbuzz';
    self.sendRequest(self.breakout_prefix + command);
};

PexRTC.prototype.leaveBreakout = function () {
    var self = this;

    self.sendRequest('leavebreakout');
};

PexRTC.prototype.processBreakoutEvent = function (msg) {
    var self = this;

    if (msg.event == 'conference_update') {
        if (!self.breakout_buzz[msg.breakout_uuid] || msg.data.breakoutbuzz.time > self.breakout_buzz[msg.breakout_uuid]) {
            self.breakout_buzz[msg.breakout_uuid] = msg.data.breakoutbuzz.time;
            if (self.onBreakoutHelp) {
                self.onBreakoutHelp(msg.breakout_uuid, true);
            }
        } else if (self.breakout_buzz[msg.breakout_uuid] && msg.data.breakoutbuzz.time == 0) {
            delete self.breakout_buzz[msg.breakout_uuid];
            if (self.onBreakoutHelp) {
                self.onBreakoutHelp(msg.breakout_uuid, false);
            }
        }
    }

    if (msg.breakout_uuid == self.breakout_uuid || msg.event.startsWith('participant')) {
        self.processEvent(msg.event, msg.data, msg.breakout_uuid);
    } else if (self.onBreakoutUpdate && msg.event == 'conference_update') {
        self.onBreakoutUpdate(msg.breakout_uuid, msg.event, msg.data);
    }
};

PexRTC.prototype.processRefer = function (msg) {
    var self = this;

    self.disconnect('Call transferred', true);
    self.state = 'IDLE';

    if (self.onCallTransfer) {
        self.onCallTransfer(msg.alias);
    }

    self.oneTimeToken = msg.token;

    self.bandwidth_in = self.orig_bandwidth_in;
    self.bandwidth_out = self.orig_bandwidth_out;

    var call_type = self.call_type;
    if (call_type == 'presentation' || call_type == 'screen') {
        call_type = 'none';
    }

    if (self.state != 'DISCONNECTING') {
        setTimeout(function () {
            self.makeCall(self.node, msg.alias, self.display_name, undefined, call_type);
        }, 500);
    }
};

PexRTC.prototype.dataChannelMessage = function (e) {
    var self = this;

    var msg = JSON.parse(e.data);
    if (msg.type != 'image') {
        self.onLog('dataChannel', msg);
    }

    if (msg.type == 'message') {
        if (msg.body.type == 'text/plain' && self.onChatMessage) {
            self.onChatMessage(msg.body);
        } else if (self.onApplicationMessage) {
            self.onApplicationMessage(msg.body);
        }
    } else if (msg.type == 'fecc') {
        if (self.onFECC && self.fecc_supported) {
            self.onFECC(msg.body);
        }
    } else if (msg.type == 'image') {
        self.gotImageChunk(msg.body);
    }
};

PexRTC.prototype.gotImageChunk = function (msg) {
    var self = this;

    self.onLog('Adding image fragment', msg.fragment, msg.data.length);
    self.imageData += msg.data;
    if (msg.fragment == msg.total) {
        self.onPresentationReload(self.imageData);
        self.imageData = '';
    }
};

PexRTC.prototype.processConferenceUpdate = function (msg) {
    var self = this;

    self.live_captions_available = msg.live_captions_available;
    self.direct_media = msg.direct_media;
    if (self.onConferenceUpdate) {
        self.onConferenceUpdate(msg);
    }
};

PexRTC.prototype.disconnect = function (reason, referral) {
    var self = this;

    self.state = 'DISCONNECTING';
    self.onLog('Disconnecting...');
    self.conference_extension = null;

    if (self.token_refresh) {
        clearInterval(self.token_refresh);
        self.token_refresh = null;
    }

    if (self.screen_http) {
        self.screen_http.disconnect();
    }

    self.present(null);
    if (referral) {
        self.disconnectCall(true);
    } else {
        self.disconnectCall();
    }
    self.stopPresentation();

    if (self.event_source) {
        self.event_source.close();
        self.event_source = null;
    }
    if (self.token) {
        var params = {};
        if (self.error) {
            params['error'] = self.error;
        }
        if (reason) {
            params['reason'] = reason;
        }
        if (navigator.sendBeacon && !referral) {
            var beaconUrl =
                'https://' + self.node + '/api/client/v2/conferences/' + self.conference_uri + '/release_token?token=' + self.token;
            if (self.chrome_ver > 59 && self.chrome_ver < 81) {
                navigator.sendBeacon(beaconUrl, JSON.stringify(params));
            } else {
                var beaconBlob = new Blob([JSON.stringify(params)], { type: 'application/json' });
                navigator.sendBeacon(beaconUrl, beaconBlob);
            }
        } else {
            self.sendRequest('release_token', params, false);
        }
        self.token = null;
    }
};

PexRTC.prototype.sendPresentationImage = function (file) {
    var self = this;
    if (self.screen_http) {
        return self.screen_http.sendPresentationImageFile(file);
    }
};

PexRTC.prototype.getMediaStatistics = function () {
    var self = this;

    return self.call ? self.call.getMediaStatistics() : {};
};

PexRTC.prototype.getSecureCheckCode = function () {
    var self = this;

    return self.call ? self.call.secure_check_code : '';
};

PexRTC.prototype.getVersion = function () {
    var self = this;

    if (self.version) {
        return self.version.version_id + ' (' + self.version.pseudo_version + ')';
    } else {
        return 'Unknown';
    }
};

function PexRTCStreamStatistics(parent, type) {
    var self = this;

    self.lastPackets = 0;
    self.lastLost = 0;
    self.lastBytes = 0;
    self.lastTimestamp = null;
    self.recentTotal = 0;
    self.recentLost = 0;
    self.qualityLimitationReason = 'none';
    self.samples = [];
    self.rawInfo = {};
    self.info = {};
    self.parent = parent;
    self.streamType = type;
}

PexRTCStreamStatistics.prototype.getStats = function () {
    var self = this;
    return self.info;
};

PexRTCStreamStatistics.prototype.updateBWEStats = function (result) {
    var self = this;
    var configuredBitrate = result.stat('googTargetEncBitrate') / 1000;
    self.rawInfo['configured-bitrate'] = configuredBitrate;
    self.info['configured-bitrate'] = configuredBitrate.toFixed(1) + 'kbps';
};

PexRTCStreamStatistics.prototype.updatePacketLossStats = function (currentPackets, currentLost) {
    var self = this;

    var currentTotal = currentPackets + currentLost;
    var percentageLost = currentTotal === 0 ? 0 : (currentLost / currentTotal) * 100;
    self.rawInfo['percentage-lost'] = percentageLost;
    self.info['percentage-lost'] = percentageLost.toFixed(1) + '%';

    var sample;
    if (self.samples.length >= 60) {
        sample = self.samples.shift();
        self.recentLost -= sample[0];
        self.recentTotal -= sample[1];
    }
    sample = [Math.max(currentLost - self.lastLost, 0), currentTotal - (self.lastPackets + self.lastLost)];
    self.recentLost += sample[0];
    self.recentTotal += sample[1];
    self.samples.push(sample);

    var percentageLostRecent = self.recentTotal === 0 ? 0 : (self.recentLost / self.recentTotal) * 100;
    self.rawInfo['percentage-lost-recent'] = percentageLostRecent;
    self.info['percentage-lost-recent'] = percentageLostRecent.toFixed(1) + '%';
};

PexRTCStreamStatistics.prototype.resetPacketLossStats = function () {
    var self = this;

    self.recentTotal = 0;
    self.recentLost = 0;
    self.samples = [];
};

PexRTCStreamStatistics.prototype.updateRxStats = function (result) {
    var self = this;
    self.info['packets-received'] = result.stat('packetsReceived');
    self.info['packets-lost'] = result.stat('packetsLost');
    self.info['percentage-lost'] = 0;
    self.info['percentage-lost-recent'] = 0;
    self.info['bitrate'] = 'unavailable';

    var packetsReceived = parseInt(self.info['packets-received']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    if (packetsReceived >= self.lastPackets) {
        self.updatePacketLossStats(packetsReceived, packetsLost);

        if (self.lastTimestamp > 0) {
            var kbps = Math.round(((result.stat('bytesReceived') - self.lastBytes) * 8) / (result.timestamp - self.lastTimestamp));
            self.rawInfo['bitrate'] = kbps;
            self.info['bitrate'] = kbps + 'kbps';
        }

        if (result.stat('googFrameHeightReceived'))
            self.info['resolution'] = result.stat('googFrameWidthReceived') + 'x' + result.stat('googFrameHeightReceived');

        if (result.stat('googCodecName')) self.info['codec'] = result.stat('googCodecName');

        if (result.stat('googDecodeMs')) self.info['decode-delay'] = result.stat('googDecodeMs') + 'ms';
    } else {
        self.resetPacketLossStats();
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.stat('bytesReceived');
    self.lastPackets = packetsReceived;
    self.lastLost = packetsLost;
};

PexRTCStreamStatistics.prototype.updateTxStats = function (result) {
    var self = this;

    self.info['packets-sent'] = result.stat('packetsSent');
    self.info['packets-lost'] = result.stat('packetsLost');
    self.info['percentage-lost'] = 0;
    self.info['percentage-lost-recent'] = 0;
    self.info['bitrate'] = 'unavailable';

    var packetsSent = parseInt(self.info['packets-sent']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    if (packetsSent >= self.lastPackets) {
        self.updatePacketLossStats(packetsSent, packetsLost);

        if (self.lastTimestamp > 0) {
            var kbps = Math.round(((result.stat('bytesSent') - self.lastBytes) * 8) / (result.timestamp - self.lastTimestamp));
            self.rawInfo['bitrate'] = kbps;
            self.info['bitrate'] = kbps + 'kbps';
        }

        if (result.stat('googFrameHeightSent')) {
            self.info['resolution'] = result.stat('googFrameWidthSent') + 'x' + result.stat('googFrameHeightSent');
        }

        if (result.stat('googCodecName')) {
            self.info['codec'] = result.stat('googCodecName');
        }
    } else {
        self.resetPacketLossStats();
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.stat('bytesSent');
    self.lastPackets = packetsSent;
    self.lastLost = packetsLost;
};

PexRTCStreamStatistics.prototype.updateRxStatsNew = function (result) {
    var self = this;

    self.info['packets-received'] = result.packetsReceived;
    self.info['packets-lost'] = result.packetsLost;
    if (result.mediaType == 'video') {
        self.info['framerate'] = result.framesPerSecond;
    }
    self.info['percentage-lost'] = 0;
    self.rawInfo['jitter'] = result.jitter;
    if (result.jitter) {
        self.info['jitter'] = (result.jitter * 1000).toFixed(2) + 'ms';
    }
    self.info['bitrate'] = 'unavailable';

    if (self.parent.codecs.hasOwnProperty(result['codecId'])) {
        var codec = self.parent.codecs[result['codecId']].split('/');
        self.info['codec'] = codec[codec.length - 1];
    }
    if (result.frameWidth) {
        self.info['resolution'] = result.frameWidth + 'x' + result.frameHeight;
    } else if (self.parent.resolutions.hasOwnProperty(result['trackId'])) {
        self.info['resolution'] = self.parent.resolutions[result['trackId']];
    }

    var packetsReceived = parseInt(self.info['packets-received']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    if (packetsReceived >= self.lastPackets) {
        self.updatePacketLossStats(packetsReceived, packetsLost);

        if (self.lastTimestamp > 0) {
            var tsDiff = result.timestamp - self.lastTimestamp;
            if (tsDiff > 500000) {
                // Safari is in milliseconds
                tsDiff = tsDiff / 1000;
            }
            var kbps = Math.round(((result.bytesReceived - self.lastBytes) * 8) / tsDiff);
            self.rawInfo['bitrate'] = kbps;
            self.info['bitrate'] = kbps + 'kbps';
        }
    } else {
        self.resetPacketLossStats();
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.bytesReceived;
    self.lastPackets = packetsReceived;
    self.lastLost = packetsLost;
};

PexRTCStreamStatistics.prototype.updateTxStatsNew = function (result) {
    var self = this;

    self.info['packets-sent'] = result.packetsSent;
    if (result.mediaType == 'video') {
        self.info['framerate'] = result.framesPerSecond;
    }
    self.info['bitrate'] = 'unavailable';

    if (self.parent.codecs.hasOwnProperty(result['codecId'])) {
        var codec = self.parent.codecs[result['codecId']].split('/');
        self.info['codec'] = codec[codec.length - 1];
    }
    if (result.frameWidth) {
        self.info['resolution'] = result.frameWidth + 'x' + result.frameHeight;
    } else if (self.parent.resolutions.hasOwnProperty(result['trackId'])) {
        self.info['resolution'] = self.parent.resolutions[result['trackId']];
    }

    var packetsSent = parseInt(self.info['packets-sent']) | 0;

    if (self.lastTimestamp > 0) {
        var tsDiff = result.timestamp - self.lastTimestamp;
        if (tsDiff > 500000) {
            tsDiff = tsDiff / 1000;
        }
        var kbps = Math.round(((result.bytesSent - self.lastBytes) * 8) / tsDiff);
        self.rawInfo['bitrate'] = kbps;
        self.info['bitrate'] = kbps + 'kbps';
    }

    self.lastTimestamp = result.timestamp;
    self.lastBytes = result.bytesSent;

    if (result.qualityLimitationReason && self.qualityLimitationReason != result.qualityLimitationReason) {
        self.qualityLimitationReason = result.qualityLimitationReason;
        self.parent.parent.parent.onLog('Quality Limitation Changed', self.streamType, self.qualityLimitationReason);
        if (self.parent.parent.parent.onQualityLimitation) {
            self.parent.parent.parent.onQualityLimitation(self.streamType, self.qualityLimitationReason);
        }
    }
};

PexRTCStreamStatistics.prototype.updateRtcpTxStatsNew = function (result) {
    var self = this;

    self.info['packets-lost'] = result.packetsLost;
    self.rawInfo['jitter'] = result.jitter;
    if (result.jitter) {
        self.info['jitter'] = (result.jitter * 1000).toFixed(2) + 'ms';
    }

    var packetsSent = parseInt(self.info['packets-sent']) | 0;
    var packetsLost = parseInt(self.info['packets-lost']) | 0;

    if (packetsSent >= self.lastPackets) {
        self.updatePacketLossStats(packetsSent, packetsLost);
    } else {
        self.resetPacketLossStats();
    }

    self.lastPackets = packetsSent;
    self.lastLost = packetsLost;
};

function PexRTCStatistics(parent) {
    var self = this;

    self.parent = parent;
    self.codecs = {};
    self.resolutions = {};
    self.audio_out = new PexRTCStreamStatistics(self, 'audio');
    self.audio_in = new PexRTCStreamStatistics(self, 'audio');
    self.video_out = new PexRTCStreamStatistics(self, 'video');
    self.video_in = new PexRTCStreamStatistics(self, 'video');
    self.preso_out = new PexRTCStreamStatistics(self, 'presentation');
    self.preso_in = new PexRTCStreamStatistics(self, 'presentation');
}

PexRTCStatistics.prototype.updateStats = function (results) {
    var self = this;

    var audio_send = null;
    var audio_recv = null;
    var video_send = null;
    var video_recv = null;
    var preso_send = null;
    var preso_recv = null;

    for (var i = 0; i < results.length; ++i) {
        if (self.statIsOfType(results[i], 'audio', 'send')) audio_send = results[i];
        else if (self.statIsOfType(results[i], 'audio', 'recv')) audio_recv = results[i];
        else if (self.statIsOfType(results[i], 'video', 'send')) video_send = results[i];
        else if (self.statIsOfType(results[i], 'video', 'recv')) video_recv = results[i];
        else if (self.statIsOfType(results[i], 'preso', 'send')) preso_send = results[i];
        else if (self.statIsOfType(results[i], 'preso', 'recv')) preso_recv = results[i];
        else if (self.statIsBandwidthEstimation(results[i])) self.video_out.updateBWEStats(results[i]);
    }

    if (audio_send) self.audio_out.updateTxStats(audio_send);
    if (audio_recv) self.audio_in.updateRxStats(audio_recv);
    if (video_send) self.video_out.updateTxStats(video_send);
    if (video_recv) self.video_in.updateRxStats(video_recv);
    if (preso_send) self.preso_out.updateTxStats(preso_send);
    if (preso_recv) self.preso_in.updateRxStats(preso_recv);
};

PexRTCStatistics.prototype.updateStatsNew = function (results) {
    var self = this;

    var values = results.values();
    for (var val_i = values.next(); !val_i.done; val_i = values.next()) {
        var val = val_i.value;
        if (val.type == 'outbound-rtp' && self.getMediaType(val) == 'audio') self.audio_out.updateTxStatsNew(val);
        else if (val.type == 'remote-inbound-rtp' && self.getMediaType(val) == 'audio') self.audio_out.updateRtcpTxStatsNew(val);
        else if (val.type == 'inbound-rtp' && self.getMediaType(val) == 'audio') self.audio_in.updateRxStatsNew(val);
        else if (val.type == 'outbound-rtp' && self.getMediaType(val) == 'video') self.video_out.updateTxStatsNew(val);
        else if (val.type == 'remote-inbound-rtp' && self.getMediaType(val) == 'video') self.video_out.updateRtcpTxStatsNew(val);
        else if (val.type == 'inbound-rtp' && self.getMediaType(val) == 'video') self.video_in.updateRxStatsNew(val);
        else if (val.type == 'outbound-rtp' && self.getMediaType(val) == 'preso') self.preso_out.updateTxStatsNew(val);
        else if (val.type == 'remote-inbound-rtp' && self.getMediaType(val) == 'preso') self.preso_out.updateRtcpTxStatsNew(val);
        else if (val.type == 'inbound-rtp' && self.getMediaType(val) == 'preso') self.preso_in.updateRxStatsNew(val);
        else if (val.type == 'codec') self.codecs[val.id] = val.mimeType;
        else if (val.type == 'track' && val.frameWidth) self.resolutions[val.id] = val.frameWidth + 'x' + val.frameHeight;
    }
};

PexRTCStatistics.prototype.statIsBandwidthEstimation = function (result) {
    return result.type == 'VideoBwe';
};

PexRTCStatistics.prototype.statIsOfType = function (result, type, direction) {
    var self = this;
    return result.type == 'ssrc' && self.parent.ssrcs[result.stat('ssrc')] == type && result.id.search(direction) != -1;
};

PexRTCStatistics.prototype.getMediaType = function (val) {
    var self = this;

    if (val.mediaType == 'audio' || val.kind == 'audio') {
        return 'audio';
    } else if (val.mediaType == 'video' || val.kind == 'video') {
        if (val.hasOwnProperty('ssrc')) {
            return self.parent.ssrcs[val['ssrc']];
        } else if (val.hasOwnProperty('codecId')) {
            if (val.codecId.indexOf('RTCCodec_2') === 0) {
                return 'preso';
            } else {
                return 'video';
            }
        }
    }
};

PexRTCStatistics.prototype.getStats = function () {
    var self = this;
    return {
        outgoing: { audio: self.audio_out.getStats(), video: self.video_out.getStats(), presentation: self.preso_out.getStats() },
        incoming: { audio: self.audio_in.getStats(), video: self.video_in.getStats(), presentation: self.preso_in.getStats() }
    };
};

//For debug purposes
currentPexrtc = function () {
    return 'vodafone V36';
};
