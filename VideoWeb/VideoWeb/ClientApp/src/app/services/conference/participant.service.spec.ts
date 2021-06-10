import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Observable } from 'rxjs';
import { Participant } from 'src/app/shared/models/participant';
import { VideoWebService } from '../api/video-web.service';
import { ParticipantResponseVho } from '../clients/api-client';
import { ParticipantService } from './participant.service';

fdescribe('ParticipantService', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    let sut: ParticipantService;

    beforeEach(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebSerivce', ['getParticipantsByConferenceId']);

        sut = new ParticipantService(videoWebServiceSpy);
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    describe('getParticipants', () => {
        it('should return the participants from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses = [
                {
                    id: Guid.create().toString()
                } as ParticipantResponseVho,
                {
                    id: Guid.create().toString()
                } as ParticipantResponseVho
            ];

            videoWebServiceSpy.getParticipantsByConferenceId.and.resolveTo(participantResponses);

            // Act
            let result: Participant[];
            sut.getParticipants(conferenceId).subscribe(participants => (result = participants));
            flush();

            // Assert
            expect(videoWebServiceSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return an empty array if no particiapnts are returned from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses = [];

            videoWebServiceSpy.getParticipantsByConferenceId.and.resolveTo(participantResponses);

            // Act
            let result: Participant[];
            sut.getParticipants(conferenceId).subscribe(participants => (result = participants));
            flush();

            // Assert
            expect(videoWebServiceSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual([]);
        }));
    });

    describe('getPexipIdForParticipant', () => {});
});
