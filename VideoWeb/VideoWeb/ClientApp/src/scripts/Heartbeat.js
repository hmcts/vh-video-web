"use strict";

(function (scope) {
  var heartbeatFactoryInstance;

  var HeartbeatFactory = function (pexrtc, cmdurl, hearingId, participantId, token, delay, interval) {
    if (heartbeatFactoryInstance !== undefined) {
      heartbeatFactoryInstance.revive();
      return heartbeatFactoryInstance;
    } else {
      heartbeatFactoryInstance = this;
    }
    this.pexipAPI = pexrtc;
    this.cmdurl = cmdurl;
    this.interval = interval || 5000;
    this.delay = delay || 15000;
    this.token = token || "none";
    this.sequence = 0;
    this.startTime = new Date();
    this.sessionId = generateUID(16);
    this.hearingId = hearingId;
    this.participantId = participantId;
    this.lookbackPeriodMS = 60000;
    this.lookbackSlices = (this.lookbackPeriodMS / this.interval) + 1;
    this.lookbackValues = {
      outgoing:
      {
        audio: {
          packetsSent: [0],
          packetsLost: [0],
        },
        video: {
          packetsSent: [0],
          packetsLost: [0],
        }
      },
      incoming:
      {
        audio: {
          packetsSent: [0],
          packetsLost: [0],
        },
        video: {
          packetsSent: [0],
          packetsLost: [0],
        }
      }
    };
    this.timer = null;
    this.postponer = null;

    this.revive();
  };

  HeartbeatFactory.prototype.kill = function () {
    //console.warn("HBF Attempting to clear timer with id : " + this.timer);
    if (this.postponer != null || this.timer != null) {
      console.log("Stopping heartbeat.");
      clearTimeout(this.postponer);
      clearInterval(this.timer);
      this.postponer = null;
      this.timer = null;
    } else {
      console.warn("Can not kill heartbeat.");
    }
  };

  HeartbeatFactory.prototype.revive = function () {

    if (this.timer == null && this.postponer == null) {
      console.log("Starting heartbeat.");
      var self = this;
      var beat = this.beat.bind(this);
      var interval = this.interval;
      this.postponer = setTimeout(function () {
        self.timer = setInterval(function () {
          //console.warn("Initiating heartbeat with timer id : " + self.timer);
          beat();
        }, interval);
        //console.warn("HBF Created timer with id : " + self.timer);
      }, this.delay);

    } else {
      console.warn("Heartbeat already active.");
    }
  };

  HeartbeatFactory.prototype.generateHeartbeat = function () {
    var now = new Date();
    var mediaStatistics = this.pexipAPI.getMediaStatistics();
    this.padEmptyMediaStatistics(mediaStatistics);
    this.updateLookback(mediaStatistics);
    mediaStatistics.outgoing.audio["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.outgoing.audio).toFixed(1) + "%";
    mediaStatistics.outgoing.video["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.outgoing.video).toFixed(1) + "%";
    mediaStatistics.incoming.audio["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.incoming.audio).toFixed(1) + "%";
    mediaStatistics.incoming.video["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.incoming.video).toFixed(1) + "%";
    if (window.updateCallStatistics && typeof window.updateCallStatistics != undefined) {
      window.updateCallStatistics(mediaStatistics);
    }
    return {
      unique_id: generateUUIDv4(),
      sequence_id: this.sequence++,
      timestamp: now.toISOString(),
      elapsed_time: now - this.startTime,
      hearing_id: this.hearingId,
      participant_id: this.participantId,
      session_id: this.sessionId,
      media_statistics: mediaStatistics
    }

  };

  HeartbeatFactory.prototype.updateLookback = function (mediaStatistics) {
    var self = this;
    var updateLookbackMedium = function (currentArray, newValue) {
      if (currentArray.length >= self.lookbackSlices) {
        currentArray.pop();
      }
      var newInt = parseInt(newValue);
      if (isNaN(newInt)) {
        currentArray.unshift(0);
      } else {
        currentArray.unshift(newValue);
      }
    };
    updateLookbackMedium(this.lookbackValues.outgoing.audio.packetsSent, mediaStatistics.outgoing.audio["packets-sent"]);
    updateLookbackMedium(this.lookbackValues.outgoing.audio.packetsLost, mediaStatistics.outgoing.audio["packets-lost"]);
    updateLookbackMedium(this.lookbackValues.outgoing.video.packetsSent, mediaStatistics.outgoing.video["packets-sent"]);
    updateLookbackMedium(this.lookbackValues.outgoing.video.packetsLost, mediaStatistics.outgoing.video["packets-lost"]);

    updateLookbackMedium(this.lookbackValues.incoming.audio.packetsSent, mediaStatistics.incoming.audio["packets-received"]);
    updateLookbackMedium(this.lookbackValues.incoming.audio.packetsLost, mediaStatistics.incoming.audio["packets-lost"]);
    updateLookbackMedium(this.lookbackValues.incoming.video.packetsSent, mediaStatistics.incoming.video["packets-received"]);
    updateLookbackMedium(this.lookbackValues.incoming.video.packetsLost, mediaStatistics.incoming.video["packets-lost"]);
  };


  HeartbeatFactory.prototype.getRecentPercentageLost = function (medium) {
    var totalSent = medium.packetsSent[0] - medium.packetsSent[medium.packetsSent.length - 1];
    if (totalSent === 0) {
      return 0;
    }
    this.correctForCorruptedPacketsLostValues(medium);
    var totalLost = medium.packetsLost[0] - medium.packetsLost[medium.packetsLost.length - 1];
    //console.log("packetratio : " + totalLost + " over " + totalSent);
    return (totalLost / (totalLost + totalSent)) * 100;
  };

  HeartbeatFactory.prototype.correctForCorruptedPacketsLostValues = function (medium) {
    if (medium.packetsLost.length > 1 && medium.packetsLost[0] < medium.packetsLost[1]) {
      var buffer = medium.packetsLost[1];
      for (var i = 1; i < medium.packetsLost.length; i++) {
        medium.packetsLost[i] = medium.packetsLost[i] - buffer;
      }
    }
  };

  HeartbeatFactory.prototype.postHeartbeat = function (heartbeat) {
    console.log("HEARTBEAT : " + heartbeat);
    var url = this.cmdurl + "/heartbeat";
    console.log("SENDING URL " + url);
    var request = {
      headers: {
        "content-type": "application/json; charset=UTF-8"
      },
      method: "POST",
      body: heartbeat
    };
    if (this.token !== "none") {
      request.headers.Authorization = this.token;
    }

    fetch(url, request)
      .then(function (response) {
        console.log(response.json());
      }
      );
  };

  HeartbeatFactory.prototype.beat = function () {
    var heartbeat = JSON.stringify(this.generateHeartbeat());
    //console.debug(heartbeat);
    this.postHeartbeat(heartbeat);
  };

  HeartbeatFactory.prototype.padEmptyMediaStatistics = function (mediaStatistics) {
    var mediumStatistics = {
      "packets-sent": 0,
      "bitrate": "",
      "packets-lost": "",
      "percentage-lost": "",
      "percentage-lost-recent": ""
    };

    if (!mediaStatistics.hasOwnProperty("outgoing")) {
      mediaStatistics.outgoing = {
        audio: mediumStatistics,
        video: mediumStatistics,
      };
    }

    if (!mediaStatistics.outgoing.audio.hasOwnProperty("packets-lost")) {
      mediaStatistics.outgoing.audio["packets-lost"] = "";
    }

    if (!mediaStatistics.outgoing.video.hasOwnProperty("packets-lost")) {
      mediaStatistics.outgoing.video["packets-lost"] = "";
    }

    if (!mediaStatistics.hasOwnProperty("incoming")) {
      mediaStatistics.incoming = {
        audio: mediumStatistics,
        video: mediumStatistics,
      };
    }
  };

  function generateUID(length) {
    var randomString = "";
    var uidLookup = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (length >= 16) {
      randomString = Date.now().toString(36);
    }
    for (var i = randomString.length; i < length; i++) {
      randomString += uidLookup[Math.floor(Math.random() * uidLookup.length)];
    }
    return randomString;
  }

  function generateUUIDv4() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  scope.HeartbeatFactory = HeartbeatFactory;

})(window);
