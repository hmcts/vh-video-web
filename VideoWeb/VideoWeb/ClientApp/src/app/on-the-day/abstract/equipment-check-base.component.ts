import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { PageUrls } from 'src/app/shared/page-url.constants';

export abstract class EquipmentCheckBaseComponent {
    form: FormGroup;
    submitted = false;

    conferenceId: string;
    conference: ConferenceLite;
    participantId: string;
    participantName: string;

    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected fb: FormBuilder,
        protected videoWebService: VideoWebService,
        protected adalService: AdalService,
        protected errorService: ErrorService,
        protected logger: Logger
    ) {}

    abstract getEquipmentCheck(): string;
    abstract getFailureReason(): SelfTestFailureReason;
    abstract navigateToNextPage(): void;

    initForm() {
        this.form = this.fb.group({
            equipmentCheck: [false, Validators.pattern('Yes')]
        });
    }

    get equipmentCheck(): AbstractControl {
        return this.form.get('equipmentCheck');
    }

    getConference(): void {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveConference();
        const participant = this.conference.participants.find(
            x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );
        this.participantId = participant.id;
        this.participantName = participant.obfuscatedDisplayName;
    }

    checkEquipmentAgain() {
        this.logger.info(
            `${this.getEquipmentCheck()} check | ConferenceId : ${this.conferenceId} | Participant : ${
                this.participantName
            } requested check equipment again.`
        );
        this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
    }

    showError(): boolean {
        return this.form.invalid && this.submitted && this.form.pristine;
    }

    async onSubmit() {
        this.submitted = true;
        if (this.form.pristine) {
            return;
        }

        if (this.form.valid && this.form.dirty) {
            this.navigateToNextPage();
            return;
        }
        try {
            await this.videoWebService.raiseSelfTestFailureEvent(
                this.conferenceId,
                new AddSelfTestFailureEventRequest({
                    participant_id: this.participantId,
                    self_test_failure_reason: this.getFailureReason()
                })
            );

            this.logger.info(
                `Camera check | ConferenceId : ${this.conferenceId} | Participant : ${this.participantName} responded camera not working.`
            );
            this.router.navigate([PageUrls.GetHelp]);
        } catch (error) {
            this.logger.error('Failed to raise "SelfTestFailureEvent"', error);
        }
    }
}
