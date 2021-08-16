import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { CustomValidators } from 'src/app/shared/custom-validators';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-quick-links',
    templateUrl: './quick-links.component.html'
})
export class QuickLinksComponent implements OnInit, OnDestroy {
    private loggerPrefix = '[QuickLinksComponent] -';

    error: {
        nameError: string;
        roleError: string;
    };
    role = Role;
    quickLinkForm: FormGroup;
    hearingId: string;
    quickLinkNameFormControl: FormControl;
    quickLinkRoleFormControl: FormControl;
    quickLinkParticipantRoles: Role[] = [];
    quickLinkSubscriptions: Subscription = new Subscription();

    constructor(
        private logger: Logger,
        private router: Router,
        private formBuilder: FormBuilder,
        private readonly quickLinksService: QuickLinksService,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.resetErrors();
        this.initialiseForm();
        this.hearingId = this.route.snapshot.paramMap.get('hearingId');
    }

    initialiseForm() {
        this.quickLinkNameFormControl = this.formBuilder.control('', [Validators.required, CustomValidators.notEmptyOrWhitespaceValidator]);
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
            this.error.nameError = 'Please enter your full name';
            errorsFound = true;
        }

        if (this.quickLinkRoleFormControl.invalid) {
            this.error.roleError = 'Please choose your role in the hearing';
            errorsFound = true;
        }

        return !errorsFound;
    }

    resetErrors() {
        this.error = {
            nameError: '',
            roleError: ''
        };
    }

    onSubmit() {
        this.resetErrors();

        if (this.validateForm()) {
            this.quickLinkSubscriptions.add(
                this.quickLinksService
                    .joinConference(this.hearingId, this.quickLinkNameFormControl.value, this.quickLinkRoleFormControl.value)
                    .subscribe(
                        response => {
                            this.logger.info(`${this.loggerPrefix} Joined conference as quick link participant`, {
                                apiResponse: response
                            });

                            this.router.navigate([pageUrls.Navigator]);
                        },
                        error => this.logger.error('[Login] - Redirect Failed', error)
                    )
            );
        }
    }

    ngOnDestroy(): void {
        this.quickLinkSubscriptions.unsubscribe();
    }
}
