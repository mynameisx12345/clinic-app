import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrl: './pharmacist-dashboard.component.scss'
})
export class PharmacistDashboardComponent implements OnInit {
  metrics = { total: 0, lowStock: 0, expiringSoon: 0, expired: 0 };
  constructor(public api: ApiService) {}

  ngOnInit() {
    this.api.getInventory().subscribe(inv => {
      const today = new Date();
      const soon = new Date(today.getTime() + 90 * 86400000);
      this.metrics.total = inv.length;
      this.metrics.lowStock = inv.filter(m => m.quantity <= 20).length;
      this.metrics.expired = inv.filter(m => new Date(m.expiration_date) <= today).length;
      this.metrics.expiringSoon = inv.filter(m => { const d = new Date(m.expiration_date); return d > today && d <= soon; }).length;
    });
  }
}
