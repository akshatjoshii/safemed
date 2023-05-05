import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './pages/auth/login/login.component';
import {SignupComponent} from './pages/auth/signup/signup.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {AngularFireAuthGuard, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {DataComponent} from './pages/data/data.component';
import {UserGuard} from './guard/user.guard';
import {CsvToJsonComponent} from './pages/csv-to-json/csv-to-json.component';
import {BulkUpdateComponent} from "./pages/bulk-update/bulk-update.component";
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'auth/signup',
    component: SignupComponent,
    canActivate: [UserGuard]
  },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  {
    path: 'data',
    component: DataComponent,
    canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  {
    path: 'bulk-update',
    component: BulkUpdateComponent,
    canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  {
    path: 'csv-to-json',
    component: CsvToJsonComponent,
    canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
