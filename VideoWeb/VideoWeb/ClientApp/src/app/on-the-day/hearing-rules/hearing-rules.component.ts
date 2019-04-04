import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-hearing-rules',
  templateUrl: './hearing-rules.component.html'
})
export class HearingRulesComponent implements OnInit {
  hearingRulesForm: FormGroup;
  loadingData: boolean;
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder) {
    this.loadingData = true;
    this.hearingRulesForm = fb.group({
      nextButton: new FormControl()
    });
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  onSubmit() {
    this.router.navigate([PageUrls.Declaration, this.conferenceId]);
  }
}
