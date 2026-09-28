import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
