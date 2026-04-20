import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LangService } from '../../services/lang';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user } from '@angular/fire/auth';
import { FirebaseService } from '../../services/firebase';
import { User } from '../../models/User';

@Component({
  selector: 'app-header',
  imports: [AsyncPipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private firebaseService = inject(FirebaseService);
  user$ = this.firebaseService.user$;

  private langService = inject(LangService);

  lang = this.langService.getLang();
  
  login() {
    this.firebaseService.login();
  }
  logout() {
    this.firebaseService.logout();
    window.location.reload();
  }
  toggleLang() {
    this.langService.toggleLang();
    this.lang = this.langService.getLang();
  }
  
}
