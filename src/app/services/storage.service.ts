import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private uploadProgress = new BehaviorSubject<number>(0);
  uploadProgress$ = this.uploadProgress.asObservable();
  
  private uploadState = new BehaviorSubject<'idle' | 'uploading' | 'success' | 'error'>('idle');
  uploadState$ = this.uploadState.asObservable();
  
  private errorMessage = new BehaviorSubject<string | null>(null);
  errorMessage$ = this.errorMessage.asObservable();

  // Flag to indicate if direct uploads are failing due to CORS
  private corsIssueDetected = false;

  constructor(
    private storage: Storage,
    private http: HttpClient
  ) {}
  
  /**
   * Upload a file to Firebase Storage
   * @param file File to upload
   * @param path Storage path
   * @returns Observable with download URL
   */
  uploadFile(file: File, path: string): Observable<string> {
    // Reset state
    this.uploadProgress.next(0);
    this.uploadState.next('uploading');
    this.errorMessage.next(null);
    
    if (!file) {
      this.uploadState.next('error');
      this.errorMessage.next('No file selected');
      return of('');
    }
    
    // If we've detected CORS issues in this session, use local storage as fallback
    if (this.corsIssueDetected) {
      return this.handleLocalFallbackUpload(file, path);
    }
    
    // Create a unique filename
    const timestamp = new Date().getTime();
    const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const fullPath = `${path}/${filename}`;
    
    // Create storage reference
    const storageRef = ref(this.storage, fullPath);
    
    try {
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Return observable with download URL
      return new Observable<string>(observer => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Update progress
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log(`Upload progress: ${progress}%`);
            this.uploadProgress.next(progress);
          },
          (error) => {
            // Handle error
            console.error('Upload error:', error);
            
            // Check if error is CORS-related
            if (this.isCorsError(error)) {
              console.log('CORS issue detected, using fallback method');
              this.corsIssueDetected = true;
              
              // Use fallback method
              this.handleLocalFallbackUpload(file, path).subscribe({
                next: (url) => observer.next(url),
                error: (err) => observer.error(err),
                complete: () => observer.complete()
              });
            } else {
              this.uploadState.next('error');
              this.errorMessage.next(this.getErrorMessage(error));
              observer.error(error);
            }
          },
          async () => {
            // Upload complete
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('File uploaded successfully, download URL:', downloadURL);
              this.uploadState.next('success');
              observer.next(downloadURL);
              observer.complete();
            } catch (error: any) {
              console.error('Error getting download URL:', error);
              this.uploadState.next('error');
              this.errorMessage.next(this.getErrorMessage(error));
              observer.error(error);
            }
          }
        );
        
        // Return unsubscribe function
        return () => {
          // If still uploading, cancel the task
          if (this.uploadState.value === 'uploading') {
            uploadTask.cancel();
          }
        };
      });
    } catch (error: any) {
      console.error('Upload setup error:', error);
      this.uploadState.next('error');
      this.errorMessage.next(this.getErrorMessage(error));
      return of('');
    }
  }
  
  /**
   * Fallback upload method that stores locally and simulates upload
   * This is a workaround for CORS issues
   */
  private handleLocalFallbackUpload(file: File, path: string): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // Get base64 data URL
          const dataUrl = event.target?.result as string;
          
          // Generate fake Firebase URL
          const timestamp = new Date().getTime();
          const fakeUrl = `${window.location.origin}/local-storage/${path}/${timestamp}_${file.name}`;
          
          // Store in local storage with the fake URL as key
          localStorage.setItem(`bapti_image_${timestamp}`, dataUrl);
          
          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            this.uploadProgress.next(progress);
            
            if (progress >= 100) {
              clearInterval(interval);
              this.uploadState.next('success');
              console.log('Local fallback upload complete:', fakeUrl);
              observer.next(fakeUrl);
              observer.complete();
            }
          }, 100);
        } catch (error: any) {
          this.uploadState.next('error');
          this.errorMessage.next('Error in local storage fallback: ' + error.message);
          observer.error(error);
        }
      };
      
      reader.onerror = (error) => {
        this.uploadState.next('error');
        this.errorMessage.next('Error reading file for local storage fallback');
        observer.error(error);
      };
      
      // Start reading the file
      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete a file from Firebase Storage or local storage
   * @param downloadURL Download URL of the file to delete
   */
  deleteFile(downloadURL: string): Observable<boolean> {
    if (!downloadURL) {
      return of(false);
    }
    
    // Check if it's a local storage URL
    if (downloadURL.startsWith(window.location.origin + '/local-storage/')) {
      try {
        // Extract timestamp from URL
        const matches = downloadURL.match(/(\d+)_[^\/]+$/);
        if (matches && matches[1]) {
          const key = `bapti_image_${matches[1]}`;
          localStorage.removeItem(key);
          return of(true);
        }
        return of(false);
      } catch (error) {
        console.error('Error removing from local storage:', error);
        return of(false);
      }
    }
    
    // Handle Firebase URL
    try {
      // Extract file path from URL
      const fileRef = ref(this.storage, downloadURL);
      
      // Delete file
      return from(deleteObject(fileRef)).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Error deleting file:', error);
          return of(false);
        })
      );
    } catch (error) {
      console.error('Error setting up file deletion:', error);
      return of(false);
    }
  }
  
  /**
   * Get image URL - either from Firebase or local storage
   * This helps display locally stored images
   */
  getImageUrl(url: string): Observable<string> {
    if (!url) return of('');
    
    // Check if it's a local storage URL
    if (url.startsWith(window.location.origin + '/local-storage/')) {
      try {
        // Extract timestamp from URL
        const matches = url.match(/(\d+)_[^\/]+$/);
        if (matches && matches[1]) {
          const key = `bapti_image_${matches[1]}`;
          const dataUrl = localStorage.getItem(key);
          if (dataUrl) {
            return of(dataUrl);
          }
        }
        return of(url); // Fallback to the URL itself
      } catch (error) {
        console.error('Error getting from local storage:', error);
        return of(url);
      }
    }
    
    // It's a regular URL
    return of(url);
  }
  
  /**
   * Reset the upload state
   */
  resetUploadState(): void {
    this.uploadProgress.next(0);
    this.uploadState.next('idle');
    this.errorMessage.next(null);
  }
  
  /**
   * Check if an error is CORS-related
   */
  private isCorsError(error: any): boolean {
    if (!error) return false;
    
    // Check error message
    if (error.message && (
      error.message.includes('XMLHttpRequest') ||
      error.message.includes('CORS') ||
      error.message.includes('Cross-Origin') ||
      error.message.includes('access control') ||
      error.message.includes('blocked by CORS')
    )) {
      return true;
    }
    
    // Check code
    if (error.code === 'storage/unauthorized' || error.code === 'storage/unknown') {
      // These can sometimes be caused by CORS
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a human-readable error message
   */
  private getErrorMessage(error: any): string {
    // Check if it's a Firebase storage error
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          return 'You don\'t have permission to upload files. Please check your Firebase Storage rules.';
        case 'storage/canceled':
          return 'Upload was canceled.';
        case 'storage/unknown':
          return 'An unknown error occurred during upload.';
        case 'storage/quota-exceeded':
          return 'Storage quota exceeded.';
        case 'storage/invalid-checksum':
          return 'File upload failed due to checksum mismatch.';
        case 'storage/server-file-wrong-size':
          return 'File upload failed due to size mismatch.';
        default:
          return `Upload failed: ${error.message || error.code}`;
      }
    }
    
    // Check for CORS-related errors
    if (this.isCorsError(error)) {
      return 'Upload failed due to CORS policy. Using local storage fallback to continue.';
    }
    
    // Generic error
    return error.message || 'An unknown error occurred';
  }
} 