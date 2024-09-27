import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialOutNumberComponent } from './dial-out-number.component';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

describe('DialOutNumberComponent', () => {
    let component: DialOutNumberComponent;
    let fixture: ComponentFixture<DialOutNumberComponent>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

    beforeEach(async () => {
        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['callParticipantByTelephone']);

        await TestBed.configureTestingModule({
            declarations: [DialOutNumberComponent],
            providers: [{ provide: VideoCallService, useValue: videoCallServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(DialOutNumberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('dialOutNumber', () => {
        it('should call videoCallService if form is valid', () => {
            component.form.controls.telephone.setValue('01234567890');
            component.dialOutNumber();

            expect(component.form.valid).toBeTrue();
            expect(videoCallServiceSpy.callParticipantByTelephone).toHaveBeenCalled();
        });

        it('should not call videoCallService if form is invalid', () => {
            component.form.controls.telephone.setValue('hello');
            component.dialOutNumber();

            expect(component.form.valid).toBeFalse();
            expect(component.form.controls.telephone.errors).toEqual({ invalidPhoneNumber: true });
            expect(videoCallServiceSpy.callParticipantByTelephone).not.toHaveBeenCalled();
        });
    });
});
