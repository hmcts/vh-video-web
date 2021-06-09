import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  constructor() {

  }

  getPexipIdForParticipant(participantId : Guid | string) : string {
        throw new Error("Not Implemented");
  }
}
