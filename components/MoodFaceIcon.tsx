import React from 'react';
import { DEFAULT_MOOD_ICON_PACK_ID, MoodIconPackId, MoodLevelMeta, readMoodIconPackId } from '../src/constants/moodV2';

interface MoodFaceIconProps {
  mood: MoodLevelMeta;
  size?: number;
  className?: string;
  packId?: MoodIconPackId;
}

const baseStrokeProps = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2.6
};

const thinStrokeProps = {
  ...baseStrokeProps,
  strokeWidth: 2.1
};

const softStrokeProps = {
  ...baseStrokeProps,
  strokeWidth: 2.3
};

const boldStrokeProps = {
  ...baseStrokeProps,
  strokeWidth: 3,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const
};

const renderPlayful = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  switch (mood.iconKey) {
    case 'ecstatic':
      return <>
        <rect x="4" y="4" width="56" height="56" rx="8" fill={mood.surfaceColor} />
        <path d="M14 19c1.4-3.2 4.1-4.8 7.2-4.8 3 0 5.5 1.3 7 4.2" stroke={stroke} {...baseStrokeProps} />
        <path d="M35 18.8c1.1-3.1 3.8-4.6 6.9-4.6 3 0 5.7 1.5 7.1 4.7" stroke={stroke} {...baseStrokeProps} />
        <path d="M17 34c2.1 7 7.9 11 15 11 7.2 0 13-4.1 15-11v0c0-1.1-.9-2-2-2H19c-1.1 0-2 .9-2 2Z" fill={stroke} />
        <path d="M24 39.5c2.5 2.6 5.2 4.1 8 4.1 2.8 0 5.4-1.4 8-4.1" stroke={mood.surfaceColor} {...baseStrokeProps} />
      </>;
    case 'happy':
      return <>
        <rect x="4" y="4" width="56" height="56" rx="8" fill={mood.surfaceColor} />
        <circle cx="20" cy="25" r="3.2" stroke={stroke} {...baseStrokeProps} />
        <circle cx="44" cy="25" r="3.2" stroke={stroke} {...baseStrokeProps} />
        <path d="M19 39c3.1 3.8 7.5 5.8 13 5.8 5.5 0 10-2 13-5.8" stroke={stroke} {...baseStrokeProps} />
      </>;
    case 'okay':
      return <>
        <rect x="4" y="4" width="56" height="56" rx="8" fill={mood.surfaceColor} />
        <path d="M16 22h12" stroke={stroke} {...baseStrokeProps} />
        <path d="M18 26.5h8" stroke={stroke} {...baseStrokeProps} />
        <path d="M36 22h12" stroke={stroke} {...baseStrokeProps} />
        <path d="M38 26.5h8" stroke={stroke} {...baseStrokeProps} />
        <path d="M20 40h24" stroke={stroke} {...baseStrokeProps} />
        <circle cx="32" cy="27" r="1.3" fill={stroke} />
        <circle cx="32" cy="22" r="1.3" fill={stroke} />
      </>;
    case 'upset':
      return <>
        <rect x="4" y="4" width="56" height="56" rx="8" fill={mood.surfaceColor} />
        <path d="M14 21.5 24 17" stroke={stroke} {...baseStrokeProps} />
        <path d="M40 17 50 21.5" stroke={stroke} {...baseStrokeProps} />
        <circle cx="22" cy="28" r="3" stroke={stroke} {...baseStrokeProps} />
        <circle cx="42" cy="28" r="3" stroke={stroke} {...baseStrokeProps} />
        <path d="M22 40c2.2-3.2 5.6-5 10-5 4.3 0 7.6 1.7 10 5" stroke={stroke} {...baseStrokeProps} />
        <circle cx="15.5" cy="32.5" r="1.4" fill={stroke} />
        <circle cx="18.5" cy="36" r="1.1" fill={stroke} />
      </>;
    case 'awful':
      return <>
        <rect x="4" y="4" width="56" height="56" rx="8" fill={mood.surfaceColor} />
        <path d="M15 14h10v24H15z" stroke={stroke} {...baseStrokeProps} />
        <path d="M39 14h10v24H39z" stroke={stroke} {...baseStrokeProps} />
        <path d="M13 14h14" stroke={stroke} {...baseStrokeProps} />
        <path d="M37 14h14" stroke={stroke} {...baseStrokeProps} />
        <path d="M22 46c2.1-4 5.3-6 10-6 4.7 0 7.9 2 10 6" stroke={stroke} {...baseStrokeProps} />
      </>;
    default:
      return null;
  }
};

