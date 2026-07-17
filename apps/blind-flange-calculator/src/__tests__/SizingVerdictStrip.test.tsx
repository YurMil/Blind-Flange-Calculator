import {afterEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import SizingVerdictStrip from '../components/SizingVerdictStrip';

afterEach(() => {
  cleanup();
});

describe('SizingVerdictStrip', () => {
  it('shows PN, recommended plate thickness, and bolt pass', () => {
    render(
      <SizingVerdictStrip
        selectedPn={16}
        recommendedThicknessMm={8}
        codeMinimumMm={6.6}
        boltPass={true}
        boltDetail="8 × M16"
      />,
    );

    expect(screen.getByLabelText(/Sizing verdict/i)).toBeInTheDocument();
    expect(screen.getByText('PN 16')).toBeInTheDocument();
    expect(screen.getByText(/Recommended plate thickness/i)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/Code minimum 6\.60 mm/i)).toBeInTheDocument();
    expect(screen.getByText('Pass')).toBeInTheDocument();
    expect(screen.getByText(/Ready for PDF \/ DXF \/ STEP export/i)).toBeInTheDocument();
  });

  it('shows bolt fail without export-ready copy', () => {
    render(
      <SizingVerdictStrip
        selectedPn={40}
        recommendedThicknessMm={20}
        codeMinimumMm={18.2}
        boltPass={false}
        boltDetail="Governing: hydrotest"
      />,
    );

    expect(screen.getByText('Fail')).toBeInTheDocument();
    expect(screen.queryByText(/Ready for PDF/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Governing: hydrotest/i)).toBeInTheDocument();
  });
});
