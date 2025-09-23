import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

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
}
