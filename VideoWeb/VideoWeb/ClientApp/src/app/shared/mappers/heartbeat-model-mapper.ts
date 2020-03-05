import {Heartbeat} from '../models/heartbeat';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeartbeatModelMapper {
  map(heartbeat: any) {
    const model = new Heartbeat();

    model.hearingId = heartbeat.hearing_id;
    model.participantId = heartbeat.participant_id;
    model.outgoingAudioPercentageLost = this.removePercent(heartbeat.media_statistics.outgoing.audio['percentage-lost']);

    return model;
  }

  private removePercent(statistic: string) {
    return statistic.replace('%', '');
  }
}
