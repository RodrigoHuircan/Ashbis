import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/firebase/authentication';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})

export class HomePage {
  private auth = inject(AuthenticationService);
  private router = inject(Router);

  userEmail$ = this.auth.authState.pipe(map(u => u?.email ?? ''));
  constructor() {}

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
