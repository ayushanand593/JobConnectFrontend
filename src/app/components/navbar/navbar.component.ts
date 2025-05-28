import { Component } from '@angular/core';
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

  constructor(private authService:AuthService){}

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

    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
