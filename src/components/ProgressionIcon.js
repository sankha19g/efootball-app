import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { PROGRESSION_ICONS } from '../constants/progressionIcons';

const ProgressionIcon = ({ statKey, size = 20, color = '#ffffff', showBackground = false, containerStyle }) => {
  const xml = PROGRESSION_ICONS[statKey];

  if (!xml) {
    return null;
  }

  const styledXml = xml.replace('#ffffff', color);

  const iconBaseSize = showBackground ? size * 0.6 : size;

  const content = (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, containerStyle]}>
      <SvgXml xml={styledXml} width={iconBaseSize} height={iconBaseSize} />
    </View>
  );

  if (showBackground) {
    return (
      <View style={[
        {
          width: size,
          height: size,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: size * 0.25,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          // Shadow for depth on dark themes
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 3,
        },
        containerStyle
      ]}>
        <SvgXml xml={styledXml} width={iconBaseSize} height={iconBaseSize} />
      </View>
    );
  }

  return content;
};

export default ProgressionIcon;
