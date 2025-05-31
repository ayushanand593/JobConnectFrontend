import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Job } from 'src/app/interfaces/Job';
import { JobSearchRequest } from 'src/app/interfaces/JobSearchRequest';
import { PageResponse } from 'src/app/interfaces/PageResponse';
import { JobService } from 'src/app/services/job.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

}
