import { Injectable } from '@angular/core';
import { ApiClient, AudioRecordingStopResponse } from 'src/app/services/clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {

  constructor(private apiClient: ApiClient) {
  }

  stopAudioRecording(caseNumber: string, hearingId: string): Promise<AudioRecordingStopResponse> {
    return this.apiClient.stopAudioRecording(caseNumber, hearingId).toPromise();
  }
}
