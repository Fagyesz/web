import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DataService, EventItem } from '../../../services/data.service';
import { StorageService } from '../../../services/storage.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatProgressBarModule,
    TranslateModule
  ],
  template: `
    <div class="admin-page">
      <h2>{{ 'admin.events' | translate }}</h2>
      
      <div class="admin-actions">
        <button class="btn-primary" (click)="showAddForm()">
          <i class="fas fa-plus"></i> {{ 'admin.add-new' | translate }}
        </button>
      </div>
      
      <div *ngIf="isAdding || isEditing" class="event-form">
        <h3>{{ isEditing ? ('admin.edit' | translate) : ('admin.add-new' | translate) }}</h3>
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="title">{{ 'admin.events-management.form.title' | translate }}</label>
            <input type="text" id="title" formControlName="title" class="form-control">
            <div *ngIf="eventForm.controls['title'].invalid && eventForm.controls['title'].touched" class="error-message">
              {{ 'admin.events-management.form.title' | translate }} {{ 'admin.required' | translate }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">{{ 'admin.events-management.form.description' | translate }}</label>
            <textarea id="description" formControlName="description" rows="6" class="form-control"></textarea>
            <div *ngIf="eventForm.controls['description'].invalid && eventForm.controls['description'].touched" class="error-message">
              {{ 'admin.events-management.form.description' | translate }} {{ 'admin.required' | translate }}
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="date">{{ 'admin.events-management.form.date' | translate }}</label>
              <input type="date" id="date" formControlName="date" class="form-control">
              <div *ngIf="eventForm.controls['date'].invalid && eventForm.controls['date'].touched" class="error-message">
                {{ 'admin.events-management.form.date' | translate }} {{ 'admin.required' | translate }}
              </div>
            </div>
            
            <div class="form-group">
              <label for="time">{{ 'admin.events-management.form.time' | translate }}</label>
              <input type="text" id="time" formControlName="time" class="form-control" placeholder="7:00 PM - 8:30 PM">
              <div *ngIf="eventForm.controls['time'].invalid && eventForm.controls['time'].touched" class="error-message">
                {{ 'admin.events-management.form.time' | translate }} {{ 'admin.required' | translate }}
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="location">{{ 'admin.events-management.form.location' | translate }}</label>
            <input type="text" id="location" formControlName="location" class="form-control">
            <div *ngIf="eventForm.controls['location'].invalid && eventForm.controls['location'].touched" class="error-message">
              {{ 'admin.events-management.form.location' | translate }} {{ 'admin.required' | translate }}
            </div>
          </div>
          
          <!-- Image Upload Field -->
          <div class="form-group">
            <label for="image">{{ 'admin.events-management.form.image' | translate }}</label>
            <div class="image-upload-container">
              <input type="file" id="image" (change)="handleImageUpload($event)" accept="image/*" class="file-input">
              <div class="file-preview" *ngIf="selectedFile() || imageUrl()">
                <img [src]="imagePreview() || imageUrl()" alt="Event Image Preview" class="preview-image">
                <button type="button" class="btn-icon btn-delete" (click)="removeImage()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button type="button" class="btn-secondary" (click)="triggerFileInput()">
                {{ selectedFile() ? 'admin.change-image' : 'admin.select-image' | translate }}
              </button>
              <span *ngIf="selectedFile()" class="file-name">{{ selectedFile()!.name }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancelForm()">
              {{ 'admin.cancel' | translate }}
            </button>
            <button type="submit" class="btn-primary" [disabled]="eventForm.invalid || isSubmitting">
              {{ isSubmitting ? ('admin.saving' | translate) : ('admin.save' | translate) }}
            </button>
          </div>
        </form>
      </div>
      
      <div class="events-list">
        <div *ngIf="isLoading" class="loading-spinner">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      
        <div *ngIf="!isLoading && events.length === 0" class="empty-state">
          No events yet. Click "Add new" to create one.
        </div>
        
        <div *ngFor="let item of events" class="event-item">
          <div class="event-image" *ngIf="item.imageUrl">
            <img [src]="item.imageUrl" alt="{{ item.title }}" class="event-thumbnail">
          </div>
          <div class="event-content">
            <h3>{{ item.title }}</h3>
            <div class="event-meta">
              <span class="event-date">{{ item.date }}</span>
              <span class="event-time">{{ item.time }}</span>
              <span class="event-location">{{ item.location }}</span>
            </div>
            <p>{{ item.description }}</p>
          </div>
          <div class="event-actions">
            <button class="btn-icon" (click)="editEvent(item)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" (click)="item.id ? deleteEvent(item.id) : null">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 1rem;
    }
    .admin-actions {
      margin-bottom: 1.5rem;
    }
    .btn-primary {
      background-color: #3474eb;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-icon {
      background: none;
      border: none;
      color: #3474eb;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.5rem;
    }
    .btn-delete {
      color: #dc3545;
    }
    .event-form {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
    }
    textarea.form-control {
      resize: vertical;
    }
    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .events-list {
      margin-top: 2rem;
    }
    .event-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .event-content {
      flex: 1;
    }
    .event-content h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .event-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      color: #6c757d;
      font-size: 0.875rem;
    }
    .event-actions {
      display: flex;
      gap: 0.5rem;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .image-upload-container {
      border: 2px dashed #ced4da;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .file-input {
      display: none;
    }
    .file-preview {
      margin-bottom: 1rem;
      position: relative;
      max-width: 300px;
    }
    .preview-image {
      width: 100%;
      border-radius: 4px;
      object-fit: cover;
    }
    .file-name {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6c757d;
    }
    .event-image {
      width: 120px;
      height: 80px;
      margin-right: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      overflow: hidden;
    }
    .event-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #3474eb;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class EventsManagementComponent implements OnInit, OnDestroy {
  events: EventItem[] = [];
  eventForm: FormGroup;
  isAdding = false;
  isEditing = false;
  currentId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  
  // File upload related properties
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  imageUrl = signal<string | null>(null);
  
  // Upload status tracking using signals
  uploadStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  uploadProgress = signal<number>(0);
  uploadError = signal<string>('');
  
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      time: ['', [Validators.required]],
      location: ['Új Élet Baptista Gyülekezet Gyöngyös', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subscription.add(
      this.dataService.getEvents().subscribe({
        next: (data) => {
          this.events = data;
          this.isLoading = false;
          console.log('Events loaded from Firestore:', data.length);
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.errorMessage = 'Error loading events from database. Please try again.';
          this.isLoading = false;
          this.showError(this.translate.instant('admin.error.loading'));
        }
      })
    );
  }

  showAddForm(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.currentId = null;
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.imageUrl.set(null);
    this.eventForm.reset({
      date: new Date().toISOString().substring(0, 10),
      location: 'Új Élet Baptista Gyülekezet Gyöngyös'
    });
  }

  editEvent(item: EventItem): void {
    this.isAdding = false;
    this.isEditing = true;
    this.currentId = item.id || null;
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.imageUrl.set(item.imageUrl || null);
    this.eventForm.setValue({
      title: item.title,
      description: item.description,
      date: item.date,
      time: item.time,
      location: item.location
    });
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle image upload
   */
  handleImageUpload(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    this.selectedFile.set(file);
    this.uploadStatus.set('uploading');
    
    // Create a file reader for preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview.set(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Set up subscriptions for the upload process
    const progressSub = this.storageService.uploadProgress$.subscribe(progress => {
      this.uploadProgress.set(progress);
    });
    
    const stateSub = this.storageService.uploadState$.subscribe(state => {
      this.uploadStatus.set(state);
    });
    
    const errorSub = this.storageService.errorMessage$.subscribe(message => {
      if (message) {
        this.uploadError.set(message);
      }
    });
    
    // Start upload
    this.storageService.uploadFile(file, 'event-images')
      .subscribe({
        next: (downloadURL) => {
          if (downloadURL) {
            this.eventForm.patchValue({ imageUrl: downloadURL });
          }
        },
        error: (error) => {
          console.error('Upload error in component:', error);
          this.uploadError.set(error.message || 'Failed to upload image');
        },
        complete: () => {
          // Clean up subscriptions
          progressSub.unsubscribe();
          stateSub.unsubscribe();
          errorSub.unsubscribe();
        }
      });
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    // If we already uploaded the image to storage, delete it
    const imageUrl = this.eventForm.get('imageUrl')?.value;
    if (imageUrl) {
      this.storageService.deleteFile(imageUrl).subscribe(success => {
        if (success) {
          console.log('Image successfully deleted from storage');
        } else {
          console.warn('Failed to delete image from storage');
        }
      });
    }
    
    // Reset form values and preview
    this.eventForm.patchValue({ imageUrl: null });
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.uploadStatus.set('idle');
    this.uploadProgress.set(0);
    this.uploadError.set('');
  }

  async deleteEvent(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        // Find the event to get its image URL if it exists
        const event = this.events.find(e => e.id === id);
        
        // Delete the event from Firestore
        await this.dataService.deleteEvent(id);
        
        // If event had an image, delete it from storage
        if (event?.imageUrl) {
          try {
            await this.storageService.deleteFile(event.imageUrl);
          } catch (error) {
            console.error('Error deleting image file:', error);
            // Continue even if image deletion fails
          }
        }
        
        this.events = this.events.filter(item => item.id !== id);
        this.showSuccess(this.translate.instant('admin.success.deleted'));
      } catch (error) {
        console.error('Error deleting event:', error);
        this.errorMessage = 'Error deleting event. Please try again.';
      }
    }
  }

  /**
   * Cancel the form and return to the events list
   */
  cancelForm(): void {
    // If we uploaded an image but are cancelling the form, delete it
    const imageUrl = this.eventForm.get('imageUrl')?.value;
    if (imageUrl && this.isAdding) {
      this.storageService.deleteFile(imageUrl).subscribe();
    }
    
    this.resetForm();
    this.router.navigate(['/admin']);
  }

  async onSubmit(): Promise<void> {
    if (this.eventForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formData = { ...this.eventForm.value };
      let imageUploadUrl: string | null = null;
      
      // If there's a new file selected, upload it
      if (this.selectedFile()) {
        try {
          // Convert Observable to Promise to use with await
          imageUploadUrl = await firstValueFrom(
            this.storageService.uploadFile(
              this.selectedFile()!, 
              'event-images'
            )
          );
        } catch (error) {
          console.error('Error uploading image:', error);
          // Show warning but continue with event save
          this.showError('Image upload failed, but event will be saved without image.');
        }
      }
      
      // If editing and already had an image but now has a new one, delete the old image
      if (this.isEditing && this.imageUrl() && imageUploadUrl && this.imageUrl() !== imageUploadUrl) {
        try {
          await firstValueFrom(this.storageService.deleteFile(this.imageUrl()!));
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      // Add image URL to form data if available
      if (imageUploadUrl || this.imageUrl()) {
        formData.imageUrl = imageUploadUrl || this.imageUrl();
      }
      
      if (this.isEditing && this.currentId) {
        // Update existing event
        await this.dataService.updateEvent(this.currentId, formData);
        this.showSuccess(this.translate.instant('admin.success.saved'));
        console.log('Event updated successfully:', this.currentId);
      } else {
        // Add new event
        const newId = await this.dataService.addEvent(formData);
        this.showSuccess(this.translate.instant('admin.success.added'));
        console.log('Event added successfully:', newId);
      }

      this.isAdding = false;
      this.isEditing = false;
      this.loadEvents(); // Reload events after successful operation
    } catch (error) {
      console.error('Error saving event:', error);
      this.errorMessage = 'Error saving event to database. Please try again.';
      this.showError(this.translate.instant('admin.error.saving'));
    } finally {
      this.isSubmitting = false;
      this.isLoading = false;
    }
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['bg-green-700', 'text-white']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['bg-red-700', 'text-white']
    });
  }

  resetForm(): void {
    this.eventForm.reset();
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.imageUrl.set(null);
  }
} 