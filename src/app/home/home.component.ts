import { Component, inject, OnInit, ViewChild } from '@angular/core'; // Agregamos ViewChild
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/firebase/authentication';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps'; // Importamos MapInfoWindow y MapMarker
import { addIcons } from 'ionicons';
import { hourglassOutline, locateOutline } from 'ionicons/icons';

interface Veterinaria {
  position: google.maps.LatLngLiteral;
  title: string;
  options: google.maps.MarkerOptions;

  address: string;
  rating?: number;
}


addIcons({ hourglassOutline, locateOutline });

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, GoogleMapsModule],
})


export class HomePage implements OnInit {
  private auth = inject(AuthenticationService);
  private router = inject(Router);


  @ViewChild(MapInfoWindow, { static: false }) infoWindow!: MapInfoWindow;

  userEmail$ = this.auth.authState.pipe(map(u => u?.email ?? ''));


  isLoadingVets: boolean = false;


  center: google.maps.LatLngLiteral = { lat: -33.4378, lng: -70.6504 };
  userPositionMarker: google.maps.LatLngLiteral | undefined;
  userMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    title: 'Mi Ubicación Actual'
  };


  realVeterinarias: Veterinaria[] = [];

  mapOptions: google.maps.MapOptions = {
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 18,
    minZoom: 10,
    zoom: 15,
  };


  selectedVet: Veterinaria | undefined;



  constructor() {}

  ngOnInit() {
    this.getCurrentLocation();
  }

  /**
   * Muestra la ventana de información al hacer clic en un marcador.
   * @param marker El componente MapMarker que fue clicado.
   * @param vet Los datos de la veterinaria a mostrar.
   */
  openInfoWindow(marker: MapMarker, vet: Veterinaria) {
    this.selectedVet = vet;

    this.infoWindow.open(marker);
  }


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

          console.log("Ubicación actual detectada:", userCoords);

          this.searchNearbyVets(userCoords);
        },
        (error) => {
          this.isLoadingVets = false;
          console.error('Error al obtener la ubicación:', error.message);
          if (manualAction) {
            console.warn('Permiso de ubicación denegado o no disponible.');
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error('La geolocalización no está disponible en este navegador.');
    }
  }


  findVetsAction() {
    if (this.userPositionMarker) {
      this.searchNearbyVets(this.userPositionMarker);
    } else {
      this.getCurrentLocation(true);
    }
  }

  /**
   * Busca veterinarias cercanas usando Google Places API.
   * Modificado para obtener más detalles necesarios para el info window.
   * @param location Coordenadas del usuario.
   */
  searchNearbyVets(location: google.maps.LatLngLiteral) {
    if (typeof google === 'undefined' || !google.maps.places) {
      console.error("Google Maps Places API no está cargada.");
      this.isLoadingVets = false;
      return;
    }

    this.isLoadingVets = true;
    this.realVeterinarias = [];

    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: 5000,
      type: 'veterinary_care',
    };

    service.nearbySearch(request, (results, status) => {
      this.isLoadingVets = false;

      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        this.realVeterinarias = results.map(place => ({
          position: place.geometry!.location!.toJSON(),
          title: place.name || 'Veterinaria Cercana',
          options: {
            animation: google.maps.Animation.DROP,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          },

          address: place.vicinity || place.formatted_address || 'Dirección no disponible',
          rating: place.rating
        }));
        console.log(`Se encontraron ${this.realVeterinarias.length} veterinarias cercanas.`);
      } else {
        console.error('Error al buscar lugares cercanos:', status);
      }
    });
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
