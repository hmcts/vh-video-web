"use strict";

(function (scope) {

	var heartbeatFactoryInstance;

	var HeartbeatFactory = function (pexrtc, cmdurl, hearingId, participantId, token, delay, interval) {
		if (heartbeatFactoryInstance !== undefined) {
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
				}
		}

		var self = this;
		var beat = this.beat.bind(this);
		var interval = this.interval;
		setTimeout(function () {
			self.timer = setInterval(function () {
				beat();
			}, interval);
		}, this.delay)
	};

	HeartbeatFactory.prototype.kill = function() {
		console.log("Stopping heartbeat.");
		clearInterval(this.timer);
	}

	HeartbeatFactory.prototype.generateHeartbeat = function () {
		var now = new Date();
		var mediaStatistics = this.pexipAPI.getMediaStatistics();
		this.padEmptyMediaStatistics(mediaStatistics);
		this.updateLookback(mediaStatistics);
		mediaStatistics.outgoing.audio["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.outgoing.audio).toFixed(1) + "%";
		mediaStatistics.outgoing.video["percentage-lost-recent"] = this.getRecentPercentageLost(this.lookbackValues.outgoing.video).toFixed(1) + "%";
		if (window.updateCallStatistics && typeof window.updateCallStatistics != undefined) {
			window.updateCallStatistics(mediaStatistics);
		}
		return {
			sequence_id: this.sequence++,
			timestamp: now.toISOString(),
			elapsed_time: now - this.startTime,
			hearing_id: this.hearingId,
			participant_id: this.participantId.split(";")[2],
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
	};


	HeartbeatFactory.prototype.getRecentPercentageLost = function (medium) {
		var totalSent = medium.packetsSent[0] - medium.packetsSent[medium.packetsSent.length - 1];
		if (totalSent === 0) {
			return 0;
		}
		var totalLost = medium.packetsLost[0] - medium.packetsLost[medium.packetsLost.length - 1];
		//console.log("packetratio : " + totalLost + " over " + totalSent);
		return (totalLost / (totalLost + totalSent)) * 100;
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
			mediaStatistics.outgoing.audio["packets-lost"]="";
		}

		if (!mediaStatistics.outgoing.video.hasOwnProperty("packets-lost")) {
			mediaStatistics.outgoing.video["packets-lost"]="";
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

	scope.HeartbeatFactory = HeartbeatFactory;

})(window);
