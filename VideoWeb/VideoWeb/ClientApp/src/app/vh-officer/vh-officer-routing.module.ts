import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VhoHearingsComponent } from './hearings/vho-hearings.component';
import { VenueListComponent } from './venue-list/venue-list.component';
import { PageUrls } from '../shared/page-url.constants';

const routes: Routes = [
    { path: '', redirectTo: PageUrls.AdminVenueList },
    { path: 'venue-list', component: VenueListComponent, data: { title: 'VHO Admin dashboard' } },
    { path: 'hearing-list', component: VhoHearingsComponent, data: { title: 'VHO Admin dashboard' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VhOfficerRoutingModule {}
