/* @ds-bundle: {"format":3,"namespace":"TripyfullDesignSystem_bc2c08","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"5d6833fbfd62","components/core/Badge.jsx":"c0a7420a26ad","components/core/Button.jsx":"8db67abb3317","components/core/Card.jsx":"3a32fcc82216","components/core/IconButton.jsx":"b424e5da3b8f","components/feedback/Alert.jsx":"07ce6b49c964","components/feedback/Toast.jsx":"85d06d2a2fdf","components/forms/Checkbox.jsx":"217726e36df8","components/forms/Input.jsx":"b68dc753fe08","components/forms/Select.jsx":"331f682d052c","components/forms/Switch.jsx":"277e469baee2","components/navigation/SegmentedControl.jsx":"22749919574e","components/navigation/Tabs.jsx":"f4e1347ffd64","ui_kits/app/screens.jsx":"c6b28ff4a614","ui_kits/marketing/sections.jsx":"f55dd3e52c45","ui_kits/marketing/sections.standalone.jsx":"c24a4c519739","ui_kits/planner/budget-data.js":"1e25f48ff7e7","ui_kits/planner/budget.jsx":"4ed6ec2d7a5e","ui_kits/planner/data.js":"8df05852857d","ui_kits/planner/money.jsx":"bf46e2958b9b","ui_kits/planner/parts.jsx":"ea3cb12f4ee2","ui_kits/planner/parts.standalone.jsx":"fbbc8a3e4f2d","ui_kits/planner/screens.jsx":"319c7f4e60bb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TripyfullDesignSystem_bc2c08 = window.TripyfullDesignSystem_bc2c08 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Avatar — circular user/place image with initials fallback
 * and optional status ring.
 */
function Avatar({
  src,
  name = '',
  size = 'md',
  ring = false,
  style,
  ...rest
}) {
  const dims = {
    xs: 24,
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56
  }[size] || 36;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const fontSize = Math.round(dims * 0.36);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dims,
      height: dims,
      borderRadius: '50%',
      background: 'var(--coral-200)',
      color: 'var(--coral-700)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize,
      overflow: 'hidden',
      flex: 'none',
      boxShadow: ring ? '0 0 0 2px var(--surface-card), 0 0 0 4px var(--brand)' : 'var(--shadow-xs)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Badge — small status / count pill. Solid or soft tone
 * across the brand + semantic palette.
 */
function Badge({
  children,
  tone = 'brand',
  variant = 'soft',
  dot = false,
  style,
  ...rest
}) {
  const map = {
    brand: {
      solid: ['var(--brand)', '#fff'],
      soft: ['var(--brand-soft)', 'var(--brand-pressed)']
    },
    accent: {
      solid: ['var(--accent)', '#fff'],
      soft: ['var(--accent-soft)', 'var(--teal-600)']
    },
    gold: {
      solid: ['var(--gold-300)', 'var(--ink-900)'],
      soft: ['var(--gold-50)', 'var(--gold-500)']
    },
    neutral: {
      solid: ['var(--ink-700)', '#fff'],
      soft: ['var(--ink-200)', 'var(--ink-700)']
    },
    success: {
      solid: ['var(--success-500)', '#fff'],
      soft: ['var(--success-100)', 'var(--success-500)']
    },
    warning: {
      solid: ['var(--warning-500)', '#fff'],
      soft: ['var(--warning-100)', 'var(--warning-500)']
    },
    danger: {
      solid: ['var(--danger-500)', '#fff'],
      soft: ['var(--danger-100)', 'var(--danger-500)']
    }
  };
  const [bg, fg] = (map[tone] || map.brand)[variant] || (map[tone] || map.brand).soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: bg,
      color: fg,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 0,
      lineHeight: 1,
      padding: '5px 12px',
      borderRadius: 'var(--radius-pill)',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: fg,
      display: 'inline-block'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Button — the primary action primitive.
 * Pill-shaped, warm, confident. Coral primary CTA, teal accent,
 * plus ghost and soft variants.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '7px 16px',
      fontSize: 'var(--text-xs)',
      gap: '6px',
      height: 34
    },
    md: {
      padding: '10px 22px',
      fontSize: 'var(--text-sm)',
      gap: '8px',
      height: 40
    },
    lg: {
      padding: '14px 28px',
      fontSize: 'var(--text-base)',
      gap: '10px',
      height: 48
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: 'var(--brand-on)',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-brand)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--accent-on)',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)'
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--text-strong)',
      border: '1.5px solid var(--border-default)',
      boxShadow: 'var(--shadow-xs)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-body)',
      border: '1px solid transparent',
      boxShadow: 'none'
    },
    soft: {
      background: 'var(--brand-soft)',
      color: 'var(--brand-pressed)',
      border: '1px solid transparent',
      boxShadow: 'none'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      padding: s.padding,
      minHeight: s.height,
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-sans)',
      fontSize: s.fontSize,
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: 'var(--ls-tight)',
      lineHeight: 1,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.filter = 'none';
      if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
      if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-card)';
    },
    onMouseEnter: e => {
      if (disabled) return;
      e.currentTarget.style.filter = 'brightness(1.05)';
      if (variant === 'ghost' || variant === 'secondary') e.currentTarget.style.background = 'var(--surface-sunken)';
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Card — the surface primitive. Rounded, warm shadow,
 * optional hover lift. Compose freely; pass `as` to change the tag.
 */
function Card({
  children,
  padding = 'md',
  interactive = false,
  elevation = 'sm',
  as: Tag = 'div',
  style,
  ...rest
}) {
  const pads = {
    none: 0,
    sm: 'var(--space-4)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
  };
  const shadows = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: shadows[elevation] ?? shadows.sm,
      padding: pads[padding] ?? pads.md,
      transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = shadows[elevation] ?? shadows.sm;
    } : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull IconButton — circular icon-only control for toolbars,
 * cards, and nav. Pass a single icon node as `icon`.
 */
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  const variants = {
    solid: {
      background: 'var(--brand)',
      color: 'var(--brand-on)',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-brand)'
    },
    soft: {
      background: 'var(--brand-soft)',
      color: 'var(--brand-pressed)',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-body)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-body)',
      border: '1.5px solid var(--border-default)',
      boxShadow: 'none'
    }
  };
  const v = variants[variant] || variants.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dims,
      height: dims,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.92)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.filter = 'none';
      if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
      if (variant === 'soft') e.currentTarget.style.background = 'var(--brand-soft)';
      if (variant === 'outline') {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.color = 'var(--text-body)';
      }
    },
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === 'solid') e.currentTarget.style.filter = 'brightness(1.08)';
      if (variant === 'ghost') e.currentTarget.style.background = 'var(--surface-sunken)';
      if (variant === 'soft') e.currentTarget.style.background = 'var(--coral-100)';
      if (variant === 'outline') {
        e.currentTarget.style.background = 'var(--brand-soft)';
        e.currentTarget.style.borderColor = 'var(--brand)';
        e.currentTarget.style.color = 'var(--brand)';
      }
    }
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    bg: 'var(--info-100)',
    fg: 'var(--info-500)',
    bar: 'var(--info-500)'
  },
  success: {
    bg: 'var(--success-100)',
    fg: 'var(--success-500)',
    bar: 'var(--success-500)'
  },
  warning: {
    bg: 'var(--warning-100)',
    fg: 'var(--warning-500)',
    bar: 'var(--warning-500)'
  },
  danger: {
    bg: 'var(--danger-100)',
    fg: 'var(--danger-500)',
    bar: 'var(--danger-500)'
  }
};

/**
 * Tripyfull Alert — inline status banner with leading accent bar,
 * title, and optional body + action.
 */
