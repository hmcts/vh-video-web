import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { PageUrls } from '../shared/page-url.constants';
import { ErrorService } from '../services/error.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private errorService: ErrorService
  ) {
  }

  ngOnInit() {
    this.navigateToHearingList();
  }

  navigateToHearingList() {
    this.profileService.getUserProfile().subscribe((data: UserProfileResponse) => {
      if (data.role === UserRole.Judge) {
        this.router.navigate([PageUrls.JudgeHearingList]);
      } else if (data.role === UserRole.VideoHearingsOfficer) {
        this.router.navigate([PageUrls.AdminHearingList]);
      } else {
        this.router.navigate([PageUrls.ParticipantHearingList]);
      }
    }, (error) => {
      this.errorService.handleApiError(error);
    });
  }

}
