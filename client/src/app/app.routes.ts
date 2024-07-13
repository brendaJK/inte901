import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TestComponent } from './test/test.component';
import { AuthGuard } from './auth/login.guard';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { AdminComponent } from './admin/admin.component';
import { VentasComponent } from './admin/ventas/ventas.component';
import { PedidoStateComponent } from './pedido-state/pedido-state.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { PlaceComponent } from './place/place.component';

import { DescriptionPlaceComponent } from './place/description-place/description-place.component';
import { ComprasComponent } from './admin/compras/compras.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AuthenticatedGuard } from './auth/route.guard';




export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard], // Este guardia redirige a los usuarios autenticados fuera del login
  },
  {
    path: 'test',
    component: TestComponent // Este guardia protege las rutas autenticadas
  },
  {
    path: '',
    component: LandingPageComponent
  },
  {
    path: 'products',
    component: HomeComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'ventas',
        component: VentasComponent
      },
      {
        path: 'compras',
        component: ComprasComponent
      }
    ]
  },
  {
    path: 'estatus',
    component: PedidoStateComponent
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'places',
    component: PlaceComponent
  },
  {
<<<<<<< HEAD
    path: 'description/:id',
    component: DescriptionPlaceComponent
=======
    path:'checkout',
    component: CheckoutComponent,
    canActivate: [AuthenticatedGuard]
>>>>>>> 794e55d6d95b03e017aca7a867425a51c153934d
  }
];
