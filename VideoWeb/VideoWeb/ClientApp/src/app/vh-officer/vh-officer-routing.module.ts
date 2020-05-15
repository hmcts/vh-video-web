import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { CommandCentreComponent } from './command-centre/command-centre.component';
import { VenueListComponent } from './venue-list/venue-list.component';

const routes: Routes = [
    { path: '', redirectTo: pageUrls.AdminVenueList },
    { path: 'venue-list', component: VenueListComponent, data: { title: 'VHO Admin dashboard' } },
    { path: 'hearing-list', component: CommandCentreComponent, data: { title: 'VHO Admin dashboard' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VhOfficerRoutingModule {}
