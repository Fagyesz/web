import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DataService, NewsItem } from '../../../services/data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="admin-page">
      <h2>{{ 'admin.news' | translate }}</h2>
      
      <div class="admin-actions">
        <button class="btn-primary" (click)="showAddForm()">
          <i class="fas fa-plus"></i> {{ 'admin.add-new' | translate }}
        </button>
      </div>
      
      <div *ngIf="isAdding || isEditing" class="news-form">
        <h3>{{ isEditing ? ('admin.edit' | translate) : ('admin.add-new' | translate) }}</h3>
        <form [formGroup]="newsForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" formControlName="title" class="form-control">
            <div *ngIf="newsForm.controls['title'].invalid && newsForm.controls['title'].touched" class="error-message">
              Title is required
            </div>
          </div>
          
          <div class="form-group">
            <label for="content">Content</label>
            <textarea id="content" formControlName="content" rows="6" class="form-control"></textarea>
            <div *ngIf="newsForm.controls['content'].invalid && newsForm.controls['content'].touched" class="error-message">
              Content is required
            </div>
          </div>
          
          <div class="form-group">
            <label for="date">Date</label>
            <input type="date" id="date" formControlName="date" class="form-control">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancelForm()">
              {{ 'admin.cancel' | translate }}
            </button>
            <button type="submit" class="btn-primary" [disabled]="newsForm.invalid">
              {{ 'admin.save' | translate }}
            </button>
          </div>
        </form>
      </div>
      
      <div class="news-list">
        <div *ngIf="news.length === 0" class="empty-state">
          No news items yet. Click "Add new" to create one.
        </div>
        
        <div *ngFor="let item of news" class="news-item">
          <div class="news-content">
            <h3>{{ item.title }}</h3>
            <p class="news-date">{{ item.date }}</p>
            <p>{{ item.content }}</p>
          </div>
          <div class="news-actions">
            <button class="btn-icon" (click)="editNews(item)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" (click)="item.id ? deleteNews(item.id) : null">
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
    .news-form {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1rem;
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
    .news-list {
      margin-top: 2rem;
    }
    .news-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .news-content {
      flex: 1;
    }
    .news-content h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .news-date {
      color: #6c757d;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .news-actions {
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
  `]
})
export class NewsManagementComponent implements OnInit, OnDestroy {
  news: NewsItem[] = [];
  newsForm: FormGroup;
  isAdding = false;
  isEditing = false;
  currentId: string | null = null;
  isLoading = false;
  errorMessage = '';
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {
    this.newsForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      date: [new Date().toISOString().substring(0, 10)]
    });
  }

  ngOnInit(): void {
    this.loadNews();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNews(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subscription.add(
      this.dataService.getNews().subscribe({
        next: (data) => {
          this.news = data;
          this.isLoading = false;
          console.log('News loaded from Firestore:', data.length);
        },
        error: (error) => {
          console.error('Error loading news:', error);
          this.errorMessage = 'Error loading news from database. Please try again.';
          this.isLoading = false;
          this.showError('Error loading news. Please try again.');
        }
      })
    );
  }

  showAddForm(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.currentId = null;
    this.newsForm.reset({
      date: new Date().toISOString().substring(0, 10)
    });
  }

  editNews(item: NewsItem): void {
    this.isAdding = false;
    this.isEditing = true;
    this.currentId = item.id || null;
    this.newsForm.setValue({
      title: item.title,
      content: item.content,
      date: item.date
    });
  }

  async deleteNews(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this news item?')) {
      try {
        await this.dataService.deleteNews(id);
        this.news = this.news.filter(item => item.id !== id);
        this.showSuccess('News item deleted successfully.');
        console.log('News deleted successfully:', id);
      } catch (error) {
        console.error('Error deleting news:', error);
        this.errorMessage = 'Error deleting news from database. Please try again.';
        this.showError('Error deleting news. Please try again.');
      }
    }
  }

  cancelForm(): void {
    this.isAdding = false;
    this.isEditing = false;
    this.errorMessage = '';
  }

  async onSubmit(): Promise<void> {
    if (this.newsForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formData = this.newsForm.value;
      
      if (this.isEditing && this.currentId) {
        // Update existing news item
        await this.dataService.updateNews(this.currentId, formData);
        this.showSuccess('News item updated successfully.');
        console.log('News updated successfully:', this.currentId);
      } else {
        // Add new news item
        const newId = await this.dataService.addNews(formData);
        this.showSuccess('News item added successfully.');
        console.log('News added successfully:', newId);
      }

      this.isAdding = false;
      this.isEditing = false;
      this.loadNews(); // Reload news after successful operation
    } catch (error) {
      console.error('Error saving news:', error);
      this.errorMessage = 'Error saving news to database. Please try again.';
      this.isLoading = false;
      this.showError('Error saving news. Please try again.');
    }
  }

  showSuccess(message: string): void {
    // Add a success notification method
    console.log('SUCCESS:', message);
  }

  showError(message: string): void {
    // Add an error notification method
    console.error('ERROR:', message);
  }
} 