import { Component, OnInit } from '@angular/core';
import { IonIcon, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, paw, add, person } from 'ionicons/icons';
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs ]
})
export class TabsComponent  implements OnInit {
  constructor() { 
    addIcons({ home, paw, add, person });
  }
  ngOnInit() {}
}
