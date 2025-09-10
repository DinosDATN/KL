import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesPaginationComponent } from './courses-pagination.component';

describe('CoursesPaginationComponent', () => {
  let component: CoursesPaginationComponent;
  let fixture: ComponentFixture<CoursesPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursesPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
