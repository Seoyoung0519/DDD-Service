/**
 * 독서 세션 종료 플로우 — 쪽수 입력 → 요약 → 인증샷(선택) → 세션 종료 API
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadReadingProof } from '@/src/api/proofUpload';
import {
  DEFAULT_CAMERA_FRAME_ID,
  getCameraFrameById,
  READING_SESSION_CAMERA_FRAMES,
} from '@/src/constants/readingSessionCameraFrames';
import {
  CameraFramePreview,
  type CameraFramePreviewHandle,
} from '@/src/features/readingSession/components/CameraFramePreview';
import { commitFinishReadingSession } from '@/src/features/readingSession/services/finishSessionCommit';
import {
  consumeReadingSessionFinishPayload,
  type ReadingSessionFinishPayload,
} from '@/src/state/readingSessionFinishFlow';

const { width: SCREEN_W } = Dimensions.get('window');

const SESSION_END_HOUSE_ICON = require('../assets/images/reading_session/session-end-house.png');
const SESSION_RECORD_CAMERA_ICON = require('../assets/images/reading_session/session-record-camera.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  NEXT_GREEN: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#7A7A7A',
  BORDER: '#E0E0E0',
  BG: '#FFFFFF',
  DIM: 'rgba(0,0,0,0.52)',
  CARD_BG: '#F5F5F5',
  BTN_OUTLINE: '#000000',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

type Step =
  | 'pages-input'
  | 'pages-summary'
  | 'record-choice'
  | 'frame-select'
  | 'camera'
  | 'proof-complete';

function OutlineButton({
  label,
  onPress,
  variant = 'default',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outlineBtn,
        isPrimary && styles.outlineBtnPrimary,
        disabled && styles.outlineBtnDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
      accessibilityRole="button">
      <Text
        style={[
          styles.outlineBtnText,
          isPrimary && styles.outlineBtnTextPrimary,
          disabled && styles.outlineBtnTextDisabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function finishFlowLog(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`[finish-flow] ${message}`, data);
  } else {
    console.log(`[finish-flow] ${message}`);
  }
}

export default function ReadingSessionFinishFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [payload, setPayload] = useState<ReadingSessionFinishPayload | null>(null);
  const [step, setStep] = useState<Step>('pages-input');
  const [endPageInput, setEndPageInput] = useState('');
  const [editingPages, setEditingPages] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState(DEFAULT_CAMERA_FRAME_ID);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [sessionCommitted, setSessionCommitted] = useState(false);
  const framePreviewRef = useRef<CameraFramePreviewHandle>(null);

  useEffect(() => {
    const p = consumeReadingSessionFinishPayload();
    if (!p) {
      finishFlowLog('no payload — redirect to intro');
      router.replace('/ReadingIntroScreen');
      return;
    }
    finishFlowLog('screen mounted with payload', {
      sessionId: p.sessionId,
      bookId: p.bookId,
    });
    setPayload(p);
    setEndPageInput(String(p.sessionEndPage > 0 ? p.sessionEndPage : p.sessionStartPage));
  }, [router]);

  const endPage = useMemo(() => {
    const n = Number(endPageInput);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }, [endPageInput]);

  const pagesValid = useMemo(() => {
    if (!payload) return false;
    return endPage >= payload.sessionStartPage;
  }, [endPage, payload]);

  const selectedFrame = getCameraFrameById(selectedFrameId);

  const finishAndGoHome = useCallback(async () => {
    if (!payload || finishing) return;
    if (sessionCommitted) {
      router.replace('/ReadingIntroScreen');
      return;
    }
    setFinishing(true);
    try {
      await commitFinishReadingSession(payload, endPage);
      setSessionCommitted(true);
      router.replace('/ReadingIntroScreen');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '세션 종료에 실패했습니다.';
      Alert.alert('세션 종료 실패', msg);
    } finally {
      setFinishing(false);
    }
  }, [endPage, finishing, payload, router, sessionCommitted]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('카메라 권한', '인증샷 촬영을 위해 카메라 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const uploadProofAndContinue = useCallback(async () => {
    const sourcePhotoUri = photoUri;
    if (!payload || !sourcePhotoUri || uploading) {
      finishFlowLog('upload skipped', {
        hasPayload: !!payload,
        hasPhoto: !!sourcePhotoUri,
        uploading,
      });
      return;
    }

    finishFlowLog('upload start');
    setUploading(true);
    try {
      let uploadUri: string = sourcePhotoUri;
      try {
        finishFlowLog('captureComposite start');
        const capturePromise = framePreviewRef.current?.captureComposite();
        const captured = capturePromise
          ? await Promise.race([
              capturePromise,
              new Promise<string | undefined>((_, reject) => {
                setTimeout(() => reject(new Error('captureComposite timeout (10s)')), 10_000);
              }),
            ])
          : undefined;
        if (captured) uploadUri = captured;
        finishFlowLog('captureComposite done', {
          hasComposite: !!captured,
          uploadUriPrefix: uploadUri.slice(0, 48),
        });
      } catch (captureError) {
        finishFlowLog('framed capture failed, uploading raw photo', {
          error: captureError instanceof Error ? captureError.message : String(captureError),
        });
      }

      try {
        finishFlowLog('calling uploadReadingProof');
        await uploadReadingProof({
          uri: uploadUri,
          bookId: payload.bookId,
          readingSessionId: payload.sessionId.startsWith('demo-session-')
            ? undefined
            : payload.sessionId,
          pageNumber: endPage,
          capturedAt: new Date().toISOString(),
          isPublic: false,
        });
        finishFlowLog('uploadReadingProof success');
      } catch (e: unknown) {
        finishFlowLog('uploadReadingProof error', {
          message: e instanceof Error ? e.message : String(e),
        });
        const msg =
          typeof e === 'object' && e != null && 'message' in e
            ? String((e as { message: unknown }).message)
            : '인증샷 저장에 실패했습니다.';
        Alert.alert('인증샷 저장 실패', msg);
        return;
      }

      try {
        await commitFinishReadingSession(payload, endPage);
        setSessionCommitted(true);
        setStep('proof-complete');
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e != null && 'message' in e
            ? String((e as { message: unknown }).message)
            : '세션 종료에 실패했습니다.';
        Alert.alert(
          '세션 종료 실패',
          `인증샷은 저장되었지만 세션 종료에 실패했습니다.\n${msg}`,
        );
      }
    } finally {
      setUploading(false);
    }
  }, [endPage, payload, photoUri, uploading]);

  useEffect(() => {
    if (step === 'camera' && !photoUri) {
      void takePhoto();
    }
  }, [photoUri, step, takePhoto]);

  if (!payload) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  const renderTopActions = () => {
    if (step === 'pages-input') {
      return (
        <OutlineButton
          label="다음"
          variant="primary"
          disabled={!pagesValid}
          onPress={() => setStep('pages-summary')}
        />
      );
    }
    if (step === 'pages-summary') {
      return (
        <View style={styles.topBtnRow}>
          <OutlineButton label="이전" onPress={() => setStep('pages-input')} />
          <OutlineButton
            label="다음"
            variant="primary"
            onPress={() => setStep('record-choice')}
          />
        </View>
      );
    }
    if (step === 'frame-select') {
      return (
        <View style={styles.topBtnRow}>
          <OutlineButton label="닫기" onPress={() => setStep('record-choice')} />
          <OutlineButton
            label="다음"
            variant="primary"
            onPress={() => setStep('camera')}
          />
        </View>
      );
    }
    if (step === 'camera') {
      return (
        <View style={styles.topBtnRow}>
          <OutlineButton label="닫기" onPress={() => setStep('frame-select')} />
          <OutlineButton
            label="다음"
            variant="primary"
            disabled={!photoUri || uploading}
            onPress={() => {
              finishFlowLog('camera NEXT pressed', { hasPhoto: !!photoUri, uploading });
              void uploadProofAndContinue();
            }}
          />
        </View>
      );
    }
    if (step === 'proof-complete') {
      return (
        <OutlineButton label="닫기" onPress={() => void finishAndGoHome()} />
      );
    }
    return null;
  };

  return (
    <View style={styles.root}>
      <View style={[styles.dim, StyleSheet.absoluteFill]} />
      <View
        style={[
          styles.modal,
          {
            marginTop: insets.top + 12,
            marginBottom: insets.bottom + 12,
            maxHeight: '92%',
          },
        ]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderSpacer} />
          {renderTopActions()}
        </View>

        <ScrollView
          contentContainerStyle={styles.modalBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {step === 'pages-input' ? (
            <>
              <Text style={styles.title}>즐거운 독서하셨을까요?</Text>
              <Text style={styles.subtitle}>
                다음에 이어서 독서하기 위해 읽은 쪽수를 기록해주세요
              </Text>
              <View style={styles.splitRow}>
                <View style={styles.splitCol}>
                  <Text style={styles.fieldLabel}>읽을 책</Text>
                  <View style={styles.bookCoverWrap}>
                    {payload.bookCoverUrl ? (
                      <Image
                        source={{ uri: payload.bookCoverUrl }}
                        style={styles.bookCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.bookCover, styles.bookCoverPlaceholder]} />
                    )}
                  </View>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {payload.bookTitle}
                  </Text>
                  {payload.authors ? (
                    <Text style={styles.bookAuthor}>{payload.authors}</Text>
                  ) : null}
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.splitCol}>
                  <Text style={styles.fieldLabel}>이동 시간</Text>
                  <Text style={styles.statValue}>{payload.actualMinutes}분</Text>
                  <Text style={[styles.fieldLabel, { marginTop: 18 }]}>읽은 쪽수</Text>
                  {editingPages ? (
                    <View style={styles.pageEditRow}>
                      <Text style={styles.pageRangeText}>{payload.sessionStartPage} ~</Text>
                      <TextInput
                        style={styles.pageInput}
                        value={endPageInput}
                        onChangeText={setEndPageInput}
                        keyboardType="number-pad"
                        autoFocus
                      />
                      <Text style={styles.pageRangeText}>p</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.pageDisplayRow}
                      onPress={() => setEditingPages(true)}
                      accessibilityRole="button">
                      <Text style={styles.pageDisplayText}>
                        {payload.sessionStartPage} ~ {endPageInput || '--'} p
                      </Text>
                      <Ionicons name="pencil" size={16} color={COLORS.SUBTITLE} />
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          ) : null}

          {step === 'pages-summary' ? (
            <>
              <Text style={styles.title}>즐거운 독서하셨을까요?</Text>
              <Text style={styles.subtitle}>
                다음에 이어서 독서하기 위해 읽은 쪽수를 기록해주세요
              </Text>
              <View style={styles.splitRow}>
                <View style={styles.splitCol}>
                  <Text style={styles.fieldLabel}>읽을 책</Text>
                  <View style={styles.bookCoverWrap}>
                    {payload.bookCoverUrl ? (
                      <Image
                        source={{ uri: payload.bookCoverUrl }}
                        style={styles.bookCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.bookCover, styles.bookCoverPlaceholder]} />
                    )}
                  </View>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {payload.bookTitle}
                  </Text>
                  {payload.authors ? (
                    <Text style={styles.bookAuthor}>{payload.authors}</Text>
                  ) : null}
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.splitCol}>
                  <Text style={styles.fieldLabel}>이동 시간</Text>
                  <Text style={styles.statValue}>{payload.actualMinutes}분</Text>
                  <Text style={[styles.fieldLabel, { marginTop: 18 }]}>추천 쪽수</Text>
                  <Text style={styles.pageDisplayText}>
                    {String(payload.sessionStartPage).padStart(2, '0')} ~{' '}
                    {String(payload.sessionEndPage).padStart(2, '0')} p
                  </Text>
                  <Text style={[styles.fieldLabel, { marginTop: 18 }]}>기록한 쪽수</Text>
                  <Text style={styles.pageDisplayText}>
                    {payload.sessionStartPage} ~ {endPage} p
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {step === 'record-choice' ? (
            <>
              <Text style={styles.title}>
                이제 대독단과 함께한 독서를{'\n'}기록해볼까요?
              </Text>
              <Text style={styles.subtitle}>
                오늘 읽은 책의 인상깊은 구절이나 표지 등을 커스텀 프레임으로 촬영하여
                공유해보세요
              </Text>
              <View style={styles.choiceRow}>
                <Pressable
                  style={styles.choiceCard}
                  onPress={() => void finishAndGoHome()}
                  disabled={finishing}
                  accessibilityRole="button">
                  {finishing ? (
                    <ActivityIndicator color={COLORS.PRIMARY} />
                  ) : (
                    <>
                      <Text style={styles.choiceText}>아니요,{'\n'}세션 종료할래요</Text>
                      <Image
                        source={SESSION_END_HOUSE_ICON}
                        style={styles.choiceIcon}
                        contentFit="contain"
                      />
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={styles.choiceCard}
                  onPress={() => setStep('frame-select')}
                  accessibilityRole="button">
                  <Text style={styles.choiceText}>네,{'\n'}기록하러 갈래요</Text>
                  <Image
                    source={SESSION_RECORD_CAMERA_ICON}
                    style={styles.choiceIcon}
                    contentFit="contain"
                  />
                </Pressable>
              </View>
            </>
          ) : null}

          {step === 'frame-select' ? (
            <>
              <Text style={styles.title}>원하는 프레임을 선택해{'\n'}사진을 남겨보아요</Text>
              <Text style={styles.subtitle}>
                오늘 읽은 책의 인상깊은 구절이나 표지 등을 커스텀 프레임으로 촬영하여
                공유해보세요
              </Text>
              <View style={styles.frameGrid}>
                {READING_SESSION_CAMERA_FRAMES.map((frame) => {
                  const selected = frame.id === selectedFrameId;
                  return (
                    <Pressable
                      key={frame.id}
                      onPress={() => setSelectedFrameId(frame.id)}
                      style={styles.frameCell}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}>
                      <CameraFramePreview
                        frame={frame}
                        width="100%"
                        selected={selected}
                        selectionColor={COLORS.PRIMARY}
                      />
                      <Text style={[styles.frameLabel, selected && styles.frameLabelSelected]}>
                        {frame.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {step === 'camera' ? (
            <>
              <Text style={styles.title}>원하는 프레임으로{'\n'}인증샷을 남겨보아요</Text>
              <View style={styles.subtitleBlock}>
                <Text style={styles.subtitleLine}>마음에 들지 않으면 다시 찍기를 눌러</Text>
                <Text style={styles.subtitleLine}>재촬영할 수 있어요</Text>
              </View>
              <CameraFramePreview
                ref={framePreviewRef}
                frame={selectedFrame}
                photoUri={photoUri}
                loading={!photoUri}
                style={styles.previewFrame}
              />
              <Pressable
                style={styles.retakeBtn}
                onPress={() => {
                  setPhotoUri(null);
                  void takePhoto();
                }}
                accessibilityRole="button">
                <Ionicons name="camera-reverse-outline" size={18} color={COLORS.TEXT} />
                <Text style={styles.retakeText}>다시 찍기</Text>
              </Pressable>
              {uploading ? (
                <ActivityIndicator style={{ marginTop: 12 }} color={COLORS.PRIMARY} />
              ) : null}
              {uploading ? (
                <Text style={styles.uploadingHint}>인증샷 저장 및 세션 종료 중...</Text>
              ) : null}
            </>
          ) : null}

          {step === 'proof-complete' ? (
            <>
              <Text style={styles.title}>인증샷 저장 완료</Text>
              <Text style={styles.subtitle}>
                오늘의 인증샷이 저장되었어요.{'\n'}
                인증샷은 내서재 캘린더에서 확인가능해요.
              </Text>
              <CameraFramePreview
                frame={selectedFrame}
                photoUri={photoUri}
                style={styles.previewFrame}
              />
              <Pressable
                style={styles.finishBtn}
                onPress={() => void finishAndGoHome()}
                disabled={finishing}
                accessibilityRole="button">
                {finishing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.finishBtnText}>끝내기</Text>
                )}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const MODAL_W = Math.min(SCREEN_W - 32, 400);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  centered: {
    justifyContent: 'center',
  },
  dim: {
    backgroundColor: COLORS.DIM,
  },
  modal: {
    width: MODAL_W,
    backgroundColor: COLORS.BG,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  modalHeaderSpacer: {
    flex: 1,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  subtitleLine: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleBlock: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 2,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCol: {
    flex: 1,
  },
  splitDivider: {
    width: 1,
    backgroundColor: COLORS.BORDER,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  bookCoverWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  bookCover: {
    width: 88,
    height: 124,
    borderRadius: 6,
  },
  bookCoverPlaceholder: {
    backgroundColor: COLORS.CARD_BG,
  },
  bookTitle: {
    fontSize: 13,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    marginTop: 2,
  },
  pageDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageDisplayText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  pageEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageRangeText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  pageInput: {
    minWidth: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.TEXT,
    fontSize: 16,
    color: COLORS.TEXT,
    paddingVertical: 2,
    textAlign: 'center',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 16,
  },
  choiceText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    textAlign: 'center',
    lineHeight: 20,
  },
  choiceIcon: {
    width: 72,
    height: 72,
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  frameCell: {
    width: (MODAL_W - 40 - 20) / 3,
    alignItems: 'center',
  },
  frameLabel: {
    fontSize: 10,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    marginTop: 6,
    marginBottom: 2,
  },
  frameLabelSelected: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  previewFrame: {
    marginBottom: 14,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  retakeText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  uploadingHint: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
  finishBtn: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.MEDIUM,
  },
  outlineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BTN_OUTLINE,
  },
  outlineBtnPrimary: {
    borderColor: COLORS.NEXT_GREEN,
  },
  outlineBtnDisabled: {
    borderColor: '#D0D0D0',
    backgroundColor: '#E8E8E8',
  },
  outlineBtnText: {
    fontSize: 13,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  outlineBtnTextPrimary: {
    color: COLORS.NEXT_GREEN,
  },
  outlineBtnTextDisabled: {
    color: '#9E9E9E',
  },
});
