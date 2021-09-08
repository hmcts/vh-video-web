import { ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantPanelModel } from './participant-panel-model';
import { ParticipantPanelModelMapper } from '../../shared/mappers/participant-panel-model-mapper';
import { HearingRole } from './hearing-role-model';

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
        expect(model.isDisconnected()).toBeTruthy();
    });

    it('should return isDisconnected: false when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isDisconnected()).toBeFalsy();
    });

    it('should return isAvailable: false when participant is in hearing', () => {
        participant.status = ParticipantStatus.InHearing;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isAvailable()).toBeFalsy();
    });

    it('should return isAvailable: true when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isAvailable()).toBeTruthy();
    });

    it('should return true when participant is a judge', () => {
        participant.role = Role.Judge;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudge).toBeTruthy();
    });

    it('should return false when participant is not a judge', () => {
        participant.role = Role.Individual;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudge).toBeFalsy();
    });

    it('should return true when participant is a joh', () => {
        participant.role = Role.JudicialOfficeHolder;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudicialOfficeHolder).toBeTruthy();
    });

    it('should return false when participant is not a joh', () => {
        participant.role = Role.Individual;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isJudicialOfficeHolder).toBeFalsy();
    });

    it('should return false when participant is a quick link observer and status is in hearing', () => {
        participant.role = Role.QuickLinkObserver;
        participant.status = ParticipantStatus.InHearing;
        participant.hearing_role = HearingRole.QUICK_LINK_OBSERVER;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isWitnessObserverReadyToJoin).toBeFalsy();
    });

    it('should return false when participant is a witness and status is in hearing', () => {
        participant.hearing_role = HearingRole.WITNESS;
        participant.status = ParticipantStatus.InHearing;
        model = mapper.mapFromParticipantUserResponse(participant);
        expect(model.isWitnessObserverReadyToJoin).toBeFalsy();
    });
});
