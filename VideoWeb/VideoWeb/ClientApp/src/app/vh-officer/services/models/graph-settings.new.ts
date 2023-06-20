import { ChartOptions, Color } from 'chart.js';

export class GraphSettingsNew {
    static MAX_RECORDS = 180;

    static getLineChartOptions(): ChartOptions<'line'> {
        const options: ChartOptions<'line'> = {
            scales: {
                y: {
                    suggestedMin: 0,
                    suggestedMax: 25,
                    display: false,
                    ticks: {
                        stepSize: 5
                    },
                    title: {
                        text: 'Signal strength',
                        display: false
                    }
                },
                x: {
                    suggestedMin: 0,
                    suggestedMax: this.MAX_RECORDS,
                    display: false,
                    title: {
                        text: ' ',
                        display: true
                    },
                    ticks: {}
                }
            },
            responsive: true,
            elements: {
                point: {
                    pointStyle: 'line',
                    radius: 0
                }
            },
            plugins: {
                tooltip: {
                    enabled: false
                }
            }
        };

        return options;
    }

    static getlineChartColors(): Color[] {
        return [];
    }

    static setScaleXLabels(chart, ease) {
        const width = chart.width / 3;
        const ctx = chart.ctx;
        ctx.restore();

        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#777';
        const y = chart.height - 10;

        let text = '15m';
        let x = 10;
        ctx.fillText(text, x, y);

        text = '10m';
        x = width;
        ctx.fillText(text, x, y);

        text = '5m';
        x = width * 2;
        ctx.fillText(text, x, y);

        text = 'now';
        x = width * 3 - 30;
        ctx.fillText(text, x, y);

        ctx.save();
    }
}
