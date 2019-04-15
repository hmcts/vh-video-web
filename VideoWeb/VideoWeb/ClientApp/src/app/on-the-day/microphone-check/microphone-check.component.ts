import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';


@Component({
  selector: 'app-microphone-check',
  templateUrl: './microphone-check.component.html'
})
export class MicrophoneCheckComponent implements OnInit {

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
      microphoneCheck: [false, Validators.pattern('Yes')],
    });
  }

  showError(): boolean {
    return this.form.invalid && this.submitted && this.form.pristine;
  }

  get microphoneCheck(): AbstractControl { return this.form.get('microphoneCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.router.navigate([PageUrls.HearingRules, this.conferenceId]);
  }

}
