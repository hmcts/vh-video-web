import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../security/auth.gaurd';
import { ContactUsComponent } from './contact-us/contact-us.component';


export const routes: Routes = [
  { path: 'contact-us', component: ContactUsComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SharedRoutingModule { }
