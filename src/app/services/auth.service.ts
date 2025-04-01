import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut, 
  user, 
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, from, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { UserProfile, UserRole } from '../models/user.model';
import { doc, updateDoc, setDoc, getDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { LoginTrackerService } from './login-tracker.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private mockAdminUser = {
    uid: 'mock-admin-uid',
    email: 'admin@bapti.com',
    displayName: 'Admin User',
    emailVerified: true,
    isStaff: true
  };
  private useMockAuth = false;
  private readonly SESSION_KEY = 'bapti_auth_user';
  private readonly SESSION_EXPIRY_KEY = 'bapti_auth_expiry';

  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private firestore: Firestore,
    private loginTrackerService: LoginTrackerService
  ) {
    this.checkFirebaseAuth();
    this.checkStoredSession();
    
    // Initialize users collection if it doesn't exist
    this.userService.initializeUsersCollection()
      .then(() => console.log('Users collection initialized'))
      .catch(error => console.error('Error initializing users collection:', error));
  }

  private checkFirebaseAuth() {
    try {
      if (!this.auth) {
        throw new Error('Auth is not initialized');
      }
      console.log('Firebase Auth is properly configured');
      this.useMockAuth = false;
    } catch (error) {
      console.error('Firebase Auth configuration error:', error);
      console.warn('Firebase Auth is not configured properly, using mock authentication instead');
      this.useMockAuth = true;
    }
  }

  /**
   * Check if there's a valid stored session and restore it
   */
  private checkStoredSession(): void {
    try {
      const storedUser = localStorage.getItem(this.SESSION_KEY);
      const expiryTime = localStorage.getItem(this.SESSION_EXPIRY_KEY);
      
      if (storedUser && expiryTime) {
        const now = new Date().getTime();
        const expiry = parseInt(expiryTime, 10);
        
        // If the session is still valid
        if (now < expiry) {
          console.log('Restoring session from localStorage');
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user as User);
        } else {
          // Session expired, clear it
          console.log('Session expired, clearing localStorage');
          this.clearStoredSession();
        }
      }
    } catch (error) {
      console.error('Error checking stored session:', error);
      this.clearStoredSession();
    }
  }
  
  /**
   * Store the user session in localStorage with a 24-hour expiry
   */
  private storeSession(user: User | any): void {
    try {
      // Set expiry time to 24 hours from now
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(this.SESSION_EXPIRY_KEY, expiryTime.toString());
      
      console.log('Session stored in localStorage with 24-hour expiry');
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }
  
  /**
   * Clear the stored session from localStorage
   */
  private clearStoredSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
  }

  /**
   * Get the current user as an observable
   */
  public user(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Get the current user value (not as an observable)
   */
  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if the current user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Check if the current user is a staff member (admin)
   */
  public get isStaff(): boolean {
    const user = this.currentUserSubject.value;
    
    if (this.useMockAuth && user?.email === this.mockAdminUser.email) {
      console.log('Staff access granted via mock auth');
      return true;
    }
    
    // First try to get the role from the userService
    const userProfile = this.userService['currentUserProfile'].value;
    if (userProfile) {
      const hasStaffRole = userProfile.role === UserRole.STAFF || 
                          userProfile.role === UserRole.ADMIN || 
                          userProfile.role === UserRole.DEV;
      console.log(`Checking staff status for ${userProfile.email}: role=${userProfile.role}, isStaff=${hasStaffRole}`);
      return hasStaffRole;
    }
    
    // Fallback to email pattern checking
    if (user?.email) {
      const isAdminEmail = user.email.includes('admin') || 
                          user.email.includes('staff') ||
                          user.email.includes('pastor') ||
                          user.email.endsWith('@bapti.org');
      console.log(`Fallback staff check for ${user.email}: isStaff=${isAdminEmail}`);
      return isAdminEmail;
    }
    
    console.log('Staff check failed: no user found');
    return false;
  }

  /**
   * Log in with email and password
   */
  login(email: string, password: string): Observable<User | null> {
    if (this.useMockAuth) {
      return this.mockLogin(email, password);
    }
    
    try {
      return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
        map((result: UserCredential) => {
          const user = result.user;
          this.currentUserSubject.next(user);
          this.storeSession(user);
          this.handleSuccessfulLogin(user);
          return user;
        }),
        catchError(error => {
          console.error('Firebase login error:', error);
          // Fall back to mock login if Firebase auth fails
          return this.mockLogin(email, password);
        })
      );
    } catch (error) {
      console.error('Error during login attempt:', error);
      return this.mockLogin(email, password);
    }
  }
  
  /**
   * Mock login for development/testing
   */
  private mockLogin(email: string, password: string): Observable<User | null> {
    console.log('Using mock login');
    
    // Only allow the mock admin credentials
    if (email === 'admin@bapti.com' && password === 'admin123') {
      console.log('Mock login successful');
      this.currentUserSubject.next(this.mockAdminUser as unknown as User);
      this.storeSession(this.mockAdminUser);
      this.handleSuccessfulLogin(this.mockAdminUser as unknown as User);
      return of(this.mockAdminUser as unknown as User);
    }
    
    console.error('Mock login failed - invalid credentials');
    return of(null);
  }

  /**
   * Log out the current user
   */
  logout(): Observable<void> {
    if (this.useMockAuth) {
      return this.mockLogout();
    }
    
    try {
      return from(signOut(this.auth)).pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.clearStoredSession();
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          console.error('Firebase logout error:', error);
          return this.mockLogout();
        })
      );
    } catch (error) {
      console.error('Error during logout attempt:', error);
      return this.mockLogout();
    }
  }
  
  /**
   * Mock logout for development/testing
   */
  private mockLogout(): Observable<void> {
    console.log('Using mock logout');
    this.currentUserSubject.next(null);
    this.clearStoredSession();
    this.router.navigate(['/login']);
    return of(void 0);
  }

  /**
   * Sign in with Google
   */
  signInWithGoogle(): Observable<User | null> {
    if (this.useMockAuth) {
      return this.mockLogin('admin@bapti.com', 'admin123');
    }
    
    try {
      const provider = new GoogleAuthProvider();
      
      console.log('Starting Google signin popup...');
      
      return from(signInWithPopup(this.auth, provider)).pipe(
        map((result: UserCredential) => {
          const user = result.user;
          console.log('Google login successful, raw user data:', user);
          this.currentUserSubject.next(user);
          this.storeSession(user);
          
          // Force manual user creation directly here to ensure it works
          this.createUserManually(user)
            .then(() => {
              console.log('User profile created/updated, now redirecting to home');
              setTimeout(() => {
                this.router.navigate(['/']);
              }, 500); // Small delay to ensure everything is processed
            })
            .catch(err => console.error('Error creating user profile:', err));
            
          return user;
        }),
        catchError(error => {
          console.error('Google login error:', error);
          return of(null);
        })
      );
    } catch (error) {
      console.error('Error during Google login attempt:', error);
      return of(null);
    }
  }

  /**
   * Create user manually - direct method to ensure user creation works
   */
  private async createUserManually(user: User, role: UserRole = UserRole.GUEST): Promise<void> {
    try {
      // List of known admin emails
      const knownAdminEmails = [
        'vinczef.o@gmail.com',
        'admin@bapti.org',
        'admin@bapti.com',
        'pastor@bapti.org'
      ];
      
      // Check if the user is a known admin
      const isKnownAdmin = user.email && knownAdminEmails.includes(user.email);
      
      // If the user is a known admin, force ADMIN role
      if (isKnownAdmin) {
        console.log(`User ${user.email} is a known admin, ensuring ADMIN role.`);
        role = UserRole.ADMIN;
      }
      
      // Check if user already exists in Firestore
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data();
        console.log(`User ${user.email} already exists in Firestore with role: ${existingData['role']}`);
        
        // If they're a known admin but don't have ADMIN role, forcibly update it
        if (isKnownAdmin && existingData['role'] !== UserRole.ADMIN && existingData['role'] !== UserRole.DEV) {
          console.log(`Forcing ADMIN role for known admin ${user.email} (was: ${existingData['role']})`);
          
          // Only update the role, preserve other data
          await updateDoc(userDocRef, { role: UserRole.ADMIN });
          console.log(`Updated ${user.email} to ADMIN role`);
        }
        
        // Track login with the role from existing data
        this.loginTrackerService.trackLogin(
          user.email || 'unknown@email.com', 
          existingData['role'] ? existingData['role'].toString() : role.toString()
        );
      } else {
        // Create a new user profile
        console.log(`Creating new user profile for ${user.email} with role: ${role}`);
        
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'unknown@email.com',
          displayName: user.displayName || 'Anonymous User',
          photoURL: user.photoURL || '',
          role: role,
          createdAt: new Date().getTime()
        };
        
        // Direct document set to bypass service layer
        await setDoc(doc(this.firestore, 'users', user.uid), userProfile);
        console.log('User profile saved successfully');
        
        // Track login with the new role
        this.loginTrackerService.trackLogin(user.email || 'unknown@email.com', role.toString());
      }
    } catch (error) {
      console.error('Error in manual user creation:', error);
    }
  }

  /**
   * Check if the current user is a staff member
   * @returns True if the user is a staff member
   */
  isStaffMember(): boolean {
    console.log('Checking if user is staff member');
    
    // Get current user profile from BehaviorSubject value
    const userProfile = this.userService['currentUserProfile'].value;
    
    // Log the current profile for debugging
    console.log('Current user profile for staff check:', userProfile);
    
    // Consider staff members as anyone with STAFF, ADMIN, or DEV role
    if (userProfile) {
      const isStaff = userProfile.role === UserRole.STAFF || 
                     userProfile.role === UserRole.ADMIN || 
                     userProfile.role === UserRole.DEV;
      
      console.log(`User ${userProfile.email} has role ${userProfile.role}, isStaff: ${isStaff}`);
      return isStaff;
    }
    
    // Fallback to simple email check if no profile is loaded yet
    const user = this.getCurrentUser();
    if (user?.email) {
      // List of staff email patterns
      const staffEmailPatterns = [
        'admin@',
        'pastor@',
        'staff@',
        'developer@'
      ];
      
      const isStaffByEmail = staffEmailPatterns.some(pattern => 
        user.email?.toLowerCase().includes(pattern)
      );
      
      console.log(`No profile loaded, checking email ${user.email}, isStaff by email: ${isStaffByEmail}`);
      return isStaffByEmail;
    }
    
    return false;
  }

  /**
   * Get the current authenticated user
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): any {
    // Return the current authenticated user from Firebase
    // This is a simplified implementation
    return this.auth.currentUser;
  }

  /**
   * Handle successful login by managing user data
   */
  private async handleSuccessfulLogin(user: User): Promise<void> {
    try {
      // List of known admin emails
      const knownAdminEmails = [
        'vinczef.o@gmail.com',
        'admin@bapti.org',
        'admin@bapti.com',
        'pastor@bapti.org'
      ];
      
      // Important: Create the user manually in Firestore first
      // This ensures a complete user record exists before any role-based operations
      const isKnownAdmin = user.email && knownAdminEmails.includes(user.email);
      await this.createUserManually(user, isKnownAdmin ? UserRole.ADMIN : UserRole.GUEST);
      
      // Log the successful login
      console.log('Login successful for:', user?.email);
      
      // Get user document from Firestore
      let userDoc = await this.getUserDocument(user.uid);
      
      // If the user document doesn't exist for some reason (should be rare after manual creation)
      if (!userDoc) {
        console.warn('User document not found after manual creation, creating fallback');
        await this.createUserManually(user, isKnownAdmin ? UserRole.ADMIN : UserRole.GUEST);
        userDoc = await this.getUserDocument(user.uid);
      }
      
      // Update navigation status
      this.updateNavStatus();
      
      // Get the user role from the user document
      let userRole = UserRole.GUEST; // Default for safety
      if (userDoc) {
        userRole = userDoc['role'] as UserRole;
        
        // Double-check: If this is a known admin user, ensure they have ADMIN role
        if (isKnownAdmin && userRole !== UserRole.ADMIN && userRole !== UserRole.DEV) {
          console.log(`Fixing role for known admin ${user.email} (was: ${userRole})`);
          await this.updateUserRole(user.uid, UserRole.ADMIN);
          userRole = UserRole.ADMIN;
        }
      } else {
        console.error('No user document found after creation attempts');
      }
      
      // Update the subject with the user's role information
      this.currentUserSubject.next(user);
      
      // Store authentication info in session storage
      sessionStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error in handleSuccessfulLogin:', error);
    }
  }

  private async getUserDocument(uid: string): Promise<any> {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      return null;
    }
  }

  private async updateUserRole(uid: string, role: UserRole): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', uid);
    await updateDoc(userDocRef, { role: role });
  }

  private updateNavStatus(): void {
    // Implementation of updateNavStatus method
  }
} 