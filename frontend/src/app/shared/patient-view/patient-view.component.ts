import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-patient-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-view.component.html',
  styleUrl: './patient-view.component.scss',
  host: { class: 'flex-grow-1' }
})
export class PatientViewComponent implements OnInit {
  patient: any;
  appointments: any[] = [];
  selectedRecord: any = null;
  backRoute = '/';

  constructor(public api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.backRoute = this.route.snapshot.data['backRoute'] || this.route.parent?.snapshot.data['backRoute'] || '/';
    const id = +(this.route.snapshot.params['id'] || this.route.parent?.snapshot.params['id']);
    this.api.getPatient(id).subscribe(p => this.patient = p);
    this.api.getPatientAppointments(id).subscribe(a => this.appointments = a);
  }

  viewRecord(a: any) {
    this.api.getMedicalRecord(a.id).subscribe(r => this.selectedRecord = r);
  }

  parsePrescriptions(data: any): any[] {
    try {
      let parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
}
