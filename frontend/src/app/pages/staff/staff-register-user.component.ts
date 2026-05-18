import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-staff-register-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-register-user.component.html',
  styleUrl: './staff-register-user.component.scss'
})
export class StaffRegisterUserComponent implements OnInit {
  form: any = { username: '', password: '', role: 'staff', first_name: '', last_name: '', middle_name: '', contact_number: '', address: '' };
  success = '';
  error = '';
  users: any[] = [];
  page = 1;
  pageSize = 10;
  sortCol=''; sortDir=1;
  showPw = false;

  constructor(public api: ApiService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() { this.api.getUsers().subscribe(d => this.users = d); }

  get pagedUsers() {
    let data = [...this.users];
    if (this.sortCol) data.sort((a: any,b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data.slice((this.page-1)*this.pageSize, this.page*this.pageSize);
  }
  get totalItems() { return this.users.length; }

  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  register() {
    this.success = ''; this.error = '';
    this.api.register(this.form).subscribe({
      next: () => { this.success = `User "${this.form.username}" registered as ${this.form.role}`; this.form = { username: '', password: '', role: 'staff', first_name: '', last_name: '', middle_name: '', contact_number: '', address: '' }; this.loadUsers(); },
      error: e => this.error = e.error?.error || 'Registration failed'
    });
  }
}
