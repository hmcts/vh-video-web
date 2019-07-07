import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { VideoWebService } from '../../services/api/video-web.service';
import { AddMediaProblemEventRequest, ConferenceResponse, MediaType } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'app-microphone-check',
  templateUrl: './microphone-check.component.html'
})
export class MicrophoneCheckComponent implements OnInit {
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
      microphoneCheck: [false, Validators.pattern('Yes')],
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

  get microphoneCheck(): AbstractControl { return this.form.get('microphoneCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      if (this.microphoneCheck.value === 'No') {

        const participant = this.conference.participants.
          find(x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());

        this.videoWebService.raiseMediaProblemEvent(this.conferenceId,
          new AddMediaProblemEventRequest({ participant_id: participant.id.toString(), media_type: MediaType.Microphone }))
          .subscribe(x => { },
            (error) => {
              console.error(error);
            });
        this.router.navigate([PageUrls.GetHelp]);
      }
      return;
    }
    this.router.navigate([PageUrls.VideoWorking, this.conferenceId]);
  }

  checkEquipmentAgain() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
