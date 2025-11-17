/**
 * 디바이스 타입 감지를 위한 커스텀 훅
 * 안드로이드 태블릿과 모바일을 구분합니다.
 */

import { Platform, useWindowDimensions } from 'react-native';

/**
 * 태블릿으로 간주할 최소 너비 (dp)
 * 일반적으로 600dp 이상을 태블릿으로 간주
 */
const TABLET_MIN_WIDTH = 600;

export type DeviceType = 'mobile' | 'tablet';

export interface UseDeviceTypeReturn {
  /** 디바이스 타입 ('mobile' 또는 'tablet') */
  deviceType: DeviceType;
  /** 태블릿인지 여부 */
  isTablet: boolean;
  /** 모바일인지 여부 */
  isMobile: boolean;
  /** 현재 화면 너비 */
  width: number;
  /** 현재 화면 높이 */
  height: number;
  /** 안드로이드인지 여부 */
  isAndroid: boolean;
}

/**
 * 디바이스 타입을 감지하는 훅
 * 
 * @param tabletMinWidth - 태블릿으로 간주할 최소 너비 (기본값: 600)
 * @returns 디바이스 타입 정보
 * 
 * @example
 * ```tsx
 * const { isTablet, deviceType, width } = useDeviceType();
 * 
 * return (
 *   <View style={[styles.container, isTablet && styles.containerTablet]}>
 *     {isTablet ? <TabletLayout /> : <MobileLayout />}
 *   </View>
 * );
 * ```
 */
export function useDeviceType(
  tabletMinWidth: number = TABLET_MIN_WIDTH
): UseDeviceTypeReturn {
  const { width, height } = useWindowDimensions();
  const isAndroid = Platform.OS === 'android';
  
  // 안드로이드에서만 태블릿 구분 (웹/ios는 항상 모바일로 처리)
  const isTablet = isAndroid && width >= tabletMinWidth;
  const deviceType: DeviceType = isTablet ? 'tablet' : 'mobile';

  return {
    deviceType,
    isTablet,
    isMobile: !isTablet,
    width,
    height,
    isAndroid,
  };
}

