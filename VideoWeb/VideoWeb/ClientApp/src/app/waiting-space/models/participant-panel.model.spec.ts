import { ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantPanelModelMapper } from '../../shared/mappers/participant-panel-model-mapper';
import { HearingRole } from './hearing-role-model';
import { ParticipantPanelModel } from './participant-panel-model';

describe('ParticipantPanelModel', () => {
    let model: ParticipantPanelModel;
    let participant: ParticipantForUserResponse;

    const mapper = new ParticipantPanelModelMapper();

    beforeEach(() => {
        participant = new ConferenceTestData().getListOfParticipants()[0];
    });

    it('should return isDisconnected: true when participant is disconnected', () => {
        participant.status = ParticipantStatus.Disconnected;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isDisconnected()).toBe(true);
    });

    it('should return isDisconnected: false when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isDisconnected()).toBe(false);
    });

    it('should return isAvailable: false when participant is in hearing', () => {
        participant.status = ParticipantStatus.InHearing;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isAvailable()).toBe(false);
    });

    it('should return isAvailable: true when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isAvailable()).toBe(true);
    });

    it('returns isAvailable: true when participant is quick link user and status is in consultation', () => {
        participant.status = ParticipantStatus.InConsultation;
        model = mapper.mapFromParticipantUserResponse(participant);
        spyOnProperty(model, 'isQuickLinkUser').and.returnValue(true);
        expect(model.isAvailable()).toBe(true);
    });

    it('returns isAvailable: false when participant is not quick link user and status is in consultation', () => {
        participant.status = ParticipantStatus.InConsultation;
        model = mapper.mapFromParticipantUserResponse(participant);
        spyOnProperty(model, 'isQuickLinkUser').and.returnValue(false);
        expect(model.isAvailable()).toBe(false);
    });

    it('returns isAvailable: true when participant is quick link user and status is available', () => {
        participant.status = ParticipantStatus.Available;
        model = mapper.mapFromParticipantUserResponse(participant);
        spyOnProperty(model, 'isQuickLinkUser').and.returnValue(true);
        expect(model.isAvailable()).toBe(true);
    });

    it('returns isAvailable: false when participant is quick link user and status is in hearing', () => {
        participant.status = ParticipantStatus.InHearing;
        model = mapper.mapFromParticipantUserResponse(participant);
        spyOnProperty(model, 'isQuickLinkUser').and.returnValue(true);
        expect(model.isAvailable()).toBe(false);
    });

    it('should return true when participant is a judge', () => {
        participant.role = Role.Judge;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudge).toBe(true);
    });

    it('should return false when participant is not a judge', () => {
        participant.role = Role.Individual;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudge).toBe(false);
    });

    it('should return true when participant is a joh', () => {
        participant.role = Role.JudicialOfficeHolder;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudicialOfficeHolder).toBe(true);
    });

    it('should return false when participant is not a joh', () => {
        participant.role = Role.Individual;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudicialOfficeHolder).toBe(false);
    });

    describe('callable', () => {
        const id = 'id';
        const displayName = 'displayName';
        const role = Role.None;
        const caseTypeGroup = 'caseTypeGroup';
        const pexipDisplayName = 'pexipDisplayName';
        const hearingRole = 'hearingRole';
        const representee = 'representsee';
        const status = ParticipantStatus.None;

        beforeEach(() => {
            model = new ParticipantPanelModel(id, displayName, role, caseTypeGroup, pexipDisplayName, hearingRole, representee, status);
        });

        describe('isWitness', () => {
            const validHearingRoles = [HearingRole.WITNESS];

            Object.keys(HearingRole).forEach(hearingRoleString => {
                const testHearingRole = HearingRole[hearingRoleString];
                const isValid = validHearingRoles.includes(testHearingRole);
                it(`should return ${isValid} when hearing role is ${hearingRoleString}`, () => {
                    model.hearingRole = testHearingRole;
                    expect(model.isWitness).toBe(isValid);
                });
            });
        });

        describe('isQuickLinkUser', () => {
            const validRoles = [Role.QuickLinkObserver, Role.QuickLinkParticipant];

            Object.keys(Role).forEach(roleString => {
                const testRole = Role[roleString];
                const isValid = validRoles.includes(testRole);
                it(`should return ${isValid} when role is ${roleString}`, () => {
                    model.role = testRole;
                    expect(model.isQuickLinkUser).toBe(isValid);
                });
            });
        });

        describe('isCallable', () => {
            const testCases = [
                { isWitness: false, isQuickLinkUser: false, isInterpreter: false, expectation: false },
                { isWitness: true, isQuickLinkUser: false, isInterpreter: false, expectation: true },
                { isWitness: false, isQuickLinkUser: true, isInterpreter: false, expectation: true },
                { isWitness: true, isQuickLinkUser: true, isInterpreter: false, expectation: true },
                { isWitness: false, isQuickLinkUser: false, isInterpreter: true, expectation: true },
                { isWitness: false, isQuickLinkUser: false, isInterpreter: true, expectation: true },
                { isWitness: true, isQuickLinkUser: false, isInterpreter: true, expectation: true }
            ];
            testCases.forEach(testCase => {
                it(`should return ${testCase.expectation} when isWitness is ${testCase.isWitness} and isQuickLinkUser is ${testCase.isQuickLinkUser}`, () => {
                    spyOnProperty(model, 'isWitness').and.returnValue(testCase.isWitness);
                    spyOnProperty(model, 'isQuickLinkUser').and.returnValue(testCase.isQuickLinkUser);
                    spyOnProperty(model, 'isInterpreter').and.returnValue(testCase.isInterpreter);
                    expect(model.isCallable).toBe(testCase.expectation);
                });
            });
        });

        describe('isCallableAndReadyToJoin', () => {
            const testCases = [
                { isCallable: false, isAvailable: false, expectation: false },
                { isCallable: true, isAvailable: true, expectation: true },
                { isCallable: false, isAvailable: true, expectation: false },
                { isCallable: true, isAvailable: false, expectation: false }
            ];
            testCases.forEach(testCase => {
                it(`should return ${testCase.expectation} when isCallable is ${testCase.isCallable} and isInHearing is ${testCase.isAvailable}`, () => {
                    spyOnProperty(model, 'isCallable').and.returnValue(testCase.isCallable);
                    spyOn(model, 'isAvailable').and.returnValue(testCase.isAvailable);
                    expect(model.isCallableAndReadyToJoin).toBe(testCase.expectation);
                });
            });
        });

        describe('isCallableAndReadyToBeDismissed', () => {
            const testCases = [
                { isCallable: false, isInHearing: false, expectation: false },
                { isCallable: true, isInHearing: false, expectation: false },
                { isCallable: false, isInHearing: true, expectation: false },
                { isCallable: true, isInHearing: true, expectation: true }
            ];
            testCases.forEach(testCase => {
                it(`should return ${testCase.expectation} when isCallable is ${testCase.isCallable} and isInHearing is ${testCase.isInHearing}`, () => {
                    spyOnProperty(model, 'isCallable').and.returnValue(testCase.isCallable);
                    spyOn(model, 'isInHearing').and.returnValue(testCase.isInHearing);
                    expect(model.isCallableAndReadyToBeDismissed).toBe(testCase.expectation);
                });
            });
        });
    });
});
