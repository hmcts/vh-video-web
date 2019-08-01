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

        var beat = this.beat.bind(this);
        var interval = this.interval;
        setTimeout(function () {
            setInterval(function () {
                beat();
            }, interval);
        }, this.delay)
    };

    HeartbeatFactory.prototype.generateHeartbeat = function () {
        var now = new Date();
        var mediaStatistics = this.pexipAPI.getMediaStatistics();
        if (Object.keys(mediaStatistics).length === 0) {
            mediaStatistics = this.getEmptyMediaStatistics();
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
        if (this.token !== "none")
        {
            request.headers.Authorization = `Bearer ${this.token}`;
        }

        fetch(url, request)
            .then(function (response) {
                    console.log(response.json());
                }
            );
    };

    HeartbeatFactory.prototype.beat = function () {
        var heartbeat = JSON.stringify(this.generateHeartbeat());
        console.debug(heartbeat);
        this.postHeartbeat(heartbeat);
    };

    HeartbeatFactory.prototype.getEmptyMediaStatistics = function () {
        var mediumStatistics = {
            "packets-sent": 0,
            "bitrate": "",
            "packets-lost": "",
            "percentage-lost": "",
            "percentage-lost-recent": ""
        };
        return {
            outgoing: {
                audio: mediumStatistics,
                video: mediumStatistics,
            },
            incoming: {
                audio: mediumStatistics,
                video: mediumStatistics
            },
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


