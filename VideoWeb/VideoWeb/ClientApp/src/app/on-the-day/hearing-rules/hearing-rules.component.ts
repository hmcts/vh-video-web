import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-hearing-rules',
  templateUrl: './hearing-rules.component.html'
})
export class HearingRulesComponent implements OnInit {
  hearingRulesForm: FormGroup;
  loadingData: boolean;

  constructor(private router: Router, private fb: FormBuilder) {
    this.loadingData = true;
    this.hearingRulesForm = fb.group({
      nextButton: new FormControl()
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    this.router.navigate([PageUrls.Declaration]);
  }
}
