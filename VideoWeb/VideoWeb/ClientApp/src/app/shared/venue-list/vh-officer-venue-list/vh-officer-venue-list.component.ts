import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { JusticeUserResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { pageUrls } from '../../page-url.constants';
import { VenueListComponentDirective } from '../venue-list.component';
import { ProfileService } from 'src/app/services/api/profile.service';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    standalone: false,
    selector: 'app-vh-officer-venue-list',
    templateUrl: '../venue-list.component.html',
    styleUrls: ['../venue-list.component.scss']
})
export class VhOfficerVenueListComponent extends VenueListComponentDirective implements OnInit {
    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService,
        protected profileService: ProfileService,
        protected translateService: TranslateService
    ) {
        super(videoWebService, router, vhoQueryService, logger, ldService, profileService, translateService);
    }

    get showVhoSpecificContent(): boolean {
        return true;
    }

    ngOnInit() {
        super.ngOnInit();
        this.videoWebService.getCSOs().subscribe(async value => {
            const items = [...value];
            items.unshift(
                new JusticeUserResponse({
                    id: VhOfficerVenueListComponent.UNALLOCATED,
                    first_name: 'Unallocated',
                    full_name: 'Unallocated'
                })
            );
            const loggedInCso = await this.getLoggedInCso(items);
            if (loggedInCso !== undefined) {
                items.unshift(
                    new JusticeUserResponse({
                        id: VhOfficerVenueListComponent.ALLOCATED_TO_ME,
                        first_name: 'Allocated to me',
                        full_name: 'Allocated to me'
                    })
                );
            }
            this.csos = items;
            const previousFilter = this.csoAllocationStorage.get();
            if (previousFilter) {
                this.updateCsoFilterSelection(previousFilter);
            }
        });
    }

    async goToHearingList() {
        this.errorMessage = null;

        if (this.activeSessions) {
            this.selectedCsos = [];
            this.selectedVenues = [];
            this.csoAllocationStorage.clear();
            this.judgeAllocationStorage.clear();
        } else if (this.csosSelected) {
            await this.updateCsoSelection();
        } else {
            this.updateVenueSelection();
        }

        if (!this.venuesSelected && !this.csosSelected && !this.activeSessions) {
            this.logger.warn('[VenueList] - No venues or csos selected');
            this.errorMessage = 'Please select a filter to view hearings';
            return;
        }

        await this.router.navigateByUrl(pageUrls.AdminHearingList);
    }

    async updateCsoFilterSelection(filter: CsoFilter) {
        const selectCso = (csoId: string) => {
            if (!this.csos.find(c => c.id === csoId)) {
                return;
            }
            this.selectedCsos = [...this.selectedCsos, csoId];
        };
        const loggedInCso = await this.getLoggedInCso(this.csos);
        const loggedInCsoId = loggedInCso?.id;
        filter.allocatedCsoIds.forEach(id => {
            if (id === loggedInCsoId) {
                selectCso(VhOfficerVenueListComponent.ALLOCATED_TO_ME);
                return;
            }
            selectCso(id);
        });
        if (filter.includeUnallocated) {
            selectCso(VhOfficerVenueListComponent.UNALLOCATED);
        }
    }
}
