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

const renderColoredPencilSticker = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  const pencil = mood.color;
  return <>
    <path d="M14 11c3-2 8-3 18-3 13 0 18 2.5 20.5 5.5S56 20 56 32c0 10.5-2 16.7-5.3 20S42.5 56 32 56c-10.5 0-15.9-1.1-19.6-4.1C8.7 48.9 8 42.4 8 32c0-9.7 1-17.3 6-21Z" fill="white" opacity="0.96" />
    <path d="M16 14c2.7-1.7 7.1-2.6 16-2.6 11.7 0 16 2.2 18.3 4.9 2.3 2.7 3.7 7.3 3.7 15.7 0 9.2-1.7 14.6-4.6 17.2-2.8 2.7-7.7 3.9-17.4 3.9-9.5 0-14.4-1.1-17.6-3.7-3.1-2.5-4.4-7.7-4.4-17.4 0-8.6 1-15.1 5.9-18Z" fill={mood.surfaceColor} />
    <path d="M17 14.5c2.8-1.9 7.3-2.8 15-2.8 9 0 15.1 1.1 18 4.2" stroke={stroke} strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.4 3.2" />
    <path d="M18 19c2.4-3 5.1-4.4 8.1-4.4 2.7 0 5 1 7.1 3" stroke={pencil} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.92" />
    <path d="M38 17.8c2.2-2.2 4.8-3.2 7.6-3.2 2.3 0 4.5 0.8 6.4 2.4" stroke={pencil} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.92" />
    <circle cx="21" cy="35" r="3.8" fill={mood.softColor} opacity="0.8" />
    <circle cx="43" cy="35" r="3.8" fill={mood.softColor} opacity="0.8" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M18 25c2.3 3 4.6 4.5 7 4.5 2.5 0 4.8-1.5 7-4.5" stroke={stroke} {...softStrokeProps} />
      <path d="M32 25c2.3 3 4.7 4.5 7.1 4.5 2.4 0 4.7-1.5 6.9-4.5" stroke={stroke} {...softStrokeProps} />
      <path d="M19.5 38c3.1 4 7.3 6 12.5 6 5.2 0 9.4-2 12.5-6" stroke={stroke} {...softStrokeProps} />
      <path d="M22 39.5c2.6 2.5 6 3.7 10 3.7 4 0 7.4-1.2 10-3.7" stroke={pencil} strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.7" />
    </>}
    {mood.iconKey === 'happy' && <>
      <ellipse cx="23" cy="28" rx="3.4" ry="4" fill="white" opacity="0.95" />
      <ellipse cx="41" cy="28" rx="3.4" ry="4" fill="white" opacity="0.95" />
      <circle cx="23" cy="29" r="2" fill={stroke} />
      <circle cx="41" cy="29" r="2" fill={stroke} />
      <path d="M21 39c2.8 2.9 6.5 4.4 11 4.4 4.6 0 8.3-1.5 11-4.4" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <ellipse cx="23" cy="28" rx="2.8" ry="3.5" fill={stroke} opacity="0.92" />
      <ellipse cx="41" cy="28" rx="2.8" ry="3.5" fill={stroke} opacity="0.92" />
      <path d="M23.5 40h17" stroke={stroke} {...softStrokeProps} />
      <path d="M24 43c2.3-0.9 5-1.3 8-1.3 2.9 0 5.6 0.4 8 1.3" stroke={pencil} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.62" />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M18.5 24.5 26 21.5" stroke={stroke} {...softStrokeProps} />
      <path d="M38 21.5 45.5 24.5" stroke={stroke} {...softStrokeProps} />
      <ellipse cx="23" cy="30" rx="3" ry="3.8" fill="white" opacity="0.95" />
      <ellipse cx="41" cy="30" rx="3" ry="3.8" fill="white" opacity="0.95" />
      <circle cx="23" cy="31" r="1.8" fill={stroke} />
      <circle cx="41" cy="31" r="1.8" fill={stroke} />
      <path d="M22.5 42c2.8-2.5 5.9-3.8 9.5-3.8 3.7 0 6.8 1.3 9.5 3.8" stroke={stroke} {...softStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M20 23h7.6v12.8H20z" stroke={stroke} {...softStrokeProps} />
      <path d="M36.4 23H44v12.8h-7.6z" stroke={stroke} {...softStrokeProps} />
      <path d="M23 43c2.5-2.2 5.5-3.3 9-3.3s6.5 1.1 9 3.3" stroke={stroke} {...softStrokeProps} />
      <path d="M19.5 39.5c1.2 1.6 2.5 2.8 4 3.6" stroke={pencil} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.58" />
    </>}
  </>;
};

