import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuteMicrophoneComponent } from './mute-microphone.component';
import { FormBuilder } from '@angular/forms';
import { ConferenceSetting } from 'src/app/shared/models/conference-setting';
import { UserMediaService } from 'src/app/services/user-media.service';

describe('MuteMicrophoneComponent', () => {
    let component: MuteMicrophoneComponent;
    let fixture: ComponentFixture<MuteMicrophoneComponent>;
    let userMediaService: jasmine.SpyObj<UserMediaService>;

    beforeEach(async () => {
        const formBuilder = new FormBuilder();
        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [
            'getConferenceSetting',
            'updateStartWithAudioMuted'
        ]);
        component = new MuteMicrophoneComponent(formBuilder, userMediaService);
    });

    describe('ngOnInit', () => {
        it('should prepopulate form when startWithAudioMuted is true in local storage', () => {
            const conference: ConferenceSetting = new ConferenceSetting('conferenceId', true);
            userMediaService.getConferenceSetting.and.returnValue(conference);
            component.ngOnInit();
            expect(component.form.value.muteMicrophone).toBeTrue();
        });
    });

    describe('confirm', () => {
        it('should save mute microphone setting when clicking confirm', () => {
            const emitSpy = spyOn(component.confirmAnswered, 'emit');
            component.form.setValue({ muteMicrophone: true });
            component.confirm();
            expect(userMediaService.updateStartWithAudioMuted).toHaveBeenCalledWith(component.hearingId, true);
            expect(emitSpy).toHaveBeenCalledWith(true);
        });
    });

    describe('cancel', () => {
        it('should emit event when clicking cancel', () => {
            const emitSpy = spyOn(component.confirmAnswered, 'emit');
            component.cancel();
            expect(emitSpy).toHaveBeenCalledWith(false);
        });
    });
});
