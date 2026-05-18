import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private router: Router) {}

  private get headers() {
    const token = localStorage.getItem('token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  get user() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  get isLoggedIn() { return !!localStorage.getItem('token'); }

  login(username: string, password: string) {
    return this.http.post<any>('/api/auth/login', { username, password });
  }

  register(data: any) {
    return this.http.post<any>('/api/auth/register', data);
  }

  getUsers() { return this.http.get<any[]>('/api/auth/users', this.headers); }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('patient_info');
    this.router.navigate(['/']);
  }

  saveAuth(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  // Availability
  getAvailability() { return this.http.get<any[]>('/api/availability'); }
  setAvailability(data: any) { return this.http.post<any>('/api/availability', data, this.headers); }
  deleteAvailability(id: number) { return this.http.delete<any>(`/api/availability/${id}`, this.headers); }

  // Appointments
  bookAppointment(data: any) { return this.http.post<any>('/api/appointments', data); }
  getAppointments() { return this.http.get<any[]>('/api/appointments', this.headers); }
  getMyAppointments() { return this.http.get<any[]>('/api/appointments/my', this.headers); }
  getDoctorAppointments() { return this.http.get<any[]>('/api/appointments/doctor', this.headers); }
  updateAppointmentStatus(id: number, status: string) { return this.http.patch<any>(`/api/appointments/${id}/status`, { status }, this.headers); }
  saveMedicalRecord(id: number, data: any) { return this.http.post<any>(`/api/appointments/${id}/medical-record`, data, this.headers); }
  getMedicalRecord(id: number) { return this.http.get<any>(`/api/appointments/${id}/medical-record`, this.headers); }

  // Patients
  getPatients() { return this.http.get<any[]>('/api/patients', this.headers); }
  getPatient(id: number) { return this.http.get<any>(`/api/patients/${id}`, this.headers); }
  getMyProfile() { return this.http.get<any>('/api/patients/me', this.headers); }
  updateMyProfile(data: any) { return this.http.put<any>('/api/patients/me', data, this.headers); }
  updateCredentials(data: any) { return this.http.put<any>('/api/auth/credentials', data, this.headers); }
  getPatientAppointments(id: number) { return this.http.get<any[]>(`/api/patients/${id}/appointments`, this.headers); }
  getPatientMedicalRecords(id: number) { return this.http.get<any[]>(`/api/patients/${id}/medical-records`, this.headers); }

  // Doctors
  getDoctors() { return this.http.get<any[]>('/api/doctors', this.headers); }
  getDoctorPatients(id: number) { return this.http.get<any[]>(`/api/doctors/${id}/patients`, this.headers); }

  // Inventory
  getInventory() { return this.http.get<any[]>('/api/inventory', this.headers); }
  addMedicine(data: any) { return this.http.post<any>('/api/inventory', data, this.headers); }

  // Stock Ledger
  getStockLedger() { return this.http.get<any[]>('/api/stock-ledger', this.headers); }
  addStockTransaction(data: any) { return this.http.post<any>('/api/stock-ledger', data, this.headers); }
}
