import { Injectable } from '@angular/core';
import { ApiClient } from 'src/app/services/clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {

  constructor(private apiClient: ApiClient) {
  }

  stopAudioRecording(hearingId: string): Promise<void> {
    return this.apiClient.stopAudioRecording(hearingId).toPromise();
  }
}
