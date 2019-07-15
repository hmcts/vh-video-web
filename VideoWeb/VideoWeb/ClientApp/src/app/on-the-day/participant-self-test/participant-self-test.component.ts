import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponent } from '../models/base-self-test.component';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';

@Component({
  selector: 'app-participant-self-test',
  templateUrl: './participant-self-test.component.html',
  styleUrls: ['./participant-self-test.component.scss']
})
export class ParticipantSelfTestComponent extends BaseSelfTestComponent {

  @ViewChild(SelfTestComponent) selfTestComponent: SelfTestComponent;

  constructor(private router: Router,
    protected route: ActivatedRoute,
    protected videoWebService: VideoWebService,
    protected errorService: ErrorService,
    protected adalService: AdalService,
    protected logger: Logger) {
    super(route, videoWebService, errorService, adalService, logger);
  }

  onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
    this.logger.debug(`participant self test completed`);
    if (testcallScore) { this.logger.debug(testcallScore.toJSON()); }
    this.continueParticipantJourney();
  }

  continueParticipantJourney() {
    this.router.navigate([PageUrls.CameraWorking, this.conference.id]);
  }

  restartTest() {
    this.logger.debug('restarting participant self-test');
    this.selfTestComponent.replayVideo();
  }

}
