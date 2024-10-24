import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonDirective } from '~/components/ui-button-helm/src';
import {
  createFormField,
  createFormGroup,
  SignalInputDirective,
  V,
} from 'ng-signal-forms';


import { Router, RouterModule } from '@angular/router';
import { AuthService } from '~/app/auth/auth.service';
import { LoaderCircle, LucideAngularModule } from 'lucide-angular';


interface ResponseLogin{
  message?: string;
  jwtToken?: string;
}

import { HlmInputDirective } from '~/components/ui-input-helm/src';
import { UserService } from '~/app/home/services/user.service';
import { toast } from 'ngx-sonner';
import { Usuario } from '~/app/admin/compras/interface/usuario';
import { GeolocationService } from '~/app/services/geolocation.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'left-seccion',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    HlmInputDirective,
    HlmButtonDirective,
    FormsModule,
    SignalInputDirective,
    RouterModule,
    
  ],
  providers: [AuthService, Router, UserService, GeolocationService],
  templateUrl: './left-seccion.component.html'
})
export class LeftSeccionComponent {
  
  constructor(private authService: AuthService, private router: Router,private userService: UserService, private geoService: GeolocationService,private http: HttpClient) {}

  disabled = signal(false);
  res = signal<ResponseLogin | null>(null);

  protected formModel = createFormGroup({
    username: createFormField('', {
      validators: [
        {
          validator: V.required(),
          message: 'El nombre de usuario es requerido',
        },
        {
          validator: V.maxLength(50),
          message: 'El nombre de usuario debe tener menos de 50 caracteres',
        }
      ],
    }),
    password: createFormField('', {
      validators: [
        {
          validator: V.required(),
          message: 'La contraseña es requerida',
        },
        {
          validator: V.maxLength(20),
          message: 'La contraseña debe tener menos de 20 caracteres',
        },
        
      ],
    }),
  });

  login() {
    console.log('Login');
    console.log(this.formModel.value());
    console.log(this.formModel.valid());
    console.log(this.formModel.errors());
    

    if (this.formModel.valid()) { // Cambiado a verificar si el formulario es válido
      this.disabled.set(true);
      console.log(this.formModel.value());
      
      this.authService.login(this.formModel.value()).subscribe({
        next: (response) => {


          //eliminar la ubicación actual
          this.geoService.deleteLocation(this.geoService.getAnonymousToken());
          localStorage.removeItem('anonymousToken');

          localStorage.setItem('token', response.jwtToken);
          localStorage.setItem('userId', response.id);
          
      
          
          this.userService.getUser(response.id).subscribe({
            next: (user) => {
              console.log('Usuario cargado correctamente', user);
              this.userService.saveUserData(user).then(()=>{
                console.log('Usuario guardado');


                console.log('role:', user.role);

                this.geoService.getCurrentPosition().then((position) => {
                  console.log('Posición actual:', position);
                  console.log('token:', localStorage.getItem('token'));
                  if(position){
                    const deviceInfo = this.geoService.getDeviceName();
                    if(this.geoService.isLogged()){
                      this.geoService.sendLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        isLogged: 1,
                        token: localStorage.getItem('token') || '',
                        browser: deviceInfo.browser,
                        deviceType: deviceInfo.deviceType
                      });
                    }      
                  }
                }
                );

                if(user.role === 'Admin'){
                  this.router.navigate(['/admin/productos']);
                }
                else{
                  this.router.navigate(['/products']);
                }
              });
            },
            complete: () => {
              console.log('Usuario cargado correctamente', this.userService.userData()?.id);
             
              
            },
            error: (error) => {
              console.error('Error al cargar el usuario', error);
            }
          });

        },
        error: (error) => {
          this.disabled.set(false);
          this.res.set(error.error);
          console.error(error.error.message);
          setTimeout(() => {
            this.res.set(null);
          }
          , 2000);
        },
        complete: () => {
          this.disabled.set(false);
        }
      });
    } else {
      console.error("Formulario no es válido:", this.formModel.errorsArray());
    }
}

  }

