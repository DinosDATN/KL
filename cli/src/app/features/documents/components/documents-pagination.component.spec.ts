import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsPaginationComponent } from './documents-pagination.component';

describe('DocumentsPaginationComponent', () => {
  let component: DocumentsPaginationComponent;
  let fixture: ComponentFixture<DocumentsPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentsPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
