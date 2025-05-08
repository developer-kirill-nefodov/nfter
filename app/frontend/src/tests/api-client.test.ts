import {AxiosError, AxiosHeaders} from 'axios';
import {describe, expect, it} from 'vitest';

import {errorMessage} from '../api/client';

const axiosError = (response?: {status: number; data: unknown}) => {
  const error = new AxiosError('failed');

  if (response) {
    error.response = {
      ...response,
      statusText: '',
      headers: new AxiosHeaders(),
      config: {headers: new AxiosHeaders()},
    };
  }

  return error;
};

describe('errorMessage', () => {
  it('reads the API message out of a JSON error body', () => {
    expect(errorMessage(axiosError({status: 401, data: {message: 'Bad credentials'}}))).toBe(
      'Bad credentials',
    );
  });

  it('accepts a plain-string error body too', () => {
    expect(errorMessage(axiosError({status: 400, data: 'Token not valid'}))).toBe(
      'Token not valid',
    );
  });

  it('explains a network failure instead of crashing on the missing response', () => {
    expect(errorMessage(axiosError())).toMatch(/cannot reach the server/i);
  });

  it('falls back for an unexpected body shape', () => {
    expect(errorMessage(axiosError({status: 500, data: {oops: true}}), 'Fallback')).toBe(
      'Fallback',
    );
  });

  it('handles something that is not an axios error at all', () => {
    expect(errorMessage(new Error('boom'), 'Fallback')).toBe('Fallback');
  });
});
