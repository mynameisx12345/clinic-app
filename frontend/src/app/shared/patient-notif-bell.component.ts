import { Component, OnInit, ElementRef, HostListener, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-patient-notif-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position:relative">
      <button class="notification-bell" (click)="toggleNotif()">🔔
        @if (unreadCount > 0) { <span class="notification-badge">{{unreadCount}}</span> }
      </button>
      @if (showNotif) {
        <div class="notification-dropdown">
          <div class="notif-header" style="display:flex;justify-content:space-between;align-items:center">
            <span>Notifications</span>
            <button style="border:none;background:none;color:#ef4444;font-size:0.75rem;cursor:pointer;font-weight:600" (click)="clearAll()">Clear all</button>
          </div>
          @for (n of notifications; track n.id) {
            <div class="notif-item" [class.unread]="!n.read"
              [style.border-left]="n.status === 'Cancelled' ? '3px solid #ef4444' : n.status === 'Confirmed' ? '3px solid #22c55e' : n.status === 'Completed' ? '3px solid #1565c0' : ''"
              [style.background]="!n.read ? (n.status === 'Cancelled' ? '#fef2f2' : n.status === 'Confirmed' ? '#f0fdf4' : n.status === 'Completed' ? '#e3f2fd' : '#e3f2fd') : ''"
              (click)="onNotifClick(n)" style="cursor:pointer">
              <div>{{n.status === 'Cancelled' ? '✗' : n.status === 'Confirmed' ? '✓' : '●'}} {{n.message}}</div>
              <div class="notif-time">{{n.time}}</div>
            </div>
          }
          @if (notifications.length === 0) {
            <div class="notif-item text-muted">No notifications</div>
          }
        </div>
      }
    </div>
  `
})
export class PatientNotifBellComponent implements OnInit {
  private ws = inject(WebsocketService);
  private el = inject(ElementRef);

  @Output() refresh = new EventEmitter<void>();

  notifications: any[] = [];
  showNotif = false;
  unreadCount = 0;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showNotif && !this.el.nativeElement.contains(event.target)) {
      this.showNotif = false;
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('patient_notif_read', JSON.stringify(this.notifications.map(n => n.id)));
    }
  }

  toggleNotif() {
    this.showNotif = !this.showNotif;
    if (!this.showNotif) {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('patient_notif_read', JSON.stringify(this.notifications.map(n => n.id)));
    }
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    localStorage.setItem('patient_notif_read', JSON.stringify(this.notifications.map(n => n.id)));
  }

  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    localStorage.removeItem('patient_notifications');
    localStorage.removeItem('patient_notif_read');
  }

  onNotifClick(n: any) {
    this.showNotif = false;
    this.notifications.forEach(x => x.read = true);
    this.unreadCount = 0;
    localStorage.setItem('patient_notif_read', JSON.stringify(this.notifications.map(x => x.id)));
    this.refresh.emit();
  }

  ngOnInit() {
    const saved: any[] = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
    const readIds: string[] = JSON.parse(localStorage.getItem('patient_notif_read') || '[]');
    this.notifications = saved.map(n => ({ ...n, read: readIds.includes(n.id) }));
    this.unreadCount = this.notifications.filter(x => !x.read).length;

    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    this.ws.connect();
    this.ws.messages$.subscribe(msg => {
      if (msg.type === 'appointment_status' && msg.data.patient_user_id == userId) {
        const d = msg.data;
        const n = { id: `${d.id}-${d.status}`, message: `Your appointment on ${d.appointment_date} has been ${d.status}`, time: new Date().toLocaleString(), read: false, status: d.status };
        this.notifications.unshift(n);
        this.unreadCount++;
        localStorage.setItem('patient_notifications', JSON.stringify(this.notifications));
      }
    });
  }
}
