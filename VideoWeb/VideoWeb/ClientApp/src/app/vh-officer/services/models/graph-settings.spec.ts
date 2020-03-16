import { GraphSettings } from '../models/graph-settings';

describe('GraphSettings', () => {


  it('should return tooltip text disconnected if value is 0', () => {
    const tooltip = GraphSettings.setTooltipText(0, 'signal');
    expect(tooltip).toBe('signal: disconnected');
  });
  it('should return tooltip text disconnected if value is less than 0', () => {
    const tooltip = GraphSettings.setTooltipText(-1, 'signal');
    expect(tooltip).toBe('signal: disconnected');
  });
  it('should return tooltip text bad if value is 5', () => {
    const tooltip = GraphSettings.setTooltipText(5, 'signal');
    expect(tooltip).toBe('signal: bad');
  });
  it('should return tooltip text bad if value is less than 5', () => {
    const tooltip = GraphSettings.setTooltipText(4, 'signal');
    expect(tooltip).toBe('signal: bad');
  });
  it('should return tooltip text poor if value is greater than 5', () => {
    const tooltip = GraphSettings.setTooltipText(6, 'signal');
    expect(tooltip).toBe('signal: poor');
  });
  it('should return tooltip text poor if value is less than 10', () => {
    const tooltip = GraphSettings.setTooltipText(9, 'signal');
    expect(tooltip).toBe('signal: poor');
  });
  it('should return tooltip text good if value is greater than 10', () => {
    const tooltip = GraphSettings.setTooltipText(19, 'signal');
    expect(tooltip).toBe('signal: good');
  });
});