const renderStamp = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  const stampBg = mood.softColor;
  return <>
    <rect x="8" y="8" width="48" height="48" rx="14" fill={stampBg} opacity="0.28" />
    <rect x="10" y="10" width="44" height="44" rx="12" stroke={stroke} strokeOpacity="0.35" strokeWidth="2.2" strokeDasharray="2.8 2.8" />
    <path d="M14 18c4-3 10-4.5 18-4.5s14 1.5 18 4.5" stroke={stroke} strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" fill="none" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M18 25c2 2.5 4.4 3.8 7 3.8 2.6 0 4.9-1.3 7-3.8" stroke={stroke} {...thinStrokeProps} />
      <path d="M32 25c2 2.5 4.4 3.8 7 3.8 2.6 0 5-1.3 7-3.8" stroke={stroke} {...thinStrokeProps} />
      <path d="M20 39c3.1 3.3 7.1 5 12 5 5 0 9-1.7 12-5" stroke={stroke} {...thinStrokeProps} />
      <path d="M25 40.5h14" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'happy' && <>
      <path d="M20 26h6" stroke={stroke} {...thinStrokeProps} />
      <path d="M38 26h6" stroke={stroke} {...thinStrokeProps} />
      <circle cx="23" cy="30" r="1.7" fill={stroke} />
      <circle cx="41" cy="30" r="1.7" fill={stroke} />
      <path d="M22 40c2.8 2.2 6.1 3.3 10 3.3 3.9 0 7.2-1.1 10-3.3" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M20 28h6" stroke={stroke} {...thinStrokeProps} />
      <path d="M38 28h6" stroke={stroke} {...thinStrokeProps} />
      <path d="M24 40h16" stroke={stroke} {...thinStrokeProps} />
      <circle cx="32" cy="33" r="1.4" fill={stroke} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M18.5 24.5 26 22" stroke={stroke} {...thinStrokeProps} />
      <path d="M38 22 45.5 24.5" stroke={stroke} {...thinStrokeProps} />
      <path d="M20 31c1.5-1.1 3.1-1.7 5-1.7 1.9 0 3.5 0.6 5 1.7" stroke={stroke} {...thinStrokeProps} />
      <path d="M34 31c1.5-1.1 3.1-1.7 5-1.7 1.9 0 3.5 0.6 5 1.7" stroke={stroke} {...thinStrokeProps} />
      <path d="M23 42c2.6-1.8 5.6-2.7 9-2.7 3.5 0 6.5 0.9 9 2.7" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 24 27 21" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 21 45 24" stroke={stroke} {...thinStrokeProps} />
      <path d="M21 31h6" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 31h6" stroke={stroke} {...thinStrokeProps} />
      <path d="M22.5 43c2.4-2 5.6-3 9.5-3 3.9 0 7.1 1 9.5 3" stroke={stroke} {...thinStrokeProps} />
    </>}
  </>;
};

const animeStrokeProps = {
  ...baseStrokeProps,
  strokeWidth: 2.2
};

