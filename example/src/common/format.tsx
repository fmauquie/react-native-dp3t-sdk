import React, { FunctionComponent } from 'react';
import { Text, TextProps } from 'react-native';

const longDateFormatter = new Intl.DateTimeFormat(['en'], {
  year: 'numeric',
  month: 'long',
  weekday: 'long',
  day: '2-digit',
  timeZone: 'UTC',
});

type DateProps = TextProps & {
  date: Date;
};

export const LongDate: FunctionComponent<DateProps> = ({ date, ...props }) => (
  <Text {...props}>{longDateFormatter.format(date)}</Text>
);
