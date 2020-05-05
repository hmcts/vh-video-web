import { Injectable } from '@angular/core';
import { ApiClient, AudioStreamInfoResponse } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {

    constructor(private apiClient: ApiClient) {
    }

    getAudioStreamInfo(hearingId: string): Promise<AudioStreamInfoResponse> {
        return this.apiClient.getAudioStreamInfo(hearingId).toPromise();
    }
}
