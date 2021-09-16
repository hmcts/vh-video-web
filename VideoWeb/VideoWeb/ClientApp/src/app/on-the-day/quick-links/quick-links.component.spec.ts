import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { ErrorService } from 'src/app/services/error.service';
import { MockComponent, MockPipe } from 'ng-mocks';
import { QuickLinksComponent } from './quick-links.component';
import { Role } from 'src/app/services/clients/api-client';
import { ContactUsFoldingComponent } from 'src/app/shared/contact-us-folding/contact-us-folding.component';
import { Logger } from 'src/app/services/logging/logger-base';
import { RouterTestingModule } from '@angular/router/testing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { By } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingComponent } from 'src/app/shared/loading/loading.component';

describe('QuickLinksComponent', () => {
    const quickLinkParticipantRoles = [Role.QuickLinkObserver, Role.QuickLinkParticipant];

    let component: QuickLinksComponent;
    let fixture: ComponentFixture<QuickLinksComponent>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let quickLinksServiceSpy: jasmine.SpyObj<QuickLinksService>;
    let routerSpy: jasmine.SpyObj<Router>;

    let validateQuickLinkSubject: Subject<boolean>;

    const testHearingId = 'testHearingId';

    beforeEach(async () => {
        errorServiceSpy = jasmine.createSpyObj('errorServiceSpy', {
            goToServiceError: () => {}
        });

        quickLinksServiceSpy = jasmine.createSpyObj('quickLinksService', {
            getQuickLinkParticipantRoles: of(quickLinkParticipantRoles),
            joinConference: of({})
        });

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

        quickLinksServiceSpy = jasmine.createSpyObj<QuickLinksService>('QuickLinksService', [
            'validateQuickLink',
            'getQuickLinkParticipantRoles',
            'joinConference'
        ]);
        quickLinksServiceSpy.getQuickLinkParticipantRoles.and.returnValue(of(quickLinkParticipantRoles));
        quickLinksServiceSpy.joinConference.and.returnValue(of(true));

        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError']);

        await TestBed.configureTestingModule({
            declarations: [
                QuickLinksComponent,
                MockComponent(ContactUsFoldingComponent),
                MockComponent(LoadingComponent),
                MockPipe(TranslatePipe)
            ],
            providers: [
                {
                    provide: Logger,
                    useValue: {
                        info: () => {}
                    }
                },
                {
                    provide: Router,
                    useValue: routerSpy
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get(param: string) {
                                    return testHearingId;
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
                    provide: QuickLinksService,
                    useValue: quickLinksServiceSpy
                }
            ],
            imports: [ReactiveFormsModule, RouterTestingModule]
        }).compileComponents();
    });

    beforeEach(() => {
        validateQuickLinkSubject = new Subject<boolean>();
        quickLinksServiceSpy.validateQuickLink.and.returnValue(validateQuickLinkSubject.asObservable());

        fixture = TestBed.createComponent(QuickLinksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnInit', () => {
        let resetErrorsSpy: jasmine.SpyObj<any>;
        let initializeFormSpy: jasmine.SpyObj<any>;

        beforeEach(() => {
            resetErrorsSpy = spyOn(component, 'resetErrors');
            initializeFormSpy = spyOn(component, 'initializeForm');
            resetErrorsSpy.and.callThrough();
            initializeFormSpy.and.callThrough();

            validateQuickLinkSubject.next(true);
            fixture.detectChanges();
        });

        it('should call method to reset errors', () => {
            expect(resetErrorsSpy.calls.count()).toBe(1);
        });

        it('should call method to initialize the form', () => {
            expect(initializeFormSpy.calls.count()).toBe(1);
        });

        it('should call quick links service to get participant roles if quick link is valid', () => {
            expect(quickLinksServiceSpy.getQuickLinkParticipantRoles.calls.count()).toBe(1);
            expect(component.quickLinkParticipantRoles).toEqual(quickLinkParticipantRoles);
        });
    });

    describe('when hearing is validated', () => {
        beforeEach(() => {
            validateQuickLinkSubject.next(true);
            fixture.detectChanges();
        });

        describe('initializeForm', () => {
            it('should initialize the form', () => {
                component.initializeForm();

                expect(component.quickLinkForm.controls['name'].value).toBe('');
                expect(component.quickLinkForm.controls['name'].valid).toBeFalse();
                expect(component.quickLinkForm.controls['quickLinkParticipantRole'].value).toBe('');
                expect(component.quickLinkForm.controls['quickLinkParticipantRole'].valid).toBeFalse();
            });
        });

        describe('validateForm', () => {
            it('should set name error and mark form as invalid if name is not populated', () => {
                component.error.nameError = false;
                component.quickLinkForm.controls['name'].setValue('');

                expect(component.validateForm()).toBeFalse();
                expect(component.error.nameError).toBeTrue();
            });

            it('should set name error and mark form as invalid if name contains special chars', () => {
                component.error.nameError = false;
                component.quickLinkForm.controls['name'].setValue('#Peter C*nolly');

                expect(component.validateForm()).toBeFalse();
                expect(component.error.nameError).toBeTrue();
            });

            it('should set role error and mark form as invalid if role is not selected', () => {
                component.error.roleError = false;
                component.quickLinkForm.controls['quickLinkParticipantRole'].setValue('');

                component.validateForm();

                expect(component.validateForm()).toBeFalse();
                expect(component.error.roleError).toBeTrue();
            });

            it('should mark form as valid if form validations are all passed', () => {
                component.quickLinkForm.controls['name'].setValue('name');
                component.quickLinkForm.controls['quickLinkParticipantRole'].setValue('quickLinkParticipantRole');

                expect(component.validateForm()).toBeTrue();
            });
        });

        describe('resetErrors', () => {
            it('should resets errors', () => {
                component.error.nameError = component.error.roleError = component.notEmptyOrWhitespaceError = component.specialCharError = true;
                component.resetErrors();
                expect(component.error.nameError).toBeFalse();
                expect(component.error.roleError).toBeFalse();
                expect(component.notEmptyOrWhitespaceError).toBeFalse();
                expect(component.specialCharError).toBeFalse();
            });
        });

        describe('onSubmit', () => {
            let validateFormSpy: jasmine.Spy;
            let resetErrorsSpy: jasmine.Spy;

            beforeEach(() => {
                validateFormSpy = spyOn(component, 'validateForm');
                resetErrorsSpy = spyOn(component, 'resetErrors');
            });

            it('should reset errors', () => {
                component.onSubmit();

                expect(resetErrorsSpy).toHaveBeenCalledTimes(1);
            });

            it('should validate the form', () => {
                component.onSubmit();

                expect(validateFormSpy).toHaveBeenCalledTimes(1);
            });

            describe('when form is valid', () => {
                beforeEach(() => {
                    validateFormSpy.and.returnValue(true);
                });

                it('should try and join the conference', () => {
                    component.onSubmit();

                    expect(quickLinksServiceSpy.joinConference).toHaveBeenCalledOnceWith(
                        component.hearingId,
                        component.quickLinkNameFormControl.value,
                        component.quickLinkRoleFormControl.value
                    );
                });

                it('should navigate to the navigator when joined is returned', fakeAsync(() => {
                    validateFormSpy.and.returnValue(true);

                    const hearingJoinedSubject = new Subject<boolean>();

                    quickLinksServiceSpy.joinConference.and.returnValue(hearingJoinedSubject.asObservable());

                    component.onSubmit();
                    hearingJoinedSubject.next(true);
                    flush();

                    expect(routerSpy.navigate).toHaveBeenCalledOnceWith([pageUrls.Navigator]);
                }));

                describe('when form is NOT valid', () => {
                    beforeEach(() => {
                        validateFormSpy.and.returnValue(false);
                    });
                    it('should NOT try and join the conference', () => {
                        component.onSubmit();
                        expect(quickLinksServiceSpy.joinConference).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe('continue button', () => {
            let buttonElement;

            beforeEach(() => {
                buttonElement = fixture.debugElement.query(By.css('#continue-button'));
            });

            it('should be present', () => {
                expect(buttonElement).toBeTruthy();
            });

            it('should submit form when clicked', () => {
                spyOn(component, 'onSubmit');
                buttonElement.nativeElement.click();
                expect(component.onSubmit).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('validate hearing', () => {
        const headingKey = 'quick-participant-errors.invalid-page.heading';
        const bodyKey = 'quick-participant-errors.invalid-page.body';

        beforeEach(() => {});

        it('should call goToServiceError if the link is NOT valid', fakeAsync(() => {
            validateQuickLinkSubject.next(false);

            // Act
            flush();

            // Expect
            expect(quickLinksServiceSpy.validateQuickLink).toHaveBeenCalledOnceWith(testHearingId);
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalledOnceWith(headingKey, bodyKey, false);
        }));

        it('should NOT call goToServiceError if the link is valid', fakeAsync(() => {
            validateQuickLinkSubject.next(true);

            // Act
            flush();

            // Expect
            expect(quickLinksServiceSpy.validateQuickLink).toHaveBeenCalledOnceWith(testHearingId);
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        }));
    });
});
