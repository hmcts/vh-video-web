import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { ErrorService } from 'src/app/services/error.service';

import { MagicLinksComponent } from './magic-links.component';
import { TranslatePipeMock } from '../..//testing/mocks/mock-translation-pipe';
import { Role } from 'src/app/services/clients/api-client';

describe('MagicLinksComponent', () => {
    const magicLinkParticipantRoles = [Role.MagicLinkObserver, Role.MagicLinkParticipant];
    const formBuilder = new FormBuilder();

    let component: MagicLinksComponent;
    let fixture: ComponentFixture<MagicLinksComponent>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let magicLinksServiceSpy: jasmine.SpyObj<MagicLinksService>;

    beforeEach(async () => {
        errorServiceSpy = jasmine.createSpyObj('errorServiceSpy', {
            goToServiceError: () => {}
        });
        magicLinksServiceSpy = jasmine.createSpyObj('magicLinksService', {
            getMagicLinkParticipantRoles: of(magicLinkParticipantRoles),
            validateMagicLink: of(true)
        });

        await TestBed.configureTestingModule({
            declarations: [MagicLinksComponent, TranslatePipeMock],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get(param: string) {
                                    return 'd1faff56-aa5e-45d5-8ec5-67e7840b1f6d';
                                }
                            }
                        }
                    }
                },
                {
                    provide: ErrorService,
                    useValue: errorServiceSpy
                },
                FormBuilder,
                {
                    provide: MagicLinksService,
                    useValue: magicLinksServiceSpy
                }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MagicLinksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnInit', () => {
        it('should call method to initialise the form', () => {
            const spy = spyOn(component, 'initialiseForm');
            component.ngOnInit();
            expect(spy.calls.count()).toBe(1);
        });

        it('should call magic links service to validate the magic link', () => {
            expect(magicLinksServiceSpy.validateMagicLink.calls.count()).toBe(1);
        });

        it('should call magic links service to get participant roles if magic link is valid', () => {
            expect(magicLinksServiceSpy.getMagicLinkParticipantRoles.calls.count()).toBe(1);
            expect(component.magicLinkParticipantRoles).toEqual(magicLinkParticipantRoles);
        });

        it('should call error service if the magic link is invalid', async () => {
            magicLinksServiceSpy.validateMagicLink.and.returnValue(of(false));
            component.ngOnInit();

            expect(errorServiceSpy.goToServiceError.calls.count()).toBe(1);
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalledWith(
                `The link you've used can't be recognised`,
                `Please check the link you were sent. If it still doesn't work, call 0300 303 0655 for immediate contact with a video hearings officer.`,
                false
            );
        });
    });

    describe('initialiseForm', () => {
        it('should initialise the form', () => {
            expect(component.magicLinkForm.controls['name'].value).toBe('');
            expect(component.magicLinkForm.controls['name'].valid).toBeFalse();
            expect(component.magicLinkForm.controls['magicLinkParticipantRole'].value).toBe('');
            expect(component.magicLinkForm.controls['magicLinkParticipantRole'].valid).toBeFalse();
        });
    });
});
