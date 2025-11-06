import { Component, inject, signal, OnDestroy, ViewChild } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel,
  IonButton, IonAvatar, IonInput, IonSelect, IonSelectOption,
  IonNote, IonModal, IonDatetime, IonDatetimeButton, IonToast, IonIcon,
  IonCard, IonCardContent, IonTextarea
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService, Mascota, Cita } from '../firebase/firestore';
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
    IonButton, IonAvatar, IonInput, IonSelect, IonSelectOption,
    IonNote, IonModal, IonDatetime, IonDatetimeButton, IonToast, IonIcon,
    IonCard, IonCardContent, IonTextarea
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

  // Calendario / Citas
  citas = signal<Cita[]>([]);
  fechaSeleccionada = signal<string>(new Date().toISOString());

  // Modal de cita
  citaModalOpen = signal(false);
  editandoCitaId = signal<string | null>(null);
  citaForm!: FormGroup;

  // Form principal
  form!: FormGroup;

  // Subscripciones
  sub?: Subscription;
  subCitas?: Subscription;

  @ViewChild('tituloInput', { read: IonInput }) tituloInput?: IonInput;
  
  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sub = this.fs.getPetById(id).subscribe(doc => {
      if (doc) {
        this.mascota.set(doc);
        this.buildForm(doc);

        // Suscribir citas de la mascota
        this.subCitas?.unsubscribe();
        this.subCitas = this.fs.getCitasByMascota(doc.id).subscribe(arr => {
          const ordenadas = [...arr].sort((a, b) =>
            new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
          );
          this.citas.set(ordenadas);
        });
      }
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.subCitas?.unsubscribe();
  }

  setSection(s: Section) {
    this.section.set(s);
  }

  // --------- FORM PRINCIPAL ----------
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

  // ---------- CALENDARIO / AGENDA ----------
  onCalendarioChange(ev: CustomEvent) {
    const val = (ev as any).detail?.value as string | null;
    if (!val) return;
    this.fechaSeleccionada.set(val);
  }

  get citasDelDia(): Cita[] {
    const sel = this.fechaSeleccionada();
    if (!sel) return [];
    return this.citas().filter(c => this.esMismoDia(c.fechaInicio, sel));
  }

  private esMismoDia(aISO: string, bISO: string): boolean {
    const a = new Date(aISO);
    const b = new Date(bISO);
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  // ---------- MODAL: crear / editar / borrar citas ----------
  abrirNuevaCita() {
    this.editandoCitaId.set(null);
    this.citaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(80)]],
      fecha: [this.fechaSeleccionada(), Validators.required], // ISO (solo fecha)
      horaInicio: ['10:00', Validators.required],             // HH:mm
      horaFin: ['11:00'],
      lugar: [''],
      notas: ['']
    });
    this.citaModalOpen.set(true);
  }

  abrirEditarCita(c: Cita) {
    const fi = new Date(c.fechaInicio);
    const ff = c.fechaFin ? new Date(c.fechaFin) : null;

    const isoFecha = new Date(fi.getFullYear(), fi.getMonth(), fi.getDate()).toISOString();
    const horaInicio = fi.toISOString().substring(11, 16); // HH:mm
    const horaFin = ff ? ff.toISOString().substring(11, 16) : '';

    this.editandoCitaId.set(c.id || null);
    this.citaForm = this.fb.group({
      titulo: [c.titulo, [Validators.required, Validators.maxLength(80)]],
      fecha: [isoFecha, Validators.required],
      horaInicio: [horaInicio, Validators.required],
      horaFin: [horaFin],
      lugar: [c.lugar || ''],
      notas: [c.notas || '']
    });
    this.citaModalOpen.set(true);
  }

  async guardarCita() {
    if (this.citaForm.invalid || !this.mascota()?.id || !this.auth.currentUser) {
      this.citaForm.markAllAsTouched();
      return this.showToast('Revisa los campos de la cita.');
    }

    const petId = this.mascota()!.id;
    const { titulo, fecha, horaInicio, horaFin, lugar, notas } = this.citaForm.value;

    // Validación simple: horaFin >= horaInicio (si existe)
    if (horaFin) {
      const iniNum = parseInt(horaInicio.replace(':', ''), 10);
      const finNum = parseInt(horaFin.replace(':', ''), 10);
      if (finNum < iniNum) {
        return this.showToast('La hora fin no puede ser menor que la hora inicio.');
      }
    }

    const isoInicio = this.combineFechaHora(fecha, horaInicio);
    const isoFin = horaFin ? this.combineFechaHora(fecha, horaFin) : undefined;

    const payload: Cita = {
      titulo,
      fechaInicio: isoInicio,
      fechaFin: isoFin,
      lugar,
      notas,
      creadoPor: this.auth.currentUser.uid
    };

    try {
      const editId = this.editandoCitaId();
      if (editId) {
        await this.fs.updateCita(petId, editId, payload);
        this.showToast('Cita actualizada.');
      } else {
        await this.fs.addCita(petId, payload);
        this.showToast('Cita creada.');
      }
      this.citaModalOpen.set(false);
    } catch (e) {
      console.error(e);
      this.showToast('No se pudo guardar la cita.');
    }
  }

  async borrarCita(c: Cita) {
    if (!this.mascota()?.id || !c.id) return;
    try {
      await this.fs.deleteCita(this.mascota()!.id, c.id);
      this.showToast('Cita eliminada.');
    } catch (e) {
      console.error(e);
      this.showToast('No se pudo eliminar la cita.');
    }
  }

  // Combina fecha (ISO) + hora (HH:mm) a ISO en zona local
  private combineFechaHora(fechaISO: string, hhmm: string): string {
    const f = new Date(fechaISO);
    const [h, m] = hhmm.split(':').map((n: string) => parseInt(n, 10));
    f.setHours(h, m, 0, 0);
    return f.toISOString();
  }
}
