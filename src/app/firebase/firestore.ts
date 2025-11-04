import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, docData } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { query, where, orderBy, CollectionReference } from '@angular/fire/firestore';
import { arrayUnion, arrayRemove } from 'firebase/firestore';


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
  fotoUrl?: string;
  galeria?: string[];
  numeroChip?: string;
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

    getPetById(id: string): Observable<Mascota | undefined> {
    const ref = doc(this.firestore, 'mascotas', id);
    return docData(ref, { idField: 'id' }) as Observable<Mascota | undefined>;
  }

  async updatePet(id: string, data: Partial<Mascota>): Promise<void> {
    const ref = doc(this.firestore, 'mascotas', id);
    await updateDoc(ref, data as any);
  }

  async uploadPetPhotos(uid: string, petId: string, files: File[]): Promise<string[]> {
    const storage = getStorage();
    const urls: string[] = [];
    for (const f of files) {
      const path = `mascotas/${uid}/${petId}/galeria/${Date.now()}-${f.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, f);
      urls.push(await getDownloadURL(r));
    }
    return urls;
  }

  async appendPhotos(petId: string, urls: string[]): Promise<void> {
    const refDoc = doc(this.firestore, 'mascotas', petId);
    // una sola operación con arrayUnion de todas las urls
    await updateDoc(refDoc, { galeria: arrayUnion(...urls) } as any);
  }

  async removePhoto(petId: string, url: string): Promise<void> {
    const refDoc = doc(this.firestore, 'mascotas', petId);
    await updateDoc(refDoc, { galeria: arrayRemove(url) } as any);
  }

  async deletePhotoFromStorage(url: string): Promise<void> {
    const storage = getStorage();
    // ref acepta URL https/gs => no necesitas refFromURL
    const r = ref(storage, url);
    await deleteObject(r);
  }  
}
