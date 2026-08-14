# 안용현과 안다혜의 결혼식 모바일 청첩장

![메인사진](https://github.com/dhlvyh/dhlvyh.github.io/blob/main/images/opt/main.webp)

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

### 2. 변환 실행

```bash
npm run images
```

`tools/build-images.mjs`가 실행되며 다음을 생성한다. **실행할 때마다 기존 결과물을
무조건 덮어쓰고 다시 변환**하므로(재사용/스킵 없음), 사진을 교체한 뒤에는 항상 다시
실행해야 한다.

- `images/gallery/main/{번호}.webp` — 1280px, 메인 뷰어용
- `images/gallery/thumb/{번호}.webp` — 260px, 썸네일 그리드용
  (5열 그리드라 표시 폭이 최대 86px뿐이다. DPR 3을 감안해도 260이면 충분하다)
- `images/opt/hall.webp`, `end.webp`, `main.webp`, `person1.webp`, `person2.webp` — 1024px,
  예식장 카드·마지막 인사·히어로·인물 소개용
- `images/opt/share.jpg` — 1200×630, 카카오톡/OG 공유 카드용
- `images/gallery/manifest.json` — 변환된 갤러리 사진 목록(경로, 가로/세로 크기 포함)

콘솔에 원본 대비 감소 배율이 출력되니 확인만 하면 된다.

> 공유 카드만 WebP가 아니라 JPG다. 카카오톡 스크래퍼가 WebP를 읽지 못해서,
> WebP로 두면 링크를 공유했을 때 썸네일이 통째로 비어버린다.

원본 `images/*.jpg`는 이 스크립트의 입력일 뿐 사이트가 직접 서빙하지 않는다.
용량이 400MB에 달해 git 추적에서 제외돼 있으니(`.gitignore`), 새로 클론한
환경에서 사진을 다시 변환하려면 원본을 별도로 가져와야 한다.

### 3. 갤러리가 화면에 뿌려지는 방식

`index.html`의 갤러리 영역(`#gallery-main-track`, `#gallery-thumb-grid`)은 빈
컨테이너만 갖고 있다. 페이지가 열리면 `scripts/main.js`가 `images/gallery/manifest.json`을
fetch해서, `scripts/gallery-loader.js`의 `buildGallerySlidesMarkup`/`buildGalleryThumbsMarkup`
함수로 슬라이드·썸네일 HTML을 만들어 그 컨테이너에 채워 넣은 뒤 갤러리 스와이프
동작(`scripts/gallery-viewer.js`)을 초기화한다. 즉 **사진을 추가·삭제하고
`npm run images`만 다시 실행하면 `index.html`은 손댈 필요가 없다.**

배포(GitHub Pages)에서 정상 동작하려면 `images/gallery/manifest.json`과
`images/gallery/main|thumb/*.webp`가 실제로 커밋되어 있어야 한다는 점에 유의한다.

### 4. 썸네일 더보기(접기/펼치기)

사진이 **30장을 넘으면** 앞 30장만 보이고 나머지는 접힌다. 그리드 아래
"더보기 (N장)" 버튼으로 펼치고 "접기"로 되돌린다. 30장 이하면 버튼 자체가
나타나지 않고 기존과 똑같이 전부 노출된다. 한도는
`scripts/gallery-collapse.js`의 `DEFAULT_LIMIT` 한 줄이다.

접힌 썸네일은 `hidden`(= `display: none`)이라 `loading="lazy"` 이미지가
아예 요청되지 않는다. 40장 기준으로 접힌 상태에서 10장분(약 145KB)을 아낀다.

위쪽 큰 사진을 접힌 구간까지 스와이프하면 그리드가 자동으로 펼쳐진다.
활성 썸네일 테두리가 숨어 있으면 안 되기 때문이다.

> 더보기 버튼은 반드시 `#gallery-thumb-grid` **바깥**에 있어야 한다.
> `gallery-viewer.js`가 그리드의 자식 인덱스로 활성 썸네일을 추적해서,
> 버튼이 자식으로 섞이면 인덱스가 통째로 밀린다. 같은 이유로 접힌 썸네일도
> DOM에서 제거하지 않고 `hidden`만 건다.

## 텍스트·정보 배치

항목별 위치는 아래와 같다. 대부분 `index.html`을 직접 열어 문자열만 바꾸면 된다.
반복 항목은 검색(`Ctrl+F`)으로 찾아 값만 바꾸면 되고, 구조(태그·클래스)는 건드릴
필요 없다.

| 항목 | 위치 | 상태 | 비고 |
|---|---|---|---|
| 히어로(첫 화면) | `index.html` `.hero-photo-full` | 완료 | 사진(`images/opt/main.webp`) 1장이 화면 폭 전체를 채우고, "Wedding Invitation" 문구만 사진 위에 오버레이된다. |
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