const renderAnimeSoft = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  const blush = mood.softColor;
  return <>
    <rect x="6" y="6" width="52" height="52" rx="18" fill={mood.surfaceColor} />
    <ellipse cx="32" cy="20" rx="16" ry="8" fill="white" opacity="0.28" />
    <path d="M14 23c2-8.6 8.5-13.5 18-13.5S48 14.4 50 23" fill="none" stroke={stroke} strokeOpacity="0.2" strokeWidth="3" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M18 23c2.5 2.7 4.8 4 7.1 4 2.4 0 4.7-1.3 7-4" stroke={stroke} {...animeStrokeProps} />
      <path d="M32 23c2.4 2.7 4.7 4 7.1 4 2.4 0 4.6-1.3 6.9-4" stroke={stroke} {...animeStrokeProps} />
      <path d="M19 38c3.6 5 7.8 7.4 13 7.4 5.3 0 9.6-2.4 13-7.4" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="22" cy="34" rx="3.2" ry="1.8" fill={blush} />
      <ellipse cx="42" cy="34" rx="3.2" ry="1.8" fill={blush} />
    </>}
    {mood.iconKey === 'happy' && <>
      <ellipse cx="23" cy="28" rx="3.6" ry="4.6" fill="white" />
      <ellipse cx="41" cy="28" rx="3.6" ry="4.6" fill="white" />
      <ellipse cx="23" cy="29" rx="1.8" ry="2.6" fill={stroke} />
      <ellipse cx="41" cy="29" rx="1.8" ry="2.6" fill={stroke} />
      <circle cx="22.2" cy="28.2" r="0.8" fill="white" />
      <circle cx="40.2" cy="28.2" r="0.8" fill="white" />
      <path d="M21 39c2.8 3 6.5 4.6 11 4.6 4.6 0 8.2-1.5 11-4.6" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="18.5" cy="35" rx="3" ry="1.7" fill={blush} />
      <ellipse cx="45.5" cy="35" rx="3" ry="1.7" fill={blush} />
    </>}
    {mood.iconKey === 'okay' && <>
      <ellipse cx="23" cy="28" rx="3.4" ry="4.4" fill="white" />
      <ellipse cx="41" cy="28" rx="3.4" ry="4.4" fill="white" />
      <ellipse cx="23" cy="29" rx="1.6" ry="2.4" fill={stroke} />
      <ellipse cx="41" cy="29" rx="1.6" ry="2.4" fill={stroke} />
      <path d="M23 39.5c2.5-0.8 5.6-1.2 9-1.2 3.4 0 6.4 0.4 9 1.2" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="19" cy="35.5" rx="2.8" ry="1.5" fill={blush} opacity="0.75" />
      <ellipse cx="45" cy="35.5" rx="2.8" ry="1.5" fill={blush} opacity="0.75" />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M18 24c2.6-1.9 5.1-2.8 7.4-2.8 2.4 0 4.6.9 6.6 2.8" stroke={stroke} {...animeStrokeProps} />
      <path d="M32 24c2.5-1.9 4.9-2.8 7.3-2.8 2.3 0 4.6.9 6.7 2.8" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="23" cy="30" rx="3.5" ry="4.8" fill="white" />
      <ellipse cx="41" cy="30" rx="3.5" ry="4.8" fill="white" />
      <ellipse cx="23" cy="31" rx="1.9" ry="2.8" fill={stroke} />
      <ellipse cx="41" cy="31" rx="1.9" ry="2.8" fill={stroke} />
      <path d="M22 42c2.8-2.7 6.1-4 10-4 4 0 7.3 1.3 10 4" stroke={stroke} {...animeStrokeProps} />
      <path d="M47 35c1.6 2.2 2.4 4.2 2.4 6.1" stroke={stroke} {...animeStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M18 22c2.3-2.7 4.8-4 7.3-4 2.5 0 4.8 1.3 6.7 4" stroke={stroke} {...animeStrokeProps} />
      <path d="M32 22c2.3-2.7 4.8-4 7.3-4 2.4 0 4.8 1.3 6.7 4" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="23" cy="30" rx="3.1" ry="5.1" fill="white" />
      <ellipse cx="41" cy="30" rx="3.1" ry="5.1" fill="white" />
      <path d="M21.5 27v7.2" stroke={stroke} {...animeStrokeProps} />
      <path d="M39.5 27v7.2" stroke={stroke} {...animeStrokeProps} />
      <path d="M23 43c2.4-2.3 5.4-3.4 9-3.4 3.7 0 6.7 1.1 9 3.4" stroke={stroke} {...animeStrokeProps} />
      <ellipse cx="18" cy="36" rx="2.7" ry="1.6" fill={blush} opacity="0.7" />
      <ellipse cx="46" cy="36" rx="2.7" ry="1.6" fill={blush} opacity="0.7" />
    </>}
  </>;
};

