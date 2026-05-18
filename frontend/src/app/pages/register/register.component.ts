import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  form: any = {};
  error = '';
  showPw = false;
  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    const cached = localStorage.getItem('patient_info');
    if (cached) Object.assign(this.form, JSON.parse(cached));
  }

  calcAge() {
    if (!this.form.birthday) return;
    const diff = Date.now() - new Date(this.form.birthday).getTime();
    this.form.age = Math.floor(diff / 31557600000);
  }

  register() {
    this.error = '';
    this.api.register(this.form).subscribe({
      next: () => { localStorage.removeItem('patient_info'); this.router.navigate(['/login']); },
      error: e => this.error = e.error?.error || 'Registration failed'
    });
  }
}
