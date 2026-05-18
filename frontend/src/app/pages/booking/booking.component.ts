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
  selectedSlots: string[] = [];
  selectedTime = '';
  selectedDoctorId: number | null = null;
  visitType = 'new';
  form: any = {};
  patientId: number | null = null;
  cancelRoute = '/';
  successRoute = '/thank-you';

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.cancelRoute = this.route.snapshot.data['cancelRoute'] || '/';
    this.successRoute = this.route.snapshot.data['successRoute'] || '/thank-you';
    this.api.getAvailability().subscribe(d => {
      const today = new Date().toISOString().split('T')[0];
      this.availability = d.filter(s => s.available_date >= today);
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

  selectDate(slot: any) {
    this.selectedDate = slot.available_date;
    this.selectedSlots = slot.time_slots;
    this.selectedDoctorId = slot.doctor_id;
    this.selectedTime = '';
  }

  calcAge() {
    if (!this.form.birthday) return;
    this.form.age = Math.floor((Date.now() - new Date(this.form.birthday).getTime()) / 31557600000);
  }

  submit() {
    const payload: any = {
      doctor_id: this.selectedDoctorId,
      appointment_date: this.selectedDate,
      time_slot: this.selectedTime,
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
