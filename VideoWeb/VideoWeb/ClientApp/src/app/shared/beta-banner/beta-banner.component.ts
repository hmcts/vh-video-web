import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import 'rxjs/add/operator/filter';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent {
  pageUrl: string;
  @Input() isRepresentativeOrIndividual: boolean;

  constructor(private router: Router) {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = router.url;
      });
  }
}
