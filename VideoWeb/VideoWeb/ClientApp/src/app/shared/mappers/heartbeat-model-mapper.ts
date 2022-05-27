import { Heartbeat } from '../models/heartbeat';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class HeartbeatModelMapper {
    map(heartbeat: any, browserName: string, browserVersion: string, os: string, osVersion: string) {
        const model = new Heartbeat();

        model.hearingId = heartbeat.hearing_id;
        model.participantId = heartbeat.participant_id;

        model.outgoingAudioPercentageLost = this.removePercent(heartbeat.media_statistics.outgoing.audio['percentage-lost']);
        model.outgoingAudioPercentageLostRecent = this.removePercent(heartbeat.media_statistics.outgoing.audio['percentage-lost-recent']);
        model.incomingAudioPercentageLost = this.removePercent(heartbeat.media_statistics.incoming.audio['percentage-lost']);
        model.incomingAudioPercentageLostRecent = this.removePercent(heartbeat.media_statistics.incoming.audio['percentage-lost-recent']);

        model.outgoingVideoPercentageLost = this.removePercent(heartbeat.media_statistics.outgoing.video['percentage-lost']);
        model.outgoingVideoPercentageLostRecent = this.removePercent(heartbeat.media_statistics.outgoing.video['percentage-lost-recent']);
        model.incomingVideoPercentageLost = this.removePercent(heartbeat.media_statistics.incoming.video['percentage-lost']);
        model.incomingVideoPercentageLostRecent = this.removePercent(heartbeat.media_statistics.incoming.video['percentage-lost-recent']);

        model.outgoingAudioPacketsLost = heartbeat.media_statistics.outgoing.audio['packets-lost'];
        model.outgoingAudioPacketSent = heartbeat.media_statistics.outgoing.audio['packets-sent'];
        model.outgoingAudioBitrate = heartbeat.media_statistics.outgoing.audio['bitrate'];
        model.outgoingAudioCodec = heartbeat.media_statistics.outgoing.audio['codec'];

        model.outgoingVideoPacketsLost = heartbeat.media_statistics.outgoing.video['packets-lost'];
        model.outgoingVideoPacketSent = heartbeat.media_statistics.outgoing.video['packets-sent'];
        model.outgoingVideoFramerate = heartbeat.media_statistics.outgoing.video['framerate'];
        model.outgoingVideoBitrate = heartbeat.media_statistics.outgoing.video['bitrate'];
        model.outgoingVideoCodec = heartbeat.media_statistics.outgoing.video['codec'];
        model.outgoingVideoResolution = heartbeat.media_statistics.outgoing.video['resolution'];

        model.incomingAudioPacketsLost = heartbeat.media_statistics.incoming.audio['packets-lost'];
        model.incomingAudioPacketReceived = heartbeat.media_statistics.incoming.audio['packets-received'];
        model.incomingAudioBitrate = heartbeat.media_statistics.incoming.audio['bitrate'];
        model.incomingAudioCodec = heartbeat.media_statistics.incoming.audio['codec'];

        model.incomingVideoPacketsLost = heartbeat.media_statistics.incoming.video['packets-lost'];
        model.incomingVideoPacketReceived = heartbeat.media_statistics.incoming.video['packets-received'];
        model.incomingVideoBitrate = heartbeat.media_statistics.incoming.video['bitrate'];
        model.incomingVideoCodec = heartbeat.media_statistics.incoming.video['codec'];
        model.incomingVideoResolution = heartbeat.media_statistics.incoming.video['resolution'];

        model.browserName = browserName;
        model.browserVersion = browserVersion;

        model.operatingSystem = os;
        model.operatingSystemVersion = osVersion;

        return model;
    }

    private removePercent(statistic: string) {
        const loss = statistic ? statistic.replace('%', '').trim() : '';
        return loss.length > 0 ? loss : '0';
    }
}
