import React, { useMemo } from 'react';
import {
  Plus, ImagePlus, ChevronLeft, ArrowDown, ArrowUp, Sparkles, Bug, Calendar, Check, ChevronRight, X, Moon, Trash, Trash2, FileText, Edit, ShieldCheck, PenTool, Info, LineChart, Share, List, Brain, Bell, BellOff, ExternalLink, Palette, ShieldAlert, Redo2, RefreshCcw, Search, Tag, RotateCcw, Activity, Sliders, Upload, Shield, Sunrise, Home, BarChart2, Settings, Archive, ArchiveRestore, Laugh, Smile, Meh, Frown, Angry, PartyPopper, Heart, Sun, MoonStar, ThumbsDown, Leaf, CloudLightning, Flame, Dumbbell, Droplet, Waves, BedDouble, Bed, Briefcase, Users, BookOpen, Clock, PersonStanding, Utensils, Hash
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
  size?: number;
  style?: React.CSSProperties;
}

// Map Material Symbol names to Lucide Icons
const iconMap: Record<string, React.ElementType> = {
  // Navigation & Actions
  'add': Plus,
  'add_photo_alternate': ImagePlus,
  'arrow_back_ios_new': ChevronLeft,
  'arrow_downward': ArrowDown,
  'arrow_upward': ArrowUp,
  'chevron_left': ChevronLeft,
  'chevron_right': ChevronRight,
  'close': X,
  'delete': Trash2,
  'delete_outline': Trash,
  'edit': Edit,
  'redo': Redo2,
  'refresh': RefreshCcw,
  'search': Search,
  'search_off': Search, // We can use the same or a variant if available
  'tune': Sliders,
  'upload_file': Upload,
  'open_in_new': ExternalLink,
  'expand_more': ChevronDown,
  'expand_less': ChevronUp,

  // Layout & Base
  'home': Home,
  'calendar_month': Calendar,
  'bar_chart': BarChart2,
  'settings': Settings,

  // System & Misc
  'auto_awesome': Sparkles,
  'bug_report': Bug,
  'check': Check,
  'dark_mode': Moon,
  'description': FileText,
  'enhanced_encryption': ShieldCheck,
  'history_edu': PenTool,
  'info': Info,
  'insights': LineChart,
  'ios_share': Share,
  'list': List,
  'neurology': Brain,
  'notifications_active': Bell,
  'notifications_off': BellOff,
  'palette': Palette,
  'privacy_tip': ShieldAlert,
  'sell': Tag,
  'settings_backup_restore': RotateCcw,
  'timeline': Activity,
  'verified_user': Shield,
  'wb_twilight': Sunrise,
  'archive': Archive,
  'unarchive': ArchiveRestore,

  // Moods
  'sentiment_very_satisfied': Laugh,
  'sentiment_satisfied': Smile,
  'sentiment_neutral': Meh,
  'sentiment_dissatisfied': Frown,
  'mood_bad': Angry,

  // Activities
  'celebration': PartyPopper,
  'favorite': Heart,
  'spa': Leaf,
  'wb_sunny': Sun,
  'bedtime': MoonStar,
  'psychology_alt': ThumbsDown,
  'eco': Leaf,
  'thunderstorm': CloudLightning,
  'volcano': Flame,
  'fitness_center': Dumbbell,
  'water_drop': Droplet,
  'waves': Waves,
  'hotel': BedDouble,
  'bed': Bed,
  'airline_seat_flat': Bed, // fallback
  'task_alt': Check,
  'groups': Users,
  'menu_book': BookOpen,
  'work_history': Clock,
  'diversity_3': Users,
  'directions_walk': PersonStanding,
  'restaurant': Utensils,
  'label': Hash,
};

// Fallback icon
import { Hash as DefaultIcon, ChevronDown, ChevronUp } from 'lucide-react';

export const Icon: React.FC<IconProps> = ({ name, className = "", fill = false, size = 24, style }) => {
  const LucideIcon = useMemo(() => iconMap[name] || DefaultIcon, [name]);

  // Apply a softer, warmer look to icons if desired
  const extraProps = fill ? { fill: "currentColor" } : {};

  return (
    <LucideIcon
      className={className}
      size={size}
      style={style}
      strokeWidth={1.8} // Slightly thicker, friendlier stroke
      {...extraProps}
    />
  );
};