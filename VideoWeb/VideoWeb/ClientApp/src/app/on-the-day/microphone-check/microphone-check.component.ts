import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { VideoWebService } from '../../services/api/video-web.service';
import { AddSelfTestFailureEventRequest, ConferenceResponse, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-microphone-check',
    templateUrl: './microphone-check.component.html'
})
export class MicrophoneCheckComponent implements OnInit {
    form: FormGroup;
    submitted = false;
    conferenceId: string;
    conference: ConferenceResponse;
    participantId: string;
    participantName: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private videoWebService: VideoWebService,
        private adalService: AdalService,
        private errorService: ErrorService,
        private logger: Logger
    ) {}

    ngOnInit() {
        this.getConference();
        this.form = this.fb.group({
            microphoneCheck: [false, Validators.pattern('Yes')]
        });
    }

    getConference(): void {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.videoWebService.getConferenceById(this.conferenceId).subscribe(
            conference => {
                this.conference = conference;
                const participant = this.conference.participants.find(
                    x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
                );
                this.participantId = participant.id.toString();
                this.participantName = this.videoWebService.getObfuscatedName(participant.first_name + ' ' + participant.last_name);
            },
            error => {
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            }
        );
    }

    showError(): boolean {
        return this.form.invalid && this.submitted && this.form.pristine;
    }

    get microphoneCheck(): AbstractControl {
        return this.form.get('microphoneCheck');
    }

    onSubmit() {
        this.submitted = true;
        if (this.form.invalid) {
            if (this.microphoneCheck.value === 'No') {
                this.videoWebService
                    .raiseSelfTestFailureEvent(
                        this.conferenceId,
                        new AddSelfTestFailureEventRequest({
                            participant_id: this.participantId,
                            self_test_failure_reason: SelfTestFailureReason.Microphone
                        })
                    )
                    .subscribe(
                        () => {},
                        error => {
                            this.logger.error('Failed to raise "AddSelfTestFailureEventRequest"', error);
                        }
                    );
                this.logger.info(
                    `Microphone check | ConferenceId : ${this.conferenceId} | Participant : ${this.participantName} responded microphone not working.`
                );
                this.router.navigate([PageUrls.GetHelp]);
            }
            return;
        }
        this.router.navigate([PageUrls.VideoWorking, this.conferenceId]);
    }

    checkEquipmentAgain() {
        this.logger.info(
            `Microphone check | ConferenceId : ${this.conferenceId} | Participant : ${this.participantName} requested check equipment again.`
        );
        this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
    }
}
