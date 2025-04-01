import { Injectable } from '@angular/core';
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
  collectionData,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable, from, map, of, catchError, switchMap } from 'rxjs';
import { LanguageService } from './language.service';

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
  imageUrl?: string; // Optional image URL field
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private currentLanguage: string = 'en';
  private useMockData = false; // Use Firestore by default
  private mockData = {
    news: [
      {
        id: '1',
        title: 'Welcome to our new website',
        content: 'We are excited to launch our new website. Stay tuned for more updates!',
        date: '2024-03-20',
        language: 'en'
      },
      {
        id: '2',
        title: 'Easter Service Announcement',
        content: 'Join us for our special Easter service on April 10 at 10:00 AM.',
        date: '2024-03-15',
        language: 'en'
      },
      {
        id: '3',
        title: 'Üdvözöljük az új weboldalunkon',
        content: 'Örömmel mutatjuk be új weboldalunkat. Kövessen minket a további frissítésekért!',
        date: '2024-03-20',
        language: 'hu'
      }
    ],
    events: [
      {
        id: '1',
        title: 'Prayer Meeting',
        description: 'Join us for our weekly prayer meeting where we come together to pray for our church, community, and world.',
        date: '2024-05-15',
        time: '7:00 PM - 8:30 PM',
        location: '123 Church Street, Budapest',
        language: 'en'
      },
      {
        id: '2',
        title: 'Youth Conference',
        description: 'Annual youth conference featuring special guest speakers, worship, and fellowship opportunities for young adults.',
        date: '2024-05-20',
        time: '9:00 AM - 5:00 PM',
        location: 'Community Center, Budapest',
        language: 'en'
      },
      {
        id: '3',
        title: 'Imaóra',
        description: 'Csatlakozzon hozzánk a heti imaórára, ahol együtt imádkozunk gyülekezetünkért, közösségünkért és a világért.',
        date: '2024-05-15',
        time: '19:00 - 20:30',
        location: 'Templom utca 123, Budapest',
        language: 'hu'
      }
    ],
    contactMessages: [] as ContactMessage[]
  };

  constructor(
    private firestore: Firestore,
    private languageService: LanguageService
  ) {
    this.languageService.getCurrentLang().subscribe(lang => {
      this.currentLanguage = lang;
    });

    console.log('Data service initialized, using Firestore');
    
    // Initialize Firestore collections
    this.ensureCollectionsExist().catch(error => {
      console.error('Failed to initialize collections, falling back to mock data:', error);
      this.useMockData = true;
    });
  }
  
  /**
   * Ensure that all required collections exist in Firestore
   * and populate with sample data if they're empty
   */
  private async ensureCollectionsExist(): Promise<void> {
    try {
      console.log('Initializing Firestore collections...');
      
      // Check and create news collection if needed
      const newsRef = collection(this.firestore, 'news');
      const newsSnapshot = await getDocs(newsRef);
      
      if (newsSnapshot.empty) {
        console.log('News collection is empty, populating with sample data');
        // Populate with sample data
        for (const item of this.mockData.news) {
          await addDoc(newsRef, item);
        }
        console.log('News collection populated successfully');
      } else {
        console.log('News collection exists with data');
      }
      
      // Check and create events collection if needed
      const eventsRef = collection(this.firestore, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      
      if (eventsSnapshot.empty) {
        console.log('Events collection is empty, populating with sample data');
        // Populate with sample data - ensure dates are properly formatted
        for (const item of this.mockData.events) {
          // Fix date format if needed to ensure it's compatible with DatePipe
          if (item.date && typeof item.date === 'string') {
            // Make sure it's in YYYY-MM-DD format
            if (!item.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              try {
                const date = new Date(item.date);
                item.date = date.toISOString().substring(0, 10);
              } catch (e) {
                console.error('Could not parse date:', item.date);
              }
            }
          }
          
          await addDoc(eventsRef, item);
        }
        console.log('Events collection populated successfully');
      } else {
        console.log('Events collection exists with data');
      }
      
      // Check and create contactMessages collection if needed
      const contactRef = collection(this.firestore, 'contactMessages');
      await getDocs(contactRef); // Just to ensure it exists
      
      console.log('All collections initialized successfully');
    } catch (error) {
      console.error('Error initializing collections:', error);
      throw error; // Throw error to indicate initialization failed
    }
  }

  // News methods
  getNews(): Observable<NewsItem[]> {
    if (this.useMockData) {
      return this.getMockNews();
    }
    
    try {
      const newsRef = collection(this.firestore, 'news');
      
      console.log('Getting all news from Firestore');
      return collectionData(query(newsRef), { idField: 'id' }).pipe(
        map(news => {
          console.log(`Found ${news.length} news items in total`);
          
          // Process news to ensure they have proper date format
          const processedNews = news.map(item => {
            // Convert Firestore Timestamp to Date string if needed
            if (item['date'] && typeof item['date'] !== 'string') {
              try {
                item['date'] = new Date(item['date']).toISOString().split('T')[0];
              } catch (e) {
                console.error('Error parsing date:', e);
              }
            }
            return item as unknown as NewsItem;
          });
          
          // Sort news by date (descending - newest first)
          return processedNews.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        }),
        catchError(error => {
          console.error('Error fetching news:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error setting up news query:', error);
      return of([]);
    }
  }
  
  private getMockNews(): Observable<NewsItem[]> {
    console.log('Using mock news data');
    // Return all mock news items regardless of language
    const allNews = this.mockData.news
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return of(allNews);
  }

  async addNews(news: Omit<NewsItem, 'language'>): Promise<string> {
    if (this.useMockData) {
      return this.addMockNews(news);
    }
    
    try {
      const newsRef = collection(this.firestore, 'news');
      // Store the language to indicate the original language of the content
      // but all news items will be shown on all language versions of the site
      const newsWithLang = {
        ...news,
        language: this.currentLanguage
      };
      
      console.log('Adding news to Firestore:', newsWithLang);
      const docRef = await addDoc(newsRef, newsWithLang);
      console.log('News added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding news to Firestore:', error);
      throw error;
    }
  }
  
  private addMockNews(news: Omit<NewsItem, 'language'>): string {
    console.log('Using mock addNews');
    const newItem = {
      ...news,
      id: Date.now().toString(),
      language: this.currentLanguage
    };
    this.mockData.news.push(newItem);
    return newItem.id || Date.now().toString();
  }

  async updateNews(id: string, news: Partial<NewsItem>): Promise<void> {
    if (this.useMockData) {
      return this.updateMockNews(id, news);
    }
    
    try {
      const docRef = doc(this.firestore, 'news', id);
      console.log('Updating news in Firestore:', id, news);
      await updateDoc(docRef, { ...news });
      console.log('News updated successfully');
    } catch (error) {
      console.error('Error updating news in Firestore:', error);
      throw error;
    }
  }
  
  private updateMockNews(id: string, news: Partial<NewsItem>): void {
    console.log('Using mock updateNews');
    const index = this.mockData.news.findIndex(item => item.id === id);
    if (index !== -1) {
      this.mockData.news[index] = {
        ...this.mockData.news[index],
        ...news
      };
    }
  }

  async deleteNews(id: string): Promise<void> {
    if (this.useMockData) {
      return this.deleteMockNews(id);
    }
    
    try {
      const docRef = doc(this.firestore, 'news', id);
      console.log('Deleting news from Firestore:', id);
      await deleteDoc(docRef);
      console.log('News deleted successfully');
    } catch (error) {
      console.error('Error deleting news from Firestore:', error);
      throw error;
    }
  }
  
  private deleteMockNews(id: string): void {
    console.log('Using mock deleteNews');
    this.mockData.news = this.mockData.news.filter(item => item.id !== id);
  }

  // Events methods
  getEvents(): Observable<EventItem[]> {
    if (this.useMockData) {
      return this.getMockEvents();
    }
    
    try {
      const eventsRef = collection(this.firestore, 'events');
      
      console.log('Getting all events from Firestore');
      
      // Get all events regardless of language
      return collectionData(
        query(eventsRef),
        { idField: 'id' }
      ).pipe(
        map(events => {
          console.log(`Found ${events.length} events in total`);
          
          // Process events to ensure they have proper date format
          const processedEvents = events.map(event => {
            // Convert Firestore Timestamp to Date string if needed
            if (event['date'] && typeof event['date'] !== 'string') {
              try {
                event['date'] = new Date(event['date']).toISOString().split('T')[0];
              } catch (e) {
                console.error('Error parsing date:', e);
              }
            }
            return event as unknown as EventItem;
          });
          
          // Sort events by date (ascending - upcoming first)
          return processedEvents.sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        }),
        catchError(error => {
          console.error('Error fetching events:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error setting up events query:', error);
      return of([]);
    }
  }
  
  private getMockEvents(): Observable<EventItem[]> {
    console.log('Using mock events data');
    // Return all mock events regardless of language
    const allEvents = this.mockData.events
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return of(allEvents);
  }

  async addEvent(event: Omit<EventItem, 'id' | 'language'>): Promise<string> {
    if (this.useMockData) {
      return this.addMockEvent(event);
    }
    
    try {
      const eventsRef = collection(this.firestore, 'events');
      // Store the language to indicate the original language of the content
      // but all events will be shown on all language versions of the site
      const eventWithLang = {
        ...event,
        // Set default location if none provided
        location: event.location || 'Új Élet Baptista Gyülekezet Gyöngyös',
        language: this.currentLanguage
      };
      
      console.log('Adding event to Firestore:', eventWithLang);
      const docRef = await addDoc(eventsRef, eventWithLang);
      console.log('Event added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding event to Firestore:', error);
      throw error;
    }
  }

  private addMockEvent(event: Omit<EventItem, 'id' | 'language'>): string {
    console.log('Using mock addEvent');
    const newId = Date.now().toString();
    const newEvent = {
      ...event,
      id: newId,
      language: this.currentLanguage
    };
    
    this.mockData.events.push(newEvent);
    return newId;
  }

  async updateEvent(id: string, event: Partial<Omit<EventItem, 'id'>>): Promise<void> {
    if (this.useMockData) {
      const index = this.mockData.events.findIndex(item => item.id === id);
      if (index !== -1) {
        this.mockData.events[index] = {
          ...this.mockData.events[index],
          ...event
        };
      }
      return;
    }
    
    try {
      const docRef = doc(this.firestore, 'events', id);
      console.log('Updating event in Firestore:', id, event);
      await updateDoc(docRef, { ...event });
      console.log('Event updated successfully');
    } catch (error) {
      console.error('Error updating event in Firestore:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    if (this.useMockData) {
      this.mockData.events = this.mockData.events.filter(item => item.id !== id);
      return;
    }
    
    try {
      const docRef = doc(this.firestore, 'events', id);
      console.log('Deleting event from Firestore:', id);
      await deleteDoc(docRef);
      console.log('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event from Firestore:', error);
      throw error;
    }
  }

  // Contact methods
  async submitContactForm(formData: Omit<ContactMessage, 'id' | 'date' | 'read'>): Promise<string> {
    if (this.useMockData) {
      const id = Date.now().toString();
      const newItem: ContactMessage = {
        ...formData,
        id: id,
        date: new Date().toISOString(),
        read: false
      };
      
      if (!this.mockData.contactMessages) {
        this.mockData.contactMessages = [];
      }
      
      this.mockData.contactMessages.push(newItem);
      return id;
    }
    
    try {
      const contactRef = collection(this.firestore, 'contactMessages');
      const message = {
        ...formData,
        date: new Date().toISOString(),
        read: false
      };
      
      console.log('Adding contact message to Firestore:', message);
      const docRef = await addDoc(contactRef, message);
      console.log('Contact message added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding contact message to Firestore:', error);
      throw error;
    }
  }
  
  // Keep private mock methods for reference if needed
} 