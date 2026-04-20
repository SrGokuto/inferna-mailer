import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { LangService } from '../../services/lang';
import { FirebaseService } from '../../services/firebase';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [AsyncPipe],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  private langService = inject(LangService);
  private firebaseService = inject(FirebaseService);

  lang = this.langService.getLang();
  user$ = this.firebaseService.user$;
  statusMessage = '';

  @ViewChild('emailsInput') emailsInput!: ElementRef;
  @ViewChild('subjectInput') subjectInput!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('senderInput') senderInput!: ElementRef;

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;

        // quitamos "data:...base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async createEmailWithAttachments(to: string, subject: string, message: string, sender: string, senderEmail: string): Promise<string> {
    const boundary = '----=' + Math.random().toString(36).substring(2);

    let mime = [
      `From: "${sender}" <${senderEmail}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(subject)}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary=${boundary}`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message,
      '',
    ].join('\n');

    const files: File[] = this.fileInput.nativeElement.files;

    for (const file of files) {
      const base64 = await this.readFileAsBase64(file);

      mime += [
        `--${boundary}`,
        `Content-Type: ${file.type || 'application/octet-stream'}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${file.name}"`,
        '',
        base64,
        '',
      ].join('\n');
    }

    mime += `--${boundary}--`;

    return btoa(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  getEmailsArray(): string[] {
    const raw = this.emailsInput.nativeElement.value;

    return raw
      .split('\n')
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0);
  }
  createEmail(to: string, subject: string, message: string, sender: string, senderEmail: string): string {
    const mime = [
      `From: "${sender}" <${senderEmail}>`,
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      message,
    ].join('\n');

    return btoa(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async sendEmails() {
    this.statusMessage = '';
    const emails = this.getEmailsArray();
    const subject = this.subjectInput.nativeElement.value;
    const message = this.messageInput.nativeElement.value;
    const sender = this.senderInput.nativeElement.value;
    const senderEmail = this.firebaseService.getEmail();

    for (const email of emails) {
      try {
        await this.sendSingleEmail(email, subject, message, sender, senderEmail);
        this.statusMessage = this.statusMessage + `<br> ${this.lang.successSendingEmail} ${email}`;
      } catch (err) {
        console.error('Error:', email, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.statusMessage = this.statusMessage + `<br> ${this.lang.errorSendingEmail} ${email}: ${errorMessage}`;
      } 

      await new Promise((r) => setTimeout(r, 2000));
    }
    this.statusMessage = this.statusMessage + `<br>${this.lang.finishedEmails}`;
  }

  async sendSingleEmail(to: string, subject: string, message: string, sender: string, senderEmail: string) {
    const raw = await this.createEmailWithAttachments(to, subject, message, sender, senderEmail);

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.firebaseService.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });
  }
  selectedFiles: File[] = [];

  onFilesSelect() {
    const files = Array.from(this.fileInput.nativeElement.files as FileList) as File[];
    this.selectedFiles = [...this.selectedFiles, ...files]; 
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);

    const dt = new DataTransfer();
    for (const file of this.selectedFiles) {
      dt.items.add(file);
    }
    this.fileInput.nativeElement.files = dt.files;
  }
}
