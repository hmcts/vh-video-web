import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../services/models/session-keys';

@Component({
    selector: 'app-venue-list',
    templateUrl: './venue-list.component.html',
    styleUrls: ['./venue-list.component.scss']
})
export class VenueListComponent implements OnInit {
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    judges: string[];
    selectedJudges: string[];
    venueListLoading: boolean;

    constructor(private videoWebService: VideoWebService, private router: Router) {
        this.selectedJudges = [];
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    async ngOnInit() {
        this.venueListLoading = false;
        this.videoWebService.getDistinctJudgeNames().then(response => {
            this.judges = response.first_names;
            console.log(response);
            this.selectedJudges = this.judgeAllocationStorage.get();
            this.venueListLoading = false;
        });
    }

    get venuesSelected(): boolean {
        return this.selectedJudges && this.selectedJudges.length > 0;
    }

    updateSelection() {
        this.judgeAllocationStorage.set(this.selectedJudges);
    }

    goToHearingList() {
        this.updateSelection();
        this.router.navigateByUrl(pageUrls.AdminHearingList);
    }
}
