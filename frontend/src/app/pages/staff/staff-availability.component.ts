import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-staff-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-availability.component.html',
  styleUrl: './staff-availability.component.scss'
})
export class StaffAvailabilityComponent implements OnInit {
  doctors: any[] = [];
  availability: any[] = [];
  form = { doctor_id: '', date: '', slots: '' };
  today = new Date().toISOString().split('T')[0];
  allSlots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  morningSlots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00'];
  afternoonSlots = ['12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  selectedSlots: Set<string> = new Set();
  page = 1; pageSize = 10;

  get paged() { return this.availability.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get totalItems() { return this.availability.length; }

  constructor(public api: ApiService) {}
  ngOnInit() {
    this.api.getDoctors().subscribe(d => this.doctors = d);
    this.api.getAvailability().subscribe(d => this.availability = d);
  }

  toggleSlot(slot: string) {
    this.selectedSlots.has(slot) ? this.selectedSlots.delete(slot) : this.selectedSlots.add(slot);
  }

  selectMorning() {
    this.morningSlots.forEach(s => this.selectedSlots.add(s));
  }

  selectAfternoon() {
    this.afternoonSlots.forEach(s => this.selectedSlots.add(s));
  }

  save() {
    if (!this.form.doctor_id || !this.form.date || this.selectedSlots.size === 0) return;
    const slots = Array.from(this.selectedSlots).sort();
    this.api.setAvailability({ doctor_id: +this.form.doctor_id, available_date: this.form.date, time_slots: slots })
      .subscribe(() => { this.api.getAvailability().subscribe(d => this.availability = d); this.form = { doctor_id: '', date: '', slots: '' }; this.selectedSlots.clear(); });
  }

  remove(id: number) {
    this.api.deleteAvailability(id).subscribe(() => this.api.getAvailability().subscribe(d => this.availability = d));
  }
}
