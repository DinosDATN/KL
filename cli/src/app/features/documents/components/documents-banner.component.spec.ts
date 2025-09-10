import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsBannerComponent } from './documents-banner.component';

describe('DocumentsBannerComponent', () => {
  let component: DocumentsBannerComponent;
  let fixture: ComponentFixture<DocumentsBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentsBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
