import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where,
  DocumentData,
  collectionData
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  date: string;
  language: string;
}

export interface EventItem {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private auth: Auth, private firestore: Firestore) { }

  // Authentication methods
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  getUser() {
    return user(this.auth);
  }

  // News methods
  getNews(language: string): Observable<NewsItem[]> {
    const newsRef = collection(this.firestore, 'news');
    const q = query(
      newsRef, 
      where('language', '==', language),
      orderBy('date', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<NewsItem[]>;
  }

  async addNews(news: NewsItem): Promise<string> {
    const newsRef = collection(this.firestore, 'news');
    const docRef = await addDoc(newsRef, news);
    return docRef.id;
  }

  async updateNews(id: string, news: Partial<NewsItem>): Promise<void> {
    const newsDocRef = doc(this.firestore, `news/${id}`);
    await updateDoc(newsDocRef, news);
  }

  async deleteNews(id: string): Promise<void> {
    const newsDocRef = doc(this.firestore, `news/${id}`);
    await deleteDoc(newsDocRef);
  }

  // Events methods
  getEvents(language: string): Observable<EventItem[]> {
    const eventsRef = collection(this.firestore, 'events');
    const q = query(
      eventsRef, 
      where('language', '==', language),
      orderBy('date', 'asc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<EventItem[]>;
  }

  async addEvent(event: EventItem): Promise<string> {
    const eventsRef = collection(this.firestore, 'events');
    const docRef = await addDoc(eventsRef, event);
    return docRef.id;
  }

  async updateEvent(id: string, event: Partial<EventItem>): Promise<void> {
    const eventDocRef = doc(this.firestore, `events/${id}`);
    await updateDoc(eventDocRef, event);
  }

  async deleteEvent(id: string): Promise<void> {
    const eventDocRef = doc(this.firestore, `events/${id}`);
    await deleteDoc(eventDocRef);
  }

  // Contact methods
  async submitContactForm(formData: any): Promise<string> {
    const contactRef = collection(this.firestore, 'contact-messages');
    const docRef = await addDoc(contactRef, {
      ...formData,
      timestamp: new Date()
    });
    return docRef.id;
  }

  // Firestore methods
  getCollection(collectionName: string): Observable<DocumentData[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' });
  }

  getDocumentById(collectionName: string, id: string) {
    const documentRef = doc(this.firestore, collectionName, id);
    return getDoc(documentRef);
  }

  addDocument(collectionName: string, data: any) {
    const collectionRef = collection(this.firestore, collectionName);
    return addDoc(collectionRef, data);
  }

  updateDocument(collectionName: string, id: string, data: any) {
    const documentRef = doc(this.firestore, collectionName, id);
    return updateDoc(documentRef, data);
  }

  deleteDocument(collectionName: string, id: string) {
    const documentRef = doc(this.firestore, collectionName, id);
    return deleteDoc(documentRef);
  }

  queryCollection(collectionName: string, fieldPath: string, operator: any, value: any): Observable<DocumentData[]> {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(fieldPath, operator, value));
    return collectionData(q, { idField: 'id' });
  }
}
