import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { CustomValidators } from 'src/app/shared/custom-validators';

@Component({
    selector: 'app-magic-links',
    templateUrl: './magic-links.component.html'
})
export class MagicLinksComponent implements OnInit {
    private loggerPrefix = '[MagicLinksComponent] -';

    error: {
        nameError: String;
        roleError: String;
    };

    isFormValid = false;
    role = Role;
    magicLinkForm: FormGroup;
    hearingId: string;
    magicLinkNameFormControl: FormControl;
    magicLinkRoleFormControl: FormControl;
    magicLinkParticipantRoles: Role[] = [];

    constructor(
        private logger: Logger,
        private errorService: ErrorService,
        private formBuilder: FormBuilder,
        private readonly magicLinksService: MagicLinksService,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.resetErrors();
        this.initialiseForm();
        this.hearingId = this.route.snapshot.paramMap.get('hearingId');
        this.magicLinksService.validateMagicLink(this.hearingId).subscribe(isValid => {
            if (isValid) {
                debugger;
                this.magicLinksService.getMagicLinkParticipantRoles().subscribe(roles => {
                    debugger;
                    this.magicLinkParticipantRoles = roles;
                });
            } else {
                this.errorService.goToServiceError(
                    `The link you've used can't be recognised`,
                    `Please check the link you were sent. If it still doesn't work, call 0300 303 0655 for immediate contact with a video hearings officer.`,
                    false
                );
            }
        });
    }

    initialiseForm() {
        this.magicLinkNameFormControl = this.formBuilder.control('', [Validators.required, CustomValidators.notEmptyOrWhitespaceValidator]);
        this.magicLinkRoleFormControl = this.formBuilder.control('', Validators.required);

        this.magicLinkForm = this.formBuilder.group({
            name: this.magicLinkNameFormControl,
            magicLinkParticipantRole: this.magicLinkRoleFormControl
        });
    }

    validateForm() {
        let errorsFound = false;

        if (this.magicLinkNameFormControl.invalid) {
            this.error.nameError = 'Please enter your full name';
            errorsFound = true;
        }

        if (this.magicLinkRoleFormControl.invalid) {
            this.error.roleError = 'Please choose your role in the hearing';
            errorsFound = true;
        }

        this.isFormValid = !errorsFound;
        return this.isFormValid;
    }

    resetErrors() {
        this.error = {
            nameError: '',
            roleError: ''
        };
    }

    onSubmit() {
        this.resetErrors();
        this.validateForm();

        if (this.isFormValid) {
            this.magicLinksService
                .joinHearing(this.hearingId, this.magicLinkNameFormControl.value, this.magicLinkRoleFormControl.value)
                .subscribe(response => {
                    this.logger.info(`${this.loggerPrefix} Joined conference as magic link participant`, {
                        apiResponse: response
                    });
                });
        }
    }
}
