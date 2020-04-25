import { Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

const styles = StyleSheet.create({
  scrollContainerContentContainerStyle: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingBottom: 40,
    paddingHorizontal: 25,
  },
  keyboardAvoidingViewContainerStyle: {
    flex: 1,
    alignItems: 'stretch',
  },
});

export const Container = styled.View`
  flex: 1;
  align-items: stretch;
  overflow: hidden;
`;

export const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  align-items: stretch;
  background-color: white;
`;

export const SafeContainerTransparent = styled(SafeAreaView)`
  flex: 1;
  align-items: stretch;
`;

export const ModalBackground = styled.View`
  flex: 1;
  align-items: stretch;
  justify-content: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
`;

export const ModalContainer = styled.View`
  align-items: stretch;
  padding-horizontal: 30px;
  padding-vertical: 35px;
  border-radius: 12px;
  background-color: white;
  shadow-color: rgba(175, 142, 98, 0.64);
  shadow-offset: 0px 10px;
  shadow-radius: 40px;
  shadow-opacity: 1;
  elevation: 2;
`;

export const ModalTitle = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 25px;
`;

export const ModalFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding-top: 25px;
`;

export const HorizontalContainer = styled(Container)`
  flex-direction: row;
`;

export const ScrollContainer = styled.ScrollView.attrs({
  contentContainerStyle: styles.scrollContainerContentContainerStyle,
})`
  flex: 1;
`;

export const ListItem = styled.View`
  padding-vertical: 25px;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: flex-end;
  height: ${50 + (StatusBar.currentHeight || 0)}px;
  background-color: white;
`;

export const HeaderAbsolute = styled.View`
  flex-direction: row;
  align-items: flex-end;
  height: ${50 + (StatusBar.currentHeight || 0)}px;
  background-color: transparent;
`;

const HeaderElement = styled.View`
  height: 50px;
  justify-content: center;
`;
export const HeaderLeft = styled(HeaderElement)`
  position: absolute;
  left: 0;
  bottom: 0;
  align-items: flex-start;
  padding-left: 25px;
  z-index: 5;
`;
export const HeaderMiddle = styled(HeaderElement)`
  flex: 1;
  align-items: center;
`;
export const HeaderRight = styled(HeaderElement)`
  position: absolute;
  right: 0;
  bottom: 0;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding-right: 25px;
  z-index: 5;
`;

export const Divider = styled.View`
  height: 1px;
  opacity: 0.16;
  border: solid 1px #979797;
`;
export const ShortDivider = styled(Divider)`
  margin-horizontal: 25px;
`;

export const KeyboardAvoidingContainer = styled.KeyboardAvoidingView.attrs({
  behavior: Platform.select({ ios: 'padding' as 'padding' }),
  contentContainerStyle: styles.keyboardAvoidingViewContainerStyle,
  enabled: true,
})`
  flex: 1;
`;

export const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: rgba(13, 13, 13, 0.1);
  padding-vertical: 3px;
  margin-bottom: 20px;
`;

export const InputLabel = styled.Text`
  margin-right: 6px;
`;

export const StyledInput = styled.TextInput`
  flex: 1;
  text-align: ${({ keyboardType }) =>
    keyboardType === 'numeric' ? 'right' : 'left'};
  padding: 0;
  margin: 0;
`;
