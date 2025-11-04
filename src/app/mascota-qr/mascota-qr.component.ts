import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../firebase/authentication';
import { FirestoreService } from '../firebase/firestore';
import { Models } from '../models/models';
import { Subject, takeUntil } from 'rxjs';


import { QRCodeComponent } from 'angularx-qrcode';


import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-mascota-qr',
  standalone: true,
  templateUrl: './mascota-qr.component.html',
  styleUrls: ['./mascota-qr.component.scss'],
  imports: [
    CommonModule,
    NgIf,
    RouterLink,
    QRCodeComponent,
    IonContent, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonButton
  ]
})
export class MascotaQrComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();


  authenticationService: AuthenticationService = inject(AuthenticationService);
  firestoreService: FirestoreService = inject(FirestoreService);
  router: Router = inject(Router);


  cargando = false;
  user_profile: Models.Auth.UserProfile | null = null;


  qrData: string | null = null;

  constructor() {
    this.cargando = true;
    this.authenticationService.authState
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.getDatosProfile(res.uid);
        } else {
          this.cargando = false;
          this.router.navigate(['/login']);
        }
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDatosProfile(uid: string) {
    this.firestoreService
      .getDocumentChanges<Models.Auth.UserProfile>(`${Models.Auth.PathUsers}/${uid}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.user_profile = res;

          this.generarVCardString(res);
        }
        this.cargando = false;
      });
  }


  private generarVCardString(perfil: Models.Auth.UserProfile) {
    const nombre = perfil.nombre?.trim() ?? '';
    const apellido = perfil.apellido?.trim() ?? '';
    const telefono = perfil.telefono?.trim() ?? '';


    if (nombre && telefono) {
      this.qrData = `BEGIN:VCARD
VERSION:3.0
N:${apellido};${nombre};;;
FN:${nombre} ${apellido}
TEL;TYPE=CELL:${telefono}
NOTE:¡Encontré a esta mascota!
END:VCARD`;
    } else {

      this.qrData = null;
    }
  }
}