function Alert({
  tone = 'info',
  title,
  children,
  icon,
  action,
  onClose,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      background: t.bg,
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${t.bar}`,
      padding: '14px 18px',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.fg,
      display: 'inline-flex',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, title), children && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-body)'
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: t.fg,
      fontSize: 18,
      lineHeight: 1,
      padding: 2
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Toast — floating notification card. Presentational; pair
 * with your own queue/positioning. Includes optional icon and action.
 */
function Toast({
  tone = 'neutral',
  title,
  message,
  icon,
  action,
  onClose,
  style,
  ...rest
}) {
  const accents = {
    neutral: 'var(--ink-700)',
    brand: 'var(--brand)',
    success: 'var(--success-500)',
    warning: 'var(--warning-500)',
    danger: 'var(--danger-500)'
  };
  const accent = accents[tone] || accents.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 280,
      maxWidth: 380,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: '14px 16px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-pill)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: tone === 'neutral' ? 'var(--surface-sunken)' : accent,
      color: tone === 'neutral' ? 'var(--text-strong)' : '#fff'
    }
  }, icon || '✶'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, title), message && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, message), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, action)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-subtle)',
      fontSize: 18,
      lineHeight: 1,
      padding: 2
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Checkbox — square check with brand fill. Controlled or
 * uncontrolled; optional label and helper.
 */
function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  helper,
  disabled = false,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternal(next);
    onChange && onChange(next);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "checkbox",
    "aria-checked": on,
    disabled: disabled,
    onClick: toggle,
    style: {
      flex: 'none',
      width: 22,
      height: 22,
      marginTop: 1,
      borderRadius: 'var(--radius-xs)',
      border: `1.5px solid ${on ? 'var(--brand)' : 'var(--field-border)'}`,
      background: on ? 'var(--brand)' : 'var(--field-bg)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      padding: 0
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), (label || helper) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-body)',
      lineHeight: 1.4
    }
  }, label), helper && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, helper)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Input — labeled text field with optional leading icon,
 * helper text, and error state.
 */
function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  iconLeft,
  helper,
  error,
  disabled = false,
  style,
  ...rest
}) {
  const fieldId = id || (label ? `tf-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const showError = Boolean(error);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      font: 'var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: disabled ? 'var(--surface-sunken)' : 'var(--field-bg)',
      border: `1.5px solid ${showError ? 'var(--danger-500)' : 'var(--field-border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '0 14px',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)'
    },
    onFocusCapture: e => {
      if (!showError) {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.boxShadow = 'var(--ring-brand)';
      }
    },
    onBlurCapture: e => {
      e.currentTarget.style.boxShadow = 'none';
      if (!showError) e.currentTarget.style.borderColor = 'var(--field-border)';
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      display: 'inline-flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-body)',
      color: 'var(--text-strong)',
      padding: '10px 0',
      minWidth: 0
    }
  }, rest))), (helper || showError) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: showError ? 'var(--danger-500)' : 'var(--text-muted)'
    }
  }, showError ? error : helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Select — labeled dropdown styled to match Input.
 * Pass options as [{value, label}] or strings.
 */
function Select({
  label,
  id,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder,
  helper,
  error,
  disabled = false,
  style,
  ...rest
}) {
  const fieldId = id || (label ? `tf-sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const showError = Boolean(error);
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      font: 'var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    value: value,
    defaultValue: defaultValue ?? (placeholder ? '' : undefined),
    onChange: onChange,
    disabled: disabled,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      background: disabled ? 'var(--surface-sunken)' : 'var(--field-bg)',
      border: `1.5px solid ${showError ? 'var(--danger-500)' : 'var(--field-border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 40px 10px 14px',
      font: 'var(--type-body)',
      color: 'var(--text-strong)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none'
    },
    onFocus: e => {
      if (!showError) {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.boxShadow = 'var(--ring-brand)';
      }
    },
    onBlur: e => {
      e.currentTarget.style.boxShadow = 'none';
      if (!showError) e.currentTarget.style.borderColor = 'var(--field-border)';
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), opts.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      right: 14,
      pointerEvents: 'none'
    },
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-subtle)",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  }))), (helper || showError) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: showError ? 'var(--danger-500)' : 'var(--text-muted)'
    }
  }, showError ? error : helper));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Switch — pill toggle for on/off settings.
 */
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const dims = size === 'sm' ? {
    w: 34,
    h: 20,
    knob: 14
  } : {
    w: 40,
    h: 22,
    knob: 16
  };
  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternal(next);
    onChange && onChange(next);
  };
  const control = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    disabled: disabled,
    onClick: toggle,
    style: {
      position: 'relative',
      width: dims.w,
      height: dims.h,
      flex: 'none',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: on ? 'var(--brand)' : 'var(--ink-300)',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur-base) var(--ease-out)',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: (dims.h - dims.knob) / 2,
      left: on ? dims.w - dims.knob - (dims.h - dims.knob) / 2 : (dims.h - dims.knob) / 2,
      width: dims.knob,
      height: dims.knob,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur-base) var(--ease-soft)'
    }
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, rest), control, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull SegmentedControl — pill-grouped toggle for 2–4 mutually
 * exclusive options. Great for view switches (List / Map / Calendar).
 */
function SegmentedControl({
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  style,
  ...rest
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const [internal, setInternal] = React.useState(defaultValue ?? (opts[0] && opts[0].value));
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  const pad = size === 'sm' ? '6px 14px' : '8px 18px';
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      gap: 2,
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-pill)',
      padding: 4,
      ...style
    }
  }, rest), opts.map(o => {
    const on = o.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      onClick: () => select(o.value),
      style: {
        border: 'none',
        cursor: 'pointer',
        padding: pad,
        borderRadius: 'var(--radius-pill)',
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} ${fontSize}/1 var(--font-sans)`,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        background: on ? 'var(--white)' : 'transparent',
        boxShadow: on ? 'var(--shadow-sm)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tripyfull Tabs — underline tab bar. Controlled or uncontrolled.
 * Pass items as [{ id, label, badge? }].
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '2px solid var(--border-subtle)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(it.id),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '12px 18px',
        marginBottom: -2,
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--text-sm)/1 var(--font-sans)`,
        color: on ? 'var(--brand)' : 'var(--text-muted)',
        borderBottom: `2px solid ${on ? 'var(--brand)' : 'transparent'}`,
        transition: 'color var(--dur-fast) var(--ease-out)'
      }
    }, it.label, it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        background: 'var(--brand-soft)',
        color: 'var(--brand-pressed)',
        font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-mono)',
        padding: '2px 7px',
        borderRadius: 'var(--radius-pill)'
      }
    }, it.badge));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tripyfull mobile app — UI kit screens.
   Composes design-system primitives from window.TripyfullDesignSystem_bc2c08.
   Loaded by index.html after the DS bundle + React + Babel. */

const TF = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Avatar,
  SegmentedControl,
  Tabs,
  Input
} = TF;

/* ---- Inline Lucide-style icons (2px stroke, round caps) ---- */
const Ico = ({
  d,
  size = 22,
  fill = 'none',
  sw = 2,
  children
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, children || /*#__PURE__*/React.createElement("path", {
  d: d
}));
const IconMap = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 20l-5.5 2.5v-15L9 5m0 15l6-3m-6 3v-15m6 12l5.5 2.5v-15L15 2m0 15V2m0 0L9 5"
}));
const IconCompass = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("polygon", {
  points: "16.2 7.8 14 14 7.8 16.2 10 10"
}));
const IconPlane = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.9-2.6 2.6H3.5a.5.5 0 0 0-.3.9L6 19l1.6 2.8a.5.5 0 0 0 .9-.3v-2.1l2.6-2.6 4.9 3.9a.5.5 0 0 0 .8-.5Z"
}));
const IconHeart = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"
}));
const IconUser = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "8",
  r: "4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 21a8 8 0 0 1 16 0"
}));
const IconPin = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "10",
  r: "3"
}));
const IconClock = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));
const IconStar = p => /*#__PURE__*/React.createElement(Ico, _extends({
  fill: "currentColor",
  sw: 0
}, p), /*#__PURE__*/React.createElement("path", {
  d: "M12 2l2.9 6.2 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.9l1.2-6.6L2.5 9.1l6.6-.9z"
}));
const IconPlus = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const IconChevron = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 6l6 6-6 6"
}));
const IconSearch = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const IconBed = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 18v2M22 18v2M2 13V7M6 11V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
}));
const IconFood = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 3v7a2 2 0 0 0 4 0V3M6 11v10M18 3c-1.7 0-3 2-3 5s1.3 4 3 4m0 0v9"
}));
const IconShare = p => /*#__PURE__*/React.createElement(Ico, p, /*#__PURE__*/React.createElement("circle", {
  cx: "18",
  cy: "5",
  r: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "6",
  cy: "12",
  r: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "18",
  cy: "19",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"
}));
const Photo = ({
  wash = 'var(--wash-warm)',
  h = 150,
  label,
  radius = 'var(--radius-lg)',
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: h,
    borderRadius: radius,
    background: wash,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.85)',
    ...style
  }
}, label && /*#__PURE__*/React.createElement(IconPin, {
  size: 30
}), children);

/* =========================================================
   STATUS BAR + PHONE CHROME
   ========================================================= */
function StatusBar({
  dark
}) {
  const c = dark ? '#fff' : 'var(--ink-900)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 24px 4px',
      color: c
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 15px/1 var(--font-sans)'
    }
  }, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    size: 16,
    sw: 2.4
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 20h.01M7 20v-4M12 20v-8M17 20V8"
  })), /*#__PURE__*/React.createElement(Ico, {
    size: 16,
    sw: 2.4
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01"
  })), /*#__PURE__*/React.createElement(Ico, {
    size: 20,
    sw: 2
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "18",
    height: "10",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 11v2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "9",
    width: "12",
    height: "6",
    rx: "1",
    fill: "currentColor",
    stroke: "none"
  }))));
}

/* =========================================================
   SCREEN 1 — ITINERARY (home)
   ========================================================= */
function ItineraryScreen({
  onOpen
}) {
  const [day, setDay] = React.useState('Day 3');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Japan \xB7 8 days"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 30px/1.05 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, "Your Tokyo & Kyoto trip")), /*#__PURE__*/React.createElement(Avatar, {
    name: "Mara Ortiz",
    size: "md",
    ring: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "92% planned"), /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "2 stops left")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '18px -20px 0',
      padding: '0 20px',
      display: 'flex',
      gap: 8,
      overflowX: 'auto'
    }
  }, ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'].map(d => {
    const on = d === day;
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setDay(d),
      style: {
        flex: 'none',
        border: 'none',
        cursor: 'pointer',
        background: on ? 'var(--brand)' : 'var(--surface-card)',
        color: on ? '#fff' : 'var(--text-muted)',
        boxShadow: on ? 'var(--shadow-brand)' : 'var(--shadow-xs)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        textAlign: 'left',
        minWidth: 64
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '600 13px/1 var(--font-sans)'
      }
    }, d), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 11px/1.4 var(--font-mono)',
        opacity: 0.8,
        marginTop: 4
      }
    }, "JUN ", 16 + parseInt(d.split(' ')[1])));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(TimelineItem, {
    time: "08:30",
    icon: /*#__PURE__*/React.createElement(IconFood, {
      size: 18
    }),
    tone: "gold",
    title: "Breakfast at Sarutahiko",
    place: "Ebisu \xB7 coffee & tamago"
  }), /*#__PURE__*/React.createElement(TimelineItem, {
    time: "10:00",
    icon: /*#__PURE__*/React.createElement(IconPin, {
      size: 18
    }),
    tone: "brand",
    highlight: true,
    title: "Arashiyama bamboo grove",
    place: "Sunrise walk before the crowds",
    onClick: onOpen
  }), /*#__PURE__*/React.createElement(TimelineItem, {
    time: "13:00",
    icon: /*#__PURE__*/React.createElement(IconFood, {
      size: 18
    }),
    tone: "accent",
    title: "Lunch \u2014 Ramen Sen",
    place: "Reservation \xB7 2 guests"
  }), /*#__PURE__*/React.createElement(TimelineItem, {
    time: "20:00",
    icon: /*#__PURE__*/React.createElement(IconBed, {
      size: 18
    }),
    tone: "accent",
    title: "Ryokan Yoshikawa",
    place: "Check-in \xB7 room 4"
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      border: '1.5px dashed var(--border-default)',
      background: 'transparent',
      color: 'var(--text-muted)',
      borderRadius: 'var(--radius-md)',
      padding: '14px',
      cursor: 'pointer',
      font: '600 15px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 18
  }), " Add a stop to Day 3")));
}
function TimelineItem({
  time,
  icon,
  title,
  place,
  tone = 'brand',
  highlight,
  onClick
}) {
  const toneColor = {
    brand: 'var(--brand)',
    accent: 'var(--accent)',
    gold: 'var(--gold-400)'
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    },
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, time), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 2,
      flex: 1,
      background: 'var(--border-subtle)',
      marginTop: 8,
      borderRadius: 2
    }
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    interactive: !!onClick,
    elevation: highlight ? 'md' : 'sm',
    style: {
      flex: 1,
      border: highlight ? '1.5px solid var(--coral-200)' : '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 38,
      height: 38,
      borderRadius: 'var(--radius-md)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'color-mix(in srgb, ' + toneColor + ' 14%, transparent)',
      color: toneColor
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 16px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    },
    dangerouslySetInnerHTML: {
      __html: title
    }
  }), highlight && /*#__PURE__*/React.createElement(Badge, {
    tone: "gold",
    variant: "soft"
  }, "\u2605 Must-do")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 2
    },
    dangerouslySetInnerHTML: {
      __html: place
    }
  })), onClick && /*#__PURE__*/React.createElement(IconChevron, {
    size: 18
  }))));
}

/* =========================================================
   SCREEN 2 — EXPLORE
   ========================================================= */
function ExploreScreen() {
  const [filter, setFilter] = React.useState('All');
  const places = [{
    name: 'Kyoto',
    tag: 'Temples & tea',
    wash: 'var(--wash-dusk)',
    rating: '4.9',
    cat: 'Culture'
  }, {
    name: 'Hakone',
    tag: 'Hot springs',
    wash: 'var(--wash-ocean)',
    rating: '4.8',
    cat: 'Nature'
  }, {
    name: 'Osaka',
    tag: 'Street food capital',
    wash: 'linear-gradient(150deg,#f4ad3c,#e35a38)',
    rating: '4.7',
    cat: 'Food'
  }, {
    name: 'Nara',
    tag: 'Deer park & shrines',
    wash: 'linear-gradient(150deg,#4f9d92,#0e5c55)',
    rating: '4.6',
    cat: 'Nature'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 28px/1.05 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: '0 0 14px'
    }
  }, "Explore Japan"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search cities, food, stays\u2026",
    iconLeft: /*#__PURE__*/React.createElement(IconSearch, {
      size: 18
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      gap: 8,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    value: filter,
    onChange: setFilter,
    options: ['All', 'Culture', 'Food', 'Nature']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 0',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, places.filter(p => filter === 'All' || p.cat === filter).map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    padding: "none",
    interactive: true,
    elevation: "sm",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: p.wash,
    h: 108,
    radius: "0"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(IconHeart, {
      size: 16
    }),
    label: "Save",
    variant: "solid",
    size: "sm",
    style: {
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(6px)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 17px/1.1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      color: 'var(--gold-400)',
      font: '600 13px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(IconStar, {
    size: 13
  }), p.rating)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, p.tag))))));
}

/* =========================================================
   SCREEN 3 — STOP DETAIL / BOOKING
   ========================================================= */
function DetailScreen({
  onBack,
  onBook,
  booked
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 110
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: "var(--wash-dusk)",
    h: 260,
    radius: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(33,27,23,0.55), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    dark: true
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 44,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      size: 18
    }, /*#__PURE__*/React.createElement("path", {
      d: "M15 6l-6 6 6 6"
    })),
    label: "Back",
    variant: "solid",
    onClick: onBack,
    style: {
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(6px)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 44,
      right: 16,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(IconShare, {
      size: 18
    }),
    label: "Share",
    variant: "solid",
    style: {
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(6px)'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(IconHeart, {
      size: 18
    }),
    label: "Save",
    variant: "solid",
    style: {
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(6px)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 20,
      bottom: 18,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      color: 'var(--gold-200)'
    }
  }, "Day 3 \xB7 10:00"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 30px/1.05 var(--font-display)',
      letterSpacing: '-0.03em',
      marginTop: 4
    }
  }, "Arashiyama bamboo grove"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
      font: '500 14px/1 var(--font-sans)',
      opacity: 0.92
    }
  }, /*#__PURE__*/React.createElement(IconPin, {
    size: 15
  }), " Kyoto, Japan"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    icon: /*#__PURE__*/React.createElement(IconClock, {
      size: 18
    }),
    label: "Duration",
    value: "1.5 hrs"
  }), /*#__PURE__*/React.createElement(Stat, {
    icon: /*#__PURE__*/React.createElement(IconStar, {
      size: 16
    }),
    label: "Rating",
    value: "4.9 \xB7 2.1k"
  }), /*#__PURE__*/React.createElement(Stat, {
    icon: /*#__PURE__*/React.createElement(IconUser, {
      size: 18
    }),
    label: "Best at",
    value: "Sunrise"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-body)',
      marginTop: 18
    }
  }, "Walk the towering bamboo paths before the crowds arrive, then follow the river to a quiet tea house. We've slotted this right after breakfast so you'll have the grove almost to yourself."), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    elevation: "sm",
    style: {
      marginTop: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 38,
      height: 38,
      borderRadius: 'var(--radius-md)',
      background: 'var(--teal-50)',
      color: 'var(--accent)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(IconBed, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 15px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, "Add a guided sunrise tour"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.3 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "\u20AC38 \xB7 90 min \xB7 free cancellation")), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 16px/1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, "\u20AC38"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '14px 20px 22px',
      background: 'linear-gradient(to top, var(--surface-page) 70%, transparent)',
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, booked ? /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    fullWidth: true,
    iconLeft: /*#__PURE__*/React.createElement(Ico, {
      size: 18,
      sw: 2.6
    }, /*#__PURE__*/React.createElement("polyline", {
      points: "20 6 9 17 4 12"
    }))
  }, "Added to Day 3") : /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onBook
  }, "Add to my trip \u2014 \u20AC38")));
}
function Stat({
  icon,
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 16px/1.1 var(--font-display)',
      color: 'var(--text-strong)',
      marginTop: 6
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, label));
}

/* =========================================================
   BOTTOM TAB BAR
   ========================================================= */
function TabBar({
  tab,
  setTab
}) {
  const items = [{
    id: 'trip',
    label: 'Trip',
    icon: IconMap
  }, {
    id: 'explore',
    label: 'Explore',
    icon: IconCompass
  }, {
    id: 'saved',
    label: 'Saved',
    icon: IconHeart
  }, {
    id: 'profile',
    label: 'You',
    icon: IconUser
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 12px 22px',
      background: 'rgba(251,245,236,0.85)',
      backdropFilter: 'blur(14px)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, items.map(it => {
    const on = it.id === tab;
    const I = it.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setTab(it.id),
      style: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        color: on ? 'var(--brand)' : 'var(--text-subtle)'
      }
    }, /*#__PURE__*/React.createElement(I, {
      size: 23,
      sw: on ? 2.4 : 2
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: (on ? '600' : '500') + ' 11px/1 var(--font-sans)'
      }
    }, it.label));
  }));
}
window.TripyfullApp = {
  ItineraryScreen,
  ExploreScreen,
  DetailScreen,
  TabBar,
  StatusBar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/sections.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tripyfull marketing site — UI kit sections.
   Composes design-system primitives from window.TripyfullDesignSystem_bc2c08. */

const TFM = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Avatar,
  Input
} = TFM;
const M = ({
  d,
  size = 20,
  fill = 'none',
  sw = 2,
  children
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, children || /*#__PURE__*/React.createElement("path", {
  d: d
}));
const MStar = p => /*#__PURE__*/React.createElement(M, _extends({
  fill: "currentColor",
  sw: 0
}, p), /*#__PURE__*/React.createElement("path", {
  d: "M12 2l2.9 6.2 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.9l1.2-6.6L2.5 9.1l6.6-.9z"
}));
const MPin = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "10",
  r: "3"
}));
const MLayers = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"
}));
const MSync = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 12a9 9 0 0 1-9 9c-2.5 0-4.8-1-6.4-2.7M3 12a9 9 0 0 1 9-9c2.5 0 4.8 1 6.4 2.7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 3v5h-5M3 21v-5h5"
}));
const MUsers = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "8",
  r: "3.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 7M22 20a6.5 6.5 0 0 0-4-6"
}));
const MArrow = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M13 6l6 6-6 6"
}));
const Photo = ({
  wash = 'var(--wash-warm)',
  h = 150,
  radius = 'var(--radius-lg)',
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: h,
    borderRadius: radius,
    background: wash,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.8)',
    ...style
  }
}, children || /*#__PURE__*/React.createElement(MPin, {
  size: 30
}));
const WRAP = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 32px'
};

/* ---- NAV ---- */
function NavBar() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(251,245,236,0.82)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-wordmark.svg",
    alt: "Tripyfull",
    style: {
      height: 34
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 30,
      alignItems: 'center'
    }
  }, ['Plan', 'Explore', 'Pricing', 'Stories'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: '500 15px/1 var(--font-sans)',
      color: 'var(--text-body)',
      textDecoration: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Log in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Start planning"))));
}

/* ---- HERO ---- */
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--wash-warm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      paddingTop: 72,
      paddingBottom: 72,
      display: 'grid',
      gridTemplateColumns: '1.05fr 0.95fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "The ultimate full-trip experience"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 68px/0.98 var(--font-display)',
      letterSpacing: '-0.035em',
      color: 'var(--text-strong)',
      margin: '16px 0 0'
    }
  }, "Pack it ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, "full"), ".", /*#__PURE__*/React.createElement("br", null), "Keep it in order."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '400 19px/1.6 var(--font-sans)',
      color: 'var(--text-body)',
      maxWidth: 460,
      margin: '22px 0 0'
    }
  }, "Every flight, stay, and reservation in one beautiful itinerary \u2014 Tripyfull keeps your whole trip full, organized, and seamless."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 30,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 18
    })
  }, "Plan my trip \u2014 free"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Watch tour")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, ['Mara', 'Ken', 'Ada', 'Luca'].map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      marginLeft: i ? -10 : 0
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: "sm"
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      color: 'var(--gold-400)'
    }
  }, /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "Loved by 60,000+ travellers"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: "var(--wash-dusk)",
    h: 420,
    radius: "var(--radius-2xl)",
    style: {
      boxShadow: 'var(--shadow-xl)'
    }
  }), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    elevation: "lg",
    style: {
      position: 'absolute',
      left: -28,
      top: 48,
      width: 218
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Day 3 \xB7 Kyoto"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 16px/1.2 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, "Arashiyama grove"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Booked"), /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "\u2605 Must-do"))), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    elevation: "lg",
    style: {
      position: 'absolute',
      right: -22,
      bottom: 40,
      width: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 36,
      height: 36,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--teal-50)',
      color: 'var(--accent)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(MSync, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.1 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, "All synced"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1.2 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "3 bookings added"))))));
}

/* ---- FEATURES ---- */
function Features() {
  const feats = [{
    icon: MLayers,
    tone: 'var(--brand)',
    soft: 'var(--brand-soft)',
    title: 'Everything in one place',
    body: 'Flights, hotels, trains, and reservations — forwarded or added in seconds, sorted onto the right day automatically.'
  }, {
    icon: MSync,
    tone: 'var(--accent)',
    soft: 'var(--teal-50)',
    title: 'Always in sync',
    body: 'Live updates, offline maps, and gentle nudges when a layover is tight or a check-in opens.'
  }, {
    icon: MUsers,
    tone: 'var(--gold-500)',
    soft: 'var(--gold-50)',
    title: 'Plan together',
    body: 'Share a trip and plan with friends in real time. Everyone sees the same full, tidy itinerary.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 88,
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "Why Tripyfull"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 42px/1.04 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: '14px 0 0'
    }
  }, "A full trip, beautifully in order")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22,
      marginTop: 40
    }
  }, feats.map(f => {
    const I = f.icon;
    return /*#__PURE__*/React.createElement(Card, {
      key: f.title,
      padding: "lg",
      elevation: "sm"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 50,
        height: 50,
        borderRadius: 'var(--radius-md)',
        background: f.soft,
        color: f.tone,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(I, {
      size: 24
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        font: '700 21px/1.15 var(--font-display)',
        color: 'var(--text-strong)',
        margin: '18px 0 8px'
      }
    }, f.title), /*#__PURE__*/React.createElement("p", {
      style: {
        font: 'var(--type-body)',
        color: 'var(--text-muted)',
        margin: 0
      }
    }, f.body));
  })));
}

/* ---- DESTINATIONS ---- */
function Destinations() {
  const places = [{
    name: 'Kyoto',
    tag: '5-day culture loop',
    wash: 'var(--wash-dusk)',
    n: '1.2k itineraries'
  }, {
    name: 'Lisbon',
    tag: 'Coast & custard',
    wash: 'linear-gradient(150deg,#f4ad3c,#e35a38)',
    n: '980 itineraries'
  }, {
    name: 'Patagonia',
    tag: 'Trek & glaciers',
    wash: 'var(--wash-ocean)',
    n: '640 itineraries'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 56,
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "Start from a template"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 36px/1.05 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: '12px 0 0'
    }
  }, "Trips travellers love")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 16
    })
  }, "Browse all")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22
    }
  }, places.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    padding: "none",
    interactive: true,
    elevation: "sm",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: p.wash,
    h: 210,
    radius: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(33,27,23,0.5), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      bottom: 16,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 26px/1 var(--font-display)'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14px/1.2 var(--font-sans)',
      opacity: 0.9,
      marginTop: 4
    }
  }, p.tag))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, p.n), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    variant: "soft"
  }, "Use template"))))));
}

/* ---- CTA + FOOTER ---- */
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 56,
      paddingBottom: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--wash-ocean)',
      borderRadius: 'var(--radius-2xl)',
      padding: '56px 48px',
      textAlign: 'center',
      color: '#fff',
      boxShadow: 'var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 44px/1.02 var(--font-display)',
      letterSpacing: '-0.03em',
      color: '#fff',
      margin: 0
    }
  }, "Your next trip, already sorted"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '400 18px/1.5 var(--font-sans)',
      color: 'rgba(255,255,255,0.85)',
      maxWidth: 480,
      margin: '16px auto 0'
    }
  }, "Start free. Add your first booking and watch the whole trip fall into place."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 18
    })
  }, "Start planning \u2014 free"))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      paddingTop: 36,
      paddingBottom: 40,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-wordmark.svg",
    alt: "Tripyfull",
    style: {
      height: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26
    }
  }, ['Product', 'Destinations', 'Pricing', 'About', 'Help'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px/1 var(--font-mono)',
      color: 'var(--text-subtle)'
    }
  }, "\xA9 2026 Tripyfull")));
}
window.TripyfullMarketing = {
  NavBar,
  Hero,
  Features,
  Destinations,
  CTA,
  Footer
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/sections.standalone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tripyfull marketing site — UI kit sections.
   Composes design-system primitives from window.TripyfullDesignSystem_bc2c08. */

const TFM = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Avatar,
  Input
} = TFM;
const M = ({
  d,
  size = 20,
  fill = 'none',
  sw = 2,
  children
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, children || /*#__PURE__*/React.createElement("path", {
  d: d
}));
const MStar = p => /*#__PURE__*/React.createElement(M, _extends({
  fill: "currentColor",
  sw: 0
}, p), /*#__PURE__*/React.createElement("path", {
  d: "M12 2l2.9 6.2 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.9l1.2-6.6L2.5 9.1l6.6-.9z"
}));
const MPin = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "10",
  r: "3"
}));
const MLayers = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"
}));
const MSync = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 12a9 9 0 0 1-9 9c-2.5 0-4.8-1-6.4-2.7M3 12a9 9 0 0 1 9-9c2.5 0 4.8 1 6.4 2.7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 3v5h-5M3 21v-5h5"
}));
const MUsers = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "8",
  r: "3.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 7M22 20a6.5 6.5 0 0 0-4-6"
}));
const MArrow = p => /*#__PURE__*/React.createElement(M, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M13 6l6 6-6 6"
}));
const Photo = ({
  wash = 'var(--wash-warm)',
  h = 150,
  radius = 'var(--radius-lg)',
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: h,
    borderRadius: radius,
    background: wash,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.8)',
    ...style
  }
}, children || /*#__PURE__*/React.createElement(MPin, {
  size: 30
}));
const WRAP = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 32px'
};

/* ---- NAV ---- */
function NavBar() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(251,245,236,0.82)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources.wordmark,
    alt: "Tripyfull",
    style: {
      height: 34
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 30,
      alignItems: 'center'
    }
  }, ['Plan', 'Explore', 'Pricing', 'Stories'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: '500 15px/1 var(--font-sans)',
      color: 'var(--text-body)',
      textDecoration: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Log in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Start planning"))));
}

/* ---- HERO ---- */
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--wash-warm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      paddingTop: 72,
      paddingBottom: 72,
      display: 'grid',
      gridTemplateColumns: '1.05fr 0.95fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "The ultimate full-trip experience"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 68px/0.98 var(--font-display)',
      letterSpacing: '-0.035em',
      color: 'var(--text-strong)',
      margin: '16px 0 0'
    }
  }, "Pack it ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, "full"), ".", /*#__PURE__*/React.createElement("br", null), "Keep it in order."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '400 19px/1.6 var(--font-sans)',
      color: 'var(--text-body)',
      maxWidth: 460,
      margin: '22px 0 0'
    }
  }, "Every flight, stay, and reservation in one beautiful itinerary \u2014 Tripyfull keeps your whole trip full, organized, and seamless."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 30,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 18
    })
  }, "Plan my trip \u2014 free"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Watch tour")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, ['Mara', 'Ken', 'Ada', 'Luca'].map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      marginLeft: i ? -10 : 0
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: "sm"
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      color: 'var(--gold-400)'
    }
  }, /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  }), /*#__PURE__*/React.createElement(MStar, {
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "Loved by 60,000+ travellers"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: "var(--wash-dusk)",
    h: 420,
    radius: "var(--radius-2xl)",
    style: {
      boxShadow: 'var(--shadow-xl)'
    }
  }), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    elevation: "lg",
    style: {
      position: 'absolute',
      left: -28,
      top: 48,
      width: 218
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Day 3 \xB7 Kyoto"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 16px/1.2 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, "Arashiyama grove"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Booked"), /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "\u2605 Must-do"))), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    elevation: "lg",
    style: {
      position: 'absolute',
      right: -22,
      bottom: 40,
      width: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 36,
      height: 36,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--teal-50)',
      color: 'var(--accent)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(MSync, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.1 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, "All synced"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1.2 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "3 bookings added"))))));
}

/* ---- FEATURES ---- */
function Features() {
  const feats = [{
    icon: MLayers,
    tone: 'var(--brand)',
    soft: 'var(--brand-soft)',
    title: 'Everything in one place',
    body: 'Flights, hotels, trains, and reservations — forwarded or added in seconds, sorted onto the right day automatically.'
  }, {
    icon: MSync,
    tone: 'var(--accent)',
    soft: 'var(--teal-50)',
    title: 'Always in sync',
    body: 'Live updates, offline maps, and gentle nudges when a layover is tight or a check-in opens.'
  }, {
    icon: MUsers,
    tone: 'var(--gold-500)',
    soft: 'var(--gold-50)',
    title: 'Plan together',
    body: 'Share a trip and plan with friends in real time. Everyone sees the same full, tidy itinerary.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 88,
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "Why Tripyfull"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 42px/1.04 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: '14px 0 0'
    }
  }, "A full trip, beautifully in order")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22,
      marginTop: 40
    }
  }, feats.map(f => {
    const I = f.icon;
    return /*#__PURE__*/React.createElement(Card, {
      key: f.title,
      padding: "lg",
      elevation: "sm"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 50,
        height: 50,
        borderRadius: 'var(--radius-md)',
        background: f.soft,
        color: f.tone,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(I, {
      size: 24
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        font: '700 21px/1.15 var(--font-display)',
        color: 'var(--text-strong)',
        margin: '18px 0 8px'
      }
    }, f.title), /*#__PURE__*/React.createElement("p", {
      style: {
        font: 'var(--type-body)',
        color: 'var(--text-muted)',
        margin: 0
      }
    }, f.body));
  })));
}

/* ---- DESTINATIONS ---- */
function Destinations() {
  const places = [{
    name: 'Kyoto',
    tag: '5-day culture loop',
    wash: 'var(--wash-dusk)',
    n: '1.2k itineraries'
  }, {
    name: 'Lisbon',
    tag: 'Coast & custard',
    wash: 'linear-gradient(150deg,#f4ad3c,#e35a38)',
    n: '980 itineraries'
  }, {
    name: 'Patagonia',
    tag: 'Trek & glaciers',
    wash: 'var(--wash-ocean)',
    n: '640 itineraries'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 56,
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tf-eyebrow"
  }, "Start from a template"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 36px/1.05 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: '12px 0 0'
    }
  }, "Trips travellers love")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 16
    })
  }, "Browse all")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22
    }
  }, places.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    padding: "none",
    interactive: true,
    elevation: "sm",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    wash: p.wash,
    h: 210,
    radius: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(33,27,23,0.5), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      bottom: 16,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 26px/1 var(--font-display)'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14px/1.2 var(--font-sans)',
      opacity: 0.9,
      marginTop: 4
    }
  }, p.tag))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, p.n), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    variant: "soft"
  }, "Use template"))))));
}

/* ---- CTA + FOOTER ---- */
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...WRAP,
      paddingTop: 56,
      paddingBottom: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--wash-ocean)',
      borderRadius: 'var(--radius-2xl)',
      padding: '56px 48px',
      textAlign: 'center',
      color: '#fff',
      boxShadow: 'var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 44px/1.02 var(--font-display)',
      letterSpacing: '-0.03em',
      color: '#fff',
      margin: 0
    }
  }, "Your next trip, already sorted"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '400 18px/1.5 var(--font-sans)',
      color: 'rgba(255,255,255,0.85)',
      maxWidth: 480,
      margin: '16px auto 0'
    }
  }, "Start free. Add your first booking and watch the whole trip fall into place."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(MArrow, {
      size: 18
    })
  }, "Start planning \u2014 free"))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...WRAP,
      paddingTop: 36,
      paddingBottom: 40,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources.wordmark,
    alt: "Tripyfull",
    style: {
      height: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26
    }
  }, ['Product', 'Destinations', 'Pricing', 'About', 'Help'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px/1 var(--font-mono)',
      color: 'var(--text-subtle)'
    }
  }, "\xA9 2026 Tripyfull")));
}
window.TripyfullMarketing = {
  NavBar,
  Hero,
  Features,
  Destinations,
  CTA,
  Footer
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/sections.standalone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/planner/budget-data.js
try { (() => {
/* Tripyfull Planner — Budget page data (extends PlannerData).
   window.PlannerBudget. Designed to demonstrate the budget story:
   one category over plan (Еда), one day over plan (День 3). */

window.PlannerBudget = {
  /* optional hard limit for the trip (toggleable in UI) */
  limit: 4500,
  /* смета (plan) per category = bookings full price + cost estimates */
  categoryPlan: {
    transport: 1528,
    stay: 1400,
    food: 180,
    activity: 320,
    other: 120
  },
  /* per-day spending plan (daily budget) */
  dayPlan: {
    d1: 90,
    d2: 110,
    d3: 140,
    d4: 80,
    d5: 120,
    d6: 80,
    d7: 70,
    d8: 60
  },
  /* actual in-trip spend (Expense) — складывается само */
  expenses: [{
    id: 'e1',
    dayId: 'd1',
    cat: 'food',
    title: 'Ужин · Ichiran',
    amount: 32,
    date: '2026-06-16'
  }, {
    id: 'e2',
    dayId: 'd1',
    cat: 'transport',
    title: "N'EX до города",
    amount: 18,
    date: '2026-06-16'
  }, {
    id: 'e3',
    dayId: 'd1',
    cat: 'other',
    title: 'SIM-карта',
    amount: 24,
    date: '2026-06-16'
  }, {
    id: 'e4',
    dayId: 'd2',
    cat: 'food',
    title: 'Завтрак · Sarutahiko',
    amount: 14,
    date: '2026-06-17'
  }, {
    id: 'e5',
    dayId: 'd2',
    cat: 'food',
    title: 'Обед · удон',
    amount: 26,
    date: '2026-06-17'
  }, {
    id: 'e6',
    dayId: 'd2',
    cat: 'activity',
    title: 'Донат у храма',
    amount: 6,
    date: '2026-06-17'
  }, {
    id: 'e7',
    dayId: 'd3',
    cat: 'food',
    title: 'Обед · Ramen Sen',
    amount: 24,
    date: '2026-06-18'
  }, {
    id: 'e8',
    dayId: 'd3',
    cat: 'food',
    title: 'Стрит-фуд · Нисики',
    amount: 45,
    date: '2026-06-18'
  }, {
    id: 'e9',
    dayId: 'd3',
    cat: 'food',
    title: 'Ужин · кайсэки',
    amount: 62,
    date: '2026-06-18'
  }, {
    id: 'e10',
    dayId: 'd3',
    cat: 'activity',
    title: 'Входной билет',
    amount: 14,
    date: '2026-06-18'
  }, {
    id: 'e11',
    dayId: 'd3',
    cat: 'transport',
    title: 'Такси',
    amount: 16,
    date: '2026-06-18'
  }],
  catOrder: ['transport', 'stay', 'food', 'activity', 'other']
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/budget-data.js", error: String((e && e.message) || e) }); }

// ui_kits/planner/budget.jsx
try { (() => {
/* Tripyfull Planner — Budget v2 screen. window.PlannerBudgetScreen.Budget2
   Answers: уложусь ли я в деньги · что горит по платежам · куда уходят деньги.
   Layout top→bottom: summary → due payments → categories → by-day detail. */

const BG_DS = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Input,
  Select,
  Switch,
  SegmentedControl,
  Alert,
  Toast
} = BG_DS;
const BGP = window.PlannerParts;
const BD = window.PlannerData;
const BB = window.PlannerBudget;
const {
  Icon,
  CatIcon,
  PageHead,
  Drawer,
  EmptyState,
  Skeleton,
  Money,
  ProgressBar
} = BGP;
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

/* ---------- metric tile ---------- */
function Metric({
  label,
  value,
  cur,
  color,
  sub,
  active,
  danger,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: !onClick,
    style: {
      textAlign: 'left',
      cursor: onClick ? 'pointer' : 'default',
      font: 'inherit',
      background: 'var(--surface-card)',
      border: '1.5px solid ' + (active ? 'var(--brand)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-lg)',
      boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      padding: '18px 20px',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      font: '400 13px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginBottom: 10
    }
  }, label, onClick && /*#__PURE__*/React.createElement(Icon, {
    name: "chevron",
    size: 13
  })), /*#__PURE__*/React.createElement(Money, {
    value: value,
    cur: cur,
    size: 28,
    strong: true,
    color: danger ? 'var(--danger-500)' : color
  }), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1.3 var(--font-mono)',
      color: danger ? 'var(--danger-500)' : 'var(--text-subtle)',
      marginTop: 8
    }
  }, sub));
}
function Budget2({
  trip,
  loading
}) {
  const cur = trip.currency;

  /* ---- live state ---- */
  const initialPaid = React.useMemo(() => {
    const s = {};
    BD.bookings.forEach(b => b.payments.forEach(p => {
      if (p.paid) s[p.id] = true;
    }));
    return s;
  }, []);
  const [paidIds, setPaidIds] = React.useState(initialPaid);
  const [expenses, setExpenses] = React.useState(BB.expenses);
  const [catMode, setCatMode] = React.useState('Оба');
  const [activeMetric, setActiveMetric] = React.useState(null);
  const [filterCat, setFilterCat] = React.useState('Все');
  const [limitOn, setLimitOn] = React.useState(true);
  const [expDrawer, setExpDrawer] = React.useState(null);
  const [expandedDay, setExpandedDay] = React.useState('d3');
  const [toast, setToast] = React.useState(null);

  /* form fields for new expense */
  const [fCat, setFCat] = React.useState('food');
  const [fAmount, setFAmount] = React.useState('');
  const [fDay, setFDay] = React.useState('d3');
  const [fTitle, setFTitle] = React.useState('');
  const allPayments = React.useMemo(() => BD.bookings.flatMap(b => b.payments.map(p => ({
    ...p,
    cat: b.cat,
    bookingTitle: b.title,
    provider: b.provider
  }))), []);

  /* ---- derived totals ---- */
  const planned = BB.catOrder.reduce((s, c) => s + (BB.categoryPlan[c] || 0), 0);
  const paidPayments = allPayments.filter(p => paidIds[p.id]);
  const unpaidPayments = allPayments.filter(p => !paidIds[p.id]).sort((a, b) => a.date.localeCompare(b.date));
  const spentInTrip = expenses.reduce((s, e) => s + e.amount, 0);
  const paid = paidPayments.reduce((s, p) => s + p.amount, 0) + spentInTrip;
  const remaining = unpaidPayments.reduce((s, p) => s + p.amount, 0);
  const byCategory = BB.catOrder.map(c => {
    const plan = BB.categoryPlan[c] || 0;
    const fact = paidPayments.filter(p => p.cat === c).reduce((s, p) => s + p.amount, 0) + expenses.filter(e => e.cat === c).reduce((s, e) => s + e.amount, 0);
    return {
      cat: c,
      plan,
      fact,
      over: fact > plan
    };
  });
  const overCats = byCategory.filter(c => c.over);
  const byDay = BD.days.map(d => {
    const plan = BB.dayPlan[d.id] || 0;
    const dayExp = expenses.filter(e => e.dayId === d.id);
    const fact = dayExp.reduce((s, e) => s + e.amount, 0);
    return {
      day: d,
      plan,
      fact,
      over: fact > plan,
      expenses: dayExp
    };
  });
  const overLimit = limitOn && planned > BB.limit;
  const isEmpty = allPayments.length === 0 && expenses.length === 0;

  /* ---- actions ---- */
  const markPaid = (id, title) => {
    setPaidIds(s => ({
      ...s,
      [id]: true
    }));
    setToast({
      tone: 'success',
      title: 'Платёж отмечен',
      message: title
    });
  };
  const addExpense = () => {
    const amt = parseFloat(fAmount);
    if (!amt) return;
    const e = {
      id: 'e' + Date.now(),
      dayId: fDay,
      cat: fCat,
      title: fTitle || BD.CATEGORY[fCat].label,
      amount: amt,
      date: BD.days.find(d => d.id === fDay).date
    };
    setExpenses(s => [...s, e]);
    setExpandedDay(fDay);
    setExpDrawer(null);
    setFAmount('');
    setFTitle('');
    setToast({
      tone: 'brand',
      title: 'Трата записана',
      message: e.title + ' · ' + BD.fmt(amt, cur)
    });
  };
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ============ LOADING ============ */
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        maxWidth: 1040,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      h: 40,
      w: 220,
      style: {
        marginBottom: 28
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 16,
        marginBottom: 24
      }
    }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 20
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      h: 13,
      w: "60%",
      style: {
        marginBottom: 14
      }
    }), /*#__PURE__*/React.createElement(Skeleton, {
      h: 26,
      w: "50%"
    })))), /*#__PURE__*/React.createElement(Skeleton, {
      h: 200,
      r: "var(--radius-lg)",
      style: {
        marginBottom: 20
      }
    }), /*#__PURE__*/React.createElement(Skeleton, {
      h: 260,
      r: "var(--radius-lg)"
    }));
  }

  /* ============ EMPTY ============ */
  if (isEmpty) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        maxWidth: 720,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: trip.name,
      title: "\u0411\u044E\u0434\u0436\u0435\u0442"
    }), /*#__PURE__*/React.createElement(EmptyState, {
      icon: "budget",
      title: "\u0411\u044E\u0434\u0436\u0435\u0442 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442",
      body: "\u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u0431\u0440\u043E\u043D\u044C \u0438\u043B\u0438 \u0442\u0440\u0430\u0442\u0443 \u2014 \u0441\u043C\u0435\u0442\u0430, \u043E\u043F\u043B\u0430\u0442\u044B \u0438 \u0440\u0430\u0437\u0431\u0438\u0432\u043A\u0430 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0441\u0430\u043C\u0438.",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: /*#__PURE__*/React.createElement(Icon, {
          name: "plus",
          size: 18
        }),
        onClick: () => setExpDrawer({})
      }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u0440\u0430\u0442\u0443")
    }));
  }

  /* ============ MAIN ============ */
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 1040,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: trip.name + ' · ' + BD.dateRange(trip.start, trip.end),
    title: "\u0411\u044E\u0434\u0436\u0435\u0442",
    subtitle: "\u0423\u043B\u043E\u0436\u0443\u0441\u044C \u043B\u0438 \u044F \u0432 \u0434\u0435\u043D\u044C\u0433\u0438, \u0447\u0442\u043E \u0433\u043E\u0440\u0438\u0442 \u043F\u043E \u043F\u043B\u0430\u0442\u0435\u0436\u0430\u043C \u0438 \u043A\u0443\u0434\u0430 \u043E\u043D\u0438 \u0443\u0445\u043E\u0434\u044F\u0442.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 16
      }),
      onClick: () => {
        setFCat('food');
        setExpDrawer({});
      }
    }, "\u0422\u0440\u0430\u0442\u0430"))
  }), overCats.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "warning",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "alert",
      size: 18
    }),
    title: 'Перерасход: ' + overCats.map(c => BD.CATEGORY[c.cat].label).join(', ')
  }, "\u0424\u0430\u043A\u0442 \u043F\u0440\u0435\u0432\u044B\u0441\u0438\u043B \u043F\u043B\u0430\u043D \u043F\u043E ", overCats.length === 1 ? 'категории' : 'категориям', ". \u0417\u0430\u0433\u043B\u044F\u043D\u0438 \u0432 \u0440\u0430\u0437\u0431\u0438\u0432\u043A\u0443 \u043D\u0438\u0436\u0435.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
    value: planned,
    cur: cur,
    sub: "\u0441\u043C\u0435\u0442\u0430: \u0431\u0440\u043E\u043D\u0438 + \u043E\u0446\u0435\u043D\u043A\u0438"
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E",
    value: paid,
    cur: cur,
    color: "var(--success-500)",
    sub: pct(paid, planned) + '% от сметы'
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u043B\u0430\u0442\u0438\u0442\u044C",
    value: remaining,
    cur: cur,
    color: "var(--coral-600)",
    sub: unpaidPayments.length + ' платеж. впереди',
    active: activeMetric === 'remaining',
    onClick: () => setActiveMetric(activeMetric === 'remaining' ? null : 'remaining')
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E \u0432 \u043F\u043E\u0435\u0437\u0434\u043A\u0435",
    value: spentInTrip,
    cur: cur,
    sub: expenses.length + ' трат записано'
  })), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm",
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: limitOn ? 12 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 15px/1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, "\u041B\u0438\u043C\u0438\u0442 \u043F\u043E\u0435\u0437\u0434\u043A\u0438"), limitOn && /*#__PURE__*/React.createElement(Badge, {
    tone: overLimit ? 'danger' : 'accent',
    variant: "soft"
  }, overLimit ? 'превышен' : BD.fmt(BB.limit, cur))), /*#__PURE__*/React.createElement(Switch, {
    size: "sm",
    checked: limitOn,
    onChange: setLimitOn,
    label: limitOn ? 'Жёсткий лимит' : 'Без лимита'
  })), limitOn && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ProgressBar, {
    value: planned,
    max: BB.limit,
    color: overLimit ? 'var(--danger-500)' : 'var(--brand)',
    h: 10
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 8,
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0441\u043C\u0435\u0442\u0430 ", BD.fmt(planned, cur), " \xB7 ", pct(planned, BB.limit), "% \u043B\u0438\u043C\u0438\u0442\u0430"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: overLimit ? 'var(--danger-500)' : 'var(--success-500)'
    }
  }, overLimit ? 'перерасход ' + BD.fmt(planned - BB.limit, cur) : 'запас ' + BD.fmt(BB.limit - planned, cur))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "sm",
    style: {
      border: activeMetric === 'remaining' ? '1.5px solid var(--brand)' : '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u0427\u0442\u043E \u0433\u043E\u0440\u0438\u0442 \u043F\u043E \u043F\u043B\u0430\u0442\u0435\u0436\u0430\u043C"), activeMetric === 'remaining' && /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    variant: "soft"
  }, "\u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u043E\u043F\u043B\u0430\u0447.")), unpaidPayments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 0',
      color: 'var(--success-500)',
      font: 'var(--type-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "budget",
    size: 18
  }), " \u0412\u0441\u0435 \u043F\u043B\u0430\u0442\u0435\u0436\u0438 \u0437\u0430\u043A\u0440\u044B\u0442\u044B \uD83C\uDF89") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, unpaidPayments.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 12px',
      background: 'var(--surface-page)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-md)',
      background: BD.CATEGORY[p.cat].soft,
      color: BD.CATEGORY[p.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: p.cat,
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.2 var(--font-sans)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, p.bookingTitle), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--coral-600)',
      marginTop: 3
    }
  }, "\u0434\u043E ", BD.dateShort(p.date))), /*#__PURE__*/React.createElement(Money, {
    value: p.amount,
    cur: cur,
    size: 14
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "soft",
    onClick: () => markPaid(p.id, p.bookingTitle)
  }, "\u041E\u043F\u043B\u0430\u0442\u0438\u043B"))))), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u041A\u0443\u0434\u0430 \u0443\u0445\u043E\u0434\u044F\u0442 \u0434\u0435\u043D\u044C\u0433\u0438"), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    value: catMode,
    onChange: setCatMode,
    options: ['Факт', 'План', 'Оба']
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, byCategory.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.cat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 'var(--radius-sm)',
      background: BD.CATEGORY[c.cat].soft,
      color: BD.CATEGORY[c.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: c.cat,
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-strong)',
      flex: 1
    }
  }, BD.CATEGORY[c.cat].label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: c.over ? 'var(--danger-500)' : 'var(--text-muted)'
    }
  }, catMode === 'Факт' ? BD.fmt(c.fact, cur) : catMode === 'План' ? BD.fmt(c.plan, cur) : BD.fmt(c.fact, cur) + ' / ' + BD.fmt(c.plan, cur))), /*#__PURE__*/React.createElement(ProgressBar, {
    value: c.fact,
    max: c.plan,
    color: c.over ? 'var(--danger-500)' : BD.CATEGORY[c.cat].color,
    h: 7
  }), c.over && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--danger-500)',
      marginTop: 4
    }
  }, "\u043F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434 ", BD.fmt(c.fact - c.plan, cur))))))), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm",
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u0414\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043F\u043E \u0434\u043D\u044F\u043C"), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    value: filterCat,
    onChange: setFilterCat,
    options: ['Все', 'Еда', 'Транспорт', 'Активности']
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      font: '500 11px/1 var(--font-mono)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-subtle)',
      padding: '0 6px 8px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "\u0414\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 84,
      textAlign: 'right'
    }
  }, "\u041F\u043B\u0430\u043D"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 84,
      textAlign: 'right'
    }
  }, "\u0424\u0430\u043A\u0442"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 84,
      textAlign: 'right'
    }
  }, "\u0394"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28
    }
  })), byDay.map(({
    day,
    plan,
    fact,
    over,
    expenses: dayExp
  }) => {
    const open = expandedDay === day.id;
    const acts = day.activities.map(id => BD.activities[id]);
    const catFilter = {
      'Еда': 'food',
      'Транспорт': 'transport',
      'Активности': 'activity'
    }[filterCat];
    const shownExp = catFilter ? dayExp.filter(e => e.cat === catFilter) : dayExp;
    return /*#__PURE__*/React.createElement("div", {
      key: day.id,
      style: {
        borderBottom: '1px dashed var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setExpandedDay(open ? null : day.id),
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '11px 6px',
        border: 'none',
        background: open ? 'var(--surface-page)' : 'transparent',
        cursor: 'pointer',
        font: 'inherit',
        borderRadius: 'var(--radius-sm)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textAlign: 'left',
        font: '500 14px/1.2 var(--font-sans)',
        color: 'var(--text-strong)'
      }
    }, "\u0414\u0435\u043D\u044C ", day.n, " \xB7 ", day.city), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 84,
        textAlign: 'right',
        font: '500 13px/1 var(--font-mono)',
        color: 'var(--text-muted)'
      }
    }, BD.fmt(plan, cur)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 84,
        textAlign: 'right',
        font: '600 13px/1 var(--font-mono)',
        color: 'var(--text-strong)'
      }
    }, BD.fmt(fact, cur)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 84,
        textAlign: 'right',
        font: '500 13px/1 var(--font-mono)',
        color: over ? 'var(--danger-500)' : 'var(--success-500)'
      }
    }, fact - plan > 0 ? '+' : '', BD.fmt(fact - plan, cur)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        display: 'inline-flex',
        justifyContent: 'flex-end',
        color: 'var(--text-subtle)',
        transform: open ? 'rotate(90deg)' : 'none',
        transition: 'transform var(--dur-fast) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 15
    }))), open && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 6px 16px'
      }
    }, shownExp.length === 0 && acts.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--type-small)',
        color: 'var(--text-subtle)',
        padding: '8px 0'
      }
    }, "\u0412 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u043D\u0435\u0442 \u043D\u0438 \u0442\u0440\u0430\u0442, \u043D\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0435\u0439."), shownExp.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: acts.length ? 12 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 11px/1 var(--font-mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-subtle)',
        margin: '8px 0'
      }
    }, "\u0422\u0440\u0430\u0442\u044B"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, shownExp.map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 'var(--radius-sm)',
        background: BD.CATEGORY[e.cat].soft,
        color: BD.CATEGORY[e.cat].color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(CatIcon, {
      cat: e.cat,
      size: 13
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: '400 13px/1.3 var(--font-sans)',
        color: 'var(--text-body)'
      }
    }, e.title), /*#__PURE__*/React.createElement(Money, {
      value: e.amount,
      cur: cur,
      size: 13,
      color: "var(--text-muted)"
    }))))), acts.length > 0 && !catFilter && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 11px/1 var(--font-mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-subtle)',
        margin: '8px 0'
      }
    }, "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 (\u043F\u043B\u0430\u043D)"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, acts.map(a => /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 11px/1 var(--font-mono)',
        color: 'var(--text-subtle)',
        width: 42
      }
    }, a.start), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: '400 13px/1.3 var(--font-sans)',
        color: 'var(--text-body)'
      }
    }, a.title), a.cost > 0 && /*#__PURE__*/React.createElement(Money, {
      value: a.cost,
      cur: cur,
      size: 13,
      color: "var(--text-subtle)"
    }))))), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 14
      }),
      style: {
        marginTop: 12
      },
      onClick: () => {
        setFDay(day.id);
        setFCat('food');
        setExpDrawer({});
      }
    }, "\u0422\u0440\u0430\u0442\u0430 \u0432 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C")));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-subtle)',
      marginTop: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 14
  }), " \u041C\u0443\u043B\u044C\u0442\u0438\u0432\u0430\u043B\u044E\u0442\u0430: \u0441\u0443\u043C\u043C\u044B \u0432 \u0434\u0440\u0443\u0433\u0438\u0445 \u0432\u0430\u043B\u044E\u0442\u0430\u0445 \u043F\u0440\u0438\u0432\u043E\u0434\u044F\u0442\u0441\u044F \u043A ", cur, " \u043F\u043E \u043A\u0443\u0440\u0441\u0443 \u043D\u0430 \u0434\u0430\u0442\u0443 \u043F\u043B\u0430\u0442\u0435\u0436\u0430 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)."), /*#__PURE__*/React.createElement(Drawer, {
    open: !!expDrawer,
    onClose: () => setExpDrawer(null),
    width: 440,
    eyebrow: "\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E \u0432 \u043F\u043E\u0435\u0437\u0434\u043A\u0435",
    title: "\u041D\u043E\u0432\u0430\u044F \u0442\u0440\u0430\u0442\u0430",
    footer: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      fullWidth: true,
      onClick: addExpense
    }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0442\u0440\u0430\u0442\u0443")
  }, expDrawer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F",
    value: fCat,
    onChange: e => setFCat(e.target.value),
    options: ['transport', 'stay', 'food', 'activity', 'other'].map(k => ({
      value: k,
      label: BD.CATEGORY[k].label
    }))
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0421\u0443\u043C\u043C\u0430",
    type: "number",
    value: fAmount,
    onChange: e => setFAmount(e.target.value),
    placeholder: "0",
    helper: 'В валюте поездки (' + cur + ')'
  }), /*#__PURE__*/React.createElement(Select, {
    label: "\u0414\u0435\u043D\u044C",
    value: fDay,
    onChange: e => setFDay(e.target.value),
    options: BD.days.map(d => ({
      value: d.id,
      label: 'День ' + d.n + ' · ' + d.city + ' (' + BD.dateShort(d.date) + ')'
    }))
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
    value: fTitle,
    onChange: e => setFTitle(e.target.value),
    placeholder: "\u041D\u0430 \u0447\u0442\u043E \u043F\u043E\u0442\u0440\u0430\u0442\u0438\u043B?"
  }))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 95,
      animation: 'tfpop var(--dur-base) var(--ease-soft)'
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: toast.tone,
    title: toast.title,
    message: toast.message,
    icon: toast.tone === 'success' ? /*#__PURE__*/React.createElement(Icon, {
      name: "budget",
      size: 18
    }) : /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    }),
    onClose: () => setToast(null)
  })));
}
window.PlannerBudgetScreen = {
  Budget2
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/budget.jsx", error: String((e && e.message) || e) }); }

// ui_kits/planner/data.js
try { (() => {
/* Tripyfull Planner — fake data model.
   Plain JS, exposed as window.PlannerData. No design-system dependency. */

const CATEGORY = {
  food: {
    label: 'Еда',
    icon: 'food',
    color: 'var(--gold-400)',
    soft: 'var(--gold-50)'
  },
  transport: {
    label: 'Транспорт',
    icon: 'plane',
    color: 'var(--accent)',
    soft: 'var(--teal-50)'
  },
  stay: {
    label: 'Проживание',
    icon: 'bed',
    color: 'var(--coral-500)',
    soft: 'var(--coral-50)'
  },
  activity: {
    label: 'Активности',
    icon: 'compass',
    color: 'var(--teal-400)',
    soft: 'var(--teal-50)'
  },
  other: {
    label: 'Прочее',
    icon: 'tag',
    color: 'var(--ink-500)',
    soft: 'var(--surface-sunken)'
  }
};
const PAYMENT_STATUS = {
  paid: {
    label: 'Оплачено',
    tone: 'success'
  },
  partial: {
    label: 'Частично',
    tone: 'warning'
  },
  unpaid: {
    label: 'Не оплачено',
    tone: 'danger'
  }
};
const TRIP_STATUS = {
  draft: {
    label: 'Черновик',
    tone: 'neutral'
  },
  planned: {
    label: 'Запланир.',
    tone: 'accent'
  },
  active: {
    label: 'В пути',
    tone: 'brand'
  },
  completed: {
    label: 'Завершено',
    tone: 'success'
  }
};
const trips = [{
  id: 'jp',
  name: 'Токио и Киото',
  destination: 'Япония',
  start: '2026-06-16',
  end: '2026-06-23',
  status: 'planned',
  currency: '€',
  wash: 'var(--wash-dusk)',
  planned: 4280,
  paid: 2640
}, {
  id: 'pt',
  name: 'Побережье Португалии',
  destination: 'Лиссабон · Порту',
  start: '2026-09-04',
  end: '2026-09-11',
  status: 'draft',
  currency: '€',
  wash: 'linear-gradient(150deg,#f4ad3c,#e35a38)',
  planned: 2150,
  paid: 320
}, {
  id: 'pa',
  name: 'Треккинг в Патагонии',
  destination: 'Чили · Аргентина',
  start: '2025-11-02',
  end: '2025-11-14',
  status: 'completed',
  currency: '€',
  wash: 'var(--wash-ocean)',
  planned: 5600,
  paid: 5600
}];

/* Days for the Japan trip */
const days = [{
  id: 'd1',
  n: 1,
  date: '2026-06-16',
  city: 'Токио',
  activities: ['a1', 'a2', 'a3']
}, {
  id: 'd2',
  n: 2,
  date: '2026-06-17',
  city: 'Токио',
  activities: ['a4', 'a5']
}, {
  id: 'd3',
  n: 3,
  date: '2026-06-18',
  city: 'Киото',
  activities: ['a6', 'a7', 'a8', 'a9']
}, {
  id: 'd4',
  n: 4,
  date: '2026-06-19',
  city: 'Киото',
  activities: []
}, {
  id: 'd5',
  n: 5,
  date: '2026-06-20',
  city: 'Осака',
  activities: ['a10']
}, {
  id: 'd6',
  n: 6,
  date: '2026-06-21',
  city: 'Осака',
  activities: []
}, {
  id: 'd7',
  n: 7,
  date: '2026-06-22',
  city: 'Нара',
  activities: ['a11']
}, {
  id: 'd8',
  n: 8,
  date: '2026-06-23',
  city: 'Токио',
  activities: []
}];
const activities = {
  a1: {
    id: 'a1',
    title: 'Прилёт · Нарита',
    cat: 'transport',
    start: '07:20',
    end: '08:00',
    address: 'Аэропорт Нарита, T1',
    cost: 0,
    note: 'Поезд N\'EX до города'
  },
  a2: {
    id: 'a2',
    title: 'Заселение в отель',
    cat: 'stay',
    start: '11:00',
    end: '11:30',
    address: 'Shibuya Stream Hotel',
    cost: 0,
    note: 'Ранний чек-ин подтверждён'
  },
  a3: {
    id: 'a3',
    title: 'Ужин — Сибуя',
    cat: 'food',
    start: '19:30',
    end: '21:00',
    address: 'Ichiran Shibuya',
    cost: 28,
    note: 'Тонкоцу рамен'
  },
  a4: {
    id: 'a4',
    title: 'Завтрак — Sarutahiko',
    cat: 'food',
    start: '08:30',
    end: '09:15',
    address: 'Эбису',
    cost: 14,
    note: 'Кофе и тамаго'
  },
  a5: {
    id: 'a5',
    title: 'Сэнсо-дзи и Асакуса',
    cat: 'activity',
    start: '10:30',
    end: '13:00',
    address: 'Асакуса',
    cost: 0,
    note: 'Храм + улица Накамисэ'
  },
  a6: {
    id: 'a6',
    title: 'Синкансэн в Киото',
    cat: 'transport',
    start: '07:00',
    end: '09:20',
    address: 'Tokyo → Kyoto',
    cost: 96,
    note: 'Вагон 7, места 11A/B'
  },
  a7: {
    id: 'a7',
    title: 'Бамбуковая роща Арасияма',
    cat: 'activity',
    start: '10:00',
    end: '11:30',
    address: 'Киото',
    cost: 0,
    note: 'Рассвет до толпы'
  },
  a8: {
    id: 'a8',
    title: 'Обед — Ramen Sen',
    cat: 'food',
    start: '13:00',
    end: '14:00',
    address: 'Киото',
    cost: 22,
    note: 'Бронь на 2'
  },
  a9: {
    id: 'a9',
    title: 'Рёкан Ёсикава',
    cat: 'stay',
    start: '20:00',
    end: '20:30',
    address: 'Киото, комната 4',
    cost: 0,
    note: 'Заезд'
  },
  a10: {
    id: 'a10',
    title: 'Стрит-фуд Дотонбори',
    cat: 'food',
    start: '18:00',
    end: '20:30',
    address: 'Осака',
    cost: 35,
    note: 'Такояки + окономияки'
  },
  a11: {
    id: 'a11',
    title: 'Парк оленей Нара',
    cat: 'activity',
    start: '11:00',
    end: '14:00',
    address: 'Нара',
    cost: 8,
    note: 'Покормить оленей'
  }
};
const bookings = [{
  id: 'b1',
  cat: 'transport',
  title: 'Barcelona → Tokyo',
  provider: 'Qatar Airways',
  conf: 'QR-8KQ2LX',
  price: 1240,
  status: 'paid',
  from: 'BCN',
  to: 'NRT',
  date: '2026-06-16 06:00',
  dayId: 'd1',
  payments: [{
    id: 'p1',
    amount: 1240,
    date: '2026-02-10',
    paid: true
  }]
}, {
  id: 'b2',
  cat: 'stay',
  title: 'Shibuya Stream Hotel',
  provider: 'Booking.com',
  conf: 'BK-77213',
  price: 860,
  status: 'partial',
  checkIn: '2026-06-16',
  checkOut: '2026-06-18',
  nights: 2,
  dayId: 'd1',
  payments: [{
    id: 'p2',
    amount: 260,
    date: '2026-03-01',
    paid: true
  }, {
    id: 'p3',
    amount: 600,
    date: '2026-06-16',
    paid: false
  }]
}, {
  id: 'b3',
  cat: 'stay',
  title: 'Рёкан Ёсикава',
  provider: 'напрямую',
  conf: 'RY-04',
  price: 540,
  status: 'unpaid',
  checkIn: '2026-06-18',
  checkOut: '2026-06-20',
  nights: 2,
  dayId: 'd3',
  payments: [{
    id: 'p4',
    amount: 540,
    date: '2026-06-18',
    paid: false
  }]
}, {
  id: 'b4',
  cat: 'transport',
  title: 'Tokyo → Kyoto',
  provider: 'JR Central',
  conf: 'JR-7-11AB',
  price: 192,
  status: 'paid',
  from: 'Tokyo',
  to: 'Kyoto',
  date: '2026-06-18 07:00',
  dayId: 'd3',
  payments: [{
    id: 'p5',
    amount: 192,
    date: '2026-04-12',
    paid: true
  }]
}, {
  id: 'b5',
  cat: 'activity',
  title: 'Тур на рассвете · Арасияма',
  provider: 'GetYourGuide',
  conf: 'GYG-2231',
  price: 76,
  status: 'partial',
  date: '2026-06-18 06:00',
  dayId: 'd3',
  payments: [{
    id: 'p6',
    amount: 38,
    date: '2026-05-20',
    paid: true
  }, {
    id: 'p7',
    amount: 38,
    date: '2026-06-18',
    paid: false
  }]
}];

/* Budget by category (planned vs actual, in trip currency) */
const budgetByCategory = [{
  cat: 'transport',
  planned: 1528,
  actual: 1432
}, {
  cat: 'stay',
  planned: 1400,
  actual: 260
}, {
  cat: 'food',
  planned: 720,
  actual: 188
}, {
  cat: 'activity',
  planned: 532,
  actual: 84
}, {
  cat: 'other',
  planned: 100,
  actual: 36
}];
window.PlannerData = {
  CATEGORY,
  PAYMENT_STATUS,
  TRIP_STATUS,
  trips,
  days,
  activities,
  bookings,
  budgetByCategory,
  fmt(n, cur = '€') {
    return cur + n.toLocaleString('ru-RU');
  },
  dateShort(iso) {
    const M = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const d = new Date(iso);
    return d.getDate() + ' ' + M[d.getMonth()];
  },
  dateRange(a, b) {
    return this.dateShort(a) + ' – ' + this.dateShort(b);
  },
  dayCost(dayId) {
    const day = days.find(d => d.id === dayId);
    if (!day) return 0;
    return day.activities.reduce((s, id) => s + (activities[id] ? activities[id].cost : 0), 0);
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/data.js", error: String((e && e.message) || e) }); }

// ui_kits/planner/money.jsx
try { (() => {
/* Tripyfull Planner — money screens. window.PlannerMoney */

const PM_DS = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Input,
  Select,
  Checkbox
} = PM_DS;
const PMT = window.PlannerParts;
const MD = window.PlannerData;
const {
  Icon,
  CatIcon,
  PageHead,
  EmptyState,
  Money,
  ProgressBar
} = PMT;

/* =========================================================
   6. BOOKINGS
   ========================================================= */
function Bookings({
  trip,
  onAdd,
  onOpen
}) {
  const groups = [{
    cat: 'transport',
    label: 'Транспорт'
  }, {
    cat: 'stay',
    label: 'Проживание'
  }, {
    cat: 'activity',
    label: 'Активности'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 920,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: trip.name,
    title: "\u0411\u0440\u043E\u043D\u0438",
    subtitle: "\u041F\u0440\u0435\u0434\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0431\u0440\u043E\u043D\u0438 \u0438 \u0433\u0440\u0430\u0444\u0438\u043A\u0438 \u043F\u043B\u0430\u0442\u0435\u0436\u0435\u0439.",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 18
      }),
      onClick: onAdd
    }, "\u0411\u0440\u043E\u043D\u044C")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, groups.map(g => {
    const items = MD.bookings.filter(b => b.cat === g.cat);
    if (!items.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: g.cat
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-md)',
        background: MD.CATEGORY[g.cat].soft,
        color: MD.CATEGORY[g.cat].color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(CatIcon, {
      cat: g.cat,
      size: 16
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        font: 'var(--type-h3)',
        margin: 0
      }
    }, g.label), /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 12px/1 var(--font-mono)',
        color: 'var(--text-subtle)'
      }
    }, "\xB7 ", items.length)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, items.map(b => /*#__PURE__*/React.createElement(BookingCard, {
      key: b.id,
      b: b,
      cur: trip.currency,
      onClick: () => onOpen(b.id)
    }))));
  })));
}
function BookingCard({
  b,
  cur,
  onClick
}) {
  const ps = MD.PAYMENT_STATUS[b.status];
  const nextPay = b.payments.filter(p => !p.paid).sort((a, c) => a.date.localeCompare(c.date))[0];
  const meta = b.cat === 'transport' ? b.from + ' → ' + b.to + ' · ' + b.date.replace(' ', ', ') : b.checkIn ? 'Заезд ' + MD.dateShort(b.checkIn) + ' · ' + b.nights + ' ноч.' : b.date ? b.date.replace(' ', ', ') : '';
  return /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    interactive: true,
    elevation: "sm",
    onClick: onClick,
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 42,
      height: 42,
      borderRadius: 'var(--radius-md)',
      background: MD.CATEGORY[b.cat].soft,
      color: MD.CATEGORY[b.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: b.cat,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 16px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, b.title), /*#__PURE__*/React.createElement(Badge, {
    tone: ps.tone,
    variant: "soft",
    dot: true
  }, ps.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, b.provider, " \xB7 ", meta), nextPay && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--coral-600)',
      marginTop: 6
    }
  }, "\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0439 \u043F\u043B\u0430\u0442\u0451\u0436 ", MD.fmt(nextPay.amount, cur), " \xB7 ", MD.dateShort(nextPay.date))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: b.price,
    cur: cur,
    size: 17
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1 var(--font-sans)',
      color: 'var(--text-subtle)',
      marginTop: 4
    }
  }, "\u043F\u043E\u043B\u043D\u0430\u044F \u0446\u0435\u043D\u0430"))));
}

/* =========================================================
   7. BOOKING + PAYMENTS DRAWER
   ========================================================= */
function BookingForm({
  booking,
  cur
}) {
  const b = booking || {
    payments: []
  };
  const catOpts = ['transport', 'stay', 'activity', 'other'].map(k => ({
    value: k,
    label: MD.CATEGORY[k].label
  }));
  const paySum = (b.payments || []).reduce((s, p) => s + p.amount, 0);
  const matches = paySum === b.price;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    defaultValue: b.title,
    placeholder: "\u0427\u0442\u043E \u0431\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C?"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F",
    options: catOpts,
    defaultValue: b.cat || 'transport'
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A",
    defaultValue: b.provider,
    placeholder: "\u0410\u0432\u0438\u0430\u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F, \u043E\u0442\u0435\u043B\u044C\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u043E\u043C\u0435\u0440 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F",
    defaultValue: b.conf,
    placeholder: "ABC-123"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u041F\u043E\u043B\u043D\u0430\u044F \u0446\u0435\u043D\u0430",
    type: "number",
    defaultValue: b.price,
    placeholder: "0"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      font: '600 15px/1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, "\u0413\u0440\u0430\u0444\u0438\u043A \u043F\u043B\u0430\u0442\u0435\u0436\u0435\u0439"), /*#__PURE__*/React.createElement(Badge, {
    tone: matches ? 'success' : 'warning',
    variant: "soft"
  }, matches ? '✓ сходится' : 'не сходится')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, (b.payments || []).map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: p.paid
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, MD.fmt(p.amount, cur)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, MD.dateShort(p.date))), /*#__PURE__*/React.createElement(Badge, {
    tone: p.paid ? 'success' : 'neutral',
    variant: "soft"
  }, p.paid ? 'оплачено' : 'ожидается'))), /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '11px',
      border: '1.5px dashed var(--border-default)',
      background: 'transparent',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      font: '600 14px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }), " \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043B\u0430\u0442\u0451\u0436")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 10,
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0421\u0443\u043C\u043C\u0430 \u043F\u043B\u0430\u0442\u0435\u0436\u0435\u0439"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 13px/1 var(--font-mono)',
      color: matches ? 'var(--success-500)' : 'var(--coral-600)'
    }
  }, MD.fmt(paySum, cur), " / ", MD.fmt(b.price || 0, cur)))), /*#__PURE__*/React.createElement(Input, {
    label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438",
    defaultValue: b.note,
    placeholder: "\u0423\u0441\u043B\u043E\u0432\u0438\u044F, \u043E\u0442\u043C\u0435\u043D\u0430, \u0434\u0435\u0442\u0430\u043B\u0438"
  }));
}

/* =========================================================
   8. BUDGET
   ========================================================= */
function Budget({
  trip
}) {
  const cur = trip.currency;
  const cats = MD.budgetByCategory;
  const planned = cats.reduce((s, c) => s + c.planned, 0);
  const actual = cats.reduce((s, c) => s + c.actual, 0);
  const left = trip.planned - trip.paid;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 960,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: trip.name,
    title: "\u0411\u044E\u0434\u0436\u0435\u0442",
    subtitle: "\u0414\u0435\u043D\u044C\u0433\u0438 \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u2014 \u043F\u043B\u0430\u043D \u043F\u0440\u043E\u0442\u0438\u0432 \u0444\u0430\u043A\u0442\u0430."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginBottom: 8
    }
  }, "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E"), /*#__PURE__*/React.createElement(Money, {
    value: planned,
    cur: cur,
    size: 30,
    strong: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-subtle)',
      marginTop: 8
    }
  }, "\u0431\u0440\u043E\u043D\u0438 + \u043E\u0446\u0435\u043D\u043A\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0435\u0439")), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginBottom: 8
    }
  }, "\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E"), /*#__PURE__*/React.createElement(Money, {
    value: actual,
    cur: cur,
    size: 30,
    strong: true,
    color: "var(--success-500)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: actual,
    max: planned,
    color: "var(--success-500)"
  }))), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginBottom: 8
    }
  }, "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u043B\u0430\u0442\u0438\u0442\u044C"), /*#__PURE__*/React.createElement(Money, {
    value: left,
    cur: cur,
    size: 30,
    strong: true,
    color: "var(--coral-600)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-subtle)',
      marginTop: 8
    }
  }, "\u043F\u043E \u0433\u0440\u0430\u0444\u0438\u043A\u0430\u043C \u0431\u0440\u043E\u043D\u0435\u0439"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: '0 0 16px'
    }
  }, "\u041F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, cats.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.cat
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 'var(--radius-sm)',
      background: MD.CATEGORY[c.cat].soft,
      color: MD.CATEGORY[c.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: c.cat,
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1 var(--font-sans)',
      color: 'var(--text-strong)',
      flex: 1
    }
  }, MD.CATEGORY[c.cat].label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, MD.fmt(c.actual, cur), " / ", MD.fmt(c.planned, cur))), /*#__PURE__*/React.createElement(ProgressBar, {
    value: c.actual,
    max: c.planned,
    color: MD.CATEGORY[c.cat].color,
    h: 7
  }))))), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: '0 0 16px'
    }
  }, "\u041F\u043E \u0434\u043D\u044F\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      font: '500 11px/1 var(--font-mono)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-subtle)',
      paddingBottom: 8,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "\u0414\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      textAlign: 'right'
    }
  }, "\u041F\u043B\u0430\u043D"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      textAlign: 'right'
    }
  }, "\u0424\u0430\u043A\u0442"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      textAlign: 'right'
    }
  }, "\u0394")), MD.days.filter(d => d.activities.length).map(d => {
    const plan = MD.dayCost(d.id);
    const fact = Math.round(plan * (0.6 + d.n % 3 * 0.18));
    const diff = fact - plan;
    return /*#__PURE__*/React.createElement("div", {
      key: d.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '9px 0',
        borderBottom: '1px dashed var(--border-subtle)',
        font: 'var(--type-small)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        color: 'var(--text-strong)',
        fontWeight: 500
      }
    }, "\u0414", d.n, " \xB7 ", d.city), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 64,
        textAlign: 'right',
        font: '500 12px/1 var(--font-mono)',
        color: 'var(--text-muted)'
      }
    }, MD.fmt(plan, cur)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 64,
        textAlign: 'right',
        font: '500 12px/1 var(--font-mono)',
        color: 'var(--text-strong)'
      }
    }, MD.fmt(fact, cur)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 64,
        textAlign: 'right',
        font: '500 12px/1 var(--font-mono)',
        color: diff > 0 ? 'var(--coral-600)' : 'var(--success-500)'
      }
    }, diff > 0 ? '+' : '', MD.fmt(diff, cur)));
  })), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 15
    }),
    style: {
      marginTop: 12
    }
  }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u0440\u0430\u0442\u0443"))));
}

/* =========================================================
   NEW TRIP DIALOG body  +  PLACES / SETTINGS placeholders
   ========================================================= */
function NewTripForm() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    placeholder: "\u041D\u0430\u043F\u0440. \u041B\u0435\u0442\u043E \u0432 \u042F\u043F\u043E\u043D\u0438\u0438"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    placeholder: "\u0413\u043E\u0440\u043E\u0434 \u0438\u043B\u0438 \u0441\u0442\u0440\u0430\u043D\u0430",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "places",
      size: 15
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430",
    placeholder: "\u0413\u0413\u0413\u0413-\u041C\u041C-\u0414\u0414",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 15
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0414\u0430\u0442\u0430 \u043A\u043E\u043D\u0446\u0430",
    placeholder: "\u0413\u0413\u0413\u0413-\u041C\u041C-\u0414\u0414",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 15
    })
  })), /*#__PURE__*/React.createElement(Select, {
    label: "\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u0432\u0430\u043B\u044E\u0442\u0430",
    options: [{
      value: 'eur',
      label: '€ Евро'
    }, {
      value: 'usd',
      label: '$ Доллар США'
    }, {
      value: 'gbp',
      label: '£ Фунт'
    }, {
      value: 'jpy',
      label: '¥ Иена'
    }],
    defaultValue: "eur"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 14px',
      background: 'var(--info-100)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--info-500)',
      font: 'var(--type-small)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 16
  }), " \u0414\u043D\u0438 \u0441\u043E\u0437\u0434\u0430\u0434\u0443\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0438\u0437 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0434\u0430\u0442."));
}
function Placeholder({
  trip,
  view
}) {
  const map = {
    places: {
      icon: 'places',
      title: 'Места и карта',
      body: 'Справочник переиспользуемых мест и карта маршрута. Опциональный экран — пока не заполнен.'
    },
    settings: {
      icon: 'budget',
      title: 'Настройки',
      body: 'Валюта по умолчанию, профиль, импорт из Notion CSV и печать маршрута.'
    }
  };
  const m = map[view] || map.places;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 720,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: trip ? trip.name : 'Tripyfull',
    title: m.title
  }), /*#__PURE__*/React.createElement(EmptyState, {
    icon: m.icon,
    title: m.title + ' · скоро',
    body: m.body
  }));
}
window.PlannerMoney = {
  Bookings,
  BookingForm,
  Budget,
  NewTripForm,
  Placeholder
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/money.jsx", error: String((e && e.message) || e) }); }

// ui_kits/planner/parts.jsx
try { (() => {
/* Tripyfull Planner — shell + shared parts. window.PlannerParts */

const PP_DS = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Avatar
} = PP_DS;
const D = window.PlannerData;

/* ---------- icons (Lucide-style, 2px stroke) ---------- */
const Svg = ({
  size = 20,
  sw = 2,
  fill = 'none',
  children
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, children);
const ICONS = {
  trips: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 20l-5.5 2.5v-15L9 5m0 15l6-3m-6 3v-15m6 12l5.5 2.5v-15L15 2m0 15V2m0 0L9 5"
  })),
  overview: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5",
    rx: "1.5"
  })),
  route: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 16V9a4 4 0 0 1 4-4h4M18 8v7a4 4 0 0 1-4 4h-4"
  })),
  bookings: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 5v14",
    strokeDasharray: "2 2"
  })),
  budget: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1.1 1.8 2.5 2 2.5.7 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"
  })),
  places: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  plus: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  back: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 6l-6 6 6 6"
  })),
  chevron: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  left: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 6l-6 6 6 6"
  })),
  right: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  close: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  edit: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
  })),
  clock: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  trash: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
  })),
  food: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 3v7a2 2 0 0 0 4 0V3M6 11v10M18 3c-1.7 0-3 2-3 5s1.3 4 3 4m0 0v9"
  })),
  plane: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.9-2.6 2.6H3.5a.5.5 0 0 0-.3.9L6 19l1.6 2.8a.5.5 0 0 0 .9-.3v-2.1l2.6-2.6 4.9 3.9a.5.5 0 0 0 .8-.5Z"
  })),
  bed: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 18v2M22 18v2M2 13V7M6 11V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
  })),
  compass: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "16.2 7.8 14 14 7.8 16.2 10 10"
  })),
  tag: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 7v5l9 9 8-8-9-9H3Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "7.5",
    r: "1.4",
    fill: "currentColor",
    stroke: "none"
  })),
  link: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"
  })),
  calendar: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4.5",
    width: "18",
    height: "17",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 9h18M8 2.5v4M16 2.5v4"
  })),
  share: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"
  })),
  alert: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }))
};
const Icon = ({
  name,
  size,
  sw,
  fill
}) => {
  const I = ICONS[name];
  return I ? /*#__PURE__*/React.createElement(I, {
    size: size,
    sw: sw,
    fill: fill
  }) : null;
};
const CatIcon = ({
  cat,
  size = 16
}) => /*#__PURE__*/React.createElement(Icon, {
  name: D.CATEGORY[cat] ? D.CATEGORY[cat].icon : 'tag',
  size: size
});

/* ---------- sidebar ---------- */
function Sidebar({
  trip,
  view,
  onNav,
  onHome
}) {
  const items = trip ? [{
    id: 'overview',
    label: 'Обзор',
    icon: 'overview'
  }, {
    id: 'itinerary',
    label: 'Маршрут',
    icon: 'route'
  }, {
    id: 'bookings',
    label: 'Брони',
    icon: 'bookings'
  }, {
    id: 'budget',
    label: 'Бюджет',
    icon: 'budget'
  }, {
    id: 'places',
    label: 'Места',
    icon: 'places',
    opt: true
  }] : [];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flex: 'none',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 14px',
      cursor: 'pointer'
    },
    onClick: onHome
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-wordmark.svg",
    alt: "Tripyfull",
    style: {
      height: 28
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onHome,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      border: 'none',
      background: trip ? 'transparent' : 'var(--brand-soft)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      color: trip ? 'var(--text-muted)' : 'var(--brand-pressed)',
      font: (trip ? '500' : '600') + ' 15px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trips",
    size: 20
  }), " \u0412\u0441\u0435 \u043F\u043E\u0435\u0437\u0434\u043A\u0438")), trip && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 8px',
      marginTop: 6,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-subtle)',
      marginBottom: 4
    }
  }, "\u041F\u043E\u0435\u0437\u0434\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 17px/1.15 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, trip.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, trip.destination, " \xB7 ", D.dateRange(trip.start, trip.end))), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, items.map(it => {
    const on = it.id === view;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onNav(it.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        background: on ? 'var(--brand)' : 'transparent',
        color: on ? '#fff' : 'var(--text-body)',
        boxShadow: on ? 'var(--shadow-brand)' : 'none',
        font: (on ? '600' : '500') + ' 15px/1 var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 19,
      sw: on ? 2.3 : 2
    }), " ", it.label, it.opt && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        font: '500 10px/1 var(--font-mono)',
        color: on ? 'rgba(255,255,255,0.7)' : 'var(--text-subtle)'
      }
    }, "\u043E\u043F\u0446."));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Mara Ortiz",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      lineHeight: 1.25
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 13px/1.25 var(--font-sans)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap'
    }
  }, "Mara Ortiz"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.2 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438"))));
}

/* ---------- topbar (page header) ---------- */
function PageHead({
  title,
  subtitle,
  actions,
  eyebrow
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 18,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 8
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 32px/1.04 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      margin: '8px 0 0'
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, actions));
}

/* ---------- right-side drawer ---------- */
function Drawer({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  children,
  width = 460
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(33,27,23,0.34)',
      zIndex: 80,
      opacity: open ? 1 : 0,
      pointerEvents: open ? 'auto' : 'none',
      transition: 'opacity var(--dur-base) var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width,
      maxWidth: '94vw',
      zIndex: 81,
      background: 'var(--surface-page)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      transform: open ? 'translateX(0)' : 'translateX(102%)',
      transition: 'transform var(--dur-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '20px 22px 16px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 22px/1.1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 18
    }),
    label: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    variant: "ghost",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 22
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)',
      display: 'flex',
      gap: 12
    }
  }, footer)));
}

/* ---------- centered dialog ---------- */
function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  children,
  width = 520
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(33,27,23,0.4)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      maxHeight: '90vh',
      overflow: 'hidden',
      background: 'var(--surface-page)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'tfpop var(--dur-base) var(--ease-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '22px 24px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 24px/1.1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 18
    }),
    label: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    variant: "ghost",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 24px 8px'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 24px 22px',
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, footer)));
}

/* ---------- empty state ---------- */
function EmptyState({
  icon = 'compass',
  title,
  body,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '56px 24px',
      border: '1.5px dashed var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--brand-soft)',
      color: 'var(--brand)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 26
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '700 20px/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      margin: '0 0 6px'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      margin: '0 auto 20px',
      maxWidth: 360
    }
  }, body), action);
}

/* ---------- skeleton (loading) ---------- */
function Skeleton({
  h = 16,
  w = '100%',
  r = 'var(--radius-sm)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      width: w,
      borderRadius: r,
      background: 'linear-gradient(90deg,var(--ink-100),var(--ink-200),var(--ink-100))',
      backgroundSize: '200% 100%',
      animation: 'tfshimmer 1.3s linear infinite',
      ...style
    }
  });
}

/* ---------- money helpers ---------- */
function Money({
  value,
  cur = '€',
  strong,
  size = 16,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: (strong ? '700' : '600') + ' ' + size + 'px/1 var(--font-display)',
      color: color || 'var(--text-strong)'
    }
  }, D.fmt(value, cur));
}
function ProgressBar({
  value,
  max,
  color = 'var(--brand)',
  h = 8
}) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      background: color,
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  }));
}
window.PlannerParts = {
  Icon,
  CatIcon,
  ICONS,
  Sidebar,
  PageHead,
  Drawer,
  Dialog,
  EmptyState,
  Skeleton,
  Money,
  ProgressBar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/parts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/planner/parts.standalone.jsx
try { (() => {
/* Tripyfull Planner — shell + shared parts. window.PlannerParts */

const PP_DS = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Avatar
} = PP_DS;
const D = window.PlannerData;

/* ---------- icons (Lucide-style, 2px stroke) ---------- */
const Svg = ({
  size = 20,
  sw = 2,
  fill = 'none',
  children
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, children);
const ICONS = {
  trips: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 20l-5.5 2.5v-15L9 5m0 15l6-3m-6 3v-15m6 12l5.5 2.5v-15L15 2m0 15V2m0 0L9 5"
  })),
  overview: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5",
    rx: "1.5"
  })),
  route: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 16V9a4 4 0 0 1 4-4h4M18 8v7a4 4 0 0 1-4 4h-4"
  })),
  bookings: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 5v14",
    strokeDasharray: "2 2"
  })),
  budget: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1.1 1.8 2.5 2 2.5.7 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"
  })),
  places: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  plus: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  back: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 6l-6 6 6 6"
  })),
  chevron: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  left: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 6l-6 6 6 6"
  })),
  right: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  close: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  edit: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
  })),
  clock: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  trash: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
  })),
  food: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M4 3v7a2 2 0 0 0 4 0V3M6 11v10M18 3c-1.7 0-3 2-3 5s1.3 4 3 4m0 0v9"
  })),
  plane: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.9-2.6 2.6H3.5a.5.5 0 0 0-.3.9L6 19l1.6 2.8a.5.5 0 0 0 .9-.3v-2.1l2.6-2.6 4.9 3.9a.5.5 0 0 0 .8-.5Z"
  })),
  bed: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 18v2M22 18v2M2 13V7M6 11V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
  })),
  compass: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "16.2 7.8 14 14 7.8 16.2 10 10"
  })),
  tag: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 7v5l9 9 8-8-9-9H3Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "7.5",
    r: "1.4",
    fill: "currentColor",
    stroke: "none"
  })),
  link: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"
  })),
  calendar: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4.5",
    width: "18",
    height: "17",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 9h18M8 2.5v4M16 2.5v4"
  })),
  share: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"
  })),
  alert: p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }))
};
const Icon = ({
  name,
  size,
  sw,
  fill
}) => {
  const I = ICONS[name];
  return I ? /*#__PURE__*/React.createElement(I, {
    size: size,
    sw: sw,
    fill: fill
  }) : null;
};
const CatIcon = ({
  cat,
  size = 16
}) => /*#__PURE__*/React.createElement(Icon, {
  name: D.CATEGORY[cat] ? D.CATEGORY[cat].icon : 'tag',
  size: size
});

/* ---------- sidebar ---------- */
function Sidebar({
  trip,
  view,
  onNav,
  onHome
}) {
  const items = trip ? [{
    id: 'overview',
    label: 'Обзор',
    icon: 'overview'
  }, {
    id: 'itinerary',
    label: 'Маршрут',
    icon: 'route'
  }, {
    id: 'bookings',
    label: 'Брони',
    icon: 'bookings'
  }, {
    id: 'budget',
    label: 'Бюджет',
    icon: 'budget'
  }, {
    id: 'places',
    label: 'Места',
    icon: 'places',
    opt: true
  }] : [];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flex: 'none',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 14px',
      cursor: 'pointer'
    },
    onClick: onHome
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources.wordmark,
    alt: "Tripyfull",
    style: {
      height: 28
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onHome,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      border: 'none',
      background: trip ? 'transparent' : 'var(--brand-soft)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      color: trip ? 'var(--text-muted)' : 'var(--brand-pressed)',
      font: (trip ? '500' : '600') + ' 15px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trips",
    size: 20
  }), " \u0412\u0441\u0435 \u043F\u043E\u0435\u0437\u0434\u043A\u0438")), trip && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 8px',
      marginTop: 6,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-subtle)',
      marginBottom: 4
    }
  }, "\u041F\u043E\u0435\u0437\u0434\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 17px/1.15 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, trip.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, trip.destination, " \xB7 ", D.dateRange(trip.start, trip.end))), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, items.map(it => {
    const on = it.id === view;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onNav(it.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        background: on ? 'var(--brand)' : 'transparent',
        color: on ? '#fff' : 'var(--text-body)',
        boxShadow: on ? 'var(--shadow-brand)' : 'none',
        font: (on ? '600' : '500') + ' 15px/1 var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 19,
      sw: on ? 2.3 : 2
    }), " ", it.label, it.opt && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        font: '500 10px/1 var(--font-mono)',
        color: on ? 'rgba(255,255,255,0.7)' : 'var(--text-subtle)'
      }
    }, "\u043E\u043F\u0446."));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Mara Ortiz",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      lineHeight: 1.25
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 13px/1.25 var(--font-sans)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap'
    }
  }, "Mara Ortiz"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.2 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438"))));
}

/* ---------- topbar (page header) ---------- */
function PageHead({
  title,
  subtitle,
  actions,
  eyebrow
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 18,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 8
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 32px/1.04 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      margin: '8px 0 0'
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, actions));
}

/* ---------- right-side drawer ---------- */
function Drawer({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  children,
  width = 460
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(33,27,23,0.34)',
      zIndex: 80,
      opacity: open ? 1 : 0,
      pointerEvents: open ? 'auto' : 'none',
      transition: 'opacity var(--dur-base) var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width,
      maxWidth: '94vw',
      zIndex: 81,
      background: 'var(--surface-page)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      transform: open ? 'translateX(0)' : 'translateX(102%)',
      transition: 'transform var(--dur-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '20px 22px 16px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 22px/1.1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 18
    }),
    label: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    variant: "ghost",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 22
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)',
      display: 'flex',
      gap: 12
    }
  }, footer)));
}

/* ---------- centered dialog ---------- */
function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  children,
  width = 520
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(33,27,23,0.4)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      maxHeight: '90vh',
      overflow: 'hidden',
      background: 'var(--surface-page)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'tfpop var(--dur-base) var(--ease-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '22px 24px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '700 24px/1.1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 18
    }),
    label: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    variant: "ghost",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 24px 8px'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 24px 22px',
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, footer)));
}

/* ---------- empty state ---------- */
function EmptyState({
  icon = 'compass',
  title,
  body,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '56px 24px',
      border: '1.5px dashed var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--brand-soft)',
      color: 'var(--brand)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 26
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '700 20px/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      margin: '0 0 6px'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      margin: '0 auto 20px',
      maxWidth: 360
    }
  }, body), action);
}

/* ---------- skeleton (loading) ---------- */
function Skeleton({
  h = 16,
  w = '100%',
  r = 'var(--radius-sm)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      width: w,
      borderRadius: r,
      background: 'linear-gradient(90deg,var(--ink-100),var(--ink-200),var(--ink-100))',
      backgroundSize: '200% 100%',
      animation: 'tfshimmer 1.3s linear infinite',
      ...style
    }
  });
}

/* ---------- money helpers ---------- */
function Money({
  value,
  cur = '€',
  strong,
  size = 16,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: (strong ? '700' : '600') + ' ' + size + 'px/1 var(--font-display)',
      color: color || 'var(--text-strong)'
    }
  }, D.fmt(value, cur));
}
function ProgressBar({
  value,
  max,
  color = 'var(--brand)',
  h = 8
}) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      background: color,
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  }));
}
window.PlannerParts = {
  Icon,
  CatIcon,
  ICONS,
  Sidebar,
  PageHead,
  Drawer,
  Dialog,
  EmptyState,
  Skeleton,
  Money,
  ProgressBar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/parts.standalone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/planner/screens.jsx
try { (() => {
/* Tripyfull Planner — trip screens. window.PlannerScreens */

const PS_DS = window.TripyfullDesignSystem_bc2c08;
const {
  Button,
  IconButton,
  Badge,
  Card,
  Input,
  Select,
  Checkbox
} = PS_DS;
const PT = window.PlannerParts;
const DD = window.PlannerData;
const {
  Icon,
  CatIcon,
  PageHead,
  EmptyState,
  Skeleton,
  Money,
  ProgressBar
} = PT;

/* =========================================================
   1. TRIPS LIST (Home)
   ========================================================= */
function TripsList({
  onOpen,
  onNew,
  loading
}) {
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        maxWidth: 1040,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      h: 40,
      w: 280,
      style: {
        marginBottom: 28
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 20
      }
    }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      h: 130,
      r: "0"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 18
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      h: 20,
      w: "70%",
      style: {
        marginBottom: 10
      }
    }), /*#__PURE__*/React.createElement(Skeleton, {
      h: 14,
      w: "50%"
    }))))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 1040,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Tripyfull",
    title: "\u041C\u043E\u0438 \u043F\u043E\u0435\u0437\u0434\u043A\u0438",
    subtitle: "\u0412\u0441\u0451, \u0447\u0442\u043E \u0442\u044B \u0437\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043B \u2014 \u0432 \u043F\u043E\u043B\u043D\u043E\u043C \u043F\u043E\u0440\u044F\u0434\u043A\u0435.",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 18
      }),
      onClick: onNew
    }, "\u041D\u043E\u0432\u0430\u044F \u043F\u043E\u0435\u0437\u0434\u043A\u0430")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20
    }
  }, DD.trips.map(t => {
    const st = DD.TRIP_STATUS[t.status];
    const left = t.planned - t.paid;
    return /*#__PURE__*/React.createElement(Card, {
      key: t.id,
      padding: "none",
      interactive: true,
      elevation: "sm",
      onClick: () => onOpen(t.id),
      style: {
        overflow: 'hidden',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 130,
        background: t.wash,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(33,27,23,0.4), transparent 60%)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 12,
        left: 12
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: st.tone,
      variant: "solid"
    }, st.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 14,
        bottom: 12,
        color: '#fff'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '700 22px/1.05 var(--font-display)',
        letterSpacing: '-0.02em'
      }
    }, t.name), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '400 13px/1.2 var(--font-sans)',
        opacity: 0.92,
        marginTop: 3
      }
    }, t.destination))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 16px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        font: '500 12px/1 var(--font-mono)',
        color: 'var(--text-muted)',
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 14
    }), " ", DD.dateRange(t.start, t.end)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--type-small)',
        color: 'var(--text-muted)'
      }
    }, "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ", DD.fmt(t.paid, t.currency)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 12px/1 var(--font-mono)',
        color: left > 0 ? 'var(--coral-600)' : 'var(--success-500)'
      }
    }, left > 0 ? 'осталось ' + DD.fmt(left, t.currency) : 'всё оплачено')), /*#__PURE__*/React.createElement(ProgressBar, {
      value: t.paid,
      max: t.planned,
      color: left > 0 ? 'var(--brand)' : 'var(--success-500)',
      h: 7
    })));
  })));
}

/* =========================================================
   3. TRIP DASHBOARD
   ========================================================= */
function Dashboard({
  trip,
  onEdit,
  onOpenDay,
  onGo
}) {
  const planned = trip.planned,
    paid = trip.paid,
    left = planned - paid;
  const upcoming = DD.bookings.flatMap(b => b.payments.filter(p => !p.paid).map(p => ({
    ...p,
    title: b.title,
    cat: b.cat
  }))).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 1040,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: DD.TRIP_STATUS[trip.status].label,
    title: trip.name,
    subtitle: trip.destination + ' · ' + DD.dateRange(trip.start, trip.end),
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "edit",
        size: 16
      }),
      onClick: onEdit
    }, "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 20,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u0411\u044E\u0434\u0436\u0435\u0442"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 15
    }),
    onClick: () => onGo('budget')
  }, "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(SumStat, {
    label: "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
    value: planned,
    cur: trip.currency
  }), /*#__PURE__*/React.createElement(SumStat, {
    label: "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E",
    value: paid,
    cur: trip.currency,
    color: "var(--success-500)"
  }), /*#__PURE__*/React.createElement(SumStat, {
    label: "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C",
    value: left,
    cur: trip.currency,
    color: "var(--coral-600)"
  })), /*#__PURE__*/React.createElement(ProgressBar, {
    value: paid,
    max: planned
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-muted)',
      marginTop: 8
    }
  }, Math.round(paid / planned * 100), "% \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E")), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: '0 0 14px'
    }
  }, "\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u043F\u043B\u0430\u0442\u0435\u0436\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, upcoming.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-md)',
      background: DD.CATEGORY[p.cat].soft,
      color: DD.CATEGORY[p.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: p.cat,
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.2 var(--font-sans)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, DD.dateShort(p.date))), /*#__PURE__*/React.createElement(Money, {
    value: p.amount,
    cur: trip.currency,
    size: 14
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u0414\u043D\u0438 \u043F\u043E\u0435\u0437\u0434\u043A\u0438"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 15
    }),
    onClick: () => onGo('itinerary')
  }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0430\u0440\u0448\u0440\u0443\u0442")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, DD.days.map(d => {
    const cost = DD.dayCost(d.id);
    return /*#__PURE__*/React.createElement(Card, {
      key: d.id,
      padding: "sm",
      interactive: true,
      elevation: "sm",
      onClick: () => onOpenDay(d.id),
      style: {
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: '700 15px/1 var(--font-display)',
        color: 'var(--text-strong)'
      }
    }, "\u0414\u0435\u043D\u044C ", d.n), /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 11px/1 var(--font-mono)',
        color: 'var(--text-subtle)'
      }
    }, DD.dateShort(d.date))), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 13px/1.2 var(--font-sans)',
        color: 'var(--accent)',
        margin: '8px 0 10px'
      }
    }, d.city), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--type-small)',
        color: 'var(--text-muted)'
      }
    }, d.activities.length === 0 ? 'пусто' : d.activities.length + ' ' + (d.activities.length === 1 ? 'пункт' : 'пункта')), cost > 0 && /*#__PURE__*/React.createElement(Money, {
      value: cost,
      cur: trip.currency,
      size: 13,
      color: "var(--text-muted)"
    })));
  })), /*#__PURE__*/React.createElement(Card, {
    elevation: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      margin: 0
    }
  }, "\u0411\u0440\u043E\u043D\u0438 \xB7 ", DD.bookings.length), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 15
    }),
    onClick: () => onGo('bookings')
  }, "\u0412\u0441\u0435 \u0431\u0440\u043E\u043D\u0438")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, DD.bookings.slice(0, 3).map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0',
      borderBottom: '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-md)',
      background: DD.CATEGORY[b.cat].soft,
      color: DD.CATEGORY[b.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: b.cat,
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, b.title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, b.provider)), /*#__PURE__*/React.createElement(Badge, {
    tone: DD.PAYMENT_STATUS[b.status].tone,
    variant: "soft"
  }, DD.PAYMENT_STATUS[b.status].label), /*#__PURE__*/React.createElement(Money, {
    value: b.price,
    cur: trip.currency,
    size: 14
  }))))));
}
function SumStat({
  label,
  value,
  cur,
  color
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 12px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement(Money, {
    value: value,
    cur: cur,
    size: 26,
    strong: true,
    color: color
  }));
}

/* =========================================================
   4. DAY ITINERARY  +  5. ACTIVITY DRAWER
   ========================================================= */
function DayItinerary({
  trip,
  dayId,
  setDayId,
  onAdd,
  onEditActivity
}) {
  const idx = DD.days.findIndex(d => d.id === dayId);
  const day = DD.days[idx];
  const acts = day.activities.map(id => DD.activities[id]);
  const byCat = {};
  acts.forEach(a => {
    byCat[a.cat] = (byCat[a.cat] || 0) + a.cost;
  });
  const total = acts.reduce((s, a) => s + a.cost, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      maxWidth: 880,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "left",
      size: 18
    }),
    label: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0434\u0435\u043D\u044C",
    variant: "outline",
    onClick: () => idx > 0 && setDayId(DD.days[idx - 1].id),
    disabled: idx === 0
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tf-eyebrow",
    style: {
      marginBottom: 4
    }
  }, "\u0414\u0435\u043D\u044C ", day.n, " \xB7 ", DD.dateShort(day.date)), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '700 30px/1 var(--font-display)',
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, day.city, " ", /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 16
  }))), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "right",
      size: 18
    }),
    label: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0434\u0435\u043D\u044C",
    variant: "outline",
    onClick: () => idx < DD.days.length - 1 && setDayId(DD.days[idx + 1].id),
    disabled: idx === DD.days.length - 1
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    }),
    onClick: onAdd
  }, "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      marginBottom: 24,
      paddingBottom: 4
    }
  }, DD.days.map(d => {
    const on = d.id === dayId;
    return /*#__PURE__*/React.createElement("button", {
      key: d.id,
      onClick: () => setDayId(d.id),
      style: {
        flex: 'none',
        border: 'none',
        cursor: 'pointer',
        background: on ? 'var(--brand)' : 'var(--surface-card)',
        color: on ? '#fff' : 'var(--text-muted)',
        boxShadow: on ? 'var(--shadow-brand)' : 'var(--shadow-xs)',
        borderRadius: 'var(--radius-md)',
        padding: '9px 13px',
        textAlign: 'center',
        minWidth: 58
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '600 13px/1 var(--font-sans)'
      }
    }, "\u0414", d.n), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 10px/1.4 var(--font-mono)',
        opacity: 0.8,
        marginTop: 3
      }
    }, DD.dateShort(d.date)));
  })), acts.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "route",
    title: "\u0412 \u044D\u0442\u043E\u043C \u0434\u043D\u0435 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E",
    body: "\u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u2014 \u043C\u044B \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043C \u0435\u0451 \u043D\u0430 \u043D\u0443\u0436\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 18
      }),
      onClick: onAdd
    }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, acts.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 6,
      minWidth: 46
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, a.start), i < acts.length - 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 2,
      flex: 1,
      background: 'var(--border-subtle)',
      marginTop: 8,
      borderRadius: 2
    }
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "sm",
    interactive: true,
    elevation: "sm",
    onClick: () => onEditActivity(a.id),
    style: {
      flex: 1,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 40,
      height: 40,
      borderRadius: 'var(--radius-md)',
      background: DD.CATEGORY[a.cat].soft,
      color: DD.CATEGORY[a.cat].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: a.cat,
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 16px/1.2 var(--font-sans)',
      color: 'var(--text-strong)'
    }
  }, a.title), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    variant: "soft"
  }, DD.CATEGORY[a.cat].label)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 13px/1.3 var(--font-sans)',
      color: 'var(--text-muted)',
      marginTop: 3,
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 13
  }), a.start, "\u2013", a.end), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "places",
    size: 13
  }), a.address))), a.cost > 0 && /*#__PURE__*/React.createElement(Money, {
    value: a.cost,
    cur: trip.currency,
    size: 15
  })))))), acts.length > 0 && /*#__PURE__*/React.createElement(Card, {
    elevation: "sm",
    style: {
      marginTop: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, Object.keys(byCat).map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 'var(--radius-sm)',
      background: DD.CATEGORY[c].soft,
      color: DD.CATEGORY[c].color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(CatIcon, {
    cat: c,
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, DD.CATEGORY[c].label), /*#__PURE__*/React.createElement(Money, {
    value: byCat[c],
    cur: trip.currency,
    size: 13
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "\u0418\u0442\u043E\u0433 \u0434\u043D\u044F"), /*#__PURE__*/React.createElement(Money, {
    value: total,
    cur: trip.currency,
    size: 20,
    strong: true
  }))));
}

/* Activity drawer body */
function ActivityForm({
  activity
}) {
  const a = activity || {};
  const catOpts = Object.keys(DD.CATEGORY).map(k => ({
    value: k,
    label: DD.CATEGORY[k].label
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    defaultValue: a.title,
    placeholder: "\u0427\u0442\u043E \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C?"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "\u0422\u0438\u043F",
    options: catOpts,
    defaultValue: a.cat || 'activity'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u041D\u0430\u0447\u0430\u043B\u043E",
    defaultValue: a.start,
    placeholder: "10:00",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 15
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u041A\u043E\u043D\u0435\u0446",
    defaultValue: a.end,
    placeholder: "11:30",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 15
    })
  })), /*#__PURE__*/React.createElement(Input, {
    label: "\u0410\u0434\u0440\u0435\u0441",
    defaultValue: a.address,
    placeholder: "\u041C\u0435\u0441\u0442\u043E \u0438\u043B\u0438 \u0430\u0434\u0440\u0435\u0441",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "places",
      size: 15
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C",
    type: "number",
    defaultValue: a.cost,
    placeholder: "0",
    helper: "\u0412 \u0432\u0430\u043B\u044E\u0442\u0435 \u043F\u043E\u0435\u0437\u0434\u043A\u0438"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438",
    defaultValue: a.note,
    placeholder: "\u041B\u044E\u0431\u044B\u0435 \u0434\u0435\u0442\u0430\u043B\u0438"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      font: '500 14px/1.3 var(--font-sans)',
      color: 'var(--text-strong)',
      display: 'block',
      marginBottom: 6
    }
  }, "\u0421\u0441\u044B\u043B\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 14px',
      border: '1.5px dashed var(--border-default)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-muted)',
      font: 'var(--type-small)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "link",
    size: 15
  }), " \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443")));
}
window.PlannerScreens = {
  TripsList,
  Dashboard,
  DayItinerary,
  ActivityForm
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/planner/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
