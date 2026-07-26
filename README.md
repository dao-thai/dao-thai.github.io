# dao-thai.github.io

## 배포
압축을 풀어 모든 파일을 GitHub 저장소 최상위에 올린 뒤 Settings → Pages → Deploy from a branch → main / root를 선택하세요.

## 업데이트
1. 배포 사이트의 `JSON 생성기`에서 곡 정보와 가사를 입력합니다.
2. 생성된 뼈대와 제공된 ChatGPT 프롬프트로 완성 JSON을 만듭니다.
3. `data/studies.js`의 `window.STUDIES=[ ... ];` 배열 안에 새 객체를 추가합니다.

## 성조 코드
- mid: 평성
- low: 1성
- falling: 2성
- high: 3성
- rising: 4성

## MP3
`assets/audio/`에 MP3를 넣고 문장 audio에 `./assets/audio/파일명.mp3`를 적습니다.
비워 두면 브라우저 태국어 TTS를 사용합니다.


## v4 추가 기능

- JSON 생성기 링크는 사이트 UI에서 숨겨졌습니다. 파일은 유지되어 필요할 때 직접 `generator.html`로 접근할 수 있습니다.
- 우측 상단 `ก` 버튼으로 현대 태국어 글꼴과 후아가 있는 기본 태국어 글꼴을 전환합니다. 설정은 브라우저에 저장됩니다.
- 우측 `퀵 노트`에 암기 규칙을 적으면 브라우저 localStorage에 자동 저장됩니다.
- 플레이어가 재생 중이 아닐 때는 “문장 듣기” 안내 문구가 표시됩니다.