const renderPebble = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <circle cx="32" cy="32" r="28" fill={mood.surfaceColor} />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M17 24c2-2.8 4.6-4.2 7.8-4.2 3 0 5.7 1.3 7.7 4" stroke={stroke} {...softStrokeProps} />
      <path d="M31.5 24c2-2.8 4.7-4.2 7.8-4.2 3.1 0 5.8 1.4 7.8 4.2" stroke={stroke} {...softStrokeProps} />
      <path d="M19.5 34.5c2.2 5.2 6.5 8 12.5 8s10.3-2.8 12.5-8" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'happy' && <>
      <circle cx="22" cy="27" r="2.9" stroke={stroke} {...softStrokeProps} />
      <circle cx="42" cy="27" r="2.9" stroke={stroke} {...softStrokeProps} />
      <path d="M21 38c2.8 2.8 6.4 4.3 11 4.3 4.7 0 8.3-1.5 11-4.3" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <circle cx="22" cy="27" r="2.2" fill={stroke} />
      <circle cx="42" cy="27" r="2.2" fill={stroke} />
      <path d="M23 39h18" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 23 24 20" stroke={stroke} {...softStrokeProps} />
      <path d="M40 20 47 23" stroke={stroke} {...softStrokeProps} />
      <circle cx="22" cy="29" r="2.7" stroke={stroke} {...softStrokeProps} />
      <circle cx="42" cy="29" r="2.7" stroke={stroke} {...softStrokeProps} />
      <path d="M23 40c2.1-1.9 5.1-2.9 9-2.9s6.9 1 9 2.9" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M18 20h9v18h-9z" stroke={stroke} {...softStrokeProps} />
      <path d="M37 20h9v18h-9z" stroke={stroke} {...softStrokeProps} />
      <path d="M23 42c2.2-2.2 5.2-3.3 9-3.3 3.8 0 6.8 1.1 9 3.3" stroke={stroke} {...softStrokeProps} />
    </>}
  </>;
};

const renderMinimal = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <rect x="8" y="8" width="48" height="48" rx="16" fill={mood.surfaceColor} opacity="0.72" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M19 25c1.8-1.9 3.9-2.8 6.5-2.8 2.5 0 4.7.9 6.4 2.8" stroke={stroke} {...thinStrokeProps} />
      <path d="M32.1 25c1.8-1.9 3.9-2.8 6.4-2.8 2.6 0 4.8.9 6.5 2.8" stroke={stroke} {...thinStrokeProps} />
      <path d="M21 37.5c3 3.1 6.7 4.6 11 4.6s8-1.5 11-4.6" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'happy' && <>
      <circle cx="23" cy="28" r="2.2" fill={stroke} />
      <circle cx="41" cy="28" r="2.2" fill={stroke} />
      <path d="M23 38c2.6 2.3 5.6 3.4 9 3.4s6.4-1.1 9-3.4" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M21 28h4" stroke={stroke} {...thinStrokeProps} />
      <path d="M39 28h4" stroke={stroke} {...thinStrokeProps} />
      <path d="M24 39h16" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M19 25 25 22" stroke={stroke} {...thinStrokeProps} />
      <path d="M39 22 45 25" stroke={stroke} {...thinStrokeProps} />
      <circle cx="23" cy="30" r="2.3" fill={stroke} />
      <circle cx="41" cy="30" r="2.3" fill={stroke} />
      <path d="M24 40c2-1.4 4.6-2.1 8-2.1s6 0.7 8 2.1" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 22h8v17h-8z" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 22h8v17h-8z" stroke={stroke} {...thinStrokeProps} />
      <path d="M24 42c2-1.9 4.7-2.8 8-2.8s6 .9 8 2.8" stroke={stroke} {...thinStrokeProps} />
    </>}
  </>;
};

