import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { AdalService } from 'adal-angular4';
import { Logger } from 'src/app/services/logging/logger-base';
import { TestCallScoreResponse, ConferenceResponse, ParticipantResponse, SelfTestPexipResponse } from 'src/app/services/clients/api-client';

@Injectable()
export abstract class BaseSelfTestComponent implements OnInit {

    testInProgress: boolean;
    hideSelfTest = false;

    loadingData: boolean;
    conference: ConferenceResponse;
    participant: ParticipantResponse;
    conferenceId: string;
    selfTestPexipConfig: SelfTestPexipResponse;

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected adalService: AdalService,
        protected logger: Logger) { }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        if (this.conferenceId) {
          this.getConference();
        } else {
          this.getPexipConfig();
        }
        this.testInProgress = false;
    }

    getConference(): void {
        
        this.logger.debug(`retrieving conference ${this.conferenceId}`);
        this.videoWebService.getConferenceById(this.conferenceId).
            subscribe((response) => {
                this.logger.debug(`retrieved conference ${this.conferenceId} successfully`);
                this.loadingData = false;
                this.conference = response;
                this.participant = response.participants
                    .find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
            }, (error) => {
                this.loadingData = false;
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            });
    }

    getPexipConfig(): void {
      this.logger.debug(`retrieving pexip configuration`);
      this.videoWebService.getPexipConfig().
        subscribe((response) => {
          this.logger.debug(`retrieved pexip configuration successfully`);
          this.selfTestPexipConfig = response;
          console.log('Self test Pexip cofig: ' + this.selfTestPexipConfig);
        }, (error) => {
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
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
