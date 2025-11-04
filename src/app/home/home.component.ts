import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonButton, 
    IonIcon, 
    IonCardContent, 
    ToastController, 
    IonContent 
} from '@ionic/angular/standalone'; 
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { addIcons } from 'ionicons';
import { hourglassOutline, locateOutline, bagOutline } from 'ionicons/icons'; // Se agrega 'bagOutline' para tiendas

/**
 * Interfaz para representar los datos de un lugar (Veterinaria o Tienda).
 */
interface Veterinaria { // Nombre mantenido por compatibilidad con el template
    position: google.maps.LatLngLiteral;
    title: string;
    options: google.maps.MarkerOptions;
    address: string;
    rating?: number;
}


addIcons({ hourglassOutline, locateOutline, bagOutline }); // Se agrega el ícono de bolsa

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss'],
    standalone: true,
    imports: [
        CommonModule, 
        IonContent, 
        IonCard, 
        IonCardHeader, 
        IonCardTitle, 
        IonButton, 
        IonIcon, 
        IonCardContent, 
        GoogleMapsModule
    ],
})
export class HomePage implements OnInit {
    // Inyección de servicios
    private auth = inject(AuthenticationService);
    private router = inject(Router);
    private toastController = inject(ToastController);

    // Referencia al componente MapInfoWindow del template
    @ViewChild(MapInfoWindow, { static: false }) infoWindow!: MapInfoWindow;

    // Observable para mostrar el correo del usuario
    userEmail$ = this.auth.authState.pipe(map(u => u?.email ?? ''));

    // Estado de la búsqueda
    isLoadingVets: boolean = false;
    currentSearchType: 'veterinary_care' | 'pet_store' | null = null; // Tipo de búsqueda actual

    // Centro inicial del mapa (SANTIAGO - CHILE como valor por defecto)
    center: google.maps.LatLngLiteral = { lat: -33.4378, lng: -70.6504 };
    
    // Marcador de la ubicación del usuario
    userPositionMarker: google.maps.LatLngLiteral | undefined;
    userMarkerOptions: google.maps.MarkerOptions = {
        draggable: false,
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // Ícono azul
        title: 'Mi Ubicación Actual'
    };

    // Array para almacenar los datos de los lugares encontrados
    realVeterinarias: Veterinaria[] = [];

    // Opciones de configuración del mapa
    mapOptions: google.maps.MapOptions = {
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        maxZoom: 18,
        minZoom: 10,
        zoom: 15,
    };

    // Datos del lugar seleccionado para el Info Window
    selectedVet: Veterinaria | undefined;

    constructor() {}

    ngOnInit() {
        // Por defecto, buscar veterinarias al iniciar.
        this.currentSearchType = 'veterinary_care'; 
        this.getCurrentLocation();
    }

