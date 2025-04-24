import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {api} from '../../api/client';
import {loadLanguage} from '../../i18n';
import {toast} from '../Toastify/toast';

import {Flag, Menu, MenuItem, Trigger, Wrapper} from './languages.styles';

interface ICountry {
  iso2: string;
  lang: string;
}

/**
 * An ISO-3166 alpha-2 code maps onto a flag emoji by shifting each letter into
 * the Regional Indicator block. The font draws it — which is how this component
 * replaced react-flags-select, whose base64 flag sprites were 880 kB, more than
 * the rest of the vendor bundle put together, for four languages.
 */
const flagOf = (iso2: string): string =>
  String.fromCodePoint(...[...iso2.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

/**
 * This selector existed in the old codebase but was never imported anywhere, so
 * the app was pinned to one hardcoded locale while an i18n backend sat behind it
 * doing nothing. It is mounted in the header now.
 */
const Languages = ({compact}: {compact: boolean}) => {
  const {i18n} = useTranslation();
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ICountry[]>('/countries/lang')
      .then(({data}) => !cancelled && setCountries(data))
      // A missing language list is not worth a toast: the app still works in the
      // locale that is already loaded.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

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

  if (countries.length === 0) {
    return null;
  }

  const current = countries.find(({iso2}) => iso2 === i18n.language) ?? countries[0];

  if (!current) {
    return null;
  }

  const select = (iso2: string) => {
    setOpen(false);

    // Fetch the dictionary before switching, or the UI flashes raw keys.
    void loadLanguage(iso2)
      .then(() => i18n.changeLanguage(iso2))
      .catch(() => toast('Could not load that language', 'error'));
  };

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.lang}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag aria-hidden="true">{flagOf(current.iso2)}</Flag>
        {!compact && current.lang}
      </Trigger>

      {open && (
        <Menu role="listbox" aria-label="Language">
          {countries.map(({iso2, lang}) => (
            <MenuItem
              key={iso2}
              type="button"
              role="option"
              aria-selected={iso2 === i18n.language}
              onClick={() => select(iso2)}
            >
              <Flag aria-hidden="true">{flagOf(iso2)}</Flag>
              {lang}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Wrapper>
  );
};

export default Languages;
