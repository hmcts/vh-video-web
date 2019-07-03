import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-video-check',
  templateUrl: './video-check.component.html'
})
export class VideoCheckComponent implements OnInit {

  form: FormGroup;
  submitted = false;
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.form = this.fb.group({
      videoCheck: [false, Validators.pattern('Yes')],
    });
  }

  showError(): boolean {
    return this.form.invalid && this.submitted && this.form.pristine;
  }

  get videoCheck(): AbstractControl { return this.form.get('videoCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      if (this.videoCheck.value === 'No') {
        this.router.navigate([PageUrls.GetHelp]);
      }
      return;
    }
    this.router.navigate([PageUrls.HearingRules, this.conferenceId]);
  }

  checkEquipmentAgain() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }

}
