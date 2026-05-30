import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-staff-register-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotifBellComponent],
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
  filter = '';

  showEdit = false;
  editId: number = 0;
  editName = '';
  editForm: any = {};
  editShowPw = false;
  editError = '';

  constructor(public api: ApiService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() { this.api.getUsers().subscribe(d => this.users = d); }

  get pagedUsers() {
    let data = this.filter ? this.users.filter(u => 
      (u.username + ' ' + u.first_name + ' ' + u.last_name + ' ' + u.role).toLowerCase().includes(this.filter.toLowerCase())
    ) : [...this.users];
    if (this.sortCol) data.sort((a: any,b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data.slice((this.page-1)*this.pageSize, this.page*this.pageSize);
  }
  get totalItems() { 
    return this.filter ? this.users.filter(u => 
      (u.username + ' ' + u.first_name + ' ' + u.last_name + ' ' + u.role).toLowerCase().includes(this.filter.toLowerCase())
    ).length : this.users.length; 
  }

  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  register() {
    this.success = ''; this.error = '';
    this.api.register(this.form).subscribe({
      next: () => { this.success = `User "${this.form.username}" registered as ${this.form.role}`; this.form = { username: '', password: '', role: 'staff', first_name: '', last_name: '', middle_name: '', contact_number: '', address: '' }; this.loadUsers(); },
      error: e => this.error = e.error?.error || 'Registration failed'
    });
  }

  editUser(u: any) {
    this.editId = u.id;
    this.editName = u.username;
    this.editForm = { username: u.username, password: '', role: u.role, first_name: u.first_name, last_name: u.last_name, middle_name: u.middle_name || '', contact_number: u.contact_number || '', address: u.address || '' };
    this.editError = '';
    this.editShowPw = false;
    this.showEdit = true;
  }

  saveEdit() {
    this.editError = '';
    this.api.updateUser(this.editId, this.editForm).subscribe({
      next: () => { this.showEdit = false; this.success = 'User updated successfully'; this.loadUsers(); },
      error: e => this.editError = e.error?.error || 'Update failed'
    });
  }

  cancelEdit() { this.showEdit = false; }
}
