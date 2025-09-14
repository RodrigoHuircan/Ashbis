import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { IonicModule, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent  implements OnInit {
  private fb: FormBuilder = inject(FormBuilder)
  authenticationService: AuthenticationService  = inject(AuthenticationService);
  datosForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  })
  cargando: boolean;

  constructor() { }

  ngOnInit() {}

  async registrarse(){
    this.cargando = true;
    console.log('datosForm -> ', this.datosForm);
    if(this.datosForm.valid){
      const data = this.datosForm.value;
      console.log('valid -> ', data);
      try{
        const user = await this.authenticationService.createUser(data.email, data.password)
        console.log('user -> ', user)
      } catch (error){
        console.log('registrarse error -> ',  error);
      }
    }

    this.cargando = false;
  }
}

