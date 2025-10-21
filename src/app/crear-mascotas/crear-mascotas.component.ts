import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonLabel, IonItem, IonList, IonSelect, IonSelectOption,
  IonButton, IonDatetimeButton, IonModal,
  IonGrid, IonRow, IonCol, IonImg, IonIcon,
} from '@ionic/angular/standalone';
import { FirestoreService } from 'src/app/firebase/firestore';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { Router } from '@angular/router';
import { Models } from 'src/app/models/models';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';


@Component({
  selector: 'app-crear-mascota',
  standalone: true,
  templateUrl: './crear-mascotas.component.html',
  styleUrls: ['./crear-mascotas.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonInput,
    IonLabel,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonModal,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
  ]
})
export class CrearMascotasComponent implements OnInit {
  

  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  mascotaForm!: FormGroup;
  cargando = false;
  imagenPreview: string | ArrayBuffer | null = null;
  imagenFile: File | null = null;

  mostrarSelectorFecha = false;
  fechaFormateada: string | null = null;
  fechaActual: string = new Date().toISOString();

  ngOnInit() {
    this.mascotaForm = this.fb.group({
      nombre: ['', Validators.required],
      numeroChip: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      edad: ['', [Validators.required, Validators.min(0)]],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      especie: ['', Validators.required],
      color: ['', Validators.required],
      raza: ['', Validators.required],
      castrado: ['', Validators.required],
      fotoUrl: ['']
    });
  }

  // 📸 Subir imagen y mostrar preview
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.imagenFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.imagenPreview = reader.result);
    reader.readAsDataURL(file);
  }

  // 📅 Fecha de nacimiento — Modal control
    abrirSelectorFecha() {
      this.mostrarSelectorFecha = true;
    }

    cerrarSelectorFecha() {
      this.mostrarSelectorFecha = false;
    }



  seleccionarFecha(event: any) {
    const fecha = new Date(event.detail.value);
    this.mascotaForm.patchValue({ fechaNacimiento: fecha.toISOString() });
    this.fechaFormateada = fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // 💾 Guardar mascota
  async guardarMascota() {
    this.mascotaForm.markAllAsTouched();
    if (this.mascotaForm.invalid) return;

    this.cargando = true;
    const data = this.mascotaForm.value;
    let fotoUrl = '';

    try {
      const user = await this.authService.getUser();
      const id = this.firestoreService.createId();

      // Subir imagen si existe
      if (this.imagenFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `mascotas/${user?.uid}/${id}-${this.imagenFile.name}`);
        await uploadBytes(storageRef, this.imagenFile);
        fotoUrl = await getDownloadURL(storageRef);
      }

      const mascota = {
        id,
        uidUsuario: user?.uid || null,
        nombre: data.nombre,
        numeroChip: data.numeroChip,
        edad: data.edad,
        sexo: data.sexo,
        especie: data.especie,
        color: data.color,
        raza: data.raza,
        castrado: data.castrado,
        fotoUrl: fotoUrl || '',
        fechaNacimiento: data.fechaNacimiento,
        fechaRegistro: new Date().toISOString()
      };

      await this.firestoreService.createDocument(Models.Mascotas.PathMascotas, mascota, id);
      this.router.navigate(['/tabs/home']);
    } catch (err) {
      console.error('Error al guardar mascota: ', err);
    } finally {
      this.cargando = false;
    }
  }
}
