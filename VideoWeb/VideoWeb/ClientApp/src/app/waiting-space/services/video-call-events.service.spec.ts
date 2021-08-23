import { fakeAsync } from '@angular/core/testing';
import { ParticipantUpdated } from '../models/video-call-models';
import { VideoCallEventsService } from './video-call-events.service';

describe('VideoCallEventsService', () => {
    let sut: VideoCallEventsService;

    beforeEach(() => {
        sut = new VideoCallEventsService();
    });

    describe('participantUpdated', () => {
        it('should emit participantUpdated$ when handleParticipantUpdated is called', fakeAsync(() => {
            // Arrange
            const update = {} as ParticipantUpdated;

            // Act
            let result: ParticipantUpdated | null = null;
            sut.participantUpdated$.subscribe(participantUpdate => (result = participantUpdate));

            sut.handleParticipantUpdated(update);

            // Assert
            expect(result).toBeTruthy();
            expect(result).toBe(update);
        }));
    });
});
