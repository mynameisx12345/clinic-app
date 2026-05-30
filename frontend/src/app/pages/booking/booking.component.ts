import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent implements OnInit {
  step = 1;
  availability: any[] = [];
  selectedDate = '';
  selectedSession = '';
  selectedSessionIdx: any = '';
  selectedDoctorId: number | null = null;
  visitType = 'new';
  form: any = {};
  patientId: number | null = null;
  cancelRoute = '/';
  successRoute = '/thank-you';

  // Calendar
  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();
  calendarDays: any[] = [];

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.cancelRoute = this.route.snapshot.data['cancelRoute'] || '/';
    this.successRoute = this.route.snapshot.data['successRoute'] || '/thank-you';
    this.api.getAvailability().subscribe(d => {
      const today = new Date().toISOString().split('T')[0];
      this.availability = d.filter((s: any) => s.available_date >= today);
      this.buildCalendar();
    });
    if (this.api.isLoggedIn && this.api.user.role === 'patient') {
      this.visitType = 'followup';
      this.api.getMyProfile().subscribe(p => {
        this.patientId = p.id;
        this.form = { first_name: p.first_name, last_name: p.last_name, middle_name: p.middle_name, birthday: p.birthday, age: p.age, gender: p.gender, contact_number: p.contact_number, email: p.email, civil_status: p.civil_status, blood_type: p.blood_type, allergies: p.allergies, address: p.address || '' };
      });
    } else {
      const cached = localStorage.getItem('patient_info');
      if (cached) this.form = JSON.parse(cached);
    }
  }

  get availableDatesSet(): Set<string> {
    return new Set(this.availability.filter(a => a.morning_remaining > 0 || a.afternoon_remaining > 0).map(a => a.available_date));
  }

  get sessionsForDate() {
    const slots = this.availability.filter(a => a.available_date === this.selectedDate);
    const sessions: { label: string, value: string, doctorId: number }[] = [];
    slots.forEach(s => {
      if (s.morning_remaining > 0) sessions.push({ label: `Morning (${s.morning_start}–${s.morning_end}) - ${s.morning_remaining} slots left - Dr. ${s.doctor_name}`, value: 'morning', doctorId: s.doctor_id });
      if (s.afternoon_remaining > 0) sessions.push({ label: `Afternoon (${s.afternoon_start}–${s.afternoon_end}) - ${s.afternoon_remaining} slots left - Dr. ${s.doctor_name}`, value: 'afternoon', doctorId: s.doctor_id });
    });
    return sessions;
  }

  get monthLabel() {
    return new Date(this.calendarYear, this.calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  buildCalendar() {
    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) this.calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.calendarDays.push({ day: d, date: dateStr, available: this.availableDatesSet.has(dateStr), past: dateStr < today });
    }
  }

  prevMonth() {
    this.calendarMonth--;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    this.buildCalendar();
  }

  nextMonth() {
    this.calendarMonth++;
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.buildCalendar();
  }

  selectDate(date: string) {
    this.selectedDate = date;
    this.selectedSession = '';
    this.selectedSessionIdx = '';
    this.selectedDoctorId = null;
  }

  selectSession(idx: number) {
    const s = this.sessionsForDate[idx];
    this.selectedSession = s.value;
    this.selectedDoctorId = s.doctorId;
  }

  calcAge() {
    if (!this.form.birthday) return;
    this.form.age = Math.floor((Date.now() - new Date(this.form.birthday).getTime()) / 31557600000);
  }

  submit() {
    const payload: any = {
      doctor_id: this.selectedDoctorId,
      appointment_date: this.selectedDate,
      time_slot: this.selectedSession,
      reason_for_visit: this.form.reason
    };
    if (this.api.isLoggedIn && this.api.user.role === 'patient') {
      payload.patient_id = this.patientId;
    } else {
      payload.patient_info = this.form;
    }
    localStorage.setItem('patient_info', JSON.stringify(this.form));
    this.api.bookAppointment(payload).subscribe(() => this.router.navigate([this.successRoute]));
  }
}
