# 사용자에게 보이는 오류 처리 (프로덕션)

## 원칙

1. **`Alert` / 화면 `Text`에는 절대 `error.message`, API `detail`, 스택 문자열을 그대로 넣지 않는다.**
2. 사용자에게는 **`src/utils/userFacingError.ts`의 `USER_FACING`에 있는 문구만** 쓰거나, 화면별로 검수된 한국어 한 줄을 하드코딩한다.
3. **`catch` 안에서는** `reportAppError(에러, { scope: '화면.동작' })`로 상세를 남기고, UI에는 `userFacingMessage('키')`만 연결한다.
4. **도메인 예외**(`WishAddFailure` 등)처럼 **우리 코드에서 이미 한국어로 가공한 `message`**만 쓰는 경우는 그대로 `Alert`에 써도 된다. (서버 원문이 아님)

## 사용 예

```ts
import { reportAppError, userFacingMessage } from '@/src/utils/userFacingError';

try {
  await load();
} catch (e) {
  reportAppError(e, { scope: 'MyScreen.load', extra: { bookId } });
  setError(userFacingMessage('generic'));
}
```

## Sentry

`@sentry/react-native`를 설치하면 `reportAppError`가 **프로덕션**에서 `captureException`을 호출한다. 미설치면 조용히 무시된다.

## 개발 중 로그

`__DEV__`일 때만 `console.error`에 메시지·스택·`extra`를 전부 찍는다. 프로덕션 앱 사용자 화면 하단의 LogBox와는 별개이며, 릴리스 빌드에서는 LogBox가 기본적으로 뜨지 않는다.
