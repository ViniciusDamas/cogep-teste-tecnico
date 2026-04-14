import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, Plugin } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models';

/**
 * Plugin inline: desenha o valor numérico na ponta de cada barra horizontal,
 * evitando a necessidade de chartjs-plugin-datalabels.
 */
const BarValueLabels: Plugin<'bar'> = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta) return;
    const data = chart.data.datasets[0]?.data as (number | null)[] | undefined;
    if (!data) return;

    ctx.save();
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, i) => {
      const value = data[i] ?? 0;
      if (value === 0) return;
      const pos = bar.tooltipPosition(false) as { x: number | null; y: number | null } | null;
      const px = Number(pos?.x ?? 0);
      const py = Number(pos?.y ?? 0);
      if (!px || !py) return;
      ctx.fillStyle = '#0a0a0a';
      ctx.textAlign = 'right';
      ctx.fillText(String(value), px - 8, py);
    });
    ctx.restore();
  },
};

@Component({
  selector: 'app-dashboard',
  template: `
    <nz-spin [nzSpinning]="loading">
      <div *ngIf="data">
        <div class="dashboard-grid">
          <nz-card class="kpi-card">
            <span nz-icon nzType="team" class="kpi-card__icon"></span>
            <nz-statistic
              nzTitle="Pessoas cadastradas"
              [nzValue]="data.totalPersons"
            ></nz-statistic>
          </nz-card>
          <nz-card class="kpi-card">
            <span nz-icon nzType="file-text" class="kpi-card__icon"></span>
            <nz-statistic
              nzTitle="Atividades ativas"
              [nzValue]="data.totalActivities"
            ></nz-statistic>
          </nz-card>
          <nz-card class="kpi-card" [class.kpi-card--alert]="data.overdueCount > 0">
            <span nz-icon nzType="clock-circle" class="kpi-card__icon"></span>
            <nz-statistic
              nzTitle="Em atraso"
              [nzValue]="data.overdueCount"
              [nzValueStyle]="{
                color: data.overdueCount > 0 ? 'var(--c-danger)' : 'var(--c-ink-soft)',
              }"
            ></nz-statistic>
            <div class="kpi-card__trend">
              {{ data.overdueCount }} de {{ data.totalActivities }} atividade{{
                data.totalActivities === 1 ? '' : 's'
              }}
            </div>
          </nz-card>
          <nz-card class="kpi-card">
            <span nz-icon nzType="appstore" class="kpi-card__icon"></span>
            <nz-statistic
              nzTitle="Etapas configuradas"
              [nzValue]="data.activitiesByStage.length"
            ></nz-statistic>
          </nz-card>
        </div>

        <nz-card [nzTitle]="chartTitleTpl" [nzExtra]="chartExtra" class="dashboard-chart">
          <ng-template #chartTitleTpl>
            <div>
              <div>Distribuição por etapa REURB</div>
              <div class="dashboard-chart__subtitle">
                {{ data.totalActivities }} atividade{{
                  data.totalActivities === 1 ? '' : 's'
                }}
                ativa{{ data.totalActivities === 1 ? '' : 's' }} em {{ populatedStages }} de
                {{ data.activitiesByStage.length }} etapas
              </div>
            </div>
          </ng-template>
          <ng-template #chartExtra>
            <span class="text-muted">Lei 13.465/2017 · Decreto 9.310/2018</span>
          </ng-template>
          <canvas
            baseChart
            [data]="barData"
            [options]="barOptions"
            [type]="barType"
            [plugins]="plugins"
          ></canvas>
        </nz-card>
      </div>
    </nz-spin>
  `,
})
export class DashboardComponent implements OnInit {
  loading = false;
  data?: DashboardSummary;
  populatedStages = 0;

  barType = 'bar' as const;
  plugins: Plugin<'bar'>[] = [BarValueLabels];
  barData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    layout: { padding: { right: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1b20',
        titleColor: '#e9eaee',
        bodyColor: '#c6f24a',
        borderColor: '#2c2e37',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Manrope', size: 12, weight: 600 },
        bodyFont: { family: 'JetBrains Mono', size: 13 },
        callbacks: {
          label: (ctx) => {
            const value = Number(ctx.parsed.x ?? 0);
            const dataset = (ctx.dataset.data as (number | null)[]).map((v) => Number(v ?? 0));
            const total = dataset.reduce((acc, v) => acc + v, 0) || 1;
            const pct = ((value / total) * 100).toFixed(0);
            return ` ${value} atividade${value === 1 ? '' : 's'} (${pct}% do total)`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
        beginAtZero: true,
      },
      y: {
        ticks: {
          color: '#d9dce4',
          font: { family: 'Manrope', size: 14, weight: 500 },
          autoSkip: false,
          padding: 14,
        },
        grid: { display: false },
      },
    },
  };

  constructor(private service: DashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.summary().subscribe({
      next: (d) => {
        this.data = d;
        const labels = d.activitiesByStage.map((s) => `${s.order}. ${s.name}`);
        const values = d.activitiesByStage.map((s) => s.count);
        this.populatedStages = values.filter((v) => v > 0).length;

        this.barData = {
          labels,
          datasets: [
            {
              label: 'Atividades',
              data: values,
              backgroundColor: (ctx) => {
                const v = values[ctx.dataIndex] ?? 0;
                if (v === 0) return 'rgba(255, 255, 255, 0.04)';
                const area = ctx.chart.chartArea;
                if (!area) return 'rgba(198, 242, 74, 0.85)';
                const g = ctx.chart.ctx.createLinearGradient(area.left, 0, area.right, 0);
                g.addColorStop(0, 'rgba(198, 242, 74, 0.35)');
                g.addColorStop(0.7, 'rgba(198, 242, 74, 0.85)');
                g.addColorStop(1, '#c6f24a');
                return g;
              },
              borderColor: values.map((v) =>
                v === 0 ? 'rgba(198, 242, 74, 0.18)' : 'rgba(198, 242, 74, 0.9)',
              ),
              borderWidth: values.map((v) => (v === 0 ? 1 : 0)),
              borderRadius: 8,
              borderSkipped: false,
              hoverBackgroundColor: '#c6f24a',
              minBarLength: 6,
              barPercentage: 0.72,
              categoryPercentage: 0.85,
            },
          ],
        };
      },
      complete: () => (this.loading = false),
    });
  }
}
