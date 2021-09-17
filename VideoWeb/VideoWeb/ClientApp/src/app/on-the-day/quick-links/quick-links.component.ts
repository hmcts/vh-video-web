import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, first, map, takeUntil } from 'rxjs/operators';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { CustomValidators } from 'src/app/shared/custom-validators';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-quick-links',
    templateUrl: './quick-links.component.html'
})
export class QuickLinksComponent implements OnInit, OnDestroy {
    private loggerPrefix = '[QuickLinksComponent] -';

    @ViewChild('fullName', { static: false }) inputFullName: ElementRef;

    error: {
        nameError: boolean;
        notEmptyOrWhitespaceError: boolean;
        specialCharError: boolean;
        roleError: boolean;
    };

    role = Role;
    quickLinkForm: FormGroup;
    hearingId: string;
    quickLinkNameFormControl: FormControl;
    quickLinkRoleFormControl: FormControl;
    quickLinkParticipantRoles: Role[] = [];
    hearingValidated = false;

    pending$ = new BehaviorSubject(false);
    private destroyed$ = new Subject();

    constructor(
        private logger: Logger,
        private router: Router,
        private formBuilder: FormBuilder,
        private readonly quickLinksService: QuickLinksService,
        private route: ActivatedRoute,
        private errorService: ErrorService
    ) {}

    ngOnInit(): void {
        this.hearingId = this.route.snapshot.paramMap.get('hearingId');
        this.quickLinksService
            .validateQuickLink(this.hearingId)
            .pipe(
                takeUntil(this.destroyed$),
                catchError(() => of(false)),
                first(),
                map(isValid => {
                    if (!isValid) {
                        this.errorService.goToServiceError(
                            'quick-participant-errors.invalid-page.heading',
                            'quick-participant-errors.invalid-page.body',
                            false
                        );
                    }
                    this.resetErrors();
                    this.initializeForm();
                    this.hearingValidated = true;
                })
            )
            .subscribe();
    }

    focusToInput(): void {
        this.inputFullName.nativeElement.focus();
    }

    initializeForm() {
        this.quickLinkNameFormControl = this.formBuilder.control('', [
            Validators.required,
            CustomValidators.specialCharValidator,
            CustomValidators.notEmptyOrWhitespaceValidator
        ]);
        this.quickLinkRoleFormControl = this.formBuilder.control('', Validators.required);

        this.quickLinksService.getQuickLinkParticipantRoles().subscribe(roles => {
            this.quickLinkParticipantRoles = roles;
        });

        this.quickLinkForm = this.formBuilder.group({
            name: this.quickLinkNameFormControl,
            quickLinkParticipantRole: this.quickLinkRoleFormControl
        });
    }

    validateForm() {
        let errorsFound = false;

        if (this.quickLinkNameFormControl.invalid) {
            if (this.quickLinkNameFormControl.errors['emptyOrWhitespaceError']) {
                this.error.notEmptyOrWhitespaceError = true;
                this.error.nameError = true;
            }
            if (this.quickLinkNameFormControl.errors['specialCharError']) {
                this.error.specialCharError = true;
                this.error.nameError = true;
            }
            errorsFound = true;
        }

        if (this.quickLinkRoleFormControl.invalid) {
            this.error.roleError = true;
            errorsFound = true;
        }

        return !errorsFound;
    }

    resetErrors() {
        this.error = {
            nameError: false,
            notEmptyOrWhitespaceError: false,
            specialCharError: false,
            roleError: false
        };
    }

    onSubmit() {
        this.resetErrors();

        if (this.validateForm()) {
            this.pending$.next(true);
            this.quickLinksService
                .joinConference(this.hearingId, this.quickLinkNameFormControl.value, this.quickLinkRoleFormControl.value)
                .pipe(first(), takeUntil(this.destroyed$))
                .subscribe(
                    response => {
                        this.logger.info(`${this.loggerPrefix} Joined conference as quick link participant`, {
                            apiResponse: response
                        });

                        this.router.navigate([pageUrls.Navigator]);
                        this.pending$.next(false);
                    },
                    error => {
                        this.logger.error('[Login] - Redirect Failed', error);
                        this.pending$.next(false);
                    }
                );
        }
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }
}
