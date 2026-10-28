/**
 * Every icon in this app is a hand-drawn vector path, never an emoji or
 * image asset glyph, per this account's no-emoji-UI rule. Stroke-based,
 * monochrome, sized to the parent's `color` prop so they work on both the
 * black canvas and white glass surfaces.
 */
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function HangerIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6.2" r="1.6" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 7.8 L4 17 H20 L12 7.8 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Line x1="7" y1="19.2" x2="17" y2="19.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="3.4" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function StarIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 3.5 14.5 9.4 21 10 16 14.3 17.5 20.5 12 17.1 6.5 20.5 8 14.3 3 10 9.5 9.4 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShuffleIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="17 3 21 3 21 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="3" x2="13" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3 7h3.5a3 3 0 0 1 2.4 1.2L15 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="17 21 21 21 21 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 17h3.5a3 3 0 0 0 2.4-1.2L10 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 7V4.5h6V7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 7l1 13h10l1-13" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="5 12.5 10 17.5 19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15 5 8 12 15 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 5 16 12 9 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GridIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LayersIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="12 3 21 8.5 12 14 3 8.5 12 3" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Polyline points="3 14 12 19.5 21 14" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MenuIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ArchiveIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5h16v4H4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
      <Path d="M5.5 9v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Line x1="9.5" y1="13" x2="14.5" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SuitcaseIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M4.5 8.5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Line x1="4.5" y1="13" x2="19.5" y2="13" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function ChartIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="20" x2="5" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="19" y1="20" x2="19" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function LightbulbIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5a5.5 5.5 0 0 0-3 10.1c.6.4 1 1.1 1 1.9v.5h4v-.5c0-.8.4-1.5 1-1.9A5.5 5.5 0 0 0 12 3.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line x1="10" y1="19" x2="14" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="10.5" y1="21" x2="13.5" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SunIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="12" y1="2.5" x2="12" y2="5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="19" x2="12" y2="21.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4.2" y1="4.2" x2="6" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="18" y1="18" x2="19.8" y2="19.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="2.5" y1="12" x2="5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="19" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4.2" y1="19.8" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="18" y1="6" x2="19.8" y2="4.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function DownloadIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="3.5" x2="12" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="7.5,10 12,14.5 16.5,10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M4.5 16.5V18.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function UploadIcon({ size = 24, color = '#F7F8F8', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="14.5" x2="12" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="7.5,8 12,3.5 16.5,8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M4.5 16.5V18.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
