import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonLabel, IonItem, IonSelect, IonSelectOption,
  IonNote, IonButton, IonDatetime, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { FirestoreService } from 'src/app/firebase/firestore';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { Router } from '@angular/router';
import { Models } from 'src/app/models/models';

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
    IonSelect,
    IonSelectOption,
    IonNote,
    IonButton,
    IonDatetime,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class CrearMascotasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  mascotaForm!: FormGroup;
  cargando = false;

  ngOnInit() {
    this.mascotaForm = this.fb.group({
      nombre: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(0)]],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      especie: ['', Validators.required],
      color: ['', Validators.required],
      raza: ['', Validators.required],
      castrado: ['', Validators.required]
    });
  }

  async guardarMascota() {
    this.mascotaForm.markAllAsTouched();
    if (this.mascotaForm.invalid) return;

    this.cargando = true;
    const data = this.mascotaForm.value;

    try {
      const user = await this.authService.getUser();
      const id = this.firestoreService.createId();

      const mascota = {
        id,
        uidUsuario: user?.uid || null,
        ...data,
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