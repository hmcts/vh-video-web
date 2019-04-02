import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/video-web.service';

@Component({
  selector: 'app-hearing-list',
  templateUrl: './hearing-list.component.html'
})

export class HearingListComponent implements OnInit {
  conferences: ConferenceForUserResponse[];
  hearingListForm: FormGroup;
  loadingData: boolean;
  interval: any;

  constructor(private videoWebService: VideoWebService, private router: Router, private fb: FormBuilder) {
    this.loadingData = true;
    this.hearingListForm = fb.group({
    });
  }

  ngOnInit() {
    this.retrieveHearingsForUser();
    this.interval = setInterval(() => {
      this.retrieveHearingsForUser();
    }, 30000);
  }

  retrieveHearingsForUser() {
    this.videoWebService.getConferencesForUser().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
      console.log(data);
    },
    () => {
      this.loadingData = false;
    });
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  onSubmit() {
    this.router.navigate([PageUrls.CameraAndMicrophone]);
  }

}
