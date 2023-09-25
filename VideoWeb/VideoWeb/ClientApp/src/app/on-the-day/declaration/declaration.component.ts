import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-declaration',
    templateUrl: './declaration.component.html'
})
export class DeclarationComponent extends ParticipantStatusBaseDirective implements OnInit {
    declarationForm: UntypedFormGroup;
    submitted = false;
    conferenceId: string;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private fb: UntypedFormBuilder,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, logger);
        this.declarationForm = this.fb.group({
            declare: [false, [Validators.required, Validators.requiredTrue]]
        });
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    onSubmit() {
        this.submitted = true;
        if (this.declarationForm.invalid) {
            return;
        }
        this.router.navigate([pageUrls.ParticipantWaitingRoom, this.conferenceId]);
    }
}
