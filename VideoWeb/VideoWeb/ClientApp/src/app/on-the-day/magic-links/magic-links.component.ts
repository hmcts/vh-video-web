import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { CustomValidators } from 'src/app/shared/custom-validators';
import { pageUrls } from 'src/app/shared/page-url.constants';

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
        private router: Router,
        private formBuilder: FormBuilder,
        private readonly magicLinksService: MagicLinksService,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.resetErrors();
        this.initialiseForm();
        this.hearingId = this.route.snapshot.paramMap.get('hearingId');
    }

    initialiseForm() {
        this.magicLinkNameFormControl = this.formBuilder.control('', [Validators.required, CustomValidators.notEmptyOrWhitespaceValidator]);
        this.magicLinkRoleFormControl = this.formBuilder.control('', Validators.required);

        this.magicLinksService.getMagicLinkParticipantRoles().subscribe(roles => {
            this.magicLinkParticipantRoles = roles;
        });

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
                .subscribe(
                    response => {
                        this.logger.info(`${this.loggerPrefix} Joined conference as magic link participant`, {
                            apiResponse: response
                        });

                        console.log('response');

                        this.router.navigate([pageUrls.Navigator]);
                    },
                    error => console.log(this.loggerPrefix, error)
                );
        }
    }
}
