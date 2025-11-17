import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';

// 1. Importar interfaces de alto nivel (como en tu mascota-editar.ts)
import { 
  FirestoreService, 
  Mascota, 
  Vacuna, 
  Examen, 
  Medicamento 
} from '../../firebase/firestore'; // (Ajusta la ruta si 'firestore.ts' no está 2 niveles arriba)

// 2. Importar el namespace de 'models' (para las rutas)
import { Models } from '../../models/models';

// Componentes de Ionic
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonNote, IonIcon, IonSpinner, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, medicalOutline, clipboardOutline, eyedropOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mascota-detalle',
  standalone: true,
  imports: [
    CommonModule, NgIf, DatePipe,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonNote, IonIcon, IonSpinner, IonCard, IonCardContent
  ],
  providers: [DatePipe],
  templateUrl: './mascota-detalle.component.html',
  styleUrls: ['./mascota-detalle.component.scss'],
})
export class MascotaDetalleComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private firestoreService = inject(FirestoreService);

  private mascotaId = '';
  
  cargando = true;
  segmentoActual: 'vacunas' | 'examenes' | 'medicamentos' = 'vacunas';

  // 3. CORREGIDO: Usar la interfaz 'Mascota' directamente
  mascota: Mascota | null = null;
  
  // Usar las interfaces correctas (¡mejor que 'any'!)
  vacunas: Vacuna[] = [];
  examenes: Examen[] = [];
  medicamentos: Medicamento[] = [];

  constructor() {
    addIcons({ addOutline, medicalOutline, clipboardOutline, eyedropOutline });
  }

  ngOnInit() {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('No se proveyó ID de mascota');
        }
        this.mascotaId = id;
        
        // 4. CORREGIDO: Usar la interfaz 'Mascota'
        return this.firestoreService.getDocumentChanges<Mascota>(
          // 5. CORREGIDO: Usar el namespace 'Mascotas' (plural)
          `${Models.Mascotas.PathMascotas}/${this.mascotaId}`
        );
      })
    ).subscribe(mascota => {
      this.mascota = mascota;
      this.cargando = false;
      this.cargarSubColecciones();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarSubColecciones() {
    // 6. CORREGIDO: Usar el namespace 'Mascotas' (plural)
    const basePath = `${Models.Mascotas.PathMascotas}/${this.mascotaId}`;

    // Cargar Vacunas
    this.firestoreService.getCollectionChanges<Vacuna>(`${basePath}/vacunas`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.vacunas = data;
      });

    // Cargar Exámenes
    this.firestoreService.getCollectionChanges<Examen>(`${basePath}/examenes`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.examenes = data;
      });

    // Cargar Medicamentos
    this.firestoreService.getCollectionChanges<Medicamento>(`${basePath}/medicamentos`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.medicamentos = data;
      });
  }

  segmentoCambiado(evento: any) {
    this.segmentoActual = evento.detail.value;
  }

  abrirModalNuevoRegistro() {
    console.log('Añadir nuevo registro para:', this.segmentoActual);
    
    // Ejemplo de cómo añadir un nuevo documento
    /*
    const nuevaVacuna = { nombre: 'Rabia (Ejemplo)', fecha: new Date() };
    this.firestoreService.addDocument(
      `${Models.Mascotas.PathMascotas}/${this.mascotaId}/vacunas`,
      nuevaVacuna
    );
    */
  }
}