import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../security/auth.guard';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ErrorComponent } from './error/error.component';
import { NotFoundComponent } from './not-found/not-found.component';


export const routes: Routes = [
  { path: 'contact-us', component: ContactUsComponent, canActivate: [AuthGuard] },
  { path: 'service-error', component: ErrorComponent, },
  { path: 'not-found', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SharedRoutingModule { }
