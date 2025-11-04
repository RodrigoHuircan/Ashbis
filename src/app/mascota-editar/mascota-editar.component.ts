import { Component, inject, signal, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel,
  IonButton, IonAvatar, IonBadge, IonInput, IonSelect, IonSelectOption,
  IonNote, IonModal, IonDatetime, IonDatetimeButton, IonToast, IonIcon, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService, Mascota } from '../firebase/firestore';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';

type Section =
  | 'info'
  | 'calendario'
  | 'vacunas'
  | 'historial'
  | 'medicamentos'
  | 'examenes';

@Component({
  selector: 'app-mascota-editar',
  standalone: true,
  imports: [
    // Angular
    NgIf, NgFor, DatePipe, ReactiveFormsModule,
    // Ionic
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel,
    IonButton, IonAvatar, IonBadge, IonInput, IonSelect, IonSelectOption,
    IonNote, IonModal, IonDatetime, IonDatetimeButton, IonToast, IonIcon,
    IonCard, IonCardContent
  ],
  templateUrl: './mascota-editar.component.html',
  styleUrls: ['./mascota-editar.component.scss'],
  providers: [DatePipe]
})
export class MascotaEditarComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fs = inject(FirestoreService);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);

  toastMsg = signal<string | null>(null);
  toastOpen = signal(false);

  mascota = signal<Mascota | null>(null);
  section = signal<Section>('info');
  fechaMax = new Date().toISOString();

  form!: FormGroup;
  sub?: Subscription;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sub = this.fs.getPetById(id).subscribe(doc => {
      if (doc) {
        this.mascota.set(doc);
        this.buildForm(doc);
      }
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setSection(s: Section) {
    this.section.set(s);
  }

  private buildForm(m: Mascota) {
    this.form = this.fb.group({
      nombre: [m.nombre ?? '', [Validators.required, Validators.maxLength(60)]],
      numeroChip: [m.numeroChip ?? '', [Validators.pattern(/^[0-9]*$/)]],
      edad: [m.edad ?? null, [Validators.min(0)]],
      sexo: [m.sexo ?? ''],
      especie: [m.especie ?? ''],
      raza: [m.raza ?? ''],
      color: [m.color ?? ''],
      castrado: [m.castrado ?? ''],
      fechaNacimiento: [m.fechaNacimiento ?? '']
    });
  }

  get avatar(): string {
    return this.mascota()?.fotoUrl || 'assets/img/logo_ashbis.jpeg';
  }

  async guardarInfo() {
    if (!this.mascota()?.id) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return this.showToast('Revisa los campos resaltados.');
    }

    this.saving.set(true);
    try {
      const payload = { ...this.form.value } as Partial<Mascota>;
      await this.fs.updatePet(this.mascota()!.id, payload);
      this.showToast('Información actualizada.');
    } catch (e) {
      console.error(e);
      this.showToast('Error al guardar. Intenta nuevamente.');
    } finally {
      this.saving.set(false);
    }
  }

  onIonDateChange(ev: CustomEvent) {
    const val = (ev as any).detail?.value as string | null;
    if (!val) return;
    this.form.patchValue({ fechaNacimiento: val });
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    this.toastOpen.set(true);
  }

  // ---------- GALERÍA ----------
  async onAddPhotos(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length || !this.mascota() || !this.auth.currentUser) return;

    this.uploading.set(true);
    try {
      const uid = this.auth.currentUser.uid;
      const petId = this.mascota()!.id;
      const urls = await this.fs.uploadPetPhotos(uid, petId, files);
      await this.fs.appendPhotos(petId, urls);
      this.showToast(`${urls.length} foto(s) añadidas`);
      input.value = '';
    } catch (e) {
      console.error(e);
      this.showToast('No se pudo subir la(s) foto(s).');
    } finally {
      this.uploading.set(false);
    }
  }

  async onRemovePhoto(url: string) {
    if (!this.mascota()) return;
    const petId = this.mascota()!.id;
    try {
      await this.fs.removePhoto(petId, url);
      await this.fs.deletePhotoFromStorage(url);
      this.showToast('Foto eliminada');
    } catch (e) {
      console.error(e);
      this.showToast('No se pudo eliminar la foto.');
    }
  }

  async setAsPrincipal(url: string) {
    if (!this.mascota()?.id) return;
    try {
      await this.fs.updatePet(this.mascota()!.id, { fotoUrl: url });
      this.showToast('Foto principal actualizada');
    } catch (e) {
      console.error(e);
      this.showToast('No se pudo actualizar la foto principal.');
    }
  }
}
