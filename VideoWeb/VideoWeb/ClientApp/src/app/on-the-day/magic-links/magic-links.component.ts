import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';

@Component({
    selector: 'app-magic-links',
    templateUrl: './magic-links.component.html'
})
export class MagicLinksComponent implements OnInit {
    constructor(private readonly magicLinksService: MagicLinksService, private route: ActivatedRoute) {}

    ngOnInit(): void {
        const hearingId = this.route.snapshot.paramMap.get('hearingId');
        this.magicLinksService.validateMagicLink(hearingId).subscribe(res => console.log(res));
    }
}
