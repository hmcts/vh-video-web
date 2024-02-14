import { Injectable } from '@angular/core';
import { ApiClient } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {
    constructor(private apiClient: ApiClient) {}

    getAudioStreamInfo(audioStream: string): Promise<boolean> {
        return this.apiClient.getAudioStreamInfo(audioStream).toPromise();
    }
}
