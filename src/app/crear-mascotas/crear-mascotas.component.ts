import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonLabel, IonItem, IonSelect, IonSelectOption,
  IonNote, IonButton, IonModal, IonGrid, IonRow, IonCol, IonImg, IonList,
  IonDatetime, IonDatetimeButton, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { FirestoreService } from 'src/app/firebase/firestore';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { Router } from '@angular/router';
import { Models } from 'src/app/models/models';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import {
  IonAccordion,
  IonAccordionGroup,
  IonCheckbox
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-crear-mascota',
  standalone: true,
  templateUrl: './crear-mascotas.component.html',
  styleUrls: ['./crear-mascotas.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonCheckbox,IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonGrid, IonRow, IonCol,
    IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonNote, IonButton, IonImg, IonModal, IonDatetimeButton, IonDatetime, IonIcon
  ]
})
export class CrearMascotasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  @ViewChild('inputFecha',{ static: false}) inputFecha!: ElementRef<HTMLInputElement>;

  mascotaForm!: FormGroup;
  cargando = false;

  // Principal
  imagenPreview: string | ArrayBuffer | null = null;
  imagenFile: File | null = null;

  // Galería
  galeriaFiles: File[] = [];
  galeriaPreviews: string[] = [];

  // Fecha
  fechaFormateada: string = '';
  fechaActual: string = new Date().toISOString();

  // comportamiento
  comportamientoOptions = [
    { label: 'Tener cuidado con otros animales', value: 'cuidado_otros_animales' },
    { label: 'Tener cuidado con mujeres', value: 'cuidado_mujeres' },
    { label: 'Tener cuidado con hombres', value: 'cuidado_hombres' },
    { label: 'Tener cuidado con niños', value: 'cuidado_ninos' },
    { label: 'Tener cuidado con su misma especie', value: 'cuidado_misma_especie' },
    { label: 'Necesita compañía constante', value: 'necesita_compania' },
    { label: 'Es temeroso', value: 'temeroso' }
  ];
  comportamientoSelected: string[] = [];

  ngOnInit() {
    this.mascotaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ ]{2,}( [A-Za-zÀ-ÖØ-öø-ÿ ]{2,})*$/)]], // palabras >2 chars y solo letras+espacios
      numeroChip: ['', [Validators.required, Validators.pattern(/^[0-9]{15}$/)]],
      edad: ['', [Validators.required, Validators.min(0), Validators.max(25)]],
      sexo: ['', Validators.required],
      fechaNacimiento: [''], // opcional
      especie: ['', Validators.required],
      color: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/)]],
      raza: ['', Validators.required],
      castrado: ['', Validators.required],
      procedencia: ['', Validators.required],
      senas: ['', Validators.required],
      notas: [''],
      fotoUrl: [''] // principal (rellenado después)
    });
  }

  // Helpers validación visual
  isInvalid(ctrl: string): boolean {
    const c = this.mascotaForm.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }

  // Imagen principal - acepta sólo imágenes
  async onImageSelected(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.presentAlert('Sólo se permiten archivos de imagen (no videos)');
      event.target.value = '';
      return;
    }

    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagenPreview = reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // Galería múltiple - sólo imágenes
  async onImagesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) {
        await this.presentAlert('Sólo se permiten archivos de imagen en la galería (no videos).');
        continue;
      }
      this.galeriaFiles.push(f);
      const reader = new FileReader();
      reader.onload = () => this.galeriaPreviews.push(reader.result as string);
      reader.readAsDataURL(f);
    }
    event.target.value = '';
  }

  removeFromGaleria(i: number) {
    this.galeriaFiles.splice(i, 1);
    this.galeriaPreviews.splice(i, 1);
  }

  toggleComportamiento(value: string, ev: any) {
    const checked = ev?.detail?.checked;
    if (checked) {
      if (!this.comportamientoSelected.includes(value)) this.comportamientoSelected.push(value);
    } else {
      this.comportamientoSelected = this.comportamientoSelected.filter(v => v !== value);
    }
  }

  onIonDateChange(ev: CustomEvent) {
    const valor = (ev as any).detail?.value as string | null;
    if (!valor) return;
    this.mascotaForm.patchValue({ fechaNacimiento: valor });
    const fecha = new Date(valor);
    const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    this.fechaFormateada = fecha.toLocaleDateString('es-CL', opciones);
  }

  async guardarMascota() {
    this.mascotaForm.markAllAsTouched();
    if (this.mascotaForm.invalid) return;

    this.cargando = true;
    const data = this.mascotaForm.value;

    let fotoUrl = '';
    let galeriaUrls: string[] = [];

    try {
      const user = await this.authService.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const id = this.firestoreService.createId();
      const storage = getStorage();

      // 1) Subir foto principal (si existe)
      if (this.imagenFile) {
        const refPrincipal = ref(storage, `mascotas/${user.uid}/${id}/principal-${Date.now()}-${this.imagenFile.name}`);
        await uploadBytes(refPrincipal, this.imagenFile);
        fotoUrl = await getDownloadURL(refPrincipal);
      }

      // 2) Subir galería (0..n)
      if (this.galeriaFiles.length) {
        const uploads = this.galeriaFiles.map(async (file, idx) => {
          const refGaleria = ref(storage, `mascotas/${user.uid}/${id}/galeria/${Date.now()}-${idx}-${file.name}`);
          await uploadBytes(refGaleria, file);
          return getDownloadURL(refGaleria);
        });
        galeriaUrls = await Promise.all(uploads);
      }

      // 3) Documento a Firestore (incluye nuevos campos)
      const mascota: any = {
        id,
        uidUsuario: user.uid,
        nombre: data.nombre,
        numeroChip: data.numeroChip,
        edad: data.edad,
        sexo: data.sexo,
        especie: data.especie,
        color: data.color,
        raza: data.raza,
        castrado: data.castrado,
        procedencia: data.procedencia,
        senas: data.senas,
        notas: data.notas || '',
        indicadores: this.comportamientoSelected,
        fotoUrl: fotoUrl || '',
        galeria: galeriaUrls,
        fechaNacimiento: data.fechaNacimiento || null,
        fechaRegistro: new Date().toISOString()
      };

      await this.firestoreService.createDocument(Models.Mascotas.PathMascotas, mascota, id);

      // Reset y navegar
      this.mascotaForm.reset();
      this.imagenFile = null;
      this.imagenPreview = null;
      this.galeriaFiles = [];
      this.galeriaPreviews = [];
      this.comportamientoSelected = [];
      this.router.navigate(['/tabs/home']);
    } catch (err) {
      console.error('Error al guardar mascota: ', err);
      await this.presentAlert('Ocurrió un error al guardar la mascota.');
    } finally {
      this.cargando = false;
    }
  }

  // Alert helper
  async presentAlert(message: string) {
    const a = await this.alertCtrl.create({
      header: 'Atención',
      message,
      buttons: ['Aceptar']
    });
    await a.present();
  }
}
