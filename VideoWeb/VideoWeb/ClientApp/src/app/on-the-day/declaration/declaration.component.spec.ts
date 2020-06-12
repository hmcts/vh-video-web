import { AbstractControl, FormBuilder } from '@angular/forms';
import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { DeclarationComponent } from './declaration.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';

describe('DeclarationComponent Tests', () => {
    let component: DeclarationComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    const formBuilder = new FormBuilder();
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    let checkboxControl: AbstractControl;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
    });

    beforeEach(() => {
        router.navigate.calls.reset();
        component = new DeclarationComponent(router, activatedRoute, formBuilder, participantStatusUpdateService, new MockLogger());
        checkboxControl = component.declarationForm.controls['declare'];
        component.ngOnInit();
    });

    it('should init conference id on init', () => {
        expect(component.conferenceId).toBe(conference.id);
    });

    it('should invalidate form when declaration is not checked', () => {
        checkboxControl.setValue(false);
        expect(component.declarationForm.valid).toBeFalsy();
    });

    it('should validate form when declaration is checked', () => {
        checkboxControl.setValue(true);
        expect(component.declarationForm.valid).toBeTruthy();
    });

    it('should not go to waiting room when form is invalid', () => {
        checkboxControl.setValue(false);
        component.onSubmit();
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should go to waiting room when form is valid', () => {
        checkboxControl.setValue(true);
        component.onSubmit();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantWaitingRoom, conference.id]);
    });
});
