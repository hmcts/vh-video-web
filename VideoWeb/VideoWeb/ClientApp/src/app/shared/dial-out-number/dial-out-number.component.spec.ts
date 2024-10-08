import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialOutNumberComponent } from './dial-out-number.component';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('DialOutNumberComponent', () => {
    let component: DialOutNumberComponent;
    let fixture: ComponentFixture<DialOutNumberComponent>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

    beforeEach(async () => {
        translateServiceSpy.instant.withArgs('dial-out-number.dial-out-success-message').and.returnValue('Dial out successful');
        translateServiceSpy.instant.withArgs('dial-out-number.dial-out-failed-message').and.returnValue('Dial out failed');
        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['callParticipantByTelephone']);

        await TestBed.configureTestingModule({
            declarations: [DialOutNumberComponent, TranslatePipeMock],
            providers: [
                { provide: VideoCallService, useValue: videoCallServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ],
            imports: [ReactiveFormsModule]
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

        it('should not call videoCallService if form has non-numeric values', () => {
            component.form.controls.telephone.setValue('01234567890$');
            component.dialOutNumber();

            expect(component.form.valid).toBeFalse();
            expect(component.form.controls.telephone.errors).toEqual({
                pattern: {
                    requiredPattern: '^[0-9]*$',
                    actualValue: '01234567890$'
                }
            });
            expect(videoCallServiceSpy.callParticipantByTelephone).not.toHaveBeenCalled();
        });
    });

    describe('processDialOutResponse', () => {
        it('should reset form and display success message if dial out is successful', () => {
            component.processDialOutResponse({ status: 'success', result: [] });

            expect(component.form.value.telephone).toBeNull();
            expect(component.message).toBe('Dial out successful');
            expect(component.isError).toBeFalse();
        });

        it('should display error message if dial out is unsuccessful', () => {
            component.processDialOutResponse({ status: 'failed', result: [] });

            expect(component.message).toBe('Dial out failed');
            expect(component.isError).toBeTrue();
        });
    });
});
