import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent {
  pageUrl: string;

  constructor(private router: Router) {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = router.url;
      });
  }
}
