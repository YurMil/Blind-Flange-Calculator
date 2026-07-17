import {afterEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import FlangeVisualizer from '../components/FlangeVisualizer';

afterEach(() => {
  cleanup();
});

describe('FlangeVisualizer', () => {
  it('renders a fluid sketch with legend and dimension callouts', () => {
    const {container} = render(
      <FlangeVisualizer
        dn={100}
        dims={{D: 220, k: 180, bolts: 8, size: 'M16', d2: 18}}
        selectedPN={16}
        recommendedThickness={8}
        gasketMeanDiameter={108}
        gasketId={100}
        gasketOd={140}
      />,
    );

    const plan = screen.getByRole('img', {name: /Blind flange plan view DN 100/i});
    expect(plan).toHaveAttribute('viewBox', '0 0 320 320');
    expect(plan).toHaveClass('w-full');
    expect(plan.getAttribute('width')).toBeNull();

    expect(screen.getByLabelText(/Sketch legend/i)).toBeInTheDocument();
    expect(screen.getByText('Outer flange')).toBeInTheDocument();
    expect(screen.getByText('Gasket envelope')).toBeInTheDocument();
    expect(screen.getByText('Bolt circle')).toBeInTheDocument();
    expect(screen.getByText('Bolt holes')).toBeInTheDocument();

    expect(screen.getByText('ØD 220')).toBeInTheDocument();
    expect(screen.getByText('K (BCD) 180')).toBeInTheDocument();
    expect(screen.getByText('d2')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: /Side view thickness 8 mm/i})).toBeInTheDocument();
    expect(screen.getByText('220 mm')).toBeInTheDocument();
    expect(container.querySelector('svg[width="320"]')).toBeNull();
  });

  it('matches empty-state chrome when EN 1092-1 data is missing', () => {
    render(<FlangeVisualizer dn={15} />);

    expect(screen.getByText(/Sketch/i)).toBeInTheDocument();
    expect(screen.getByText(/No EN 1092-1 data available for DN 15/i)).toBeInTheDocument();
  });
});
