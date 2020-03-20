import { ConferenceResponse, SelfTestFailureReason, AddSelfTestFailureEventRequest } from 'src/app/services/clients/api-client';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';

export abstract class EquipmentCheckBaseComponent {
    form: FormGroup;
    submitted = false;

    conferenceId: string;
    conference: ConferenceResponse;
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
        this.videoWebService
            .getConferenceById(this.conferenceId)
            .then(conference => {
                this.conference = conference;
                const participant = this.conference.participants.find(
                    x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
                );
                this.participantId = participant.id.toString();
                this.participantName = this.videoWebService.getObfuscatedName(participant.first_name + ' ' + participant.last_name);
            })
            .catch(error => {
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            });
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
        if (this.form.invalid) {
            if (this.equipmentCheck.value === 'No') {
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
            return;
        }
        this.navigateToNextPage();
    }
}
