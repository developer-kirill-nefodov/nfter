import 'styled-components';

import type {ITheme} from './theme';

// Augmenting DefaultTheme is what makes `({theme}) => theme.colors.primary`
// type-check inside every styled component — and removes the `useTheme() as
// ITheme` cast the old code needed everywhere.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends ITheme {}
}
