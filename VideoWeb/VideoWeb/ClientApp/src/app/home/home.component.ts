import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { UserProfileResponse } from '../services/clients/api-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  constructor(
    private router: Router,
    private profileService: ProfileService
  ) {
  }

  ngOnInit() {
    this.navigateToHearingList();
  }

  navigateToHearingList() {
    this.profileService.getUserProfile().subscribe((data: UserProfileResponse) => {
      if (data.role === 'Judge') {
        this.router.navigate(['judge/hearing-list']);
      } else if (data.role === 'VhOfficer') {
        this.router.navigate(['admin/hearing-list']);
      } else {
        this.router.navigate(['participant/hearing-list']);
      }
    });
  }

}
