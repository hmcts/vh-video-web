import { ChartOptions } from 'chart.js';

export const graphLabel = {
    Poor: 'poor',
    Bad: 'bad',
    Good: 'good',
    Disconnected: 'disconnected',
    Unsupported: 'unsupported'
};

export class GraphSettings {
    static MAX_RECORDS = 180;

    static getLineChartOptions(): ChartOptions<'line'> {
        const options: ChartOptions<'line'> = {
            responsive: true,
            elements: {
                point: {
                    pointStyle: 'line',
                    radius: 0
                }
            },
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
                    suggestedMax: 180,
                    display: false,
                    title: {
                        text: ' ',
                        display: true
                    },
                    ticks: {}
                }
            }
        };

        return options;
    }

    static setScaleXLabels(chart, args, options) {
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