const renderSticker = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="white" opacity="0.9" />
    <rect x="9" y="9" width="46" height="46" rx="12" fill={mood.surfaceColor} />
    <rect x="9" y="9" width="46" height="46" rx="12" stroke={stroke} strokeOpacity="0.22" strokeWidth="1.6" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M18 23c1.5-2.3 3.9-3.6 6.8-3.6 2.9 0 5.2 1.2 6.8 3.6" stroke={stroke} {...baseStrokeProps} />
      <path d="M32.4 23c1.5-2.3 3.8-3.6 6.8-3.6 2.9 0 5.3 1.2 6.8 3.6" stroke={stroke} {...baseStrokeProps} />
      <path d="M19 34h26c0 4.9-5.2 9.1-13 9.1S19 38.9 19 34Z" fill={stroke} />
    </>}
    {mood.iconKey === 'happy' && <>
      <circle cx="23" cy="27" r="3.1" stroke={stroke} {...baseStrokeProps} />
      <circle cx="41" cy="27" r="3.1" stroke={stroke} {...baseStrokeProps} />
      <path d="M22 38c2.5 2.7 5.8 4 10 4 4.1 0 7.5-1.3 10-4" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M20 27h8" stroke={stroke} {...baseStrokeProps} />
      <path d="M36 27h8" stroke={stroke} {...baseStrokeProps} />
      <path d="M23 39h18" stroke={stroke} {...baseStrokeProps} />
      <circle cx="32" cy="32" r="1.5" fill={stroke} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M18 23 26 20" stroke={stroke} {...baseStrokeProps} />
      <path d="M38 20 46 23" stroke={stroke} {...baseStrokeProps} />
      <circle cx="23" cy="29" r="2.8" stroke={stroke} {...baseStrokeProps} />
      <circle cx="41" cy="29" r="2.8" stroke={stroke} {...baseStrokeProps} />
      <path d="M23 40c2.3-2.1 5.3-3.1 9-3.1 3.7 0 6.7 1 9 3.1" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M20 19h8v20h-8z" stroke={stroke} {...baseStrokeProps} />
      <path d="M36 19h8v20h-8z" stroke={stroke} {...baseStrokeProps} />
      <path d="M24 43c1.8-2.2 4.4-3.3 8-3.3s6.2 1.1 8 3.3" stroke={stroke} {...baseStrokeProps} />
    </>}
  </>;
};

const renderDoodle = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <path d="M10 14c0-4.4 3.6-8 8-8h28c4.4 0 8 3.6 8 8v28c0 6.6-5.4 12-12 12H18C11.4 54 6 48.6 6 42V18c0-2.1 1.7-4 4-4Z" fill={mood.surfaceColor} />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M17 24c1.9-2.5 4.3-3.9 7-3.9 2.7 0 5.1 1.1 7.1 3.5" stroke={stroke} {...softStrokeProps} />
      <path d="M34 22.8c1.7-1.8 4-2.7 6.8-2.7 2.9 0 5.3 1.1 7.2 3.4" stroke={stroke} {...softStrokeProps} />
      <path d="M18 34.5c3.2 5.4 7.9 8.2 14 8.2 6 0 10.7-2.8 14-8.2" stroke={stroke} {...softStrokeProps} />
      <circle cx="50" cy="18" r="1.5" fill={stroke} />
    </>}
    {mood.iconKey === 'happy' && <>
      <path d="M19 27c0-2.1 1.4-3.5 3.2-3.5 1.9 0 3.3 1.4 3.3 3.5" stroke={stroke} {...softStrokeProps} />
      <path d="M38.5 27c0-2.1 1.5-3.5 3.3-3.5 1.8 0 3.2 1.4 3.2 3.5" stroke={stroke} {...softStrokeProps} />
      <path d="M21 38c2.8 3.2 6.5 4.8 11 4.8s8.2-1.6 11-4.8" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M19 27h8" stroke={stroke} {...softStrokeProps} />
      <path d="M37 27h8" stroke={stroke} {...softStrokeProps} />
      <path d="M23 39.5c3-.2 6-.3 9-.3 3.1 0 6.1.1 9 .3" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 24 25 20" stroke={stroke} {...softStrokeProps} />
      <path d="M39 20 47 24" stroke={stroke} {...softStrokeProps} />
      <path d="M21 31c1.1-1.7 2.6-2.5 4.5-2.5" stroke={stroke} {...softStrokeProps} />
      <path d="M38.5 28.5c1.9 0 3.4.8 4.5 2.5" stroke={stroke} {...softStrokeProps} />
      <path d="M23 40.5c2.2-1.8 5.2-2.7 9-2.7 3.7 0 6.7.9 9 2.7" stroke={stroke} {...softStrokeProps} />
      <circle cx="15.5" cy="34" r="1.2" fill={stroke} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 19h8v19h-8z" stroke={stroke} {...softStrokeProps} />
      <path d="M37 19h8v19h-8z" stroke={stroke} {...softStrokeProps} />
      <path d="M24 43c2.2-2.1 4.9-3.1 8-3.1 3.1 0 5.8 1 8 3.1" stroke={stroke} {...softStrokeProps} />
      <path d="M17 17h9" stroke={stroke} {...softStrokeProps} />
      <path d="M38 17h9" stroke={stroke} {...softStrokeProps} />
    </>}
  </>;
};

