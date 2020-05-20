import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-declaration',
    templateUrl: './declaration.component.html'
})
export class DeclarationComponent implements OnInit {
    declarationForm: FormGroup;
    submitted = false;
    conferenceId: string;

    constructor(private router: Router, private route: ActivatedRoute, private fb: FormBuilder) {
        this.declarationForm = this.fb.group({
            declare: [false, [Validators.required, Validators.requiredTrue]]
        });
    }

    ngOnInit() {
        console.log(this.route);
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    onSubmit() {
        this.submitted = true;
        if (this.declarationForm.invalid) {
            return;
        }
        this.router.navigate([pageUrls.ParticipantWaitingRoom, this.conferenceId]);
    }
}
