import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { ErrorService } from 'src/app/services/error.service';
import { MockComponent, MockPipe } from 'ng-mocks';
import { QuickLinksComponent } from './quick-links.component';
import { TranslatePipeMock } from '../../testing/mocks/mock-translation-pipe';
import { Role } from 'src/app/services/clients/api-client';
import { ContactUsFoldingComponent } from 'src/app/shared/contact-us-folding/contact-us-folding.component';
import { Logger } from 'src/app/services/logging/logger-base';
import { RouterTestingModule } from '@angular/router/testing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { By } from '@angular/platform-browser';

describe('QuickLinksComponent', () => {
    const quickLinkParticipantRoles = [Role.QuickLinkObserver, Role.QuickLinkParticipant];

    let component: QuickLinksComponent;
    let fixture: ComponentFixture<QuickLinksComponent>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let quickLinksServiceSpy: jasmine.SpyObj<QuickLinksService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        errorServiceSpy = jasmine.createSpyObj('errorServiceSpy', {
            goToServiceError: () => {}
        });

        quickLinksServiceSpy = jasmine.createSpyObj('quickLinksService', {
            getQuickLinkParticipantRoles: of(quickLinkParticipantRoles),
            joinHearing: of({})
        });

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [QuickLinksComponent, MockComponent(ContactUsFoldingComponent), MockPipe(TranslatePipeMock)],
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
                    provide: QuickLinksService,
                    useValue: quickLinksServiceSpy
                }
            ],
            imports: [ReactiveFormsModule, RouterTestingModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickLinksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        console.log(fixture);
    });

    describe('ngOnInit', () => {
        it('should call method to initialise errors', () => {
            const spy = spyOn(component, 'resetErrors');
            component.ngOnInit();
            expect(spy.calls.count()).toBe(1);
        });

        it('should call method to initialise the form', () => {
            const spy = spyOn(component, 'initialiseForm');
            component.ngOnInit();
            expect(spy.calls.count()).toBe(1);
        });

        it('should call quick links service to get participant roles if quick link is valid', () => {
            expect(quickLinksServiceSpy.getQuickLinkParticipantRoles.calls.count()).toBe(1);
            expect(component.quickLinkParticipantRoles).toEqual(quickLinkParticipantRoles);
        });
    });

    describe('initialiseForm', () => {
        it('should initialise the form', () => {
            component.initialiseForm();

            expect(component.quickLinkForm.controls['name'].value).toBe('');
            expect(component.quickLinkForm.controls['name'].valid).toBeFalse();
            expect(component.quickLinkForm.controls['quickLinkParticipantRole'].value).toBe('');
            expect(component.quickLinkForm.controls['quickLinkParticipantRole'].valid).toBeFalse();
        });
    });

    describe('validateForm', () => {
        it('should set name error and mark form as invalid if name is not populated', () => {
            component.isFormValid = true;
            component.error.nameError = '';
            component.quickLinkForm.controls['name'].setValue('');

            component.validateForm();

            expect(component.isFormValid).toBeFalse();
            expect(component.error.nameError).toBe('Please enter your full name');
        });

        it('should set role error and mark form as invalid if name is not populated', () => {
            component.isFormValid = true;
            component.error.roleError = '';
            component.quickLinkForm.controls['quickLinkParticipantRole'].setValue('');

            component.validateForm();

            expect(component.isFormValid).toBeFalse();
            expect(component.error.roleError).toBe('Please choose your role in the hearing');
        });

        it('should mark form as valid if form validations are all passed', () => {
            component.isFormValid = false;
            component.quickLinkForm.controls['name'].setValue('name');
            component.quickLinkForm.controls['quickLinkParticipantRole'].setValue('quickLinkParticipantRole');

            component.validateForm();

            expect(component.isFormValid).toBeTrue();
        });
    });

    describe('resetErrors', () => {
        it('should resets errors', () => {
            component.error.nameError = component.error.roleError = 'error';
            component.resetErrors();
            expect(component.error.nameError).toBe('');
        });
    });

    describe('onSubmit', () => {
        it('should reset errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');

            component.onSubmit();

            expect(resetErrorsSpy).toHaveBeenCalledTimes(1);
        });

        it('should validate the form', () => {
            const validateFormSpy = spyOn(component, 'validateForm');

            component.onSubmit();

            expect(validateFormSpy).toHaveBeenCalledTimes(1);
        });

        it('should try and join the conference if the form is valid', () => {
            spyOn(component, 'validateForm');
            component.isFormValid = true;

            component.onSubmit();

            expect(quickLinksServiceSpy.joinHearing).toHaveBeenCalledOnceWith(
                component.hearingId,
                component.quickLinkNameFormControl.value,
                component.quickLinkRoleFormControl.value
            );
        });

        it('should navigate to the navigator when joined is returned', fakeAsync(() => {
            spyOn(component, 'validateForm');
            component.isFormValid = true;

            const hearingJoinedSubject = new Subject<boolean>();

            quickLinksServiceSpy.joinHearing.and.returnValue(hearingJoinedSubject.asObservable());

            component.onSubmit();
            hearingJoinedSubject.next(true);
            flush();

            expect(routerSpy.navigate).toHaveBeenCalledOnceWith([pageUrls.Navigator]);
        }));
    });

    describe('continue button', () => {
        let buttonElement;

        beforeEach(() => {
            buttonElement = fixture.debugElement.query(By.css('#continue-button'));
        });

        it('should submit form when clicked', () => {
            spyOn(component, 'onSubmit');
            buttonElement.nativeElement.click();
            expect(component.onSubmit).toHaveBeenCalledTimes(1);
        });
    });
});
