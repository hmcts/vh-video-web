import { Guid } from 'guid-typescript';
import { ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { LinkedParticipantPanelModel } from './linked-participant-panel-model';
import { ParticipantPanelModel } from './participant-panel-model';

describe('LinkedParticipantPanelModel', () => {
    let model: LinkedParticipantPanelModel;
    let participants: ParticipantForUserResponse[];

    beforeEach(() => {
        participants = new ConferenceTestData().getListOfLinkedParticipants();
    });

    it('should return isDisconnected: false when only one participant is disconnected', () => {
        participants[0].status = ParticipantStatus.Disconnected;
        createLinkedModel();
        expect(model.isDisconnected()).toBeFalsy();
    });

    it('should return isDisconnected: true when only both participants are disconnected', () => {
        participants[0].status = ParticipantStatus.Disconnected;
        participants[1].status = ParticipantStatus.Disconnected;
        createLinkedModel();
        expect(model.isDisconnected()).toBeTruthy();
    });

    it('should return isDisconnected: false when a participant is available', () => {
        participants[0].status = ParticipantStatus.Available;
        createLinkedModel();
        expect(model.isDisconnected()).toBeFalsy();
    });

    it('should return isAvailable: false when a participant is in hearing', () => {
        participants[0].status = ParticipantStatus.InHearing;
        createLinkedModel();
        expect(model.isAvailable()).toBeFalsy();
    });

    it('should return isAvailable: true when a participant is available', () => {
        participants[0].status = ParticipantStatus.Available;
        createLinkedModel();
        expect(model.isAvailable()).toBeTruthy();
    });

    it('should return isInConsultation: true when a participant is InConsultation', () => {
        participants[0].status = ParticipantStatus.InConsultation;
        createLinkedModel();
        expect(model.isInConsultation()).toBeTruthy();
    });

    it('should return hasParticipant: true when an id is given for one of the linked participants', () => {
        const patId = participants[0].id;
        createLinkedModel();
        expect(model.hasParticipant(patId)).toBeTruthy();
    });

    it('should return hasParticipant: false when an id is given for none of the linked participants', () => {
        const patId = Guid.create().toString();
        createLinkedModel();
        expect(model.hasParticipant(patId)).toBeFalsy();
    });

    it('should return false when none of the participants are witnesses', () => {
        createLinkedModel();
        expect(model.isWitness).toBeFalsy();
    });

    it('should return true when one of the participants is a witness', () => {
        participants = new ConferenceTestData().getListOfLinkedParticipants(true);
        createLinkedModel();
        expect(model.isWitness).toBeTruthy();
    });

    function createLinkedModel() {
        const pats = participants.map(p => new ParticipantPanelModel(p));
        const roomLabel = 'Interpreter1';
        const roomId = '787';
        model = LinkedParticipantPanelModel.fromListOfPanelModels(pats, roomLabel, roomId);
    }
});
