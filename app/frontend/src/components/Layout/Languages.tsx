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

const flagOf = (iso2: string): string =>
  String.fromCodePoint(...[...iso2.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

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
