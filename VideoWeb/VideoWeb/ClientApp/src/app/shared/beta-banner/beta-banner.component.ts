import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { ProfileService } from 'src/app/services/api/profile.service';
import { UserRole } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent {
  pageUrl: string;
  isRepresentativeOrIndividual: boolean;

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private errorService: ErrorService,
  ) {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = router.url;
      });

    this.profileService.getUserProfile()
      .then((profile) => {
        this.isRepresentativeOrIndividual = (profile.role === (UserRole.Individual || UserRole.Representative));
      })
      .catch((error) => this.errorService.handleApiError(error));
  }
}
