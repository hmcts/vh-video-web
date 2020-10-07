import { EndpointStatus, ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantPanelModel, VideoEndpointPanelModel } from './participant-panel-model';

describe('ParticipantPanelModel', () => {
    let model: ParticipantPanelModel;
    let participant: ParticipantForUserResponse;

    beforeEach(() => {
        participant = new ConferenceTestData().getListOfParticipants()[0];
    });

    it('should return isDisconnected: true when participant is disconnected', () => {
        participant.status = ParticipantStatus.Disconnected;
        model = new ParticipantPanelModel(participant);
        expect(model.isDisconnected()).toBeTruthy();
    });

    it('should return isDisconnected: false when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = new ParticipantPanelModel(participant);
        expect(model.isDisconnected()).toBeFalsy();
    });

    it('should return isAvailable: false when participant is in hearing', () => {
        participant.status = ParticipantStatus.InHearing;
        model = new ParticipantPanelModel(participant);
        expect(model.isAvailable()).toBeFalsy();
    });

    it('should return isAvailable: true when participant is available', () => {
        participant.status = ParticipantStatus.Available;
        model = new ParticipantPanelModel(participant);
        expect(model.isAvailable()).toBeTruthy();
    });

    it('should return true when participant is a judge', () => {
        participant.role = Role.Judge;
        model = new ParticipantPanelModel(participant);
        expect(model.isJudge).toBeTruthy();
    });

    it('should return false when participant is not a judge', () => {
        participant.role = Role.Individual;
        model = new ParticipantPanelModel(participant);
        expect(model.isJudge).toBeFalsy();
    });
});
