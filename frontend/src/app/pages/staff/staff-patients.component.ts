import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-staff-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-patients.component.html',
  styleUrl: './staff-patients.component.scss'
})
export class StaffPatientsComponent implements OnInit {
  patients: any[] = [];
  search = '';
  page = 1;
  pageSize = 10;
  sortCol=''; sortDir=1;
  constructor(public api: ApiService) {}
  ngOnInit() { this.api.getPatients().subscribe(d => this.patients = d); }

  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  get filtered() {
    let data = !this.search ? [...this.patients] : this.patients.filter(p => (p.first_name + ' ' + p.last_name).toLowerCase().includes(this.search.toLowerCase()));
    if (this.sortCol) data.sort((a: any,b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data;
  }

  get paged() { return this.filtered.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get totalItems() { return this.filtered.length; }
}
