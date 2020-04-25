import { LocationState, Path } from 'history';
import { RouteComponentProps } from 'react-router';

export * from './NavigationButtons';
export * from './NotFound';

export function goRoot<HistoryLocationState = LocationState>(
  history: RouteComponentProps['history'],
  path: Path,
  state?: HistoryLocationState
) {
  history.go(-history.length);
  history.replace('/home');
  history.push(path, state);
}
