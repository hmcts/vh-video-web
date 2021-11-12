import { TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { IConferenceParticipantsStatus, IParticipatRemoteMuteStatus } from '../models/conference-participants-status';

import { ParticipantRemoteMuteStoreService } from './participant-remote-mute-store.service';

describe('ParticipantRemoteMuteStoreService', () => {
    let service: ParticipantRemoteMuteStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ParticipantRemoteMuteStoreService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('updateRemoteMuteStatus', () => {
        it('should call patchState', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const isRemoteMuted = true;

            const patchStateSpy = spyOn(service, 'patchState');

            const expectedState = {};
            expectedState[participantId] = { isRemoteMuted: isRemoteMuted } as IParticipatRemoteMuteStatus;

            // Act
            service.updateRemoteMuteStatus(participantId, isRemoteMuted);

            // Assert
            expect(patchStateSpy).toHaveBeenCalledOnceWith(expectedState);
        });
    });

    describe('conferenceParticipantsStatus$', () => {
        it('returns state$', () => {
            // Arrange
            const expectedObservable = service.state$;

            // Act
            const state$ = service.conferenceParticipantsStatus$;

            // Assert
            expect(state$).toBe(expectedObservable);
        });
    });
});
