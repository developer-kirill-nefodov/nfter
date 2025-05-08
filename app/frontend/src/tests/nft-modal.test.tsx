import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeProvider} from 'styled-components';
import {describe, expect, it, vi} from 'vitest';

import NftModal from '../components/Nft/NftModal';
import {theme} from '../theme';
import type {INft} from '../types/nft';

const NFT: INft = {
  tokenId: '7',
  tokenUri: 'data:application/json;base64,eyJuYW1lIjoiIn0=',
  name: 'EthersWeb3 Artifact #7',
  description: 'A fully on-chain generative artifact.',
  image: 'data:image/svg+xml;base64,PHN2Zy8+',
  attributes: [
    {trait_type: 'Tier', value: 'Legendary'},
    {trait_type: 'Hue', value: 167},
    {trait_type: 'Rings', value: 9},
  ],
};

const renderModal = (onClose = vi.fn()) => {
  render(
    <ThemeProvider theme={theme}>
      <NftModal nft={NFT} contract="0xabc" onClose={onClose} />
    </ThemeProvider>,
  );

  return onClose;
};

describe('NftModal', () => {
  it('shows the art large, with every trait — not just the first two', () => {
    renderModal();

    expect(screen.getByRole('img', {name: NFT.name})).toHaveAttribute('src', NFT.image);

    expect(screen.getByText('Hue')).toBeInTheDocument();
    expect(screen.getByText('Rings')).toBeInTheDocument();
    expect(screen.getAllByText('Legendary')).toHaveLength(2);
  });

  it('links out to the token on the explorer', () => {
    renderModal();

    expect(screen.getByRole('link', {name: /etherscan/i})).toHaveAttribute(
      'href',
      'https://sepolia.etherscan.io/nft/0xabc/7',
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = renderModal();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on the backdrop, but not on a click inside it', async () => {
    const user = userEvent.setup();
    const onClose = renderModal();

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', {name: 'Close'}));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('congratulates rather than merely informs, right after a mint', () => {
    render(
      <ThemeProvider theme={theme}>
        <NftModal nft={NFT} contract="0xabc" reveal txHash="0xdead" onClose={vi.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading')).toHaveTextContent(/it’s yours/i);
    expect(screen.getByRole('link', {name: /transaction/i})).toHaveAttribute(
      'href',
      'https://sepolia.etherscan.io/tx/0xdead',
    );
  });
});
