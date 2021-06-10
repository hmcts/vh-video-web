import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { IHttpRequestResult } from 'src/app/shared/http-request-result/http-request-result';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ApiClient, ParticipantForUserResponse, ParticipantStatus, Role } from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ParticipantService } from './participant.service';

fdescribe('ParticipantService', () => {
    const participantOneId = Guid.create().toString();
    const participantOne = new ParticipantForUserResponse({
        id: participantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpreter',
        role: Role.Individual,
        representee: null,
        case_type_group: 'applicant',
        tiled_display_name: `CIVILIAN;Interpreter;${participantOneId}`,
        hearing_role: HearingRole.INTERPRETER,
        first_name: 'Interpreter',
        last_name: 'Doe',
        linked_participants: []
    });

    const participantTwoId = Guid.create().toString();
    const participantTwo = new ParticipantForUserResponse({
        id: participantTwoId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpretee',
        role: Role.Individual,
        representee: null,
        case_type_group: 'applicant',
        tiled_display_name: `CIVILIAN;Interpretee;${participantTwoId}`,
        hearing_role: HearingRole.LITIGANT_IN_PERSON,
        first_name: 'Interpretee',
        last_name: 'Doe',
        linked_participants: []
    });

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let getParticipantsByConferenceId$: Subject<ParticipantForUserResponse[]>;

    let sut: ParticipantService;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getParticipantsByConferenceId']);

        getParticipantsByConferenceId$ = new Subject<ParticipantForUserResponse[]>();
        apiClientSpy.getParticipantsByConferenceId.and.returnValue(getParticipantsByConferenceId$.asObservable());

        sut = new ParticipantService(
            apiClientSpy,
            jasmine.createSpyObj<Logger>('Logger', ['error'])
        );

        apiClientSpy.getParticipantsByConferenceId.calls.reset();
    });

    it('should be created and the initialise participant list', fakeAsync(() => {
        // Act
        const participantResponses = [participantOne, participantTwo];
        getParticipantsByConferenceId$.next(participantResponses);
        flush();

        // Assert
        expect(sut).toBeTruthy();
        expect(sut.participants).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
    }));

    describe('getParticipantsForConference', () => {
        it('should return the participants from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses = [participantOne, participantTwo];

            let result: Participant[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return the participants from VideoWebService when called with a GUID', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const conferenceId = Guid.create();

            let result: Participant[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId.toString());
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return an empty array if no particiapnts are returned from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses: ParticipantForUserResponse[] = [];

            let result: Participant[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual([]);
        }));
    });

    describe('getPexipIdForParticipant', () => {});
});