const renderAnimeCool = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  return <>
    <rect x="5" y="5" width="54" height="54" rx="16" fill={mood.surfaceColor} opacity="0.94" />
    <path d="M15 18c3-6.2 8.7-9.4 17-9.4 8.2 0 13.9 3.1 17 9.4" fill="none" stroke={stroke} strokeOpacity="0.24" strokeWidth="2.6" />
    <path d="M16 20c2.8-4.2 8.4-6.5 16-6.5 7.6 0 13.1 2.3 16 6.5" fill={stroke} fillOpacity="0.08" />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M18 25c2.1 1.7 4.5 2.5 7.1 2.5 2.5 0 4.8-0.8 6.9-2.5" stroke={stroke} {...thinStrokeProps} />
      <path d="M32 25c2.1 1.7 4.4 2.5 6.9 2.5 2.6 0 5-0.8 7.1-2.5" stroke={stroke} {...thinStrokeProps} />
      <path d="M20 39c3.3 3.8 7.3 5.7 12 5.7 4.8 0 8.7-1.9 12-5.7" stroke={stroke} {...thinStrokeProps} />
      <path d="M27 36h10" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'happy' && <>
      <path d="M19 24h9" stroke={stroke} {...thinStrokeProps} />
      <path d="M36 24h9" stroke={stroke} {...thinStrokeProps} />
      <path d="M22 29c1.1 1.4 2.1 2.1 3.2 2.1 1.1 0 2.1-0.7 3-2.1" stroke={stroke} {...thinStrokeProps} />
      <path d="M38 29c1 1.4 2 2.1 3.1 2.1 1.1 0 2.1-0.7 3.1-2.1" stroke={stroke} {...thinStrokeProps} />
      <path d="M22 40c2.6 2.4 5.9 3.6 10 3.6 4.2 0 7.5-1.2 10-3.6" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <path d="M20 27h7" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 27h7" stroke={stroke} {...thinStrokeProps} />
      <path d="M24 40h16" stroke={stroke} {...thinStrokeProps} />
      <path d="M22 31.5h4" stroke={stroke} {...thinStrokeProps} />
      <path d="M38 31.5h4" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M18 24 27 21.5" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 21.5 46 24" stroke={stroke} {...thinStrokeProps} />
      <path d="M20 31c1.5-1.2 3.2-1.9 5-1.9 1.8 0 3.4 0.6 5 1.9" stroke={stroke} {...thinStrokeProps} />
      <path d="M34 31c1.5-1.2 3.2-1.9 5-1.9 1.8 0 3.4 0.6 5 1.9" stroke={stroke} {...thinStrokeProps} />
      <path d="M23 42c2.5-1.7 5.6-2.5 9-2.5 3.5 0 6.5 0.8 9 2.5" stroke={stroke} {...thinStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 24 28 20" stroke={stroke} {...thinStrokeProps} />
      <path d="M36 20 45 24" stroke={stroke} {...thinStrokeProps} />
      <path d="M21 30h7" stroke={stroke} {...thinStrokeProps} />
      <path d="M37 30h7" stroke={stroke} {...thinStrokeProps} />
      <path d="M22 43c2.6-2 5.9-3 10-3 4.1 0 7.4 1 10 3" stroke={stroke} {...thinStrokeProps} />
      <path d="M28 35c1 0.8 2.3 1.2 4 1.2 1.7 0 3-0.4 4-1.2" stroke={stroke} {...thinStrokeProps} />
    </>}
  </>;
};

const clayStrokeProps = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 4,
};

const renderPixel = (mood: MoodLevelMeta) => {
  const fill = mood.displayColor;
  return <>
    <rect x="8" y="8" width="48" height="48" fill={mood.surfaceColor} />
    <path d="M8 8h48v48H8z" fill="none" stroke={mood.displayColor} strokeOpacity={0.2} strokeWidth="2" shapeRendering="crispEdges"/>
    <g shapeRendering="crispEdges">
    {mood.iconKey === 'ecstatic' && <>
      <rect x="18" y="24" width="6" height="6" fill={fill} />
      <rect x="40" y="24" width="6" height="6" fill={fill} />
      <rect x="14" y="28" width="6" height="6" fill={fill} />
      <rect x="24" y="28" width="6" height="6" fill={fill} />
      <rect x="34" y="28" width="6" height="6" fill={fill} />
      <rect x="44" y="28" width="6" height="6" fill={fill} />
      <rect x="22" y="38" width="20" height="10" fill={fill} />
      <rect x="18" y="40" width="4" height="6" fill={fill} />
      <rect x="42" y="40" width="4" height="6" fill={fill} />
    </>}
    {mood.iconKey === 'happy' && <>
      <rect x="20" y="24" width="6" height="6" fill={fill} />
      <rect x="38" y="24" width="6" height="6" fill={fill} />
      <rect x="20" y="36" width="6" height="6" fill={fill} />
      <rect x="38" y="36" width="6" height="6" fill={fill} />
      <rect x="26" y="42" width="12" height="6" fill={fill} />
    </>}
    {mood.iconKey === 'okay' && <>
      <rect x="20" y="26" width="6" height="6" fill={fill} />
      <rect x="38" y="26" width="6" height="6" fill={fill} />
      <rect x="20" y="38" width="24" height="6" fill={fill} />
    </>}
    {mood.iconKey === 'upset' && <>
      <rect x="22" y="24" width="6" height="6" fill={fill} />
      <rect x="36" y="24" width="6" height="6" fill={fill} />
      <rect x="16" y="20" width="6" height="6" fill={fill} />
      <rect x="42" y="20" width="6" height="6" fill={fill} />
      <rect x="26" y="40" width="12" height="6" fill={fill} />
      <rect x="20" y="46" width="6" height="6" fill={fill} />
      <rect x="38" y="46" width="6" height="6" fill={fill} />
    </>}
    {mood.iconKey === 'awful' && <>
      <rect x="18" y="22" width="8" height="8" fill={fill} />
      <rect x="38" y="22" width="8" height="8" fill={fill} />
      <rect x="22" y="44" width="20" height="6" fill={fill} />
      <rect x="18" y="38" width="6" height="6" fill={fill} />
      <rect x="40" y="38" width="6" height="6" fill={fill} />
    </>}
    </g>
  </>;
};

