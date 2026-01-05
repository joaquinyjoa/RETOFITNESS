import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CambiarPasswordComponent } from './cambiar-password.component';

describe('CambiarPasswordComponent', () => {
  let component: CambiarPasswordComponent;
  let fixture: ComponentFixture<CambiarPasswordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CambiarPasswordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CambiarPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
