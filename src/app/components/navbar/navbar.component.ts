import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'src/app/interfaces/User';
import { AuthService } from 'src/app/services/auth-service.service';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  currentUser: User | null = null;
   isAuthenticated = false;
   private destroy$ = new Subject<void>();
   selectedOption: string;

  constructor(private authService:AuthService, private router:Router){
    this.selectedOption='';
  }

  options = [
    { label: 'Register Candidate', value: 'register/candidate'},
    { label: 'Register Employer', value: 'register/employer' }
  ];

   ngOnInit(): void {
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
        });
  
      this.authService.isAuthenticated$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isAuth => {
          this.isAuthenticated = isAuth;
        });
    }

    navigateToComponent(event:any) {
    if (event.value) {
      this.router.navigate([event.value]);
    }
  }

    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
