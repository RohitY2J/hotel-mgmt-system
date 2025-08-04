// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-callback',
//   standalone: true,
//   imports: [],
//   templateUrl: './callback.component.html',
//   styleUrl: './callback.component.scss'
// })
// export class CallbackComponent {

// }


import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `<div>Processing login...</div>`
})
export class CallbackComponent implements OnInit {
  constructor(private authService: AuthService,private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.authService.handleCallback(code).subscribe({
        next: () => console.log('Callback processed'),
        error: (err) => {
          console.error('Callback failed:', err);
          this.router.navigateByUrl('/login');
        }
      });
    } else {
      console.error('No authorization code in callback');
      this.router.navigateByUrl('/login');
    }
  }
}