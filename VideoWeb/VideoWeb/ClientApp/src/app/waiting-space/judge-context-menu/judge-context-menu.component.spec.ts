import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ParticipantStatus } from '../../services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { JudgeContextMenuComponent } from './judge-context-menu.component';

describe('JudgeContextMenuComponent', () => {
    const participants = new ConferenceTestData().getListOfParticipants();
    const logger = new MockLogger();

    let component: JudgeContextMenuComponent;
    beforeEach(() => {
        component = new JudgeContextMenuComponent(logger, null);
        component.participant = new ParticipantPanelModel(participants[0]);
    });

    it('should getAdditionalText return displayname as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toContain(``);
    });

    it('should getAdditionalText return hearing role and case role for an individual', () => {
        const p = participants[1];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}<br/>${p.case_type_group}`);
    });

    it('should getAdditionalText return hearing role and case role for a representative', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role} for ${p.representee}<br/>${p.case_type_group}`
        );
    });

    it('should getAdditionalText return hearing role and case role for an observer', () => {
        const p = participants[5];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}`);
    });

    it('should getAdditionalText return hearing role and case role for a panel member', () => {
        const p = participants[6];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}`);
    });

    it('should getAdditionalText return display name for judge', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(``);
    });
});