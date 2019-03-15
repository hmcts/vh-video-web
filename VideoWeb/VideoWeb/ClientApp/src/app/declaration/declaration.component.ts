import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
})
export class DeclarationComponent implements OnInit {
  @ViewChild('declarationForm')
  form: any;
  submitted = false;

  constructor(private router: Router) { }

  ngOnInit() { }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    var navigateUrl = "/home";

    this.router.navigate([navigateUrl]);
  }
}
