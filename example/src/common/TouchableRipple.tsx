import React, { useCallback } from 'react';
import { GestureResponderEvent, InteractionManager } from 'react-native';
import Touchable, {
  PlatformTouchableProps,
} from 'react-native-platform-touchable';

export type TouchableRippleProps = Pick<
  PlatformTouchableProps,
  Exclude<keyof PlatformTouchableProps, 'foreground' | 'background'>
> & {
  useForeground?: boolean;
  borderless?: boolean;
  onPressImmediate?: PlatformTouchableProps['onPress'];
};

function useDelayedOnPress(
  onPress: TouchableRippleProps['onPress'],
  onPressImmediate: TouchableRippleProps['onPressImmediate']
) {
  return useCallback(
    (e: GestureResponderEvent) => {
      if (onPressImmediate) {
        onPressImmediate(e);
        if (e.defaultPrevented) {
          return;
        }
      }
      if (onPress) {
        e.persist();
        setTimeout(() => {
          InteractionManager.runAfterInteractions(() => onPress(e));
        }, 1);
      }
    },
    [onPress, onPressImmediate]
  );
}

export const TouchableRipple: React.FC<TouchableRippleProps> = ({
  borderless,
  useForeground,
  onPress,
  onPressImmediate,
  ...props
}) => {
  const ripple = Touchable.Ripple('blue', borderless);
  const delayedOnPress = useDelayedOnPress(onPress, onPressImmediate);

  return (
    <Touchable
      foreground={useForeground ? ripple : undefined}
      background={useForeground ? undefined : ripple}
      onPress={delayedOnPress}
      {...props}
    />
  );
};

export const TouchableRippleBorderless: React.FC<TouchableRippleProps> = props => (
  <TouchableRipple borderless {...props} />
);

export const TouchableRippleForeground: React.FC<TouchableRippleProps> = props => (
  <TouchableRipple useForeground {...props} />
);

export const TouchableRippleBorderlessForeground: React.FC<TouchableRippleProps> = props => (
  <TouchableRipple borderless useForeground {...props} />
);

export const TouchableRippleNeutral: React.FC<TouchableRippleProps> = ({
  borderless,
  useForeground,
  onPress,
  onPressImmediate,
  ...props
}) => {
  const ripple = borderless
    ? Touchable.SelectableBackgroundBorderless()
    : Touchable.SelectableBackground();
  const delayedOnPress = useDelayedOnPress(onPress, onPressImmediate);

  return (
    <Touchable
      foreground={useForeground ? ripple : undefined}
      background={useForeground ? undefined : ripple}
      onPress={delayedOnPress}
      {...props}
    />
  );
};

export const TouchableRippleNeutralBorderless: React.FC<TouchableRippleProps> = props => (
  <TouchableRippleNeutral borderless {...props} />
);

export const TouchableRippleNeutralForeground: React.FC<TouchableRippleProps> = props => (
  <TouchableRippleNeutral useForeground {...props} />
);

export const TouchableRippleNeutralBorderlessForeground: React.FC<TouchableRippleProps> = props => (
  <TouchableRippleNeutral borderless useForeground {...props} />
);
