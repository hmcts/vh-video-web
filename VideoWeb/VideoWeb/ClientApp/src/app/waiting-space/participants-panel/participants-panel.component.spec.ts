import { ParticipantsPanelComponent } from './participants-panel.component';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role } from '../../services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

describe('ParticipantsPanelComponent', () => {
    const participants = new ConferenceTestData().getListOfParticipants();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj('VideoWebService', ['getParticipantsByConferenceId']);
    videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(participants));

    const component = new ParticipantsPanelComponent(videoWebServiceSpy);

    it('should get participant sorted list, the panel members are the first and observers are the last one', async () => {
        await component.ngOnInit();
        expect(component.participants.length).toBeGreaterThan(0);

        expect(component.participants[0].caseTypeGroup).toBe('panelmember');
        expect(component.participants[component.participants.length - 1].caseTypeGroup).toBe('observer');
    });
    it('should list of participant not include judge', async () => {
        await component.ngOnInit();
        expect(component.participants.length).toBeGreaterThan(0);
        expect(component.participants.findIndex(x => x.role === Role.Judge)).toBe(-1);
    });
    it('should toggle collaps or expand panel', () => {
        const currentValue = component.expandPanel;
        component.toggleCollapseExpand();
        expect(component.expandPanel).toBe(!currentValue);
    });
});
