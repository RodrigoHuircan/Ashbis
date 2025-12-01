import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent,
  IonList, IonItem, IonAvatar, IonSkeletonText,
  IonButton, IonLabel, IonIcon, 
  IonFab, IonFabButton // Importar componentes FAB
} from '@ionic/angular/standalone';
import { RefresherCustomEvent } from '@ionic/angular';
import { Auth, authState } from '@angular/fire/auth';
import { of, take } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirestoreService, Mascota } from '../firebase/firestore';
import { Router, RouterLink } from '@angular/router'; // Importar RouterLink
import { addIcons } from 'ionicons';
import { add, qrCodeOutline } from 'ionicons/icons'; // Importar iconos

@Component({
  selector: 'app-mis-mascotas',
  standalone: true,
  imports: [
    NgIf, NgFor, RouterLink, // Añadir RouterLink a imports
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonRefresher, IonRefresherContent,
    IonList, IonItem, IonAvatar, IonSkeletonText,
    IonButton, IonLabel, IonIcon,
    IonFab, IonFabButton // Añadir FABs a imports
  ],
  templateUrl: './listar-mascotas.component.html',
  providers: [DatePipe],
})
export class ListarMascotasComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private fs = inject(FirestoreService);
  private router = inject(Router);

  loading = signal(true);
  mascotas = signal<Mascota[]>([]);
  usuarioUid = signal<string | null>(null);

  constructor() {
    // Registrar los iconos
    addIcons({ add, qrCodeOutline });

    authState(this.auth)
      .pipe(
        switchMap(user => {
          const uid = user?.uid ?? null;
          this.usuarioUid.set(uid);
          return uid ? this.fs.getUserPets(uid) : of<Mascota[]>([]);
        })
      )
      .subscribe(pets => {
        this.mascotas.set(pets ?? []);
        this.loading.set(false);
      });
  }

  ngOnInit() {}

  ngOnDestroy() {
    // Limpieza si fuera necesaria
  }

  trackById = (_: number, m: Mascota) => m.id;

  doRefresh(ev: Event): void {
    const refresher = ev as RefresherCustomEvent;
    const uid = this.usuarioUid();

    if (!uid) {
      refresher.target.complete();
      return;
    }

    this.loading.set(true);
    this.fs.getUserPets(uid).pipe(take(1)).subscribe({
      next: pets => {
        this.mascotas.set(pets ?? []);
        this.loading.set(false);
        refresher.target.complete();
      },
      error: () => {
        this.loading.set(false);
        refresher.target.complete();
      }
    });
  }

  // Navega al perfil (solo lectura)
  goPerfil(m: Mascota) {
    this.router.navigate(['/tabs/perfil-mascota', m.id], { state: { mascota: m } });
  }

  // Navega al dashboard de edición
  goEditar(m: Mascota) {
    // Ruta corregida: 'mascota-editar/:id' (sin /editar al final, según tus rutas actuales)
    this.router.navigate(['/tabs/mascota-editar', m.id], { state: { mascota: m } });
  }

  // Función para ir al QR específico de la mascota
  // Acepta el evento para detener la propagación del clic
  verQrMascota(m: Mascota, event: Event) {
    event.stopPropagation(); // Evita que se abra el perfil al hacer clic en el QR
    this.router.navigate(['/tabs/mascota-qr'], { 
      queryParams: { mascotaId: m.id } 
    });
  }
}