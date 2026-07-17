import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import ExportActions from '../components/ExportActions';
import type {CalculationInput, CalculationResult} from '../domain/types/bfTypes';

vi.mock('../components/StepExportPanel', () => ({
  default: () => <div data-testid="step-export-panel">STEP export</div>,
}));

afterEach(() => {
  cleanup();
});

const baseInput: CalculationInput = {
  geometryMode: 'standard',
  dn: 100,
  pressureOp: 10,
  pressureTest: 15,
  temperature: 20,
  material: 'P265GH',
  corrosionAllowance: 1,
  gasketMaterial: 'graphite',
  gasketThickness: 2,
  gasketFacing: 'RF',
  frictionPreset: 'dry',
  fastenerStandard: 'EN',
  fastenerType: 'BOLT',
  fastenerGradeId: 'EN_8.8',
};

const sampleResult = {
  dims: {D: 220, k: 180, bolts: 8, size: 'M16', d2: 18},
  selectedPN: 10,
  source: 'en1092',
  gasketDiameter: 140,
  allowableStressOp: 150,
  allowableStressTest: 200,
  minThickness: 12,
  finalThickness: 14,
  recommendedThickness: 14,
  weight: 12,
} as CalculationResult;

describe('ExportActions', () => {
  it('disables PDF and DXF when there is no result', () => {
    render(
      <ExportActions
        input={baseInput}
        result={null}
        gasketFacing="RF"
        targetPN={10}
      />,
    );

    expect(screen.getByRole('button', {name: 'Export PDF'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Download DXF'})).toBeDisabled();
    expect(screen.getByTestId('step-export-panel')).toBeInTheDocument();
  });

  it('enables PDF and DXF when a calculation result exists', () => {
    render(
      <ExportActions
        input={baseInput}
        result={sampleResult}
        stepBaseResult={sampleResult}
        gasketFacing="RF"
        targetPN={10}
      />,
    );

    expect(screen.getByRole('button', {name: 'Export PDF'})).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Download DXF'})).toBeEnabled();
  });
});
