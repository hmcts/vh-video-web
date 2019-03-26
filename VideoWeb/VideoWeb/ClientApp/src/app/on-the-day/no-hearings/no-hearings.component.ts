import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-no-hearings',
  templateUrl: './no-hearings.component.html'
})
export class NoHearingsComponent implements OnInit {
  noHearingForm: FormGroup;
  loadingData: boolean;

  constructor(private router: Router, private fb: FormBuilder) {
    this.loadingData = true;
    this.noHearingForm = fb.group({
      nextButton: new FormControl()
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    this.router.navigate([PageUrls.CameraAndMicrophone]);
  }
}
