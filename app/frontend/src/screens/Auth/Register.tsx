import {useTranslation} from 'react-i18next';
import {useSearchParams} from 'react-router-dom';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import {registerRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {
  registerFields,
  registerInitial,
  registerSchema,
  type IRegisterValues,
} from '../../validations/auth';

import AuthLayout from './AuthLayout';
import {FormActions, InviteNote} from './styles';

const RegisterPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const loading = useStoreSelector((state) => state.user.loading);
  const [params] = useSearchParams();

  const invite = params.get('invite') ?? '';

  return (
    <AuthLayout
      note={
        invite ? (
          <InviteNote>
            {t('auth.invitedBy')} <strong>{invite}</strong>
          </InviteNote>
        ) : undefined
      }
    >
      <BaseForm<IRegisterValues>
        title={t('auth.register')}
        subtitle={t('auth.registerSubtitle')}
        initialValues={{...registerInitial, inviteCode: invite}}
        validationSchema={registerSchema}
        onSubmit={({email, password, inviteCode}) =>
          dispatch(registerRequest({email, password, inviteCode: inviteCode || undefined}))
        }
      >
        {registerFields.map((field) => (
          <InputText key={field.name} {...field} />
        ))}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.haveAccount')}</NavLink>
          <Button type="submit" loading={loading}>
            {t('auth.register')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthLayout>
  );
};

export default RegisterPage;
