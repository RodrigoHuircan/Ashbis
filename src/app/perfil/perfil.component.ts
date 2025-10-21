// src/app/perfil/perfil.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, DatePipe } from '@angular/common'; // ⬅️ importa NgIf o CommonModule
import { AuthenticationService } from '../firebase/authentication';
import { FirestoreService } from '../firebase/firestore';
import { Models } from '../models/models';
import {
  IonContent, IonCard, IonSkeletonText,
  IonItem, IonLabel, IonInput
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  // Basta con NgIf; si prefieres, puedes usar CommonModule en su lugar.
  imports: [
    NgIf, /* o CommonModule */
    IonContent, IonCard,
    IonSkeletonText, IonItem, IonLabel, IonInput,
  ],
  providers: [DatePipe]
})
export class PerfilComponent implements OnInit {
  authenticationService: AuthenticationService = inject(AuthenticationService);
  firestoreService: FirestoreService = inject(FirestoreService);

  user: { email: string; name: string } | null = null;
  user_profile!: Models.Auth.UserProfile;

  new_name = '';
  new_photo = '';
  new_age: number | null = null;
  cargando = false;

  defaultPhoto = 'assets/img/foto_avatar.jpg';

  constructor() {
    this.cargando = true;
    this.authenticationService.authState.subscribe(res => {
      if (res) {
        this.user = { email: res.email, name: res.displayName };
        this.getDatosProfile(res.uid);
      } else {
        this.user = null;
        this.cargando = false;
      }
    });
  }

  ngOnInit() {}

  getDatosProfile(uid: string) {
    this.firestoreService
      .getDocumentChanges<Models.Auth.UserProfile>(`${Models.Auth.PathUsers}/${uid}`)
      .subscribe(res => {
        if (res) {
          this.user_profile = res;
          console.log('this.user_profile -> ', this.user_profile);
        }
        this.cargando = false;
      });
  }

  // Si tu campo "date" es Firestore Timestamp:
  get fechaNacimiento(): Date | null {
    const ts: any = (this.user_profile as any)?.date;
    return ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
  }
}
