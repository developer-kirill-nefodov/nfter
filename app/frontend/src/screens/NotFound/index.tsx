import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';

import Button from '../../components/Button';
import {Card, Stack, Subtitle, Title} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';

const NotFoundPage = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <Stack $align="flex-start">
        <Title>404</Title>
        <Subtitle>{t('notFound.message')}</Subtitle>
        <Button onClick={() => navigate(NavigateUrls.home)}>{t('notFound.home')}</Button>
      </Stack>
    </Card>
  );
};

export default NotFoundPage;
