import { Injectable } from '@angular/core';
import { es } from '../lang/es';
import { en } from '../lang/en';
@Injectable({
  providedIn: 'root',
})
export class LangService {
  currentLang: string;
  lang: any;


  constructor() {
    this.currentLang = localStorage.getItem('lang') || 'es';
    if (this.currentLang === 'es') {
      this.lang = es;
    } else {
      this.lang = en;
    }
  }


  toggleLang() {
    if (this.currentLang === 'en') {
      this.currentLang = 'es';
      this.lang = es;
    } else {
      this.currentLang = 'en';
      this.lang = en;
    }
    localStorage.setItem('lang', this.currentLang);
    window.location.reload(); 
  }


  getLang() {
    return this.lang;
  }
}
