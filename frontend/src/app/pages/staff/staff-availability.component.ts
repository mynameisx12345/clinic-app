import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-staff-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotifBellComponent],
  templateUrl: './staff-availability.component.html',
  styleUrl: './staff-availability.component.scss'
})
export class StaffAvailabilityComponent implements OnInit {
  doctors: any[] = [];
  availability: any[] = [];
  form: any = { doctor_id: '', date: '', morning_start: '08:00', morning_end: '12:00', morning_max: 10, afternoon_start: '13:00', afternoon_end: '17:00', afternoon_max: 10 };
  today = new Date().toISOString().split('T')[0];
  page = 1; pageSize = 10;

  get paged() { return this.availability.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get totalItems() { return this.availability.length; }

  constructor(public api: ApiService) {}

  ngOnInit() {
    this.api.getDoctors().subscribe(d => this.doctors = d);
    this.load();
  }

  load() { this.api.getAvailability().subscribe(d => this.availability = d); }

  save() {
    if (!this.form.doctor_id || !this.form.date) return;
    this.api.setAvailability({
      doctor_id: +this.form.doctor_id,
      available_date: this.form.date,
      morning_start: this.form.morning_start || null,
      morning_end: this.form.morning_end || null,
      morning_max: +this.form.morning_max || 0,
      afternoon_start: this.form.afternoon_start || null,
      afternoon_end: this.form.afternoon_end || null,
      afternoon_max: +this.form.afternoon_max || 0
    }).subscribe(() => { this.load(); this.form = { doctor_id: '', date: '', morning_start: '08:00', morning_end: '12:00', morning_max: 10, afternoon_start: '13:00', afternoon_end: '17:00', afternoon_max: 10 }; });
  }

  remove(id: number) { this.api.deleteAvailability(id).subscribe(() => this.load()); }
}
