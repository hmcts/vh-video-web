import {Heartbeat} from '../models/heartbeat';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeartbeatModelMapper {
  map(heartbeat: any) {
    const model = new Heartbeat();

    model.hearing_id = heartbeat.hearing_id;
    model.ConferenceId = heartbeat.hearing_id;

    return model;
  }
}
