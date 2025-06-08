import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JobApplication } from 'src/app/interfaces/JobApplication';

@Component({
  selector: 'app-view-application',
  templateUrl: './view-application.component.html',
  styleUrls: ['./view-application.component.scss']
})
export class ViewApplicationComponent {
   @Input() visible: boolean = false;
  @Input() application: JobApplication | null = null;
  @Input() showStatusActions: boolean = false; // Show status actions for employers
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() statusUpdate = new EventEmitter<{application: JobApplication, status: string}>();
  @Output() viewResume = new EventEmitter<JobApplication>();
  @Output() downloadResume = new EventEmitter<JobApplication>();
  @Output() viewCoverLetter = new EventEmitter<JobApplication>();
  @Output() downloadCoverLetter = new EventEmitter<JobApplication>();

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'REVIEW': return 'warning';
      case 'SHORTLISTED': return 'success';
      case 'REJECTED': return 'danger';
      case 'INTERVIEW_SCHEDULED': return 'warning';
      case 'SELECTED': return 'success';
      default: return 'info';
    }
  }

  hasSkills(skills: any): boolean {
    if (!skills) return false;
    if (Array.isArray(skills)) return skills.length > 0;
    if (typeof skills === 'string') return skills.trim().length > 0;
    if (typeof skills === 'object') return Object.keys(skills).length > 0;
    return false;
  }

  getSkillsArray(skills: any): string[] {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') return skills.split(',').map(s => s.trim()).filter(s => s);
    if (typeof skills === 'object') return Object.values(skills) as string[];
    return [];
  }

  formatDateTime(dateTime: any): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
}
