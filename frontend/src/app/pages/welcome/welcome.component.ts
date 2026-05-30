import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  username = ''; password = ''; error = ''; loading = false; showPw = false;
  constructor(public api: ApiService, private router: Router) {}

  login() {
    this.loading = true; this.error = '';
    this.api.login(this.username, this.password).subscribe({
      next: res => {
        this.api.saveAuth(res);
        this.router.navigate(['/' + res.user.role]);
      },
      error: () => { this.error = 'Invalid credentials'; this.loading = false; }
    });
  }
}
