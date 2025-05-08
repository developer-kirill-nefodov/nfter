import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import ResetOnSuccess from '../../components/Forms/ResetOnSuccess';
import {useResetCooldown} from '../../hooks/useCountdown';
import {forgotPasswordRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {clearAuthFlow} from '../../store/reducers/auth-slice';
import {NavLink, Subtitle} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {forgotFields, forgotInitial, forgotSchema, type IForgotValues} from '../../validations/auth';

import AuthLayout from './AuthLayout';
import {FormActions} from './styles';

const ForgotPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const cooldown = useResetCooldown();

  const status = useStoreSelector((state) => state.auth.forgotStatus);

  useEffect(() => () => void dispatch(clearAuthFlow()), [dispatch]);

  const waiting = cooldown > 0;
  const pending = status === 'pending';

  return (
    <AuthLayout>
      <BaseForm<IForgotValues>
        title={t('auth.forgotPassword')}
        subtitle={t('auth.forgotSubtitle')}
        initialValues={forgotInitial}
        validationSchema={forgotSchema}
        onSubmit={(values) => dispatch(forgotPasswordRequest(values))}
      >
        {forgotFields.map((field) => (
          <InputText key={field.name} {...field} disabled={waiting || pending} />
        ))}

        <ResetOnSuccess when={status === 'success'} />

        {waiting && <Subtitle role="status">{t('auth.resendIn', {seconds: cooldown})}</Subtitle>}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.backToLogin')}</NavLink>
          <Button type="submit" loading={pending} disabled={waiting}>
            {waiting ? t('auth.resendCountdown', {seconds: cooldown}) : t('auth.sendLink')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
