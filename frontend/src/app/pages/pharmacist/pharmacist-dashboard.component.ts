import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PharmaNotifBellComponent } from '../../shared/pharma-notif-bell.component';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PharmaNotifBellComponent, NgChartsModule],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrl: './pharmacist-dashboard.component.scss'
})
export class PharmacistDashboardComponent implements OnInit {
  metrics = { total: 0, lowStock: 0, expiringSoon: 0, expired: 0 };
  ledger: any[] = [];
  dateFrom = '';
  dateTo = '';
  txnTypes = [
    { name: 'Sales', color: '#dc3545' },
    { name: 'Purchase', color: '#198754' },
    { name: 'Return', color: '#f59e0b' },
    { name: 'Dispose', color: '#ef4444' },
    { name: 'Adjust', color: '#6c757d' }
  ];
  activeTypes: string[] = ['Sales', 'Purchase'];
  chartLabels: string[] = [];
  chartData: ChartConfiguration<'line'>['data']['datasets'] = [];
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Quantity' } }, x: { title: { display: true, text: 'Date' } } }
  };

  salesChartLabels: string[] = [];
  salesChartData: ChartConfiguration<'bar'>['data']['datasets'] = [];
  salesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Quantity Sold' } }, x: { title: { display: true, text: 'Medicine' } } }
  };

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
    this.api.getStockLedger().subscribe(d => { this.ledger = d; this.buildLineChart(); this.buildSalesChart(); });
  }

  applyFilter() { this.buildCharts(); }

  toggleType(type: string) {
    this.activeTypes = this.activeTypes.includes(type) ? this.activeTypes.filter(t => t !== type) : [...this.activeTypes, type];
    this.buildLineChart();
  }

  private getFiltered() {
    return this.ledger.filter(t => {
      const d = t.transaction_date.slice(0, 10);
      if (this.dateFrom && d < this.dateFrom) return false;
      if (this.dateTo && d > this.dateTo) return false;
      return true;
    });
  }

  buildCharts() {
    this.buildLineChart();
    this.buildSalesChart();
  }

  buildLineChart() {
    const filtered = this.ledger.filter(t => this.activeTypes.includes(t.transaction_type));
    const dates = [...new Set(filtered.map(t => t.transaction_date))].sort();
    this.chartLabels = dates;
    this.chartData = this.activeTypes.map(type => {
      const color = this.txnTypes.find(t => t.name === type)!.color;
      const grouped = new Map<string, number>();
      filtered.filter(t => t.transaction_type === type).forEach(t => grouped.set(t.transaction_date, (grouped.get(t.transaction_date) || 0) + Math.abs(t.quantity)));
      return { data: dates.map(d => grouped.get(d) || 0), label: type, borderColor: color, backgroundColor: color + '20', tension: 0.3, fill: false };
    });
  }

  buildSalesChart() {
    const sales = this.getFiltered().filter(t => t.transaction_type === 'Sales');
    const byMedicine = new Map<string, number>();
    sales.forEach(t => byMedicine.set(t.medicine_name, (byMedicine.get(t.medicine_name) || 0) + Math.abs(t.quantity)));
    const sorted = [...byMedicine.entries()].sort((a, b) => b[1] - a[1]);
    const colors = ['#0d6efd','#dc3545','#198754','#f59e0b','#6f42c1','#20c997','#fd7e14','#0dcaf0','#d63384','#6c757d'];
    this.salesChartLabels = [...sorted.map(e => e[0])];
    this.salesChartData = [{ data: sorted.map(e => e[1]), backgroundColor: sorted.map((_, i) => colors[i % colors.length]) }];
  }
}
