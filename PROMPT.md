# JSON 분석 프롬프트

```text
다음 태국어 노래 가사를 Dao Thai Study 사이트용 데이터로 분석해줘.

반드시 설명 없이 유효한 JSON 객체 하나만 출력해.
- 한 단어가 여러 음절이면 syllables 배열에서 음절별로 분리한다. 예: สุดท้าย → สุด / ท้าย
- 각 음절: thai, reading, tone
- tone 값: mid=평성, low=1성, falling=2성, high=3성, rising=4성
- 독음은 실제 발음에 가깝게 적고 장모음 뒤에 -를 붙인다.
- เธอ는 트ㅓ-, เลย는 르ㅓ이-, เคย는 크ㅓ이-처럼 적는다.
- meaning은 단어·구절 뜻, natural은 자연스러운 문장 번역
- studyNotes에는 성조 공식 대신 결합 의미, 문법, 유의어, 혼동어, 문맥 뉘앙스를 넣는다.
- audio는 빈 문자열
- 문장 id는 s1, s2 순서

스키마:
{
 "id":"YYYY-MM-DD-song-title","date":"YYYY-MM-DD","title":"곡명","artist":"가수",
 "youtube":"주소","description":"선택 설명","sentences":[{
  "id":"s1","thai":"원문","audio":"","natural":"번역",
  "tokens":[{"meaning":"뜻","syllables":[{"thai":"음절","reading":"독음","tone":"mid"}]}],
  "studyNotes":["학습 메모"]
 }]
}

곡 정보와 가사:
[여기에 붙여 넣기]
```
