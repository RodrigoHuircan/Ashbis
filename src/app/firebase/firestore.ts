import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, docData } from '@angular/fire/firestore';
import { ref } from 'firebase/storage';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { query, where, orderBy, CollectionReference } from '@angular/fire/firestore';

export interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  color?: string;
  castrado?: 'Sí' | 'No' | 'Si' | 'No';
  edad?: number;
  fechaNacimiento?: string; // o Timestamp si lo guardas así
  fechaRegistro?: string;
  date?: any;
  uidUsuario: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  firestore: Firestore = inject(Firestore)

  getCollectionChanges<tipo>(path:string){
    const itemCollection = collection(this.firestore, path);
    return collectionData(itemCollection) as Observable<tipo[]>;
  }

  //Forma 1, El enlace y el id vienen listos
  async createDocument<tipo>(path:string, data:tipo, id:string = null){
    let refDoc;
    if (id) {
        refDoc = doc(this.firestore, `${path}/${id}`)
    }
    else {
        const refCollection = collection(this.firestore, path)
        refDoc = doc(refCollection);
    }
    const dataDoc: any = data;
    dataDoc.id = refDoc.id;
    dataDoc.date = serverTimestamp()
    await setDoc(refDoc, dataDoc);
    return dataDoc.id;
  }

  //Forma 2, concateno el enlace con el id del documento
  createDocumentID(data:any, enlace:string, idDoc: string){
    const document = doc(this.firestore, `${enlace}/${idDoc}`)
    return setDoc(document, data)
  }

  createIdDoc(){
    return uuidv4()
  }

  deleteDocumentID(enlace: string, idDoc: string){
    const document = doc(this.firestore, `${enlace}/${idDoc}`);
    return deleteDoc(document)
  }

  createId(): string {
    return uuidv4();
  }

  getDocumentChanges<tipo>(path: string){
    const document = doc(this.firestore, path);
    return docData(document) as Observable<tipo>
  }

  async updateDocument(path: string, data: any){
    const refDoc = doc(this.firestore, path)
    data.updateAt = serverTimestamp()
    return await updateDoc(refDoc, data)
  }

  getUserPets(uid: string) {
    const ref = collection(this.firestore, 'mascotas') as CollectionReference<Mascota>;
    const q = query(ref, where('uidUsuario', '==', uid), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Mascota[]>;
  }
}
