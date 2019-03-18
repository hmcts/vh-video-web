import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html'
})
export class DeclarationComponent implements OnInit {
  declarationForm: FormGroup;
  submitted = false;

  constructor(private router: Router, private fb: FormBuilder) {
    this.declarationForm = fb.group({
      declare: [false, Validators.required],
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    this.submitted = true;
    console.log('in declaration submit method');
    if (this.declarationForm.invalid) {
      console.log('in declaration validation error');
      return;
    }
    console.log('in declaration before redirecting');
    const navigateUrl = '/waiting-room';
    this.router.navigate([navigateUrl]);
  }
}
