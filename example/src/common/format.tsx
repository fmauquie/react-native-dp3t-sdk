import React, { FunctionComponent } from 'react';
import { Text, TextProps } from 'react-native';

const longDateWithTimeFormatter = new Intl.DateTimeFormat(['en'], {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  second: '2-digit',
});

type DateProps = TextProps & {
  date: Date;
};

export const LongDateWithTime: FunctionComponent<DateProps> = ({
  date,
  ...props
}) => <Text {...props}>{longDateWithTimeFormatter.format(date)}</Text>;
