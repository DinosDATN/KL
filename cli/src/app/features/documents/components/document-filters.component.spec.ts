import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentFiltersComponent } from './document-filters.component';

describe('DocumentFiltersComponent', () => {
  let component: DocumentFiltersComponent;
  let fixture: ComponentFixture<DocumentFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
