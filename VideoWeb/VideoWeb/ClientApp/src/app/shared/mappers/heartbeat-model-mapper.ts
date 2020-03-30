import {Heartbeat} from '../models/heartbeat';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeartbeatModelMapper {
  map(heartbeat: any, browserName: string, browserVersion: string) {
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

    model.browserName = browserName;
    model.browserVersion = browserVersion;

    return model;
  }

  private removePercent(statistic: string) {
    const loss = statistic ? statistic.replace('%', '').trim() : '';
    return loss.length > 0 ? loss : '0';
  }
}
