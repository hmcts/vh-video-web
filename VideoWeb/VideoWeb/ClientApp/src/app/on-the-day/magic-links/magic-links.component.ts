import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';

@Component({
    selector: 'app-magic-links',
    templateUrl: './magic-links.component.html'
})
export class MagicLinksComponent implements OnInit {
    role = Role;
    magicLinkForm: FormGroup;
    magicLinkParticipantRoles: Role[] = [];

    constructor(
        private errorService: ErrorService,
        private formBuilder: FormBuilder,
        private readonly magicLinksService: MagicLinksService,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.initialiseForm();
        const hearingId = this.route.snapshot.paramMap.get('hearingId');
        this.magicLinksService.validateMagicLink(hearingId).subscribe(isValid => {
            if (isValid) {
                this.magicLinksService.getMagicLinkParticipantRoles().subscribe(roles => {
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
        this.magicLinkForm = this.formBuilder.group({
            name: ['', Validators.required],
            magicLinkParticipantRole: ['', Validators.required]
        });
    }

    onSubmit() {
        console.log(this.magicLinkForm);
    }
}
