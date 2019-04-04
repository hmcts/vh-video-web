import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, Validators, FormBuilder, FormControl } from '@angular/forms';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html'
})
export class DeclarationComponent implements OnInit {
  declarationForm: FormGroup;
  submitted = false;
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.declarationForm = fb.group({
      declare: [false, Validators.required],
    });
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  onSubmit() {
    this.submitted = true;
    if (this.declarationForm.invalid) {
      return;
    }

    console.log(PageUrls.WaitingRoom);
    console.log(this.conferenceId);
    this.router.navigate([PageUrls.WaitingRoom, this.conferenceId]);
  }
}
