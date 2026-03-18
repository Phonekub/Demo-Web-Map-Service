import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const fetchSevenInfoByPoiId = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../../../../components', () => ({
  Input: ({ title, ...props }: any) => (
    <label>
      <span>{title}</span>
      <input {...props} />
    </label>
  ),
}));

vi.mock('../../../../services/location.service', () => ({
  fetchSevenInfoByPoiId: (...args: unknown[]) => fetchSevenInfoByPoiId(...args),
}));

import SevenInfo from './SevenInfo';

describe('SevenInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Fetch, mapping, and readonly formatting ---
  // Loads seven info by poi id, maps API fields into readonly inputs, formats numbers, and sets radio states.
  it('fetches seven info and renders mapped readonly values', async () => {
    fetchSevenInfoByPoiId.mockResolvedValue({
      storecode: '7001',
      storename: 'Seven Rama 9',
      locationT: 'PTT Station',
      tradeArea: 'Urban',
      branchType: 'Open',
      sevenType: 'PTT',
      saleAverage: '12345.5',
      customerAverage: '321',
      salePricePerson: '38.25',
      opentypeAmount: '2',
      vaultAmount: '1',
      shelf: '20',
      posAmount: '4',
      canSaleCigarette: 'Y',
      canSaleAlcohol: 'N',
    });

    render(<SevenInfo poiId="42" />);

    await waitFor(() => expect(fetchSevenInfoByPoiId).toHaveBeenCalledWith(42));

    expect(await screen.findByDisplayValue('7001')).toBeDisabled();
    expect(screen.getByDisplayValue('Seven Rama 9')).toBeDisabled();
    expect(screen.getByDisplayValue('12,345.50')).toBeDisabled();
    expect(screen.getByDisplayValue('321')).toBeDisabled();
    expect(screen.getByDisplayValue('38.25')).toBeDisabled();
    expect(screen.getByDisplayValue('4')).toBeDisabled();

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(radios[2]).not.toBeChecked();
    expect(radios[3]).toBeChecked();
  });

  // --- Invalid poi handling ---
  // Clears displayed values and skips the API call when the poi id is missing or non-numeric.
  it('does not fetch when poi id is invalid and renders empty readonly fields', () => {
    render(
      <SevenInfo
        poiId="abc"
        data={{ store_code: 'seed-code', store_name: 'seed-name' }}
      />
    );

    expect(fetchSevenInfoByPoiId).not.toHaveBeenCalled();
    expect(screen.getAllByDisplayValue('').length).toBeGreaterThan(0);
    expect(screen.queryByDisplayValue('seed-code')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('seed-name')).not.toBeInTheDocument();
  });
});
