import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ParticipantResponse, TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-participant-self-test',
  templateUrl: './participant-self-test.component.html',
  styleUrls: ['./participant-self-test.component.scss']
})
export class ParticipantSelfTestComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private adalService: AdalService,
    private logger: Logger
  ) { }

  ngOnInit() {
    this.getConference();
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.logger.debug(`retrieving conference ${conferenceId}`);
    this.videoWebService.getConferenceById(conferenceId).
      subscribe((response) => {
        this.logger.debug(`retrieved conference ${conferenceId} successfully`);
        this.loadingData = false;
        this.conference = response;
        this.participant = response.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
      }, (error) => {
        this.loadingData = false;
        this.errorService.handleApiError(error);
      });
  }

  onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
    this.logger.debug(`participant self test completed`);
    if (testcallScore) { this.logger.debug(testcallScore.toJSON()); }
    this.router.navigate([PageUrls.CameraWorking, this.conference.id]);
  }

}
