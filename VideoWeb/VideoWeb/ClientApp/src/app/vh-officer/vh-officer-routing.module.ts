import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { VhOfficerVenueListComponent } from '../shared/venue-list/vh-officer-venue-list/vh-officer-venue-list.component';
import { CommandCentreComponent } from './command-centre/command-centre.component';

const routes: Routes = [
    { path: '', redirectTo: pageUrls.AdminVenueList, pathMatch: 'full' },
    { path: 'venue-list', component: VhOfficerVenueListComponent, data: { title: 'VHO Admin dashboard' } },
    {
        path: 'hearing-list',
        component: CommandCentreComponent,
        data: { title: 'VHO Admin dashboard' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VhOfficerRoutingModule {}
