import { Component, OnInit, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-pharma-notif-bell',
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
              [style.border-left]="'3px solid #f59e0b'"
              [style.background]="!n.read ? '#fffbeb' : ''">
              <div>⚠ {{n.message}}</div>
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
export class PharmaNotifBellComponent implements OnInit {
  private ws = inject(WebsocketService);
  private el = inject(ElementRef);

  notifications: any[] = [];
  showNotif = false;
  unreadCount = 0;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showNotif && !this.el.nativeElement.contains(event.target)) {
      this.showNotif = false;
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('pharma_notifications', JSON.stringify(this.notifications));
    }
  }

  toggleNotif() {
    this.showNotif = !this.showNotif;
    if (!this.showNotif) {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      localStorage.setItem('pharma_notifications', JSON.stringify(this.notifications));
    }
  }

  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    localStorage.removeItem('pharma_notifications');
  }

  ngOnInit() {
    const saved: any[] = JSON.parse(localStorage.getItem('pharma_notifications') || '[]');
    this.notifications = saved;
    this.unreadCount = this.notifications.filter(x => !x.read).length;

    this.ws.connect();
    this.ws.messages$.subscribe(msg => {
      if (msg.type === 'low_stock') {
        const d = msg.data;
        this.notifications.unshift({ id: `${d.id}-${Date.now()}`, message: `${d.medicine_name} is low on stock (${d.quantity} remaining)`, time: new Date().toLocaleString(), read: false });
        this.unreadCount++;
        localStorage.setItem('pharma_notifications', JSON.stringify(this.notifications));
      }
    });
  }
}
