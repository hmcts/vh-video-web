import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
})
export class DeclarationComponent implements OnInit {
  declarationForm: FormGroup;
  submitted = false;

  constructor(private router: Router, private fb: FormBuilder) {
    this.declarationForm = fb.group({
      declare: [false, Validators.required],
    });
  }

  ngOnInit() {}

  onSubmit() {
    this.submitted = true;
    if (this.declarationForm.invalid) {
      return;
    }
    const navigateUrl = '/home';
    this.router.navigate([navigateUrl]);
  }
}
