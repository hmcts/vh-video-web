import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BaseSelfTestComponent } from '../models/base-self-test.component';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { SelfTestComponent } from '../../shared/self-test/self-test.component';

@Component({
  selector: 'app-independent-self-test',
  templateUrl: './independent-self-test.component.html',
  styleUrls: ['./independent-self-test.component.scss']
})
export class IndependentSelfTestComponent extends BaseSelfTestComponent {

  @ViewChild(SelfTestComponent)
  selfTestComponent: SelfTestComponent;

  showEquipmentFaultMessage: boolean;
  contact = {
    phone: VhContactDetails.phone
  };

  constructor(private router: Router,
    protected route: ActivatedRoute,
    protected videoWebService: VideoWebService,
    protected errorService: ErrorService,
    protected adalService: AdalService,
    protected logger: Logger) {
    super(route, videoWebService, errorService, adalService, logger);
    this.showEquipmentFaultMessage = false;
  }

  onSelfTestCompleted(testcallScore: TestCallScoreResponse): void {
    this.testInProgress = false;
    this.logger.debug(`independent self test completed`);
    if (testcallScore) { this.logger.debug(testcallScore.toJSON()); }
  }

  equipmentWorksHandler() {
    this.router.navigateByUrl(PageUrls.ParticipantHearingList);
    this.hideSelfTest = true;
  }

  equipmentFaultyHandler() {
    this.showEquipmentFaultMessage = true;
    this.testInProgress = false;
    this.hideSelfTest = true;
  }

  restartTest() {
    this.logger.debug('representative self-test');
    super.restartTest();
    this.showEquipmentFaultMessage = false;
    this.selfTestComponent.replayVideo();
  }
}
