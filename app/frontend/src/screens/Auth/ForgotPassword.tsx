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

import {AuthShell, FormActions} from './styles';

const ForgotPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const cooldown = useResetCooldown();

  const status = useStoreSelector((state) => state.auth.forgotStatus);

  useEffect(() => () => void dispatch(clearAuthFlow()), [dispatch]);

  const waiting = cooldown > 0;
  const pending = status === 'pending';

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
          <InputText key={field.name} {...field} disabled={waiting || pending} />
        ))}

        {/* Once the link is on its way, the address has done its job. */}
        <ResetOnSuccess when={status === 'success'} />

        {/* The server refuses a second link to the same mailbox for 30 seconds,
            so the button says so rather than letting the user click into a wall. */}
        {waiting && <Subtitle role="status">{t('auth.resendIn', {seconds: cooldown})}</Subtitle>}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.backToLogin')}</NavLink>
          <Button type="submit" loading={pending} disabled={waiting}>
            {waiting ? t('auth.resendCountdown', {seconds: cooldown}) : t('auth.sendLink')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
