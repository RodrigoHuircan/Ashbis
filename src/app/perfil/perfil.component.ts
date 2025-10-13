import { Component, inject, OnInit } from '@angular/core';
import { AuthenticationService } from '../firebase/authentication';
import { FirestoreService } from '../firebase/firestore';
import { Models } from '../models/models';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent  implements OnInit {
  authenticationService: AuthenticationService  = inject(AuthenticationService);
  firestoreService:  FirestoreService = inject(FirestoreService)


  user: {email: string, name: string}
  user_profile: Models.Auth.UserProfile

  new_name: string = ''
  new_photo: string = ''
  new_age: number = null
  cargando: boolean = false



  constructor() { 
    this.cargando = true;
    this.authenticationService.authState.subscribe( res => {
      console.log('res = ', res);
      if (res){
        this.user = {
          email: res.email,
          name: res.displayName
        }
      }
      else{
        this.user = null
        this.cargando = false
      }
    })


  }
  ngOnInit() {}

}
