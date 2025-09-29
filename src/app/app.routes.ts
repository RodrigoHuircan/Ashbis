import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { TabsComponent } from './tabs/tabs.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./auth/pages/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'tabs',
    component: TabsComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.component').then((m) => m.HomePage),
      },
      {
        path: 'listar-mascotas',
        loadComponent: () => import('./listar-mascotas/listar-mascotas.component').then((m) => m.ListarMascotasComponent),
      },
      {
        path: 'crear-mascotas',
        loadComponent: () => import('./crear-mascotas/crear-mascotas.component').then((m) => m.CrearMascotasComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login', 
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login', 
  },
];