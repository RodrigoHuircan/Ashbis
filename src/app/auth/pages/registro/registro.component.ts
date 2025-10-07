import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { IonContent, IonInput, IonNote, IonIcon, 
  IonSelect, IonSelectOption,  IonButton, IonSpinner
 } from '@ionic/angular/standalone';
import { Models } from 'src/app/models/models';
import { FirestoreService } from 'src/app/firebase/firestore';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,IonContent, IonInput, IonNote, IonIcon, 
  IonSelect, IonSelectOption,  IonButton, IonSpinner],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent  implements OnInit {
  private fb: FormBuilder = inject(FormBuilder)
  authenticationService: AuthenticationService  = inject(AuthenticationService);
  firestoreService:  FirestoreService = inject(FirestoreService)
  private router = inject(Router);
  mostrarPass = false;
  mostrarPass2 = false;
  datosForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    telefono: ['', Validators.required],
    direccion: ['', Validators.required],
    region: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  })
  cargando: boolean;


  constructor() { 
    addIcons({ eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  async registrarse(){
    this.cargando = true;
    console.log('datosForm -> ', this.datosForm);
    if(this.datosForm.valid){
      const data = this.datosForm.value;
      console.log('valid -> ', data);
      try{
        const respuesta = await this.authenticationService.createUser(data.email, data.password)
        let profile: Models.Auth.UpdateProfileI = {
          displayName: data.nombre
        }
        const datosUser: Models.Auth.UserProfile = {
          id: respuesta.user.uid,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,    
          direccion: data.direccion,
          region: data.region,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword
        }
        console.log('user -> ', respuesta)
        await this.firestoreService.createDocument(Models.Auth.PathUsers, datosUser, respuesta.user.uid)
        this.router.navigate(['/login'])
      } catch (error){
        console.log('registrarse error -> ',  error);
      }
    }

    this.cargando = false;
  }

  irALogin(){
    this.router.navigate(['/login'])
  }
}

