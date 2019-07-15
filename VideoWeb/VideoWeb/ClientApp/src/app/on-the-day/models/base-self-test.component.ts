import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { AdalService } from 'adal-angular4';
import { Logger } from 'src/app/services/logging/logger-base';
import { TestCallScoreResponse, ConferenceResponse, ParticipantResponse } from 'src/app/services/clients/api-client';

@Injectable()
export abstract class BaseSelfTestComponent implements OnInit {

    testInProgress: boolean;
    hideSelfTest = false;

    loadingData: boolean;
    conference: ConferenceResponse;
    participant: ParticipantResponse;

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected adalService: AdalService,
        protected logger: Logger) { }

    ngOnInit() {
        this.getConference();
        this.testInProgress = false;
    }

    getConference(): void {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.logger.debug(`retrieving conference ${conferenceId}`);
        this.videoWebService.getConferenceById(conferenceId).
            subscribe((response) => {
                this.logger.debug(`retrieved conference ${conferenceId} successfully`);
                this.loadingData = false;
                this.conference = response;
                this.participant = response.participants
                    .find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
            }, (error) => {
                this.loadingData = false;
                this.errorService.handleApiError(error);
            });
    }

    onTestStarted() {
        this.testInProgress = true;
    }

    restartTest() {
        this.testInProgress = false;
        this.hideSelfTest = false;
    }

    abstract onSelfTestCompleted(testcallScore: TestCallScoreResponse): void;
}
