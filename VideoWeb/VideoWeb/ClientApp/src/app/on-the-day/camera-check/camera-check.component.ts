import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-camera-check',
  templateUrl: './camera-check.component.html'
})
export class CameraCheckComponent implements OnInit {
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
      cameraCheck: [false, Validators.pattern('Yes')],
    });
  }

  showError(): boolean {
    return this.form.invalid && this.submitted && this.form.pristine;
  }

  get cameraCheck(): AbstractControl { return this.form.get('cameraCheck'); }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.router.navigate([PageUrls.MicrophoneCheck, this.conferenceId]);
  }

  checkEquipmentAgain() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
