import { Guid } from 'guid-typescript';
import { ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from './hearing-role-model';
import { LinkedParticipantPanelModel } from './linked-participant-panel-model';
import { ParticipantPanelModel } from './participant-panel-model';
import { ParticipantPanelModelMapper } from '../../shared/mappers/participant-panel-model-mapper';

describe('LinkedParticipantPanelModel', () => {
    let model: LinkedParticipantPanelModel;
    let participants: ParticipantForUserResponse[];
    let johs: ParticipantForUserResponse[];
    const testData = new ConferenceTestData();
    const mapper = new ParticipantPanelModelMapper();
    beforeEach(() => {
        participants = testData.getListOfLinkedParticipants();
        johs = testData.getListOfParticipants().filter(x => x.role === Role.JudicialOfficeHolder);
    });

    it('should update status for participant', () => {
        const participantId = participants[0].id;
        createLinkedModel();
        model.updateStatus(ParticipantStatus.Available, participantId);
        expect(model.participants.find(x => x.id === participantId).isAvailable()).toBeTruthy();
    });

    it('should update device status for participant', () => {
        const participantId = participants[0].id;
        createLinkedModel();

        model.updateParticipantDeviceStatus(true, true, participantId);

        const updatedParticipant = model.participants.find(x => x.id === participantId);
        expect(updatedParticipant.isLocalMicMuted()).toBeTruthy();
        expect(updatedParticipant.isLocalCameraOff()).toBeTruthy();
    });

    it('should dismiss all participants', () => {
        createLinkedModel();
        model.participants.forEach(p => p.updateParticipant(false, true, true));
        model.dimissed();
        expect(model.hasHandRaised()).toBeFalsy();
        expect(model.hasSpotlight()).toBeFalsy();
    });

    it('should return isInHearing: true when at least one participant is in hearing', () => {
        createLinkedModel();
        model.participants[0].updateStatus(ParticipantStatus.InHearing);
        expect(model.isInHearing()).toBeTruthy();
    });

    it('should return isInHearing: false when no participant is in hearing', () => {
        createLinkedModel();
        model.participants.forEach(p => p.updateStatus(ParticipantStatus.Available));
        expect(model.isInHearing()).toBeFalsy();
    });

    it('should return isLocalMicMuted: true when all participants are locally muted', () => {
        participants.forEach(p => (p.status = ParticipantStatus.InHearing));
        createLinkedModel();
        const micMuted = true;
        const videoMuted = false;
        model.participants.forEach(p => p.updateParticipantDeviceStatus(micMuted, videoMuted));

        expect(model.isLocalMicMuted()).toBeTruthy();
    });

    it('should return isLocalMicMuted: false when only one participants is locally muted', () => {
        participants.forEach(p => (p.status = ParticipantStatus.InHearing));
        createLinkedModel();
        const micMuted = true;
        const videoMuted = false;

        model.participants[0].updateParticipantDeviceStatus(micMuted, videoMuted);
        model.participants[1].updateParticipantDeviceStatus(false, false);

        expect(model.isLocalMicMuted()).toBeFalsy();
    });

    it('should return isLocalCameraOff: true when all participants have camera off', () => {
        participants.forEach(p => (p.status = ParticipantStatus.InHearing));
        createLinkedModel();
        const micMuted = false;
        const videoMuted = true;
        model.participants.forEach(p => p.updateParticipantDeviceStatus(micMuted, videoMuted));

        expect(model.isLocalCameraOff()).toBeTruthy();
    });

    it('should return isLocalCameraOff: false when only one participants has camera off', () => {
        participants.forEach(p => (p.status = ParticipantStatus.InHearing));
        createLinkedModel();
        const micMuted = false;
        const videoMuted = true;

        model.participants[0].updateParticipantDeviceStatus(micMuted, videoMuted);
        model.participants[1].updateParticipantDeviceStatus(false, false);

        expect(model.isLocalCameraOff()).toBeFalsy();
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

    it('should return true when all participants are JOHs', () => {
        createLinkedJohs();
        expect(model.isJudicalOfficeHolder).toBeTruthy();
    });

    function createLinkedModel() {
        const pats = participants.map(p => mapper.mapFromParticipantUserResponse(p));
        const roomLabel = 'Interpreter1';
        const roomId = '787';
        model = LinkedParticipantPanelModel.fromListOfPanelModels(pats, roomLabel, roomId);
    }

    function createLinkedJohs() {
        const pats = johs.map(p => mapper.mapFromParticipantUserResponse(p));
        const roomLabel = 'PanelMember1';
        const roomId = '788';
        model = LinkedParticipantPanelModel.forJudicialHolders(pats, roomLabel, roomId);
    }
});

describe('LinkedParticipantPanelModel - witness & interpreter', () => {
    let model: LinkedParticipantPanelModel;
    let participants: ParticipantForUserResponse[];
    const mapper = new ParticipantPanelModelMapper();
    beforeEach(() => {
        participants = new ConferenceTestData().getListOfLinkedParticipants(true);
    });

    it('should return true when both participants are available', () => {
        participants.forEach(p => (p.status = ParticipantStatus.Available));
        createLinkedModel();
        expect(model.isCallableAndReadyToJoin).toBeTruthy();
    });

    it('should return false when one participant is not available', () => {
        const participant = participants.find(p => p.hearing_role === HearingRole.INTERPRETER);
        participant.status = ParticipantStatus.NotSignedIn;
        createLinkedModel();
        expect(model.isCallableAndReadyToJoin).toBeFalsy();
    });

    function createLinkedModel() {
        const pats = participants.map(p => mapper.mapFromParticipantUserResponse(p));
        const roomLabel = 'Witness1';
        const roomId = '788';
        model = LinkedParticipantPanelModel.fromListOfPanelModels(pats, roomLabel, roomId);
    }
});
