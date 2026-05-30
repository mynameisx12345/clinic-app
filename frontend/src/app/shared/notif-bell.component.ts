import { Component, OnInit, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-notif-bell',
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
              [style.border-left]="n.status === 'Cancelled' ? '3px solid #ef4444' : n.status === 'new' ? '3px solid #1565c0' : ''"
              [style.background]="!n.read ? (n.status === 'Cancelled' ? '#fef2f2' : '#e3f2fd') : ''"
              (click)="openNotif(n)" style="cursor:pointer">
              <div>{{n.status === 'Cancelled' ? '✗' : '●'}} {{n.message}}</div>
              <div class="notif-time">{{n.time}}</div>
            </div>
          }
          @if (notifications.length === 0) {
            <div class="notif-item text-muted">No new notifications</div>
          }
        </div>
      }
    </div>
  `
})
export class NotifBellComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebsocketService);
  private el = inject(ElementRef);
  private router = inject(Router);

  notifications: any[] = [];
  showNotif = false;
  unreadCount = 0;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showNotif && !this.el.nativeElement.contains(event.target)) {
      this.showNotif = false;
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('notif_read_ids', JSON.stringify(this.notifications.map(n => n.id)));
      localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
    }
  }

  toggleNotif() {
    this.showNotif = !this.showNotif;
    if (!this.showNotif) {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('notif_read_ids', JSON.stringify(this.notifications.map(n => n.id)));
      localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
    }
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    localStorage.setItem('notif_read_ids', JSON.stringify(this.notifications.map(n => n.id)));
    localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
  }

  clearAll() {
    const dismissedIds = this.notifications.map(n => n.id);
    const existing: any[] = JSON.parse(localStorage.getItem('notif_dismissed_ids') || '[]');
    localStorage.setItem('notif_dismissed_ids', JSON.stringify([...existing, ...dismissedIds]));
    this.notifications = [];
    this.unreadCount = 0;
    localStorage.removeItem('staff_notifications');
    localStorage.removeItem('notif_read_ids');
  }

  openNotif(n: any) {
    this.showNotif = false;
    this.notifications.forEach(x => x.read = true);
    this.unreadCount = 0;
    localStorage.setItem('notif_read_ids', JSON.stringify(this.notifications.map(x => x.id)));
    localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
    const role = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';
    this.router.navigate([`/${role}/appointments`], { queryParams: { search: n.patientName } });
  }

  ngOnInit() {
    const readIds: any[] = JSON.parse(localStorage.getItem('notif_read_ids') || '[]');
    const stored: any[] = JSON.parse(localStorage.getItem('staff_notifications') || '[]');
    const dismissedIds: any[] = JSON.parse(localStorage.getItem('notif_dismissed_ids') || '[]');

    this.api.getNotifications().subscribe(n => {
      const apiNotifs = n
        .filter(a => !dismissedIds.includes(a.id))
        .map(a => ({
          id: a.id, message: `New appointment from ${a.first_name} ${a.last_name}`, time: a.appointment_date, read: readIds.includes(a.id), patientName: `${a.first_name} ${a.last_name}`, status: 'new', ts: new Date(a.created_at || a.appointment_date).getTime()
        }));

      if (stored.length) {
        // Keep stored order, add any new API items not already stored
        const storedIds = new Set(stored.map(s => s.id));
        const newFromApi = apiNotifs.filter(a => !storedIds.has(a.id));
        const validStored = stored.filter(s => !dismissedIds.includes(s.id)).map(s => ({ ...s, read: readIds.includes(s.id) }));
        this.notifications = [...newFromApi, ...validStored];
      } else {
        this.notifications = apiNotifs;
      }
      this.unreadCount = this.notifications.filter(x => !x.read).length;
      localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
    });

    this.ws.connect();
    this.ws.messages$.subscribe(msg => {
      if (msg.type === 'new_appointment') {
        const d = msg.data;
        const ts = Date.now();
        this.notifications.unshift({ id: d.id, message: `New appointment from ${d.first_name} ${d.last_name}`, time: d.appointment_date, read: false, patientName: `${d.first_name} ${d.last_name}`, status: 'new', ts });
        this.unreadCount++;
        localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
      }
      if (msg.type === 'appointment_status' && msg.data.status === 'Cancelled') {
        const d = msg.data;
        const ts = Date.now();
        this.notifications.unshift({ id: `${d.id}-cancel`, message: `${d.first_name} ${d.last_name} cancelled appointment on ${d.appointment_date}`, time: new Date().toLocaleString(), read: false, patientName: `${d.first_name} ${d.last_name}`, status: 'Cancelled', ts });
        this.unreadCount++;
        localStorage.setItem('staff_notifications', JSON.stringify(this.notifications));
      }
    });
  }
}
