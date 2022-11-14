import { Injectable } from '@angular/core';
import { ApiClient } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {
    constructor(private apiClient: ApiClient) {}

    getAudioStreamInfo(hearingId: string, wowzaSingleApp = true): Promise<boolean> {
        return this.apiClient.getAudioStreamInfo(hearingId, wowzaSingleApp).toPromise();
    }
}
