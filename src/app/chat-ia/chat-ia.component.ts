import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonList, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-chat-ia',
  templateUrl: './chat-ia.component.html',
  styleUrls: ['./chat-ia.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
  ]
})
export class ChatIaComponent {
  pasoActual: number = 1; 
  categoriaSeleccionada: string = '';
  mascotaSeleccionada: string = '';
  mensaje: string = '';
  mensajes: { autor: string; texto: string }[] = [];

  async enviarMensajeIA(prompt: string) {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + environment.geminiApiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      console.log('Respuesta de Gemini:', data);

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        this.mensajes.push({
          autor: 'Ashbis IA',
          texto: data.candidates[0].content.parts[0].text,
        });
      } else if (data?.error) {
        this.mensajes.push({
          autor: 'Ashbis IA',
          texto: '⚠️ Error en la respuesta: ' + data.error.message,
        });
      } else {
        this.mensajes.push({
          autor: 'Ashbis IA',
          texto: 'Lo siento, no entendí la respuesta. 😅',
        });
      }

    } catch (error) {
      console.error('Error al conectar con Gemini:', error);
      this.mensajes.push({
        autor: 'Ashbis IA',
        texto: '🚨 Ocurrió un error al procesar tu mensaje.',
      });
    }
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.mensajes.push({ autor: 'Ashbis IA', texto: `Perfecto 🐾. ¿Qué tipo de mascota tienes?` });
    this.pasoActual = 2;
  }

  seleccionarMascota(tipo: string) {
    this.mascotaSeleccionada = tipo;
    this.mensajes.push({
      autor: 'Ashbis IA',
      texto: `Excelente 🐶🐱. Ahora escribe tu pregunta sobre **${this.categoriaSeleccionada}** de tu **${this.mascotaSeleccionada}**.`,
    });
    this.pasoActual = 3;
  }

  async enviarPregunta() {
    if (!this.mensaje.trim()) return;

    const preguntaFinal = `Tema: ${this.categoriaSeleccionada}, Mascota: ${this.mascotaSeleccionada}. Pregunta: ${this.mensaje}`;
    this.mensajes.push({ autor: 'Tú', texto: this.mensaje });
    this.mensaje = '';

    await this.enviarMensajeIA(preguntaFinal);
  }

  reiniciarChat() {
    this.pasoActual = 1;
    this.categoriaSeleccionada = '';
    this.mascotaSeleccionada = '';
    this.mensaje = '';
    this.mensajes = [];
    this.ngOnInit();
  }

  ngOnInit() {
    this.mensajes.push({
      autor: 'Ashbis IA',
      texto: '👋 ¡Hola! Soy Ashbis IA, tu asistente virtual para cuidar a tus mascotas. ¿Sobre qué quieres aprender hoy?',
    });
  }
}
