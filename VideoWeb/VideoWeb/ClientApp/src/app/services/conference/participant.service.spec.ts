import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { VideoWebService } from '../api/video-web.service';
import { LinkedParticipantResponse, LinkType, ParticipantForUserResponse, ParticipantStatus, Role } from '../clients/api-client';
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

    const participantResponses = [participantOne, participantTwo];

    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    let sut: ParticipantService;

    beforeEach(fakeAsync(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebSerivce', ['getParticipantsByConferenceId']);
        videoWebServiceSpy.getParticipantsByConferenceId.and.resolveTo(participantResponses);

        sut = new ParticipantService(videoWebServiceSpy);
        flush();

        videoWebServiceSpy.getParticipantsByConferenceId.calls.reset();
    }));

    it('should be created and the initialise participant list', () => {
        expect(sut).toBeTruthy();
        expect(sut.participants).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
    });

    describe('getParticipants', () => {
        it('should return the participants from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';

            // Act
            let result: Participant[];
            sut.getParticipants(conferenceId).subscribe(participants => (result = participants));
            flush();

            // Assert
            expect(videoWebServiceSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return the participants from VideoWebService when called with a GUID', fakeAsync(() => {
            // Arrange
            const conferenceId = Guid.create();

            // Act
            let result: Participant[];
            sut.getParticipants(conferenceId).subscribe(participants => (result = participants));
            flush();

            // Assert
            expect(videoWebServiceSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId.toString());
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
