import * as React from 'react';
import { Animated, Image, LayoutAnimation, ViewProps } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RouteComponentProps, withRouter } from 'react-router-native';
import { TouchableRipple } from '../common';

interface NavigationButtonProps extends RouteComponentProps {
  icon?: string;
  onPress: (navigation: RouteComponentProps) => any;
  style?: ViewProps['style'];
  image?: any;
}
export const NavigationButton = withRouter(
  ({ style, icon, image, onPress, ...navigation }: NavigationButtonProps) => (
    <TouchableRipple
      borderless
      useForeground
      hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }}
      onPress={() => onPress(navigation)}
    >
      <Animated.View style={style as any}>
        {icon ? (
          <Icon name={icon} color="black" size={20} />
        ) : (
          <Image source={image} />
        )}
      </Animated.View>
    </TouchableRipple>
  )
);

export const GoBackButton = ({
  style,
}: {
  style?: ViewProps['style'];
  page: string;
}) => (
  <NavigationButton
    icon="arrow-back"
    style={style}
    onPress={({ history }) => {
      LayoutAnimation.linear();
      history.goBack();
    }}
  />
);
