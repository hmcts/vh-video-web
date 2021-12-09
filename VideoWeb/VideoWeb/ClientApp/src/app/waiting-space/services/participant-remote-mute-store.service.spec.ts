import { TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { IConferenceParticipantsStatus, IParticipatRemoteMuteStatus } from '../models/conference-participants-status';
import { testDataDevice } from '../waiting-room-shared/tests/waiting-room-base-setup';

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

    describe('updateLocalMuteStatus', () => {
        it('should call patchState isLocalAudioMuted is true', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = false;

            commonActAndAssert(participantId, isLocalAudioMuted, isLocalVideoMuted);
        });

        it('should call patchState isLocalAudioMuted is false', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const isLocalAudioMuted = false;
            const isLocalVideoMuted = false;

            commonActAndAssert(participantId, isLocalAudioMuted, isLocalVideoMuted);
        });
        it('should call patchState isLocalVideoMuted is true', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const isLocalAudioMuted = false;
            const isLocalVideoMuted = true;

            commonActAndAssert(participantId, isLocalAudioMuted, isLocalVideoMuted);
        });

        const commonActAndAssert = (participantId: string, isLocalAudioMuted: boolean, isLocalVideoMuted: boolean) => {
            const patchStateSpy = spyOn(service, 'patchState');

            const expectedState = {};
            expectedState[participantId] = { isLocalAudioMuted: isLocalAudioMuted, isLocalVideoMuted: isLocalVideoMuted } as IParticipatRemoteMuteStatus;

            // Act
            service.updateLocalMuteStatus(participantId, isLocalAudioMuted, isLocalVideoMuted);

            // Assert
            expect(patchStateSpy).toHaveBeenCalledOnceWith(expectedState);
        }

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
