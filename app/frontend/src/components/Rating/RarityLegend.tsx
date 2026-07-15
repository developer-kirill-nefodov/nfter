import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {
  Card,
  CardName,
  CardPoints,
  Note,
  Panel,
  PanelTitle,
  Swatch,
  Trigger,
  Wrapper,
} from './rarity-legend.styles';

interface ITier {
  key: string;
  labelKey: string;
  points: number;
}

const TIERS: ITier[] = [
  {key: 'legendary', labelKey: 'collect.tiers.legendary', points: 30},
  {key: 'epic', labelKey: 'collect.tiers.epic', points: 10},
  {key: 'rare', labelKey: 'collect.tiers.rare', points: 3},
  {key: 'common', labelKey: 'collect.tiers.common', points: 1},
  {key: 'pass', labelKey: 'rating.pass', points: 1},
];

const InfoIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 7v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="4.6" r="0.9" fill="currentColor" />
  </svg>
);

const RarityLegend = () => {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <InfoIcon />
        {t('rating.pointsTitle')}
      </Trigger>

      {open && (
        <Panel role="dialog" aria-label={t('rating.pointsTitle')}>
          <PanelTitle>{t('rating.pointsTitle')}</PanelTitle>

          {TIERS.map((tier) => (
            <Card key={tier.key} $tier={tier.key}>
              <Swatch $tier={tier.key} aria-hidden="true" />
              <CardName $tier={tier.key}>{t(tier.labelKey)}</CardName>
              <CardPoints>{t('rating.points', {points: tier.points})}</CardPoints>
            </Card>
          ))}

          <Note>{t('rating.pointsHint')}</Note>
        </Panel>
      )}
    </Wrapper>
  );
};

export default RarityLegend;
