import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { RouterModule, Routes } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { InputNumberModule } from 'primeng/inputnumber';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';
// PrimeNG Services
import { MessageService, ConfirmationService } from 'primeng/api';



import { AppComponent } from './app.component';
import{ HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
 import { FormsModule,ReactiveFormsModule } from '@angular/forms';

// import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';

// Services and Guards
import { AuthService } from './services/auth-service.service';
import { JwtInterceptor } from './interceptors/JwtInterceptor';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { GuestGuard } from './guards/GuestGuard';
import { AuthGuard } from './guards/AuthGuard';
import { CandidateregisterComponent } from './components/register/candidateregister/candidateregister.component';
import { EmployeeregisterComponent } from './components/register/employeeregister/employeeregister.component';
import { RegistrationService } from './services/registration.service';
import { JobListComponent } from './components/home/job/job-list/job-list.component';
import { JobService } from './services/job.service';
import { JobDetailComponent } from './components/home/job/job-detail/job-detail.component';
import { JobSearchComponent } from './components/home/job/job-search/job-search.component';
import { CandidateComponent } from './components/profile/candidate/candidate.component';
import { CandidateService } from './services/candidate-service.service';
import { JobApplyComponent } from './components/home/job/job-apply/job-apply.component';
import { EmployerComponent } from './components/profile/employer/employer.component';
import { EmployerService } from './services/employer-service.service';
import { CalendarModule } from 'primeng/calendar';
import { SavedJobService } from './services/saved-job.service';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [GuestGuard]
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
   { 
    path: 'register/candidate', 
    component: CandidateregisterComponent,
    canActivate: [GuestGuard]
  },
   { 
    path: 'register/employer', 
    component: EmployeeregisterComponent,
    canActivate: [GuestGuard]
  },
  { 
    path: 'job-detail/:jobId', 
    component: JobDetailComponent
  },
    {
    path: 'jobs/:jobId/apply',
    component: JobApplyComponent,
    canActivate: [AuthGuard] // Assuming you have authentication
  },
   {
    path: 'candidate',
    children: [
      {
        path: 'dashboard',
        component: CandidateComponent,
        data: { title: 'Candidate Dashboard' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
    {
    path: 'employer',
    children: [
      {
        path: 'dashboard',
        component: EmployerComponent,
        data: { title: 'Employer Dashboard' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path:'**',
    component:LoginComponent,
    canActivate:[GuestGuard]
  }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProfileComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    CandidateregisterComponent,
    EmployeeregisterComponent,
    JobListComponent,
    JobDetailComponent,
    JobSearchComponent,
    CandidateComponent,
    JobApplyComponent,
    EmployerComponent,
    
    
  ],
  imports: [
     BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes,{
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',       // optional—lets you jump to #anchors
      scrollOffset: [0, 0]             // optional—offset [x, y]
    
    }), 
    
    // PrimeNG Modules
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    RippleModule,
    CheckboxModule,
    DropdownModule,
    AutoCompleteModule,
    ChipModule,
    InputNumberModule,
    PaginatorModule,
    ProgressSpinnerModule,
    TagModule,
    MessageModule,
    PanelModule,
    SkeletonModule,
    FileUploadModule,
    InputTextareaModule,
    TableModule,
    TabViewModule,
    DividerModule,
    RadioButtonModule,
    CalendarModule
  ],
  providers: [ 
    AuthGuard,
    GuestGuard,
    AuthService,
    RegistrationService,
    JobService,
    CandidateService,
    EmployerService,
    SavedJobService,
    MessageService,
    ConfirmationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
