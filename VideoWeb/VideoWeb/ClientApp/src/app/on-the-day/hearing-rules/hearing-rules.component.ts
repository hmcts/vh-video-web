import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-hearing-rules',
    templateUrl: './hearing-rules.component.html',
    styleUrls: ['./hearing-rules.component.scss']
})
export class HearingRulesComponent implements OnInit {
    conferenceId: string;

    constructor(private router: Router, private route: ActivatedRoute) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    goToDeclaration() {
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
    }
}
