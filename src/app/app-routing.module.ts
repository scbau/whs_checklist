import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { NotVisitedComponent } from './modules/notvisited/not.visited.component';
import { ChecklistComponent } from './modules/checklist/checklist.component';
import { ForkliftChecklistComponent } from './modules/checklist/forklift.checklist.component';
import { VSRChecklistComponent } from './modules/checklist/vsr.checklist.component';
import { WarehouseChecklistComponent } from './modules/checklist/warehouse.checklist.component';
import { LoginComponent } from './modules/login/login.component';
import { SettingsComponent } from './modules/settings/settings.component';
// import { UploadComponent } from './modules/settings/upload.component';

import { AuthGuard } from './modules/_helpers/auth.guard';
import {
  RoleGuardService as RoleGuard
} from './services/auth/role-guard.service';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Scorecard',
      expectedRole: ['admin']
    }
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/not-visited',
    component: NotVisitedComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Not Visited',
      expectedRole: ['admin']
    }
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/checksheet',
    component: ChecklistComponent,
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/checksheet/vsr',
    component: VSRChecklistComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always',
    data: {
      title: 'VSR Pre-start Checklist',
      expectedRole: ['admin', 'stateAdmin', 'entityAdmin']
    }
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/checksheet/forklift',
    component: ForkliftChecklistComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always',
    data: {
      title: 'Forklift Pre-start Checklist',
      expectedRole: ['admin', 'stateAdmin', 'entityAdmin', 'storeAdmin']
    }
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/checksheet/warehouse',
    component: WarehouseChecklistComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always',
    data: {
      title: 'Warehouse Depot Checklist',
      expectedRole: ['admin', 'stateAdmin', 'entityAdmin', 'storeAdmin']
    }
    // outlet: 'sidebarContent'
  },
  {
    path: 'dashboard/settings',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
    // outlet: 'sidebarContent'
  },
  { 
    path: 'login', 
    component: LoginComponent,
    data: {
      title: ''
    }
  },
  { path: '**', redirectTo: 'dashboard/checksheet/forklift' }
];

@NgModule({
  // imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
