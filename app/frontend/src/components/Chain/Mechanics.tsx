import {useTranslation} from 'react-i18next';

import {Note, NoteBody, NoteTitle, Notes, Panel, PanelHead, PanelTitle} from './styles';

interface IMechanics {
  title: string;
  items: string[];
}

const Mechanics = ({title, items}: IMechanics) => {
  const {t} = useTranslation();

  return (
    <Panel>
      <PanelHead>
        <PanelTitle>{t(title)}</PanelTitle>
      </PanelHead>

      <Notes>
        {items.map((key) => (
          <Note key={key}>
            <NoteTitle>{t(`${key}.title`)}</NoteTitle>
            <NoteBody>{t(`${key}.body`)}</NoteBody>
          </Note>
        ))}
      </Notes>
    </Panel>
  );
};

export default Mechanics;
