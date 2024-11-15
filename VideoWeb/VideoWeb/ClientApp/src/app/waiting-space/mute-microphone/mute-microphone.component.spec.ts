import { ComponentFixture } from '@angular/core/testing';

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
            'updateStartWithAudioMuted',
            'removeExpiredConferenceSettings'
        ]);
        component = new MuteMicrophoneComponent(formBuilder, userMediaService);
    });

    describe('ngOnInit', () => {
        it('should prepopulate form when startWithAudioMuted is true in local storage', () => {
            const conference: ConferenceSetting = new ConferenceSetting('conferenceId', true);
            userMediaService.getConferenceSetting.and.returnValue(conference);
            component.ngOnInit();
            expect(component.form.value.muteMicrophone).toBeTrue();
            expect(userMediaService.removeExpiredConferenceSettings).toHaveBeenCalled();
        });
    });

    describe('save', () => {
        it('should save mute microphone setting', () => {
            component.form.setValue({ muteMicrophone: true });
            component.save();
            expect(userMediaService.updateStartWithAudioMuted).toHaveBeenCalledWith(component.hearingId, true);
        });
    });
});
