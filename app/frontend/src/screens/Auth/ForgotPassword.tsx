import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import {forgotPasswordRequest} from '../../store/actions';
import {useStoreDispatch} from '../../store/hooks';
import {NavLink} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {forgotFields, forgotInitial, forgotSchema, type IForgotValues} from '../../validations/auth';

import {AuthShell, FormActions} from './styles';

const ForgotPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  return (
    <AuthShell>
      <BaseForm<IForgotValues>
        title={t('auth.forgotPassword')}
        subtitle={t('auth.forgotSubtitle')}
        initialValues={forgotInitial}
        validationSchema={forgotSchema}
        onSubmit={(values) => dispatch(forgotPasswordRequest(values))}
      >
        {forgotFields.map((field) => (
          <InputText key={field.name} {...field} />
        ))}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.backToLogin')}</NavLink>
          <Button type="submit">{t('auth.sendLink')}</Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