    /**
     * Muestra una notificación Toast al usuario.
     * @param message Mensaje a mostrar.
     */
    async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: color,
        });
        await toast.present();
    }

    /**
     * Muestra la ventana de información al hacer clic en un marcador.
     * @param marker El componente MapMarker que fue clicado.
     * @param vet Los datos del lugar a mostrar.
     */
    openInfoWindow(marker: MapMarker, vet: Veterinaria) {
        this.selectedVet = vet;
        this.infoWindow.open(marker);
    }

    /**
     * Obtiene la ubicación actual del usuario a través del API de Geolocation del navegador.
     * @param manualAction Indica si la acción fue disparada por el botón (true) o por ngOnInit (false).
     */
    getCurrentLocation(manualAction: boolean = false) {

        if (navigator.geolocation) {
            this.isLoadingVets = true;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userCoords: google.maps.LatLngLiteral = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    this.center = userCoords;
                    this.userPositionMarker = userCoords;
                    this.mapOptions = { ...this.mapOptions, zoom: 15 };

                    console.log("Ubicación actual detectada:", userCoords);

                    // Usa el tipo de búsqueda actual (veterinaria por defecto)
                    if (this.currentSearchType) {
                        this.searchNearbyPlaces(userCoords, this.currentSearchType);
                    } else {
                        // En caso de contingencia, busca veterinarias
                        this.searchNearbyPlaces(userCoords, 'veterinary_care');
                    }
                },
                (error) => {
                    this.isLoadingVets = false;
                    console.error('Error al obtener la ubicación:', error.message);

                    let errorMessage = 'No se pudo obtener tu ubicación.';

                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'Permiso de ubicación denegado. Por favor, actívalo en la configuración de tu navegador.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'La información de ubicación no está disponible.';
                    }

                    // Mostrar un toast solo si fue una acción manual
                    if (manualAction) {
                        this.presentToast(errorMessage, 'danger');
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            console.error('La geolocalización no está disponible en este navegador.');
            this.presentToast('Tu navegador no soporta la Geoposición.', 'danger');
        }
    }

    /**
     * Acción disparada al hacer clic en un botón de búsqueda.
     * @param type El tipo de lugar a buscar ('veterinary_care' o 'pet_store').
     */
    findPlacesAction(type: 'veterinary_care' | 'pet_store') {
        this.currentSearchType = type; // Actualizar el tipo de búsqueda
        
        if (this.userPositionMarker) {
            // Si ya tenemos la posición, la usamos para buscar
            this.searchNearbyPlaces(this.userPositionMarker, type);
        } else {
            // Si no tenemos la posición, la obtenemos
            this.getCurrentLocation(true);
        }
    }

    /**
     * Busca lugares cercanos usando Google Places API.
     * @param location Coordenadas del usuario.
     * @param type Tipo de lugar a buscar (e.g., 'veterinary_care', 'pet_store').
     */
    searchNearbyPlaces(location: google.maps.LatLngLiteral, type: 'veterinary_care' | 'pet_store') {
        // Validación de API
        if (typeof google === 'undefined' || !google.maps.places) {
            console.error("Google Maps Places API no está cargada o no es accesible.");
            this.presentToast('Error: El servicio de búsqueda de lugares no está disponible.', 'danger');
            this.isLoadingVets = false;
            return;
        }

        this.isLoadingVets = true;
        this.realVeterinarias = []; // Limpiar resultados anteriores
        
        // Determinar el título para los mensajes y el ícono del marcador
        const placeName = type === 'veterinary_care' ? 'Veterinarias' : 'Tiendas de Mascotas';
        const markerIcon = type === 'veterinary_care' ? 
                           'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 
                           'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // Punto verde para tiendas

        const service = new google.maps.places.PlacesService(document.createElement('div'));

        const request: google.maps.places.PlaceSearchRequest = {
            location: location,
            radius: 5000, // Radio de 5km
            type: type, // Usar el tipo dinámico
        };

        service.nearbySearch(request, (results, status) => {
            this.isLoadingVets = false;

            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                this.realVeterinarias = results.map(place => ({
                    position: place.geometry!.location!.toJSON(),
                    title: place.name || placeName,
                    options: {
                        animation: google.maps.Animation.DROP,
                        icon: markerIcon 
                    },
                    address: place.vicinity || place.formatted_address || 'Dirección no disponible',
                    rating: place.rating
                }));
                console.log(`Se encontraron ${this.realVeterinarias.length} ${placeName} cercanas.`);
                this.presentToast(`Se encontraron ${this.realVeterinarias.length} ${placeName}.`, 'success');
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                 this.presentToast(`No se encontraron ${placeName} en 5km a la redonda.`, 'warning');
            } else {
                console.error('Error al buscar lugares cercanos:', status);
                this.presentToast(`Error en la búsqueda de lugares: ${status}.`, 'danger');
            }
        });
    }

    /**
     * Cierra la sesión del usuario y lo redirige a la página de login.
     */
    async logout() {
        await this.auth.logout();
        this.router.navigate(['/login'], { replaceUrl: true });
    }
}
