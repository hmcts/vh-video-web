import {fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
    LinkedParticipantResponse,
    LinkType,
    ParticipantContactDetailsResponseVho,
    Role
} from 'src/app/services/clients/api-client';
import {ParticipantContactDetails} from 'src/app/shared/models/participant-contact-details';
import {ConferenceTestData} from 'src/app/testing/mocks/data/conference-test-data';
import {eventsServiceSpy} from 'src/app/testing/mocks/mock-events-service';
import {HearingRole} from 'src/app/waiting-space/models/hearing-role-model';
import {VideoWebService} from '../../services/api/video-web.service';
import {ErrorService} from '../../services/error.service';
import {ParticipantStatusReader} from '../../shared/models/participant-status-reader';
import {MockLogger} from '../../testing/mocks/mock-logger';
import {ParticipantStatusComponent} from './participant-status.component';

describe('ParticipantStatusComponent', () => {
    const eventsService = eventsServiceSpy;
    const videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getParticipantsWithContactDetailsByConferenceId',
        'raiseSelfTestFailureEvent',
        'updateParticipantDisplayName'
    ]);
    const errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', [
        'goToServiceError',
        'handleApiError',
        'returnHomeIfUnauthorised'
    ]);
    const participantStatusReaderSpy = jasmine.createSpyObj<ParticipantStatusReader>(
        'ParticipantStatusReader',
        ['getStatusAsText', 'getStatusAsTextForHost'],
        { inAnotherHearingText: 'In Another Hearing' }
    );

    let participants: ParticipantContactDetailsResponseVho[];
    let component: ParticipantStatusComponent;

    beforeEach(() => {
        participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            '174DFEFB-8EF2-4093-801D-621DF852021D',
            'MyVenue'
        );
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.returnValue(Promise.resolve(participants));
        videoWebServiceSpy.updateParticipantDisplayName.and.returnValue(Promise.resolve());
        component = new ParticipantStatusComponent(
            videoWebServiceSpy,
            errorServiceSpy,
            eventsService,
            new MockLogger(),
            participantStatusReaderSpy
        );
    });

    it('should initalise data', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(4);
        expect(component.loadingData).toBeFalsy();
    }));

    describe('sort participants', () => {
        it('should sort participants in correct order', async () => {
            const participantsToSort: ParticipantContactDetails[] = [];

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Manual Judge 26',
                        hearing_role: HearingRole.JUDGE,
                        linked_participants: [],
                        role: Role.Judge
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'A Staff Member',
                        hearing_role: HearingRole.STAFF_MEMBER,
                        linked_participants: [],
                        role: Role.StaffMember
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'M Individual 10',
                        hearing_role: 'Family Member',
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Witness 01',
                        hearing_role: HearingRole.WITNESS,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'M PanelMember 04',
                        hearing_role: HearingRole.MEDICAL_MEMBER,
                        linked_participants: [],
                        role: Role.JudicialOfficeHolder
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'P Member_01',
                        hearing_role: HearingRole.LAY_MEMBER,
                        linked_participants: [],
                        role: Role.JudicialOfficeHolder
                    })
                )
            );

            const linkedParticipants1: LinkedParticipantResponse[] = [];
            linkedParticipants1.push(
                new LinkedParticipantResponse({
                    link_type: LinkType.Interpreter,
                    linked_id: 'f195ea9d-0118-4790-bda9-dbc49796584f'
                })
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'M Interpreter 06',
                        hearing_role: HearingRole.INTERPRETER,
                        id: '77bb94c6-040b-47f3-87ce-378a4fb2ab57',
                        linked_participants: linkedParticipants1,
                        role: Role.Individual
                    })
                )
            );

            const linkedParticipants2: LinkedParticipantResponse[] = [];
            linkedParticipants2.push(
                new LinkedParticipantResponse({
                    link_type: LinkType.Interpreter,
                    linked_id: '77bb94c6-040b-47f3-87ce-378a4fb2ab57'
                })
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'M Individual 12',
                        hearing_role: 'Family Member',
                        id: 'f195ea9d-0118-4790-bda9-dbc49796584f',
                        linked_participants: linkedParticipants2,
                        role: Role.Individual
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'M Observer 03',
                        hearing_role: HearingRole.OBSERVER,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            component.participants = participantsToSort;

            const participantList = component.sortParticipants();

            // Judge
            const judgeIndex = participantList.findIndex(x => x.displayName === 'Manual Judge 26');
            expect(judgeIndex).toEqual(0);

            // Panel members and wingers
            const panelMember1Index = participantList.findIndex(x => x.displayName === 'M PanelMember 04');
            const panelMember2Index = participantList.findIndex(x => x.displayName === 'P Member_01');
            expect(panelMember1Index).toEqual(1);
            expect(panelMember2Index).toEqual(2);

            // Others
            const other1Index = participantList.findIndex(x => x.displayName === 'A Staff Member');
            const other2Index = participantList.findIndex(x => x.displayName === 'M Individual 10');
            const other3Index = participantList.findIndex(x => x.displayName === 'Witness 01');
            expect(other1Index).toEqual(3);
            expect(other2Index).toEqual(4);
            expect(other3Index).toEqual(5);

            // Interpreters and interpretees
            const interp1Index = participantList.findIndex(x => x.displayName === 'M Interpreter 06');
            const interp2Index = participantList.findIndex(x => x.displayName === 'M Individual 12');
            expect(interp1Index).toEqual(6);
            expect(interp2Index).toEqual(7);

            // Interpreter 06
            // Individual 12

            // Observers
            const observer1Index = participantList.findIndex(x => x.displayName === 'M Observer 03');
            expect(observer1Index).toEqual(8);
            // Observer 03
        });
    });
    describe('Updating Participant Name Controls', () => {
        it('should set participant being edited, when edit button clicked', () => {
            const participant = new ParticipantContactDetails(participants[0]);
            component.setParticipantEdit(participant);
            expect(component.participantBeingEdited).toEqual(participant);
            expect(component.newParticipantDisplayName).toEqual(participant.displayName);
        });

        it('should set new participant display name, when text box filled in', () => {
            const newName = 'New Name';
            component.onParticipantDisplayName(newName);
            expect(component.newParticipantDisplayName).toEqual(newName);
        });

        it('should cancel editing participant, when cancel button clicked', () => {
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            component.newParticipantDisplayName = 'New Name';
            component.cancelDisplayName();
            expect(component.participantBeingEdited).toBeNull();
            expect(component.newParticipantDisplayName).toBeNull();
        });

        it('should update participant name, when save button clicked', async () => {
            component.conferenceId = '123';
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            component.newParticipantDisplayName = 'New Name';
            await component.renameParticipant(component.participantBeingEdited.id);
            expect(videoWebServiceSpy.updateParticipantDisplayName).toHaveBeenCalled();
            expect(component.participantBeingEdited).toBeNull();
            expect(component.newParticipantDisplayName).toBeNull();
        });
    });
});
