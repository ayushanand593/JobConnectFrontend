import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateregisterComponent } from './candidateregister.component';

describe('CandidateregisterComponent', () => {
  let component: CandidateregisterComponent;
  let fixture: ComponentFixture<CandidateregisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CandidateregisterComponent]
    });
    fixture = TestBed.createComponent(CandidateregisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
