import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.scss'
})
export class ConsultationComponent implements OnInit {
  appointment: any;
  patient: any;
  form: any = { signs_symptoms: '', diagnosis: '', treatment: '', prescriptions: [{ medicine_id: null, medicine: '', dosage: '', frequency: '', duration: '' }] };
  showHistory = false;
  history: any[] = [];
  snackbar = '';
  showCompleteConfirm = false;
  medicines: any[] = [];

  constructor(public api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.api.getInventory().subscribe(m => this.medicines = m);
    const id = +this.route.snapshot.params['id'];
    this.api.getDoctorAppointments().subscribe(appts => {
      this.appointment = appts.find(a => a.id === id);
      if (this.appointment) {
        this.api.getPatient(this.appointment.patient_id).subscribe(p => this.patient = p);
        // Load existing medical record if any
        this.api.getMedicalRecord(this.appointment.id).subscribe(r => {
          if (r) {
            this.form.signs_symptoms = r.signs_symptoms || '';
            this.form.diagnosis = r.diagnosis || '';
            this.form.treatment = r.treatment || '';
            this.form.prescriptions = r.prescriptions ? JSON.parse(r.prescriptions) : [{ medicine: '', dosage: '', frequency: '', duration: '' }];
          }
        });
        this.api.getPatientAppointments(this.appointment.patient_id).subscribe(h => {
          this.history = h.filter(a => a.id !== this.appointment.id);
          this.history.forEach((a: any) => {
            this.api.getMedicalRecord(a.id).subscribe(rec => { if (rec) a.diagnosis = rec.diagnosis; });
          });
        });
      }
    });
  }

  searchMedicine(p: any, value: string) {
    if (value.length < 3) { p._suggestions = []; return; }
    const s = value.toLowerCase();
    p._suggestions = this.medicines.filter(m => m.medicine_name.toLowerCase().includes(s)).slice(0, 5);
  }

  selectMedicine(p: any, med: any) {
    p.medicine_id = med.id;
    p.medicine = `${med.medicine_name} ${med.strength} (${med.dosage_form})`;
    p._suggestions = [];
  }

  closeSuggestions(p: any) { setTimeout(() => p._suggestions = [], 200); }

  complete() {
    this.api.saveMedicalRecord(this.appointment.id, this.form).subscribe(() => this.router.navigate(['/doctor/appointments']));
  }

  save() {
    this.api.saveMedicalRecord(this.appointment.id, { ...this.form, saveOnly: true }).subscribe(() => this.showSnackbar('Record saved successfully'));
  }

  showSnackbar(msg: string) { this.snackbar = msg; setTimeout(() => this.snackbar = '', 3000); }
}
