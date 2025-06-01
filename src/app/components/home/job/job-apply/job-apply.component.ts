import { Component } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { DisclosureAnswerDTO } from 'src/app/interfaces/DisclosureAnswerDTO';
import { DisclosureQuestion } from 'src/app/interfaces/DisclosureQuestion';
import { Job } from 'src/app/interfaces/Job';
import { JobApplicationSubmissionDTO } from 'src/app/interfaces/JobApplicationSubmissionDTO';
import { JobDisclosureQuestionsDTO } from 'src/app/interfaces/JobDisclosureQuestionsDTO';
import { JobService } from 'src/app/services/job.service';

@Component({
  selector: 'app-job-apply',
  templateUrl: './job-apply.component.html',
  styleUrls: ['./job-apply.component.scss']
})
export class JobApplyComponent {
  private destroy$ = new Subject<void>();

  jobId!: string;
  job: Job | null = null;
  disclosureQuestions: DisclosureQuestion[] = [];
  jobDisclosures: JobDisclosureQuestionsDTO | null = null; // Add this to store full response
  applicationForm!: FormGroup;
  
  // File handling
  resumeFile: File | null = null;
  coverLetterFile: File | null = null;
  maxFileSize = 5000000; // 5MB
  allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  // UI State
  loading = false;
  submitting = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private jobService: JobService,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }
  
  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('jobId') || '';
    if (!this.jobId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Job ID not found'
      });
      this.router.navigate(['/jobs']);
      return;
    }
    
    this.loadJobAndDisclosures();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForm(): void {
    this.applicationForm = this.fb.group({
      useExistingResume: [false],
      voluntaryDisclosures: [''],
      disclosureAnswers: this.fb.array([])
    });
  }
  
  private loadJobAndDisclosures(): void {
    this.loading = true;
    
    forkJoin({
      job: this.jobService.getJobByJobId(this.jobId),
      disclosures: this.jobService.getJobDisclosureQuestionsRaw(this.jobId) // Use new method that returns full DTO
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.job = result.job;
        this.jobDisclosures = result.disclosures; // Store full DTO
        this.disclosureQuestions = result.disclosures.disclosureQuestions || []; // Extract questions array
        
        this.setupDisclosureAnswers();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading job data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load job information'
        });
        this.loading = false;
        this.router.navigate(['/jobs']);
      }
    });
  }
  
  private setupDisclosureAnswers(): void {
    const disclosureArray = this.applicationForm.get('disclosureAnswers') as FormArray;
    disclosureArray.clear();
    
    this.disclosureQuestions.forEach(question => {
      const answerGroup = this.fb.group({
        questionId: [question.id],
        questionText: [question.questionText],
        answerText: ['', question.isRequired ? [Validators.required] : []] // Fixed: use isRequired instead of required
      });
      
      disclosureArray.push(answerGroup);
    });
  }
  
  get disclosureAnswersArray(): FormArray {
    return this.applicationForm.get('disclosureAnswers') as FormArray;
  }
  
  getDisclosureAnswerControl(index: number): AbstractControl {
    return this.disclosureAnswersArray.at(index);
  }
  
  onResumeSelect(event: any): void {
    const file = event.files[0];
    if (this.validateFile(file, 'resume')) {
      this.resumeFile = file;
    }
  }
  
  onCoverLetterSelect(event: any): void {
    const file = event.files[0];
    if (this.validateFile(file, 'cover letter')) {
      this.coverLetterFile = file;
    }
  }
  
  private validateFile(file: File, fileType: string): boolean {
    if (!file) return false;
    
    // Check file size
    if (file.size > this.maxFileSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: `${fileType} file size should not exceed 5MB`
      });
      return false;
    }
    
    // Check file type
    if (!this.allowedFileTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: `${fileType} must be PDF, DOC, DOCX, or TXT file`
      });
      return false;
    }
    
    return true;
  }
  
  onResumeRemove(): void {
    this.resumeFile = null;
  }
  
  onCoverLetterRemove(): void {
    this.coverLetterFile = null;
  }
  
  onSubmitApplication(): void {
    if (!this.applicationForm.valid) {
      this.markFormGroupTouched(this.applicationForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Form Invalid',
        detail: 'Please fill in all required fields'
      });
      return;
    }
    
    // Check if resume is required (either file upload or existing resume)
    const useExistingResume = this.applicationForm.get('useExistingResume')?.value;
    if (!useExistingResume && !this.resumeFile) {
      this.messageService.add({
        severity: 'error',
        summary: 'Resume Required',
        detail: 'Please upload a resume or use your existing resume'
      });
      return;
    }
    
    this.submitting = true;
    
    // Get job's internal ID from the job object
    const jobInternalId = this.job?.id; // Assuming Job has an 'id' field for internal ID

    if (typeof jobInternalId !== 'number') {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid job information. Please try again.'
      });
      this.submitting = false;
      return;
    }
    
    const applicationData: JobApplicationSubmissionDTO = {
      jobId: jobInternalId, // Use internal ID, not the jobId string
      useExistingResume: useExistingResume,
      voluntaryDisclosures: this.applicationForm.get('voluntaryDisclosures')?.value,
      disclosureAnswers: this.disclosureAnswersArray.value.filter((answer: DisclosureAnswerDTO) => 
        answer.answerText && answer.answerText.trim() !== ''
      )
    };
    
    this.jobService.applyToJob(
      this.jobId, // Still use jobId string for the URL parameter
      applicationData, 
      this.resumeFile || undefined, 
      this.coverLetterFile || undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (application) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Application Submitted',
          detail: 'Your job application has been submitted successfully'
        });
        this.submitting = false;
        
        // Navigate to applications page or job detail
        this.router.navigate(['/my-applications']);
      },
      error: (error) => {
        console.error('Error submitting application:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail: error.error?.message || 'Failed to submit application. Please try again.'
        });
        this.submitting = false;
      }
    });
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/jobs', this.jobId]);
  }
  
  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.applicationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  isDisclosureAnswerInvalid(index: number): boolean {
    const control = this.getDisclosureAnswerControl(index).get('answerText');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.applicationForm.get(fieldName);
    if (field?.errors?.['required']) {
      return `${fieldName} is required`;
    }
    return '';
  }

  // Helper method to get company logo URL
  getCompanyLogoUrl(): string {
    // Implement based on how your company logos are stored
    // This could be a property on the job object or constructed from company name
    if(this.job?.logoDataUrl){
      return this.job?.logoDataUrl 
    }
    return this.job?.logoDataUrl || 'logo not found';
  }
    getCompanyInitials(companyName: string): string {
    return companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }
}
