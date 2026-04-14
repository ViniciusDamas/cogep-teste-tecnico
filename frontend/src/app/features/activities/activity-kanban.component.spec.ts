import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';
import { ActivityKanbanComponent } from './activity-kanban.component';

describe('ActivityKanbanComponent', () => {
  let fixture: ComponentFixture<ActivityKanbanComponent>;
  let component: ActivityKanbanComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NoopAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [ActivityKanbanComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityKanbanComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with empty columns', () => {
    expect(component.columns).toEqual([]);
    expect(component.dropListIds).toEqual([]);
  });

  it('trackByStage returns stage id', () => {
    const col = { stage: { id: 'abc' } } as never;
    expect(component.trackByStage(0, col)).toBe('abc');
  });
});
