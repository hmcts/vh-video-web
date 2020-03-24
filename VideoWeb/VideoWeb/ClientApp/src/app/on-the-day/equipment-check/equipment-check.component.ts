import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-equipment-check',
    templateUrl: './equipment-check.component.html'
})
export class EquipmentCheckComponent implements OnInit {
    conferenceId: string;

    constructor(private router: Router, private route: ActivatedRoute) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    goToCameraAndMicCheck() {
        if (this.conferenceId) {
            this.router.navigate([PageUrls.SwitchOnCameraMicrophone, this.conferenceId]);
        } else {
            this.router.navigate([PageUrls.SwitchOnCameraMicrophone]);
        }
    }
}
