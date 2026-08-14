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
npm run dev        # http://localhost:8080 에서 캐시 없이 미리보기
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
| 갤러리 | `images/gallery1.jpg`, `images/gallery2.jpg`, … | 제한 없음 |
| 예식장 사진 | `images/hall.jpg` | 1장 |
| 마지막 인사 사진 | `images/end.jpg` | 1장 |
| 히어로(첫 화면) 사진 | `images/main.jpg` | 1장 |
| 두 사람 소개 인물사진 | `images/person1.jpg`(신랑), `images/person2.jpg`(신부) | 각 1장 |

- 갤러리는 `gallery{번호}.jpg` 형식의 파일을 `images/` 폴더에서 직접 스캔해서 찾는다.
  몇 장을 넣든(1장이든 100장이든) 자동으로 그만큼만 변환하고, 번호가 중간에
  비어 있어도(`gallery1.jpg`, `gallery3.jpg`만 있어도) 있는 파일만 순서대로 처리한다.
  **코드를 따로 고칠 필요가 없다.**
- 히어로 배경사진(`images/main-background.jpg`)은 현재 디자인에서는 쓰지 않는다
  (히어로가 `main.jpg` 한 장으로 화면 전체를 채우는 구조로 바뀌었다). 넣어 두면
  변환은 되지만 `index.html`/CSS 어디에서도 참조하지 않는다.

### 2. 변환 실행

```bash
npm run images
```

`tools/build-images.mjs`가 실행되며 다음을 생성한다. **실행할 때마다 기존 결과물을
무조건 덮어쓰고 다시 변환**하므로(재사용/스킵 없음), 사진을 교체한 뒤에는 항상 다시
실행해야 한다.

- `images/gallery/main/{번호}.webp` — 1280px, 메인 뷰어용
- `images/gallery/thumb/{번호}.webp` — 380px, 썸네일 그리드용
- `images/opt/hall.webp`, `end.webp`, `main.webp`, `person1.webp`, `person2.webp` — 1024px,
  예식장 카드·마지막 인사·히어로·인물 소개용
- `images/gallery/manifest.json` — 변환된 갤러리 사진 목록(경로, 가로/세로 크기 포함)

콘솔에 원본 대비 감소 배율이 출력되니 확인만 하면 된다.

### 3. 갤러리가 화면에 뿌려지는 방식

`index.html`의 갤러리 영역(`#gallery-main-track`, `#gallery-thumb-grid`)은 빈
컨테이너만 갖고 있다. 페이지가 열리면 `scripts/main.js`가 `images/gallery/manifest.json`을
fetch해서, `scripts/gallery-loader.js`의 `buildGallerySlidesMarkup`/`buildGalleryThumbsMarkup`
함수로 슬라이드·썸네일 HTML을 만들어 그 컨테이너에 채워 넣은 뒤 갤러리 스와이프
동작(`scripts/gallery-viewer.js`)을 초기화한다. 즉 **사진을 추가·삭제하고
`npm run images`만 다시 실행하면 `index.html`은 손댈 필요가 없다.**

배포(GitHub Pages)에서 정상 동작하려면 `images/gallery/manifest.json`과
`images/gallery/main|thumb/*.webp`가 실제로 커밋되어 있어야 한다는 점에 유의한다.

## 텍스트·정보 배치

항목별 위치는 아래와 같다. 대부분 `index.html`을 직접 열어 문자열만 바꾸면 된다.
반복 항목은 검색(`Ctrl+F`)으로 찾아 값만 바꾸면 되고, 구조(태그·클래스)는 건드릴
필요 없다.

| 항목 | 위치 | 상태 | 비고 |
|---|---|---|---|
| 히어로(첫 화면) | `index.html` `.hero-photo-full` | 완료 | 사진(`images/opt/main.webp`) 1장이 화면 폭 전체를 채우고, "Wedding Invitation" 문구만 사진 위에 오버레이된다. 신랑·신부 이름은 더 이상 히어로에 표시하지 않는다 |
| 인사말 문구 | `index.html` `#greeting` `.greeting-message` | 완료 | 히어로 다음, "두 사람" 섹션 앞 |
| 예식 일시 | `scripts/main.js` 상단 `WEDDING_DATE`, `WEDDING_DATETIME_ISO` | 완료 | 카운트다운·달력이 이 값을 그대로 씀 |
| 연애 시작일 | `scripts/main.js` 상단 `RELATIONSHIP_START_ISO` | 완료 | "함께한 시간" 오도미터 기준값 |
| 양가 부모님 성함 | `index.html` `.couple-parents` (2곳) | 완료 | 커플 카드 안 |
| 연락처 6명분 | `index.html` `#contact-sheet` 안 `tel:`/`sms:` | 완료 | 전화·문자 링크 12곳 |
| 계좌 6개 | `index.html` `.account-number` (은행명 000-0000-0000000) | **미완료** | 은행명·예금주는 바로 위/옆 텍스트. 현재 전부 `OO은행` / `000-0000-0000000` 플레이스홀더 |
| 마지막 인사말 | `index.html` `.closing-message` | 완료 | |
| 카카오톡 공유 앱키 | `scripts/main.js` 상단 `KAKAO_JS_KEY` | 완료 | [Kakao Developers](https://developers.kakao.com)에서 발급, 앱의 플랫폼 > Web에 배포 도메인 등록 필요 |
| 주차 안내 문구 | `index.html` `.transit-info` 내 주차 관련 문단 | 완료 | 예식장 실제 정책이 바뀌면 다시 확인 |

**아직 채워야 할 것은 계좌 정보(`.account-number` 6곳)뿐이다.**
