import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PageUrls } from '../page-url.constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  hideContactUsLink = false;
  privacyPolicyUri = PageUrls.PrivacyPolicy;
  accessibilityUri = PageUrls.Accessibility;
  hideLinksForUnsupportedBrowser = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event: RouterEvent) => event instanceof NavigationEnd)
    ).subscribe(x => {
      this.hideContactUs();
      this.hideLinks();
    });
  }

  ngOnInit() {
    this.hideContactUs();
  }

  hideContactUs() {
    this.hideContactUsLink = this.router.url === '/contact-us';
  }

  hideLinks() {
    this.hideLinksForUnsupportedBrowser = this.router.url === `/${PageUrls.UnsupportedBrowser}`;
  }
}






