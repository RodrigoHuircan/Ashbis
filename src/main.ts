import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

addIcons({ alertCircleOutline });

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)), provideFirebaseApp(() => initializeApp({ projectId: "ashbis-5c7d9", appId: "1:586939747639:web:5d8dcf672717cf1052deb2", storageBucket: "ashbis-5c7d9.firebasestorage.app", apiKey: "AIzaSyBo5QFVaHTLOCB-FrVCznHr0HTbWDqz4iY", authDomain: "ashbis-5c7d9.firebaseapp.com", messagingSenderId: "586939747639", measurementId: "G-JPXH6ZVCGZ" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideMessaging(() => getMessaging()),
  ],
});
