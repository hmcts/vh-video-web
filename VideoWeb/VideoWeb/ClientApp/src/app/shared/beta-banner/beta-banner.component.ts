import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent {
  pageUrl: string;

  constructor(private router: Router) {
    this.router.events
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = router.url;
      });
  }
}
