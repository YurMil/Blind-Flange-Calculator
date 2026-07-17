import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputForm from '../components/InputForm';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS} from '../domain/standards/data';
import type {InputFormProps} from '../domain/types/bfTypes';

afterEach(() => {
  cleanup();
});

const buildProps = (overrides: Partial<InputFormProps> = {}): InputFormProps => ({
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
  tighteningMethod: 'k_factor',
  fastenerStandard: 'EN',
  fastenerType: 'BOLT',
  fastenerGradeId: DEFAULT_FASTENER_ID,
  autoTestPressure: 14.3,
  availableDns: AVAILABLE_DNS,
  materials: MATERIALS,
  onGeometryModeChange: vi.fn(),
  onDnChange: vi.fn(),
  onCustomOuterDiameterChange: vi.fn(),
  onCustomNozzleIdChange: vi.fn(),
  onPressureOpChange: vi.fn(),
  onPressureTestChange: vi.fn(),
  onTemperatureChange: vi.fn(),
  onMaterialChange: vi.fn(),
  onCorrosionAllowanceChange: vi.fn(),
  onGasketMaterialChange: vi.fn(),
  onGasketThicknessChange: vi.fn(),
  onGasketFacingChange: vi.fn(),
  onFrictionPresetChange: vi.fn(),
  onTighteningMethodChange: vi.fn(),
  onFastenerStandardChange: vi.fn(),
  onFastenerTypeChange: vi.fn(),
  onFastenerGradeChange: vi.fn(),
  ...overrides,
});

describe('InputForm', () => {
  it('renders standard geometry mode and switches to custom', async () => {
    const user = userEvent.setup();
    const onGeometryModeChange = vi.fn();

    render(<InputForm {...buildProps({onGeometryModeChange})} />);

    expect(screen.getByRole('radio', {name: 'Standard (DN)'})).toBeChecked();
    await user.click(screen.getByRole('radio', {name: 'Custom geometry'}));
    expect(onGeometryModeChange).toHaveBeenCalledWith('custom');
  });

  it('exposes accessible names for primary parameter controls', () => {
    render(<InputForm {...buildProps()} />);

    expect(screen.getByLabelText(/^Diameter \(DN\)$/i)).toHaveDisplayValue('DN 100');
    expect(screen.getByLabelText(/^Operating pressure \(bar\)$/i)).toHaveValue('10');
    expect(screen.getByLabelText(/^Test pressure \(bar\)$/i)).toHaveValue('15');
    expect(screen.getByLabelText(/^Temperature \(deg C\)$/i)).toHaveValue('20');
    expect(screen.getByLabelText(/^Material$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Corrosion allowance \(mm\)$/i)).toHaveValue('1');
    expect(screen.getByLabelText(/^Facing$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Gasket material$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Gasket thickness \(mm\)$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Fastener standard$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Fastener type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Grade \/ Material$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Tightening condition$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Method$/i)).toBeInTheDocument();
  });

  it('shows custom geometry fields when geometryMode is custom', () => {
    render(
      <InputForm
        {...buildProps({
          geometryMode: 'custom',
          customOuterDiameter: 340,
          customNozzleId: 200,
        })}
      />,
    );

    expect(screen.getByLabelText(/Flange outer diameter D/i)).toHaveValue('340');
    expect(screen.getByLabelText(/Nozzle \/ pipe inner diameter ID/i)).toHaveValue('200');
  });

  it('shows test-pressure warning when requested', () => {
    render(
      <InputForm
        {...buildProps({
          showTestPressureWarning: true,
          autoTestPressure: 20,
        })}
      />,
    );

    expect(screen.getByText(/Test pressure is below the code auto value/i)).toBeInTheDocument();
  });
});
