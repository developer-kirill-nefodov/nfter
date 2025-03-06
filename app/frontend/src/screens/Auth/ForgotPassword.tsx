import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import {useResetCooldown} from '../../hooks/useCountdown';
import {forgotPasswordRequest} from '../../store/actions';
import {useStoreDispatch} from '../../store/hooks';
import {NavLink, Subtitle} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {forgotFields, forgotInitial, forgotSchema, type IForgotValues} from '../../validations/auth';

import {AuthShell, FormActions} from './styles';

const ForgotPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const cooldown = useResetCooldown();

  const waiting = cooldown > 0;

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
          <InputText key={field.name} {...field} disabled={waiting} />
        ))}

        {/* The server refuses a second link to the same mailbox for 30 seconds,
            so the button says so rather than letting the user click into a wall. */}
        {waiting && <Subtitle role="status">{t('auth.resendIn', {seconds: cooldown})}</Subtitle>}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.backToLogin')}</NavLink>
          <Button type="submit" disabled={waiting}>
            {waiting ? t('auth.resendCountdown', {seconds: cooldown}) : t('auth.sendLink')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
