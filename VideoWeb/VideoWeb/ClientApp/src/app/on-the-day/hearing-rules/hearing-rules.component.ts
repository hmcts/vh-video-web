import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-hearing-rules',
  templateUrl: './hearing-rules.component.html'
})
export class HearingRulesComponent implements OnInit {
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  goToDeclaration() {
    this.router.navigate([PageUrls.Declaration, this.conferenceId]);
  }
}
