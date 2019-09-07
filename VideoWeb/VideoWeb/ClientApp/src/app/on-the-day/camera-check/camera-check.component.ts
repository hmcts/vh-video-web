import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { VideoWebService } from '../../services/api/video-web.service';
import {
  AddSelfTestFailureEventRequest, ConferenceResponse,
  SelfTestFailureReason
} from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-camera-check',
  templateUrl: './camera-check.component.html'
})
export class CameraCheckComponent implements OnInit {
  form: FormGroup;
  submitted = false;
  conferenceId: string;
  conference: ConferenceResponse;
  participantId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private videoWebService: VideoWebService,
    private adalService: AdalService,
    private errorService: ErrorService
  ) { }

  ngOnInit() {
    this.getConference();
    this.form = this.fb.group({
      cameraCheck: [false, Validators.pattern('Yes')],
    });
  }

  getConference(): void {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(this.conferenceId)
      .subscribe((conference) => {
        this.conference = conference;
        const participant = this.conference.participants.
          find(x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());
        this.participantId = participant.id.toString();
      },
        (error) => {
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
        });
  }

  showError(): boolean {
    return this.form.invalid && this.submitted && this.form.pristine;
  }

  get cameraCheck(): AbstractControl { return this.form.get('cameraCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      if (this.cameraCheck.value === 'No') {
        this.videoWebService.raiseSelfTestFailureEvent(this.conferenceId,
          new AddSelfTestFailureEventRequest({
            participant_id: this.participantId,
            self_test_failure_reason: SelfTestFailureReason.Camera
          }))
          .subscribe(x => { },
            (error) => {
              console.error(error);
            });

        this.router.navigate([PageUrls.GetHelp]);
      }
      return;
    }
    this.router.navigate([PageUrls.MicrophoneWorking, this.conferenceId]);
  }

  checkEquipmentAgain() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
