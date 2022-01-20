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
        it('should call updateRemoteMutePatchCallBack', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const isRemoteMuted = true;
            const updateRemoteMutePatchCallBackSpy = spyOn(service, 'updateRemoteMutePatchCallBack');
            // Act
            service.updateRemoteMuteStatus(participantId, isRemoteMuted);

            // Assert
            expect(updateRemoteMutePatchCallBackSpy).toHaveBeenCalledTimes(1);
        });

        it('updateRemoteMutePatchCallBack updates isRemoteMuted', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const expectedPexipId = '1234';
            const currentState = {};
            currentState[participantId] = {
                isRemoteMuted: false,
                isLocalAudioMuted: false,
                isLocalVideoMuted: false,
                pexipId: expectedPexipId
            } as IConferenceParticipantsStatus;

            const updatedState = service.updateRemoteMutePatchCallBack(participantId, true, currentState);

            expect(updatedState[participantId].isRemoteMuted).toBe(true);
            expect(updatedState[participantId].isLocalAudioMuted).toBe(false);
            expect(updatedState[participantId].isLocalVideoMuted).toBe(false);
            expect(updatedState[participantId].pexipId).toBe(expectedPexipId);
        });
    });

    describe('updateLocalMuteStatus', () => {
        it('should call updateRemoteMutePatchCallBack', () => {
            // Arrange
            const participantId = Guid.create().toString();
            const updateRemoteMutePatchCallBackSpy = spyOn(service, 'updateLocalMutePatchCallBack');
            // Act
            service.updateLocalMuteStatus(participantId, false, false);

            // Assert
            expect(updateRemoteMutePatchCallBackSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateLocalMutePatchCallBack', () => {
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
            const expectedPexipId = '1234';

            const expectedState = {};
            expectedState[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted
            } as IParticipatRemoteMuteStatus;

            const currentState = {};
            currentState[participantId] = {
                isRemoteMuted: false,
                isLocalAudioMuted: false,
                isLocalVideoMuted: false,
                pexipId: expectedPexipId
            } as IConferenceParticipantsStatus;

            // Act
            const updatedState = service.updateLocalMutePatchCallBack(participantId, isLocalAudioMuted, isLocalVideoMuted, currentState);

            // Assert
            // expect(patchStateSpy).toHaveBeenCalledOnceWith(expectedState);
            // expect(patchStateSpy).toHaveBeenCalledTimes(1);
            expect(updatedState[participantId].isRemoteMuted).toBe(false);
            expect(updatedState[participantId].isLocalAudioMuted).toBe(isLocalAudioMuted);
            expect(updatedState[participantId].isLocalVideoMuted).toBe(isLocalVideoMuted);
            expect(updatedState[participantId].pexipId).toBe(expectedPexipId);
        };
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
