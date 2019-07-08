import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from '../../services/api/video-web.service';
import {
  AddSelfTestFailureEventRequest, ConferenceResponse,
  SelfTestFailureReason
} from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'app-video-check',
  templateUrl: './video-check.component.html'
})
export class VideoCheckComponent implements OnInit {
  form: FormGroup;
  submitted = false;
  conferenceId: string;
  conference: ConferenceResponse;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private videoWebService: VideoWebService,
    private adalService: AdalService
  ) { }

  ngOnInit() {
    this.getConference();
    this.form = this.fb.group({
      videoCheck: [false, Validators.pattern('Yes')],
    });
  }

  getConference(): void {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(this.conferenceId)
      .subscribe((conference) => this.conference = conference);
  }

  showError(): boolean {
    return this.form.invalid && this.submitted && this.form.pristine;
  }

  get videoCheck(): AbstractControl { return this.form.get('videoCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      if (this.videoCheck.value === 'No') {

        const participant = this.conference.participants.
          find(x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());

        this.videoWebService.raiseMediaProblemEvent(this.conferenceId,
          new AddSelfTestFailureEventRequest({
            participant_id: participant.id.toString(),
            self_test_failure_reason: SelfTestFailureReason.Video
          }))
          .subscribe(x => { },
            (error) => {
              console.error(error);
            });
        this.router.navigate([PageUrls.GetHelp]);
      }
      return;
    }
    this.router.navigate([PageUrls.HearingRules, this.conferenceId]);
  }

  checkEquipmentAgain() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
