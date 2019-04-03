import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/video-web.service';

@Component({
  selector: 'app-judge-hearing-list',
  templateUrl: './judge-hearing-list.component.html'
})

export class JudgeHearingListComponent implements OnInit {
  conferences: ConferenceForUserResponse[];
  hearingListForm: FormGroup;
  loadingData: boolean;
  interval: any;

  constructor(private videoWebService: VideoWebService, private router: Router) {
    this.loadingData = true;
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
}
