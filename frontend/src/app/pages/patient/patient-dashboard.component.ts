import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PatientNotifBellComponent } from '../../shared/patient-notif-bell.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PatientNotifBellComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent implements OnInit {
  appointments: any[] = [];
  filter = '';
  counts = { Pending: 0, Confirmed: 0, Completed: 0 };
  showMenu = false;
  showProfile = false;
  showAccount = false;
  showAccPw = false;
  profile: any = {};
  accountForm = { username: '', password: '' };
  snackbar = '';
  accountError = '';
  confirmCancel: any = null;
  viewingRecord: any = null;
  viewingMedRecord: any = null;
  parsedPrescriptions: any[] = [];
  page=1; pageSize=10;
  sortCol=''; sortDir=1;

  get paged() { return this.filtered.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get totalItems() { return this.filtered.length; }

  constructor(public api: ApiService) {}

  ngOnInit() {
    this.api.getMyAppointments().subscribe(d => {
      this.appointments = d;
      this.counts.Pending = d.filter((a: any) => a.status === 'Pending').length;
      this.counts.Confirmed = d.filter((a: any) => a.status === 'Confirmed').length;
      this.counts.Completed = d.filter((a: any) => a.status === 'Completed').length;
    });
    this.api.getMyProfile().subscribe(p => this.profile = { ...p });
    this.accountForm.username = this.api.user.username;
  }

  get filtered() {
    let data = this.filter ? this.appointments.filter(a => a.status === this.filter) : [...this.appointments];
    if (this.sortCol) data.sort((a: any,b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data;
  }

  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  calcProfileAge() {
    if (!this.profile.birthday) return;
    this.profile.age = Math.floor((Date.now() - new Date(this.profile.birthday).getTime()) / 31557600000);
  }

  saveProfile() {
    this.api.updateMyProfile(this.profile).subscribe(() => { this.showProfile = false; this.showSnackbar('Profile updated successfully'); });
  }

  saveCredentials() {
    this.accountError = '';
    this.api.updateCredentials(this.accountForm).subscribe({
      next: () => { this.showAccount = false; this.accountForm.password = ''; this.showSnackbar('Credentials updated successfully'); },
      error: e => this.accountError = e.error?.error || 'Update failed'
    });
  }

  showSnackbar(msg: string) {
    this.snackbar = msg;
    setTimeout(() => this.snackbar = '', 3000);
  }

  cancelAppointment() {
    this.api.updateAppointmentStatus(this.confirmCancel.id, 'Cancelled').subscribe(() => {
      this.confirmCancel.status = 'Cancelled';
      this.confirmCancel = null;
      this.showSnackbar('Appointment cancelled');
    });
  }

  viewRecord(a: any) {
    this.viewingRecord = a;
    this.api.getMedicalRecord(a.id).subscribe(r => {
      this.viewingMedRecord = r;
      this.parsedPrescriptions = r?.prescriptions ? JSON.parse(r.prescriptions) : [];
    });
  }
}
