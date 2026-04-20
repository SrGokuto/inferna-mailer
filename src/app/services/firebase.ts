import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user } from '@angular/fire/auth';
import { User } from '../models/User';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  
  private userSubject = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.userSubject.asObservable();

  private accessToken: string | undefined = '';

  constructor(private auth: Auth) {
    // 🔥 Escucha cambios de sesión automáticamente
    user(this.auth).subscribe(u => {
      if (u) {
        this.userSubject.next({
          name: u.displayName,
          email: u.email,
          photoURL: u.photoURL
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }
  login()  {
    const provider = new GoogleAuthProvider();

    provider.addScope('https://www.googleapis.com/auth/gmail.send');

    signInWithPopup(this.auth, provider)
      .then((result) => {
        const user = result.user;

        this.userSubject.next({
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
        });
        const credential = GoogleAuthProvider.credentialFromResult(result);
        this.accessToken = credential?.accessToken;
      })
      .catch((error) => {
        console.error(error);
      });
      
  }
  logout() {
    signOut(this.auth)
      .then(() => {
        this.userSubject.next(null); // limpiar usuario en tu app
        console.log('Signed Out');
      })
      .catch((error) => {
        console.error(error);
      });
  }
  getAccessToken(): string | undefined {
    return this.accessToken;
  }
  getUsername(): string {
    const user = this.userSubject.getValue();
    return user ? user.name : 'Unknown Sender';
  }
  getEmail(): string {
    const user = this.userSubject.getValue();
    return user ? user.email : '';
  }
}