const renderClay = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  const outerShadow = 'drop-shadow(0px 4px 3px rgba(0,0,0,0.12)) drop-shadow(0px 2px 2px rgba(0,0,0,0.08))';
  
  return <g style={{ filter: outerShadow }}>
    <rect x="6" y="6" width="52" height="52" rx="20" fill={mood.surfaceColor} />
    <rect x="8" y="8" width="48" height="48" rx="18" stroke="white" strokeWidth="2.5" opacity="0.6" fill="none" />
    
    <g style={{ filter: 'drop-shadow(0px 3px 1px rgba(0,0,0,0.15))' }}>
    {mood.iconKey === 'ecstatic' && <>
      <path d="M17 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke={stroke} {...clayStrokeProps} />
      <path d="M34 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke={stroke} {...clayStrokeProps} />
      <path d="M18 36c3 5 8 8 14 8 6 0 11-3 14-8" stroke={stroke} {...clayStrokeProps} fill={stroke} />
      <ellipse cx="32" cy="40" rx="6" ry="3" fill="white" opacity="0.4" />
    </>}
    {mood.iconKey === 'happy' && <>
      <circle cx="22" cy="27" r="4.5" fill={stroke} />
      <circle cx="42" cy="27" r="4.5" fill={stroke} />
      <circle cx="21" cy="26" r="1.5" fill="white" opacity="0.9" />
      <circle cx="41" cy="26" r="1.5" fill="white" opacity="0.9" />
      <path d="M20 38c3 3 7 5 12 5 5 0 9-2 12-5" stroke={stroke} {...clayStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <circle cx="22" cy="27" r="4" fill={stroke} />
      <circle cx="42" cy="27" r="4" fill={stroke} />
      <circle cx="21" cy="26" r="1.2" fill="white" opacity="0.9" />
      <circle cx="41" cy="26" r="1.2" fill="white" opacity="0.9" />
      <path d="M20 39h24" stroke={stroke} {...clayStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 24 24 20" stroke={stroke} {...clayStrokeProps} />
      <path d="M40 20 47 24" stroke={stroke} {...clayStrokeProps} />
      <circle cx="23" cy="30" r="4" fill={stroke} />
      <circle cx="41" cy="30" r="4" fill={stroke} />
      <circle cx="22" cy="29" r="1.2" fill="white" opacity="0.9" />
      <circle cx="40" cy="29" r="1.2" fill="white" opacity="0.9" />
      <path d="M22 42c3-3 7-4 10-4 3 0 7 1 10 4" stroke={stroke} {...clayStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 21h8v16h-8z" stroke={stroke} {...clayStrokeProps} strokeWidth="3" />
      <path d="M37 21h8v16h-8z" stroke={stroke} {...clayStrokeProps} strokeWidth="3" />
      <path d="M22 44c3-3 7-4 10-4 3 0 7 1 10 4" stroke={stroke} {...clayStrokeProps} />
    </>}
    </g>
  </g>;
};

const renderSolid = (mood: MoodLevelMeta) => {
  const fill = mood.displayColor;
  return <>
    <rect x="4" y="4" width="56" height="56" rx="28" fill={fill} />
    {mood.iconKey === 'ecstatic' && <>
      <path d="M17 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <path d="M34 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <path d="M18 36c3 5 8 8 14 8 6 0 11-3 14-8" stroke="white" {...baseStrokeProps} strokeWidth="3" fill="none" />
      <path d="M22 36c2 4 6 6 10 6 4 0 8-2 10-6" fill="white" opacity="0.4" />
    </>}
    {mood.iconKey === 'happy' && <>
      <circle cx="22" cy="27" r="4.5" fill="white" />
      <circle cx="42" cy="27" r="4.5" fill="white" />
      <path d="M20 38c3 3 7 5 12 5 5 0 9-2 12-5" stroke="white" {...baseStrokeProps} strokeWidth="3" />
    </>}
    {mood.iconKey === 'okay' && <>
      <circle cx="22" cy="27" r="4" fill="white" />
      <circle cx="42" cy="27" r="4" fill="white" />
      <path d="M20 39h24" stroke="white" {...baseStrokeProps} strokeWidth="3" />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 24 24 20" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <path d="M40 20 47 24" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <circle cx="23" cy="30" r="4" fill="white" />
      <circle cx="41" cy="30" r="4" fill="white" />
      <path d="M22 42c3-3 7-4 10-4 3 0 7 1 10 4" stroke="white" {...baseStrokeProps} strokeWidth="3" />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 21h8v16h-8z" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <path d="M37 21h8v16h-8z" stroke="white" {...baseStrokeProps} strokeWidth="3" />
      <path d="M22 44c3-3 7-4 10-4 3 0 7 1 10 4" stroke="white" {...baseStrokeProps} strokeWidth="3" />
    </>}
  </>;
};

const renderNeon = (mood: MoodLevelMeta) => {
  const stroke = mood.displayColor;
  const glow = `drop-shadow(0 0 5px ${stroke})`;
  
  return <g style={{ filter: glow }}>
    <rect x="4" y="4" width="56" height="56" rx="16" fill="#131316" stroke={stroke} strokeWidth="2.5" />
    
    {mood.iconKey === 'ecstatic' && <>
      <path d="M17 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke={stroke} {...baseStrokeProps} />
      <path d="M34 25c1.5-2 4-3 6.5-3 2.5 0 5 1 6.5 3" stroke={stroke} {...baseStrokeProps} />
      <path d="M18 36c3 5 8 8 14 8 6 0 11-3 14-8" fill="none" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'happy' && <>
      <line x1="22" y1="23" x2="22" y2="30" stroke={stroke} {...baseStrokeProps} strokeWidth="4" />
      <line x1="42" y1="23" x2="42" y2="30" stroke={stroke} {...baseStrokeProps} strokeWidth="4" />
      <path d="M20 38c3 3 7 5 12 5 5 0 9-2 12-5" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'okay' && <>
      <line x1="22" y1="23" x2="22" y2="30" stroke={stroke} {...baseStrokeProps} strokeWidth="4" />
      <line x1="42" y1="23" x2="42" y2="30" stroke={stroke} {...baseStrokeProps} strokeWidth="4" />
      <path d="M20 39h24" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'upset' && <>
      <path d="M17 24 24 20" stroke={stroke} {...baseStrokeProps} />
      <path d="M40 20 47 24" stroke={stroke} {...baseStrokeProps} />
      <circle cx="23" cy="30" r="3" fill={stroke} />
      <circle cx="41" cy="30" r="3" fill={stroke} />
      <path d="M22 42c3-3 7-4 10-4 3 0 7 1 10 4" stroke={stroke} {...baseStrokeProps} />
    </>}
    {mood.iconKey === 'awful' && <>
      <path d="M19 21h8v16h-8z" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M37 21h8v16h-8z" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M22 44c3-3 7-4 10-4 3 0 7 1 10 4" stroke={stroke} {...baseStrokeProps} />
    </>}
  </g>;
};

const renderers: Record<MoodIconPackId, (mood: MoodLevelMeta) => React.ReactNode> = {
  playful: renderPlayful,
  pebble: renderPebble,
  minimal: renderMinimal,
  sticker: renderSticker,
  coloredPencilSticker: renderColoredPencilSticker,
  stamp: renderStamp,
  pixel: renderPixel,
  clay: renderClay,
  solid: renderSolid,
  animeSoft: renderAnimeSoft,
  animeCool: renderAnimeCool
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


