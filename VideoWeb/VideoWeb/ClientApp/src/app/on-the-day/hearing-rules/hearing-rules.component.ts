import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-hearing-rules',
  templateUrl: './hearing-rules.component.html'
})
export class HearingRulesComponent implements OnInit {
  constructor(private router: Router) {
  }

  ngOnInit() {
  }

  onSubmit() {
    this.router.navigate([PageUrls.Declaration]);
  }
}
