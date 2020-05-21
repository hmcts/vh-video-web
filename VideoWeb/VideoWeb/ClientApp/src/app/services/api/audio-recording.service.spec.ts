import { AudioRecordingService } from './audio-recording.service';
import { ApiClient } from 'src/app/services/clients/api-client';
import { of } from 'rxjs';

describe('AudioRecordingService', () => {
    const apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['getAudioStreamInfo']);
    const service = new AudioRecordingService(apiClient);

    it('should call api endpoint to define if audio recording is working', () => {
        apiClient.getAudioStreamInfo.and.returnValue(of(true));

        service.getAudioStreamInfo('111111111');

        expect(apiClient.getAudioStreamInfo).toHaveBeenCalled();
    });

    it('should call api endpoint to delete audio recording applicaion', () => {
        apiClient.stopAudioRecording.and.returnValue(of());

        service.stopAudioRecording('111111111');

        expect(apiClient.stopAudioRecording).toHaveBeenCalled();
    });
});
