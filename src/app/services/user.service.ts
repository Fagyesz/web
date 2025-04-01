import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  DocumentData,
  collectionData,
  Timestamp,
  DocumentReference,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Observable, from, of, BehaviorSubject, throwError, firstValueFrom } from 'rxjs';
import { map, catchError, tap, switchMap, first } from 'rxjs/operators';
import { UserProfile, UserRole, isRoleHigherOrEqual } from '../models/user.model';
import { DebugService } from './debug.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserProfile = new BehaviorSubject<UserProfile | null>(null);
  private users = new BehaviorSubject<UserProfile[]>([]);
  private readonly USERS_COLLECTION = 'users';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private debugService: DebugService
  ) {
    // Initialize auth state listener
    this.initAuthListener();
  }

  /**
   * Initialize auth state listener to keep user profile in sync
   */
  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          // Try to get user profile
          const profile = await firstValueFrom(this.getUserProfile(user.uid));
          if (profile) {
            this.currentUserProfile.next(profile);
          } else {
            // Create profile if it doesn't exist
            await this.createUserProfile(user);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          this.currentUserProfile.next(null);
        }
      } else {
        this.currentUserProfile.next(null);
      }
    });
  }

  /**
   * Get the current user profile
   */
  getCurrentUserProfile(): Observable<UserProfile | null> {
    return this.currentUserProfile.asObservable();
  }

  /**
   * Create a new user profile in Firestore
   * @param user Firebase Auth user
   */
  async createUserProfile(user: User): Promise<void> {
    if (!user.uid) {
      throw new Error('User ID is required');
    }

    try {
      const userRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      
      // Default new users to GUEST role
      const newUser: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        role: UserRole.GUEST,
        createdAt: Date.now()
      };
      
      if (this.debugService.isDebugModeEnabled()) {
        console.log('Creating new user profile:', newUser);
      }
      
      await setDoc(userRef, newUser);
      this.currentUserProfile.next(newUser);
      
      if (this.debugService.isDebugModeEnabled()) {
        console.log('User profile created successfully');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Create a new user profile in Firestore with a specific role
   * @param user Firebase Auth user
   * @param role The role to assign to the user
   */
  async createUserProfileWithRole(user: User, role: UserRole): Promise<void> {
    if (!user.uid) {
      throw new Error('User ID is required');
    }

    try {
      console.log(`Creating new user profile for ${user.email} with role ${role}`);
      const userRef = doc(this.firestore, this.USERS_COLLECTION, user.uid);
      
      // Extract provider data if available
      const providerData = user.providerData && user.providerData[0];
      const provider = providerData?.providerId?.split('.')[0] || 'unknown';
      
      // Create user with specified role
      const newUser: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        role: role,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        loginCount: 1,
        provider: provider, // Store authentication provider
        emailVerified: user.emailVerified || false,
        phoneNumber: user.phoneNumber || undefined
      };
      
      console.log('About to save user profile to Firestore:', newUser);
      
      try {
        await setDoc(userRef, newUser);
        console.log('✅ User profile successfully saved to Firestore');
        this.currentUserProfile.next(newUser);
      } catch (firestoreError: any) {
        console.error('❌ Firestore write error:', firestoreError);
        // Check if it's a permission error
        if (firestoreError.toString().includes('permission-denied')) {
          console.error('This appears to be a Firestore permissions error - check your security rules');
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error('Error creating user profile with role:', error);
      throw error;
    }
  }

  /**
   * Get a user profile by UID
   * @param uid User ID
   */
  getUserProfile(uid: string): Observable<UserProfile | null> {
    try {
      const userRef = doc(this.firestore, this.USERS_COLLECTION, uid);
      
      return from(getDoc(userRef)).pipe(
        map(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (this.debugService.isDebugModeEnabled()) {
              console.log('Retrieved user profile:', data);
            }
            return { ...data, uid: docSnap.id };
          }
          
          if (this.debugService.isDebugModeEnabled()) {
            console.log('User profile not found');
          }
          
          return null;
        }),
        catchError(error => {
          console.error('Error getting user profile:', error);
          return of(null);
        })
      );
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return of(null);
    }
  }

  /**
   * Get all user profiles
   */
  getAllUsers(): Observable<UserProfile[]> {
    try {
      console.log('Getting all user profiles...');
      const usersRef = collection(this.firestore, this.USERS_COLLECTION);
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      
      return collectionData(q, { idField: 'uid' }).pipe(
        map(users => {
          console.log('Retrieved users:', users.length);
          
          if (users.length === 0) {
            console.log('No users found, might be a Firestore permissions issue');
          }
          
          if (this.debugService.isDebugModeEnabled()) {
            console.log('Users data:', JSON.stringify(users));
          }
          
          // Update the internal users BehaviorSubject
          this.users.next(users as UserProfile[]);
          
          return users as UserProfile[];
        }),
        catchError(error => {
          console.error('Error getting users in service:', error);
          
          if (error.toString().includes('permission-denied')) {
            console.error('Firestore permissions error - check security rules for users collection');
          }
          
          // Return empty array instead of throwing to avoid breaking the UI
          return of([]);
        })
      );
    } catch (error) {
      console.error('Exception in getAllUsers:', error);
      return of([]);
    }
  }

  /**
   * Update a user's role
   * @param targetUid User ID to update
   * @param newRole New role to assign
   */
  async updateUserRole(targetUid: string, newRole: UserRole): Promise<boolean> {
    try {
      // Check if current user has permission to update roles
      const currentProfile = this.currentUserProfile.value;
      
      if (!currentProfile) {
        throw new Error('Not authenticated');
      }
      
      // Check if current user has permission to assign this role
      const currentUserRole = currentProfile.role;
      
      if (!isRoleHigherOrEqual(currentUserRole, UserRole.ADMIN)) {
        throw new Error('Insufficient permissions to manage roles');
      }
      
      // DEV users can assign any role, ADMIN users can only assign STAFF and GUEST
      if (currentUserRole === UserRole.ADMIN && 
         (newRole === UserRole.ADMIN || newRole === UserRole.DEV)) {
        throw new Error('Admin users cannot assign Admin or Dev roles');
      }
      
      // Cannot change your own role
      if (targetUid === currentProfile.uid) {
        throw new Error('Cannot change your own role');
      }
      
      // Update the role
      const userRef = doc(this.firestore, this.USERS_COLLECTION, targetUid);
      await updateDoc(userRef, { role: newRole });
      
      if (this.debugService.isDebugModeEnabled()) {
        console.log(`Updated user ${targetUid} role to ${newRole}`);
      }
      
      // Refresh users list
      await firstValueFrom(this.getAllUsers());
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Check if the current user has a specific role or higher
   * @param requiredRole The minimum role required
   */
  hasRole(requiredRole: UserRole): boolean {
    const profile = this.currentUserProfile.value;
    if (!profile) return false;
    
    return isRoleHigherOrEqual(profile.role, requiredRole);
  }

  /**
   * Search for users by email or display name
   * @param searchTerm The search term
   */
  searchUsers(searchTerm: string): Observable<UserProfile[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getAllUsers();
    }
    
    return this.getAllUsers().pipe(
      map(users => {
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
          user.email.toLowerCase().includes(term) || 
          (user.displayName && user.displayName.toLowerCase().includes(term))
        );
      })
    );
  }

  /**
   * Initialize the users collection if it doesn't exist
   * This should be called on app startup
   */
  async initializeUsersCollection(): Promise<void> {
    try {
      console.log('Checking if users collection exists...');
      const usersRef = collection(this.firestore, this.USERS_COLLECTION);
      
      try {
        const snapshot = await getDocs(usersRef);
        
        if (snapshot.empty) {
          console.log('Users collection is empty. Creating default admin user...');
          
          // Create a default admin user
          const adminUser: UserProfile = {
            uid: 'default-admin-' + Date.now(),
            email: 'admin@bapti.org',
            displayName: 'Default Admin',
            role: UserRole.ADMIN,
            createdAt: Date.now(),
            lastLoginAt: Date.now()
          };
          
          try {
            await setDoc(doc(this.firestore, this.USERS_COLLECTION, adminUser.uid), adminUser);
            console.log('✅ Default admin user created successfully:', adminUser);
          } catch (writeError: any) {
            console.error('❌ Error creating default admin user:', writeError);
            
            if (writeError.toString().includes('permission-denied')) {
              console.error(`
              ======================= FIRESTORE PERMISSION ERROR =======================
              It appears you don't have permission to write to the users collection.
              Please check your Firestore security rules and make sure they allow writes.
              
              For testing, you can use these rules in the Firebase console:
              
              rules_version = '2';
              service cloud.firestore {
                match /databases/{database}/documents {
                  match /{document=**} {
                    allow read, write: if request.auth != null;
                  }
                }
              }
              ======================= FIRESTORE PERMISSION ERROR =======================
              `);
            }
          }
        } else {
          console.log('✅ Users collection exists with data:', snapshot.size, 'documents');
        }
      } catch (readError: any) {
        console.error('❌ Error checking users collection:', readError);
        
        if (readError.toString().includes('permission-denied')) {
          console.error(`
          ======================= FIRESTORE PERMISSION ERROR =======================
          It appears you don't have permission to read from the users collection.
          Please check your Firestore security rules and make sure they allow reads.
          
          For testing, you can use these rules in the Firebase console:
          
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if request.auth != null;
              }
            }
          }
          ======================= FIRESTORE PERMISSION ERROR =======================
          `);
        }
      }
    } catch (error) {
      console.error('Error initializing users collection:', error);
    }
  }

  /**
   * Force update a user's role directly in Firestore
   * This is a more direct approach that bypasses the regular update flow
   */
  async forceUpdateUserRole(uid: string, role: UserRole): Promise<boolean> {
    try {
      console.log(`Force updating user ${uid} to role ${role}`);
      const userDocRef = doc(this.firestore, 'users', uid);
      
      // Direct update to Firestore
      await updateDoc(userDocRef, { 
        role: role,
        lastUpdatedAt: new Date().getTime(),
        updatedBy: this.auth.currentUser?.uid || 'system'
      });
      
      console.log(`User ${uid} role successfully updated to ${role}`);
      return true;
    } catch (error) {
      console.error('Error force updating user role:', error);
      return false;
    }
  }
} 