# 안용현과 안다혜의 결혼식 모바일 청첩장

![메인사진](https://github.com/dhlvyh/dhlvyh.github.io/blob/main/images/main.jpg)

## 예식정보

* 날짜 : 2026년 11월 1일 일요일 11시 00분
* 장소 : 서울 강서구 공항대로36길 57 더뉴컨벤션 2층 더뉴홀
* 청첩장 url : https://dhlvyh.github.io/

---

## 개발 환경 설정

이 저장소를 Clone해서 자신의 청첩장으로 바꿔 쓰려면 아래 순서를 따른다.

```bash
git clone https://github.com/dhlvyh/dhlvyh.github.io.git
cd dhlvyh.github.io
npm install       # sharp(이미지 변환)만 설치된다. 별도 빌드 도구 없음
npm run dev        # http://localhost:3000 에서 캐시 없이 미리보기
npm test           # node --test 기반 테스트 실행
```

빌드 시스템이 없는 순수 정적 사이트다. `index.html`을 직접 열어도 되지만,
캐시 때문에 수정 사항이 반영 안 되는 경우가 잦으므로 `npm run dev` 사용을 권장한다.

## 갤러리 이미지 압축 및 변환

원본 사진을 올리면 자동으로 웹용 WebP 2단(메인/썸네일)으로 변환해주는 스크립트가 있다.
원본 그대로 쓰면 사진 한 장당 수 MB라 첫 화면이 무거워지므로, 반드시 이 스크립트를 거친다.

### 1. 원본 사진 배치

`images/` 폴더 바로 아래에 정해진 파일명으로 넣는다.

| 용도 | 파일명 | 매수 |
|---|---|---|
| 갤러리 | `images/gallery1.jpg` ~ `images/gallery20.jpg` | 최대 20장 |
| 예식장 사진 | `images/hall.jpg` | 1장 |

- 갤러리는 `gallery{번호}.jpg` 형식만 인식한다. 20장을 다 채우지 않아도 되며,
  없는 번호는 자동으로 건너뛴다.
- 히어로 배경(`images/main-background.jpg`), 커플 사진(`images/main.jpg`),
  두 사람 소개 인물사진(`images/person1.jpg`, `images/person2.jpg`)은 아직 별도
  변환 없이 원본 경로를 그대로 쓰고 있다. 같은 파일명으로 교체하면 된다.

### 2. 변환 실행

```bash
npm run images
```

`tools/build-images.mjs`가 실행되며 다음을 생성한다.

- `images/gallery/main/{번호}.webp` — 1280px, 메인 뷰어용
- `images/gallery/thumb/{번호}.webp` — 380px, 썸네일 그리드용
- `images/opt/hall.webp` — 1024px, 예식장 카드 미리보기용
- `images/gallery/manifest.json` — 변환 결과 목록(가로/세로 크기 포함)

원본이 바뀌지 않았으면 재변환하지 않고 기존 결과물을 재사용한다(빌드 시간 절약).
콘솔에 원본 대비 감소 배율이 출력되니 확인만 하면 된다.

### 3. index.html에서 참조하는 경로

갤러리 20칸(`#gallery-main-track`, `#gallery-thumb-grid`)은 이미
`images/gallery/main/1.webp` ~ `20.webp`, `images/gallery/thumb/1.webp` ~ `20.webp`를
가리키도록 마크업이 완성돼 있다. **사진 장수가 20장보다 적으면 남는 슬라이드의
`<img>` src만 지우거나 해당 `.gallery-main-slide` / `.gallery-thumb` 블록을
통째로 삭제**하면 된다.

## 텍스트·정보 배치 (수정이 필요한 곳)

플레이스홀더로 채워둔 항목과 위치는 아래와 같다. 대부분 `index.html`을 직접 열어
문자열만 바꾸면 된다.

| 항목 | 위치 | 비고 |
|---|---|---|
| 신랑·신부 이름 | `index.html` `.hero-name-value` (2곳) | 히어로 첫 화면 |
| 예식 일시 | `scripts/main.js` 상단 `WEDDING_DATE`, `WEDDING_DATETIME_ISO` | 카운트다운·달력이 이 값을 그대로 씀 |
| 연애 시작일 | `scripts/main.js` 상단 `RELATIONSHIP_START_ISO` | "함께한 시간" 오도미터 기준값 |
| 양가 부모님 성함 | `index.html` `.couple-parents` (2곳) | 커플 카드 안 |
| 연락처 6명분 | `index.html` `#contact-sheet` 안 `tel:0000000000` / `sms:0000000000` | 전화·문자 링크 12곳, 번호만 그대로 교체 |
| 계좌 6개 | `index.html` `.account-number` (은행명 000-0000-0000000) | 은행명·예금주는 바로 위/옆 텍스트 |
| 마지막 인사말 | `index.html` `.closing-message` | 현재 플레이스홀더 문구 |
| 카카오톡 공유 앱키 | `scripts/main.js` 상단 `KAKAO_JS_KEY` | [Kakao Developers](https://developers.kakao.com)에서 발급, 앱의 플랫폼 > Web에 배포 도메인 등록 필요 |
| 주차 안내 문구 | `index.html` `.transit-info` 내 주차 관련 문단 | 예식장 실제 정책에 맞게 확인 후 수정 |

이름·연락처·계좌 같은 반복 항목은 검색(`Ctrl+F`)으로 찾아 값만 바꾸면 되고,
구조(태그·클래스)는 건드릴 필요 없다.
