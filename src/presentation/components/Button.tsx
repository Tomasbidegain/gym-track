import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.surfaceElevated;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      case 'danger':
        return '#ffffff';
      default:
        return '#ffffff';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 10, paddingHorizontal: 18 };
      case 'medium':
        return { paddingVertical: 14, paddingHorizontal: 24 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'medium':
        return { fontSize: 16 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 2 : 0,
          shadowColor: variant === 'primary' || variant === 'danger' ? getBackgroundColor() : 'transparent',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, getTextSize(), { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  icon: {
    marginRight: 10,
  },
});
