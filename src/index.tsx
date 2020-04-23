import { NativeModules } from 'react-native';

type Dp3tType = {
  getDeviceName(): Promise<string>;
};

const { Dp3t } = NativeModules;

export default Dp3t as Dp3tType;
