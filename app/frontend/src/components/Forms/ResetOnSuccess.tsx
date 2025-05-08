import {useFormikContext} from 'formik';
import {useEffect} from 'react';

const ResetOnSuccess = ({when}: {when: boolean}) => {
  const {resetForm} = useFormikContext();

  useEffect(() => {
    if (when) {
      resetForm();
    }
  }, [when, resetForm]);

  return null;
};

export default ResetOnSuccess;