const renderTile = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <rect x="6" y="6" width="52" height="52" rx="4" fill={mood.surfaceColor} />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M16 20h14" stroke={stroke} {...boldStrokeProps} />
      <path d="M34 20h14" stroke={stroke} {...boldStrokeProps} />
      <path d="M20 35h24v8H20z" fill={stroke} />
    </>}
    {mood.iconKey === 'happy' && <>
      <rect x="18" y="24" width="7" height="7" stroke={stroke} {...boldStrokeProps} />
      <rect x="39" y="24" width="7" height="7" stroke={stroke} {...boldStrokeProps} />
      <path d="M22 40h20" stroke={stroke} {...boldStrokeProps} />
      <path d="M25 44h14" stroke={stroke} {...boldStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M17 26h11" stroke={stroke} {...boldStrokeProps} />
      <path d="M36 26h11" stroke={stroke} {...boldStrokeProps} />
      <rect x="30" y="22" width="4" height="10" fill={stroke} />
      <path d="M21 40h22" stroke={stroke} {...boldStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 23 26 19" stroke={stroke} {...boldStrokeProps} />
      <path d="M38 19 47 23" stroke={stroke} {...boldStrokeProps} />
      <rect x="19" y="27" width="6" height="6" stroke={stroke} {...boldStrokeProps} />
      <rect x="39" y="27" width="6" height="6" stroke={stroke} {...boldStrokeProps} />
      <path d="M22 42h20" stroke={stroke} {...boldStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <rect x="18" y="18" width="8" height="20" stroke={stroke} {...boldStrokeProps} />
      <rect x="38" y="18" width="8" height="20" stroke={stroke} {...boldStrokeProps} />
      <path d="M23 43h18" stroke={stroke} {...boldStrokeProps} />
      <path d="M27 47h10" stroke={stroke} {...boldStrokeProps} />
    </>}
  </>;
};

const renderers: Record<MoodIconPackId, (mood: MoodLevelMeta) => React.ReactNode> = {
  playful: renderPlayful,
  pebble: renderPebble,
  minimal: renderMinimal,
  sticker: renderSticker,
  doodle: renderDoodle,
  tile: renderTile
};

export const MoodFaceIcon: React.FC<MoodFaceIconProps> = ({ mood, size = 56, className = '', packId }) => {
  const activePack = packId || readMoodIconPackId() || DEFAULT_MOOD_ICON_PACK_ID;
  const render = renderers[activePack] || renderers[DEFAULT_MOOD_ICON_PACK_ID];

  return (
    <span className={className} style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        {render(mood)}
      </svg>
    </span>
  );
};
