import React from 'react';
import { tokens } from './tokens';

/**
 * Box Component: Generic container with shorthand props for layout and styling.
 */
export const Box = ({ 
  children, 
  p, pt, pb, pl, pr, 
  m, mt, mb, ml, mr, 
  bg, border, borderRadius, 
  display, alignItems, justifyContent, flexDirection, gap,
  flex, width, height, maxWidth,
  style, className, ...props 
}) => {
  const getSpacing = (val) => tokens.spacing[val] || val;
  const getRadius = (val) => tokens.radius[val] || val;
  const getColor = (val) => tokens.colors[val] || val;

  const boxStyle = {
    display,
    flexDirection,
    alignItems,
    justifyContent,
    gap: getSpacing(gap),
    flex,
    width,
    height,
    maxWidth,
    padding: getSpacing(p),
    paddingTop: getSpacing(pt || p),
    paddingBottom: getSpacing(pb || p),
    paddingLeft: getSpacing(pl || p),
    paddingRight: getSpacing(pr || p),
    margin: getSpacing(m),
    marginTop: getSpacing(mt || m),
    marginBottom: getSpacing(mb || m),
    marginLeft: getSpacing(ml || m),
    marginRight: getSpacing(mr || m),
    background: getColor(bg),
    border: border ? (border === true ? `1px solid ${tokens.colors.border}` : border) : undefined,
    borderRadius: getRadius(borderRadius),
    ...style
  };

  return (
    <div style={boxStyle} className={className} {...props}>
      {children}
    </div>
  );
};

export const VStack = (props) => (
  <Box display="flex" flexDirection="column" {...props} />
);

export const HStack = (props) => (
  <Box display="flex" flexDirection="row" alignItems="center" {...props} />
);

export const Text = ({ children, size = 'md', color = 'textMain', weight = '400', align, style, ...props }) => {
  const fontSize = {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '2.5rem',
  }[size] || size;

  return (
    <span style={{ 
      fontSize, 
      color: tokens.colors[color] || color, 
      fontWeight: weight,
      textAlign: align,
      lineHeight: '1.5',
      ...style 
    }} {...props}>
      {children}
    </span>
  );
};

export const Card = ({ children, glass = false, p = 'lg', ...props }) => {
  const glassStyle = glass ? {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  } : {
    background: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    boxShadow: tokens.shadows.md,
  };

  return (
    <Box 
      borderRadius="lg" 
      p={p} 
      style={glassStyle}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * KPI Component: Standard display for dashboard metrics.
 */
export const KPI = ({ label, value, icon: Icon, color = 'primary', secondaryInfo, trend }) => {
  const bgColor = {
    primary: 'rgba(99, 102, 241, 0.15)',
    success: 'rgba(16, 185, 129, 0.15)',
    danger: 'rgba(239, 68, 68, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
  }[color] || 'rgba(0, 0, 0, 0.05)';

  const iconColor = tokens.colors[color] || tokens.colors.primary;

  return (
    <Card display="flex" alignItems="center" gap="md">
      <Box 
        p="md" 
        borderRadius="lg" 
        bg={bgColor} 
        style={{ color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {Icon && <Icon size={28} />}
      </Box>
      <VStack flex="1" gap="xs">
        <Text size="sm" color="textMuted" weight="600">{label}</Text>
        <HStack gap="sm">
          <Text size="xl" weight="800">{value}</Text>
          {trend && (
            <Text size="xs" color={trend > 0 ? 'success' : 'danger'} weight="700">
              {trend > 0 ? '+' : ''}{trend}%
            </Text>
          )}
        </HStack>
        {secondaryInfo && <Text size="xs" color="textMuted">{secondaryInfo}</Text>}
      </VStack>
    </Card>
  );
};

export const Button = ({ children, variant = 'primary', ...props }) => {
  const className = `btn-${variant}`;
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};
