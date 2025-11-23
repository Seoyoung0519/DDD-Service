// app/onboarding.tsx

import React from 'react';

import {
  Image,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useDeviceType } from '@/hooks/use-device-type';

// 버스 아이콘 이미지 (app 바로 아래에 있으므로 한 단계만 올라감)
const BUS_ICON = require('../assets/images/onboarding/daedokdan-bus.png');

export default function OnboardingScreen() {
  
  const { isTablet } = useDeviceType();

  const router = useRouter();



  const handleStart = () => {

    // 온보딩 2단계 페이지로 이동
    router.push('/Onboarding_2');

  };



  return (

    <View style={styles.root}>

      {/* 상단 앱바 */}

      <View style={styles.appBar}>

        <View style={styles.appBarLeft}>

          <Image source={BUS_ICON} style={styles.busIcon} resizeMode="contain" />

          <Text style={styles.appTitle}>대독단</Text>

        </View>

      </View>



      {/* 회색 바 */}

      <View style={styles.divider} />



      {/* 본문 */}

      <View style={styles.content}>

        <Text style={[styles.title, isTablet && styles.titleTablet]}>여러분 환영합니다!</Text>

        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>

          대독단과 함께 독서를 시작하기 전에{'\n'}

          가이드를 따라 정보를 등록해주세요

        </Text>



        {/* 페이저 인디케이터 (3개의 점) */}

        <View style={styles.dotsContainer}>

          <View style={[styles.dot, styles.dotActive]} />

          <View style={styles.dot} />

          <View style={styles.dot} />

        </View>

      </View>



      {/* 하단 시작하기 버튼 */}

      <View style={styles.bottom}>

        <TouchableOpacity

          style={[styles.startButton, isTablet && styles.startButtonTablet]}

          activeOpacity={0.85}

          onPress={handleStart}

        >

          <Text style={[styles.startText, isTablet && styles.startTextTablet]}>시작하기</Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  root: {

    flex: 1,

    backgroundColor: '#F0EEEB',

  },

  appBar: {

    height: 56,

    paddingHorizontal: 16,

    paddingTop: 50,

    justifyContent: 'center',

  },

  appBarLeft: {

    flexDirection: 'row',

    alignItems: 'center',

  },

  busIcon: {

    width: 32,

    height: 32,

    marginRight: 7,

  },

  appTitle: {

    fontSize: 18,

    fontWeight: '600',

  },

  divider: {

    height: 2,

    backgroundColor: '#E0E0E0',

    width: '100%',

    marginTop: 15,

  },

  content: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 24,

  },

  title: {

    fontSize: 24,

    fontWeight: '700',

    marginBottom: 12,

  },

  subtitle: {

    fontSize: 14,

    color: '#666666',

    textAlign: 'center',

    lineHeight: 20,

    marginBottom: 40,

  },

  dotsContainer: {

    flexDirection: 'column',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

  },

  dot: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: '#D0D0D0',

  },

  dotActive: {

    backgroundColor: '#4F8F3A',

  },

  bottom: {

    paddingHorizontal: 14,

    paddingBottom: 50,

  },

  startButton: {

    height: 58,

    borderRadius: 29,

    backgroundColor: '#3A6F35', // 약간 진한 초록색

    alignItems: 'center',

    justifyContent: 'center',

  },

  startText: {

    color: '#FFFFFF',

    fontSize: 19,

    fontWeight: '600',

  },

  // 태블릿용 스타일 (안드로이드만) - 모바일과 유사하게 유지

  titleTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  subtitleTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  startButtonTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  startTextTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

});

