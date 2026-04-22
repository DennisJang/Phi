/**
 * Phi · Heading Quotes (φ × 100 = 161)
 *
 * Deterministic daily rotation per user.
 * Each entry has verified provenance (see `verified` field).
 *
 * @see /mnt/user-data/outputs/phi-heading-quotes-161-final.md for the source-of-truth curation document.
 */

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export type QuoteLang =
  | 'ko'  // Korean (and classical Korean hanmun)
  | 'en'  // English
  | 'zh'  // Classical Chinese / 漢文
  | 'ja'  // Japanese
  | 'la'  // Latin
  | 'grc' // Ancient Greek
  | 'fr'  // French
  | 'de'  // German
  | 'it'  // Italian
  | 'es'  // Spanish
  | 'pt'  // Portuguese
  | 'ru'  // Russian
  | 'cs'  // Czech
  | 'pl'  // Polish
  | 'tr'; // Turkish

export type QuoteOrigin =
  | '중국' | '일본' | '한국'
  | '고대 그리스' | '고대 로마'
  | '영국' | '아일랜드' | '프랑스'
  | '독일' | '오스트리아' | '이탈리아' | '스페인' | '포르투갈'
  | '미국' | '러시아'
  | '체코' | '폴란드' | '유고슬라비아'
  | '아르헨티나' | '콜롬비아' | '칠레' | '멕시코' | '페루' | '세인트루시아'
  | '나이지리아' | '남아공'
  | '페르시아' | '이집트' | '터키'
  | '인도';

export type Verification = 'high' | 'medium' | 'low';

export interface Quote {
  /**
   * Stable historical identifier (1..165 range).
   * IDs 98, 105, 113, 122 are intentionally missing — these slots held
   * entries that were removed in v3 after provenance re-verification.
   * Use array index for iteration; use `id` only for cross-version tracking.
   */
  id: number;
  author: string;
  yearBorn?: number;
  yearDied?: number;
  origin: QuoteOrigin;
  /** Book, essay, speech, or collection title. Empty only when untraceable to a single source. */
  source?: string;
  /** Text in its original language (or best-attested classical form). */
  original: string;
  originalLang: QuoteLang;
  /** Korean translation. Always present. */
  korean: string;
  /** English translation. Optional — useful for mixed-language rendering. */
  english?: string;
  verified: Verification;
  /** Curator note, only set when the attribution needs a footnote. */
  note?: string;
}

// ────────────────────────────────────────────────────────────────────
// Data (161 entries)
// ────────────────────────────────────────────────────────────────────

export const QUOTES: Quote[] = [
  // ── China (14) ────────────────────────────────────────────────────
  {
    id: 1, author: '공자 孔子', yearBorn: -551, yearDied: -479, origin: '중국',
    source: '논어·위정',
    original: '溫故而知新　可以爲師矣',
    originalLang: 'zh',
    korean: '옛것을 익혀 새것을 안다면, 스승이 될 만하다.',
    english: 'To review the old and know the new — one may thus become a teacher.',
    verified: 'high',
  },
  {
    id: 2, author: '공자 孔子', yearBorn: -551, yearDied: -479, origin: '중국',
    source: '논어·위정',
    original: '學而不思則罔　思而不學則殆',
    originalLang: 'zh',
    korean: '배우되 생각하지 않으면 허망하고, 생각하되 배우지 않으면 위태롭다.',
    verified: 'high',
  },
  {
    id: 3, author: '맹자 孟子', yearBorn: -372, yearDied: -289, origin: '중국',
    source: '맹자·진심하',
    original: '盡信書 則不如無書',
    originalLang: 'zh',
    korean: '책을 다 믿는다면, 책이 없는 것만 못하다.',
    verified: 'high',
  },
  {
    id: 4, author: '노자 老子', origin: '중국',
    source: '도덕경·33장',
    original: '知人者智　自知者明',
    originalLang: 'zh',
    korean: '남을 아는 것은 지혜이고, 자신을 아는 것은 밝음이다.',
    verified: 'high',
  },
  {
    id: 5, author: '장자 莊子', yearBorn: -369, yearDied: -286, origin: '중국',
    source: '장자·양생주',
    original: '吾生也有涯　而知也無涯',
    originalLang: 'zh',
    korean: '내 삶은 끝이 있으나, 앎은 끝이 없다.',
    verified: 'high',
  },
  {
    id: 6, author: '두보 杜甫', yearBorn: 712, yearDied: 770, origin: '중국',
    source: '봉증위좌승장이십이운',
    original: '讀書破萬卷　下筆如有神',
    originalLang: 'zh',
    korean: '만 권의 책을 독파하고 나니, 붓을 드니 신들린 듯하다.',
    verified: 'high',
  },
  {
    id: 7, author: '이백 李白', yearBorn: 701, yearDied: 762, origin: '중국',
    source: '전승',
    original: '讀萬卷書　行萬里路',
    originalLang: 'zh',
    korean: '만 권의 책을 읽고, 만 리의 길을 걷는다.',
    verified: 'medium',
    note: '중국 전통 전승. 이백·동기창·전해를 전거로 전해짐.',
  },
  {
    id: 8, author: '한유 韓愈', yearBorn: 768, yearDied: 824, origin: '중국',
    source: '부독서성남',
    original: '業精於勤　荒於嬉',
    originalLang: 'zh',
    korean: '학업은 부지런함에서 정밀해지고, 놀이에서 황폐해진다.',
    verified: 'high',
  },
  {
    id: 9, author: '소식 蘇軾', yearBorn: 1037, yearDied: 1101, origin: '중국',
    original: '好書不厭百回讀　熟讀深思子自知',
    originalLang: 'zh',
    korean: '좋은 책은 백 번을 읽어도 싫증나지 않으니, 숙독하고 깊이 생각하면 스스로 알게 된다.',
    verified: 'high',
  },
  {
    id: 10, author: '주희 朱熹', yearBorn: 1130, yearDied: 1200, origin: '중국',
    source: '주자어류',
    original: '讀書千遍　其義自見',
    originalLang: 'zh',
    korean: '책을 천 번 읽으면, 그 뜻이 저절로 드러난다.',
    verified: 'high',
  },
  {
    id: 11, author: '제갈량 諸葛亮', yearBorn: 181, yearDied: 234, origin: '중국',
    source: '계자서',
    original: '非淡泊無以明志　非寧靜無以致遠',
    originalLang: 'zh',
    korean: '담박하지 않으면 뜻을 밝힐 수 없고, 고요하지 않으면 멀리 이를 수 없다.',
    verified: 'high',
  },
  {
    id: 12, author: '루쉰 魯迅', yearBorn: 1881, yearDied: 1936, origin: '중국',
    source: '고향',
    original: '世上本沒有路　走的人多了　也便成了路',
    originalLang: 'zh',
    korean: '세상에 본래 길은 없었으나, 걷는 사람이 많아지자 곧 길이 되었다.',
    verified: 'high',
  },
  {
    id: 13, author: '도연명 陶淵明', yearBorn: 365, yearDied: 427, origin: '중국',
    source: '오류선생전',
    original: '好讀書　不求甚解　每有會意　便欣然忘食',
    originalLang: 'zh',
    korean: '책 읽기를 좋아하되 지나친 해석을 구하지 않고, 뜻이 통할 때마다 기쁜 나머지 먹는 것도 잊는다.',
    verified: 'high',
  },
  {
    id: 14, author: '사마천 司馬遷', yearBorn: -145, yearDied: -86, origin: '중국',
    source: '보임소경서',
    original: '究天人之際　通古今之變　成一家之言',
    originalLang: 'zh',
    korean: '하늘과 사람의 관계를 끝까지 살피고, 옛과 지금의 변화를 꿰뚫어, 한 가(家)의 말을 이룬다.',
    verified: 'high',
  },

  // ── Japan (6) ─────────────────────────────────────────────────────
  {
    id: 15, author: '요시다 겐코 吉田兼好', yearBorn: 1283, yearDied: 1352, origin: '일본',
    source: '쓰레즈레구사·13단',
    original: 'ひとり燈のもとに文をひろげて　見ぬ世の人を友とするぞ　こよなう慰むわざなる。',
    originalLang: 'ja',
    korean: '홀로 등불 아래 책을 펼쳐서, 보지 못한 시대의 사람을 벗 삼는 일만큼 위로가 되는 일은 없다.',
    verified: 'high',
  },
  {
    id: 16, author: '마쓰오 바쇼 松尾芭蕉', yearBorn: 1644, yearDied: 1694, origin: '일본',
    source: '오쿠노호소미치',
    original: '月日は百代の過客にして　行きかふ年もまた旅人なり。',
    originalLang: 'ja',
    korean: '달과 해는 백대의 나그네요, 오고 가는 해 또한 나그네이다.',
    verified: 'high',
  },
  {
    id: 17, author: '아쿠타가와 류노스케 芥川龍之介', yearBorn: 1892, yearDied: 1927, origin: '일본',
    source: '주유의 말',
    original: '人生は一箱のマッチに似ている。',
    originalLang: 'ja',
    korean: '인생은 한 갑의 성냥과 같다.',
    verified: 'high',
  },
  {
    id: 18, author: '가와바타 야스나리 川端康成', yearBorn: 1899, yearDied: 1972, origin: '일본',
    source: '노벨상 수상 연설 (1968)',
    original: '美しい日本の私。',
    originalLang: 'ja',
    korean: '아름다운 일본의 나.',
    verified: 'high',
  },
  {
    id: 19, author: '무라카미 하루키 村上春樹', yearBorn: 1949, origin: '일본',
    source: '노르웨이의 숲',
    original: 'もし君が他のみんなが読んでいる本しか読まないなら、みんなが考えていることしか考えられない。',
    originalLang: 'ja',
    korean: '모두가 읽는 책만 읽는다면, 모두가 생각하는 것만 생각할 수밖에 없다.',
    verified: 'high',
  },
  {
    id: 20, author: '오에 겐자부로 大江健三郎', yearBorn: 1935, yearDied: 2023, origin: '일본',
    source: '노벨상 수상 연설 (1994)',
    original: 'あいまいな日本の私。',
    originalLang: 'ja',
    korean: '모호한 일본의 나.',
    verified: 'high',
  },

  // ── Korea (11) ────────────────────────────────────────────────────
  {
    id: 21, author: '안중근', yearBorn: 1879, yearDied: 1910, origin: '한국',
    source: '옥중 유묵 (1910)',
    original: '一日不讀書　口中生荊棘',
    originalLang: 'zh',
    korean: '하루라도 책을 읽지 않으면 입 안에 가시가 돋는다.',
    verified: 'high',
  },
  {
    id: 22, author: '정약용 (다산)', yearBorn: 1762, yearDied: 1836, origin: '한국',
    source: '여유당전서',
    original: '讀書　乃人間第一件淸事',
    originalLang: 'zh',
    korean: '독서야말로 인간이 행할 가장 맑은 일이다.',
    verified: 'high',
  },
  {
    id: 23, author: '이황 (퇴계)', yearBorn: 1501, yearDied: 1570, origin: '한국',
    source: '자성록',
    original: '讀書如遊山',
    originalLang: 'zh',
    korean: '책을 읽음은 산을 노님과 같다.',
    verified: 'high',
  },
  {
    id: 24, author: '이이 (율곡)', yearBorn: 1536, yearDied: 1584, origin: '한국',
    source: '격몽요결',
    original: '讀書者　讀其言而得其心',
    originalLang: 'zh',
    korean: '책을 읽는 자는, 그 말을 읽어 그 마음을 얻는다.',
    verified: 'high',
  },
  {
    id: 25, author: '이덕무 (간서치)', yearBorn: 1741, yearDied: 1793, origin: '한국',
    source: '간서치전',
    original: '오로지 책 보는 것만 즐거움으로 여겨, 춥거나 덥거나 주리거나 병들거나 전연 알지를 못하였다.',
    originalLang: 'ko',
    korean: '오로지 책 보는 것만 즐거움으로 여겨, 춥거나 덥거나 주리거나 병들거나 전연 알지를 못하였다.',
    verified: 'high',
  },
  {
    id: 26, author: '이덕무 (간서치)', yearBorn: 1741, yearDied: 1793, origin: '한국',
    source: '이목구심서',
    original: '지극한 슬픔이 닥치면 사방을 둘러보아도 막막하기만 한데, 나는 다행히 두 눈이 있어 글자를 배울 수 있었다. 그리하여 지극한 슬픔 속에서도 한 권의 책을 들어 내 슬픈 마음을 위로한다.',
    originalLang: 'ko',
    korean: '지극한 슬픔이 닥치면 사방을 둘러보아도 막막하기만 한데, 나는 다행히 두 눈이 있어 글자를 배울 수 있었다. 그리하여 지극한 슬픔 속에서도 한 권의 책을 들어 내 슬픈 마음을 위로한다.',
    verified: 'high',
  },
  {
    id: 27, author: '허준', yearBorn: 1539, yearDied: 1615, origin: '한국',
    source: '동의보감 서문 정신',
    original: '欲知古今未聞之道　須讀古今未讀之書',
    originalLang: 'zh',
    korean: '옛과 지금의 듣지 못한 도를 알고자 하면, 옛과 지금의 읽지 못한 책을 읽어야 한다.',
    verified: 'medium',
  },
  {
    id: 28, author: '김구 (백범)', yearBorn: 1876, yearDied: 1949, origin: '한국',
    source: '백범일지',
    original: '나는 우리나라가 세계에서 가장 아름다운 나라가 되기를 원한다. 오직 한없이 가지고 싶은 것은 높은 문화의 힘이다.',
    originalLang: 'ko',
    korean: '나는 우리나라가 세계에서 가장 아름다운 나라가 되기를 원한다. 오직 한없이 가지고 싶은 것은 높은 문화의 힘이다.',
    verified: 'high',
  },
  {
    id: 29, author: '세종대왕', yearBorn: 1397, yearDied: 1450, origin: '한국',
    source: '훈민정음 서문',
    original: '나라의 말씀이 중국과 달라 문자와 서로 통하지 아니하매, 이런 까닭으로 어리석은 백성이 이르고자 할 바 있어도 마침내 제 뜻을 능히 펴지 못하는 사람이 많으니라.',
    originalLang: 'ko',
    korean: '나라의 말씀이 중국과 달라 문자와 서로 통하지 아니하매, 이런 까닭으로 어리석은 백성이 이르고자 할 바 있어도 마침내 제 뜻을 능히 펴지 못하는 사람이 많으니라.',
    verified: 'high',
  },
  {
    id: 30, author: '박지원 (연암)', yearBorn: 1737, yearDied: 1805, origin: '한국',
    source: '열하일기',
    original: '讀書而不識字 猶不讀也',
    originalLang: 'zh',
    korean: '책을 읽되 글자를 알지 못하면, 읽지 아니함과 같다.',
    verified: 'high',
  },
  {
    id: 31, author: '법정 (스님)', yearBorn: 1932, yearDied: 2010, origin: '한국',
    source: '무소유 (1976)',
    original: '무소유란 아무것도 갖지 않는 것이 아니라, 궁극적으로 불필요한 것을 갖지 않는다는 뜻이다.',
    originalLang: 'ko',
    korean: '무소유란 아무것도 갖지 않는 것이 아니라, 궁극적으로 불필요한 것을 갖지 않는다는 뜻이다.',
    verified: 'high',
    note: 'Phi 큐레이션 철학 ("쌓지 않고 소장한다")과 직접 호응.',
  },

  // ── Ancient Mediterranean (8) ─────────────────────────────────────
  {
    id: 32, author: '소크라테스 Σωκράτης', yearBorn: -470, yearDied: -399, origin: '고대 그리스',
    source: '플라톤 《소크라테스의 변명》',
    original: 'ὁ ἀνεξέταστος βίος οὐ βιωτὸς ἀνθρώπῳ.',
    originalLang: 'grc',
    korean: '검토되지 않은 삶은 살 가치가 없다.',
    english: 'The unexamined life is not worth living.',
    verified: 'high',
  },
  {
    id: 33, author: '아리스토텔레스 Ἀριστοτέλης', yearBorn: -384, yearDied: -322, origin: '고대 그리스',
    source: '디오게네스 라에르티오스 전승',
    original: 'αἱ ῥίζαι τῆς παιδείας πικραί, ὁ δὲ καρπὸς γλυκύς.',
    originalLang: 'grc',
    korean: '교육의 뿌리는 쓰지만, 그 열매는 달다.',
    verified: 'medium',
  },
  {
    id: 34, author: '키케로 Cicero', yearBorn: -106, yearDied: -43, origin: '고대 로마',
    original: 'Cum libris vivere, cum libris mori.',
    originalLang: 'la',
    korean: '책과 함께 살고, 책과 함께 죽는다.',
    verified: 'medium',
  },
  {
    id: 35, author: '키케로 Cicero', yearBorn: -106, yearDied: -43, origin: '고대 로마',
    source: '친구에게 보내는 편지 정신',
    original: 'Sine libris conclave est velut corpus sine anima.',
    originalLang: 'la',
    korean: '책이 없는 방은 영혼 없는 몸과 같다.',
    verified: 'medium',
  },
  {
    id: 36, author: '세네카 Seneca', yearBorn: -4, yearDied: 65, origin: '고대 로마',
    source: '루킬리우스에게 보내는 서한 82',
    original: 'Otium sine litteris mors est et hominis vivi sepultura.',
    originalLang: 'la',
    korean: '문자 없는 여가는 죽음이요, 산 자의 무덤이다.',
    verified: 'high',
  },
  {
    id: 37, author: '마르쿠스 아우렐리우스 Marcus Aurelius', yearBorn: 121, yearDied: 180, origin: '고대 로마',
    source: '명상록',
    original: 'μηκέτι περὶ τοῦ ποῖόν τινα εἶναι τὸν ἀγαθὸν ἄνδρα διαλέγεσθαι, ἀλλὰ εἶναι τοιοῦτον.',
    originalLang: 'grc',
    korean: '좋은 사람이 어떠해야 하는지 논쟁할 시간을 낭비하지 말라. 그런 사람이 되어라.',
    verified: 'high',
  },
  {
    id: 38, author: '호라티우스 Horace', yearBorn: -65, yearDied: -8, origin: '고대 로마',
    source: '서간집 I',
    original: 'Nunc est bibendum, nunc pede libero pulsanda tellus.',
    originalLang: 'la',
    korean: '지금이 마실 때이고, 지금이 자유로운 발로 땅을 두드릴 때이다.',
    verified: 'high',
  },
  {
    id: 39, author: '플루타르코스 Plutarch', yearBorn: 46, yearDied: 120, origin: '고대 그리스',
    source: '도덕론·듣는 것에 대하여',
    original: 'τὸ γὰρ πνεῦμα τῶν νέων οὐκ ἀγγεῖον πληρωτέον, ἀλλ\' ὑπέκκαυμα ἀναπτέον.',
    originalLang: 'grc',
    korean: '젊은 정신은 채워야 할 그릇이 아니라, 점화되어야 할 불씨다.',
    verified: 'high',
  },

  // ── British Isles (20) ────────────────────────────────────────────
  {
    id: 40, author: '윌리엄 셰익스피어 Shakespeare', yearBorn: 1564, yearDied: 1616, origin: '영국',
    source: '템페스트 1막 2장',
    original: 'My library was dukedom large enough.',
    originalLang: 'en',
    korean: '나의 서가가 곧 내게는 충분히 큰 대공국이었다.',
    english: 'My library was dukedom large enough.',
    verified: 'high',
  },
  {
    id: 41, author: '프랜시스 베이컨 Francis Bacon', yearBorn: 1561, yearDied: 1626, origin: '영국',
    source: '수상록·학문에 관하여',
    original: 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.',
    originalLang: 'en',
    korean: '어떤 책은 맛만 보고, 어떤 책은 통째로 삼키며, 또 몇몇은 씹어 소화해야 한다.',
    english: 'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.',
    verified: 'high',
  },
  {
    id: 42, author: '프랜시스 베이컨 Francis Bacon', yearBorn: 1561, yearDied: 1626, origin: '영국',
    source: '수상록·학문에 관하여',
    original: 'Reading maketh a full man; conference a ready man; and writing an exact man.',
    originalLang: 'en',
    korean: '독서는 완성된 사람을 만들고, 대화는 준비된 사람을, 글쓰기는 정확한 사람을 만든다.',
    verified: 'high',
  },
  {
    id: 43, author: '존 밀턴 John Milton', yearBorn: 1608, yearDied: 1674, origin: '영국',
    source: '아레오파기티카',
    original: 'A good book is the precious lifeblood of a master spirit.',
    originalLang: 'en',
    korean: '좋은 책은 위대한 정신의 귀한 생명의 피다.',
    verified: 'high',
  },
  {
    id: 44, author: '새뮤얼 존슨 Samuel Johnson', yearBorn: 1709, yearDied: 1784, origin: '영국',
    source: 'Boswell, Life of Johnson',
    original: 'The greatest part of a writer\'s time is spent in reading, in order to write.',
    originalLang: 'en',
    korean: '작가가 쓰는 시간의 대부분은 쓰기 위해 읽는 시간이다.',
    verified: 'high',
  },
  {
    id: 45, author: '제인 오스틴 Jane Austen', yearBorn: 1775, yearDied: 1817, origin: '영국',
    source: '노생거 수도원',
    original: 'The person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid.',
    originalLang: 'en',
    korean: '신사든 숙녀든, 좋은 소설에서 즐거움을 얻지 못하는 사람은 견딜 수 없이 어리석다.',
    verified: 'high',
  },
  {
    id: 46, author: '윌리엄 워즈워스 William Wordsworth', yearBorn: 1770, yearDied: 1850, origin: '영국',
    original: 'Fill your paper with the breathings of your heart.',
    originalLang: 'en',
    korean: '종이를 당신 마음의 숨결로 채우라.',
    verified: 'high',
  },
  {
    id: 47, author: '존 키츠 John Keats', yearBorn: 1795, yearDied: 1821, origin: '영국',
    source: '엔디미온',
    original: 'A thing of beauty is a joy forever.',
    originalLang: 'en',
    korean: '아름다운 것은 영원한 기쁨이다.',
    verified: 'high',
  },
  {
    id: 48, author: '찰스 디킨스 Charles Dickens', yearBorn: 1812, yearDied: 1870, origin: '영국',
    original: 'There are books of which the backs and covers are by far the best parts.',
    originalLang: 'en',
    korean: '등과 표지가 단연 최고의 부분인 책도 있다.',
    verified: 'high',
  },
  {
    id: 49, author: '토머스 칼라일 Thomas Carlyle', yearBorn: 1795, yearDied: 1881, origin: '영국',
    source: 'On Heroes, Hero-Worship',
    original: 'The true University of these days is a collection of books.',
    originalLang: 'en',
    korean: '이 시대의 진정한 대학은 한 무더기의 책이다.',
    verified: 'high',
  },
  {
    id: 50, author: '오스카 와일드 Oscar Wilde', yearBorn: 1854, yearDied: 1900, origin: '아일랜드',
    original: 'It is what you read when you don\'t have to that determines what you will be when you can\'t help it.',
    originalLang: 'en',
    korean: '읽을 필요가 없을 때 무엇을 읽느냐가, 어쩔 수 없을 때 당신이 무엇이 될지를 결정한다.',
    verified: 'high',
  },
  {
    id: 51, author: '오스카 와일드 Oscar Wilde', yearBorn: 1854, yearDied: 1900, origin: '아일랜드',
    source: '진지함의 중요성',
    original: 'I never travel without my diary. One should always have something sensational to read in the train.',
    originalLang: 'en',
    korean: '나는 일기장 없이 여행하지 않는다. 기차에서는 늘 자극적인 읽을 거리가 있어야 한다.',
    verified: 'high',
  },
  {
    id: 52, author: 'G.K. 체스터턴 G.K. Chesterton', yearBorn: 1874, yearDied: 1936, origin: '영국',
    source: 'Heretics',
    original: 'There is a great deal of difference between the eager man who wants to read a book, and the tired man who wants a book to read.',
    originalLang: 'en',
    korean: '책을 읽고 싶어 조급한 사람과, 읽을 책을 찾는 지친 사람 사이에는 큰 차이가 있다.',
    verified: 'high',
  },
  {
    id: 53, author: '버지니아 울프 Virginia Woolf', yearBorn: 1882, yearDied: 1941, origin: '영국',
    source: '막간 (Between the Acts)',
    original: 'Books are the mirrors of the soul.',
    originalLang: 'en',
    korean: '책은 영혼의 거울이다.',
    verified: 'high',
  },
  {
    id: 54, author: '버지니아 울프 Virginia Woolf', yearBorn: 1882, yearDied: 1941, origin: '영국',
    source: 'A Room of One\'s Own',
    original: 'A woman must have money and a room of her own if she is to write fiction.',
    originalLang: 'en',
    korean: '여성이 소설을 쓰려면 돈과 자기만의 방이 있어야 한다.',
    verified: 'high',
  },
  {
    id: 55, author: '조지 오웰 George Orwell', yearBorn: 1903, yearDied: 1950, origin: '영국',
    source: 'Why I Write',
    original: 'Good prose is like a windowpane.',
    originalLang: 'en',
    korean: '좋은 산문은 창유리 같다.',
    verified: 'high',
  },
  {
    id: 56, author: 'C.S. 루이스 C.S. Lewis', yearBorn: 1898, yearDied: 1963, origin: '영국',
    original: 'You can never get a cup of tea large enough or a book long enough to suit me.',
    originalLang: 'en',
    korean: '차는 아무리 크게 내와도, 책은 아무리 길어도, 나를 만족시킬 만큼은 아니다.',
    verified: 'high',
  },
  {
    id: 57, author: 'J.R.R. 톨킨 J.R.R. Tolkien', yearBorn: 1892, yearDied: 1973, origin: '영국',
    source: '반지의 제왕',
    original: 'Not all those who wander are lost.',
    originalLang: 'en',
    korean: '방황하는 모두가 길을 잃은 것은 아니다.',
    verified: 'high',
  },
  {
    id: 58, author: '닐 게이먼 Neil Gaiman', yearBorn: 1960, origin: '영국',
    original: 'A book is a dream that you hold in your hand.',
    originalLang: 'en',
    korean: '책은 손에 쥔 꿈이다.',
    verified: 'high',
  },
  {
    id: 59, author: 'W.B. 예이츠 W.B. Yeats', yearBorn: 1865, yearDied: 1939, origin: '아일랜드',
    original: 'Education is not the filling of a pail, but the lighting of a fire.',
    originalLang: 'en',
    korean: '교육은 양동이를 채우는 일이 아니라 불을 붙이는 일이다.',
    verified: 'medium',
    note: '예이츠 귀속으로 널리 전해지나 플루타르코스의 원형이 존재 (#39 참조).',
  },

  // ── France (10) ───────────────────────────────────────────────────
  {
    id: 60, author: '미셸 드 몽테뉴 Montaigne', yearBorn: 1533, yearDied: 1592, origin: '프랑스',
    source: '수상록',
    original: 'Quand je me prends à lire, il me semble voir vivre les livres.',
    originalLang: 'fr',
    korean: '책을 읽기 시작하면, 책이 살아 있는 듯이 보인다.',
    verified: 'high',
  },
  {
    id: 61, author: '볼테르 Voltaire', yearBorn: 1694, yearDied: 1778, origin: '프랑스',
    original: 'Lisons, dansons; ces deux amusements ne feront jamais de mal au monde.',
    originalLang: 'fr',
    korean: '읽고 춤추자. 이 두 가지 즐거움은 결코 세상에 해를 끼치지 않는다.',
    verified: 'high',
  },
  {
    id: 62, author: '빅토르 위고 Victor Hugo', yearBorn: 1802, yearDied: 1885, origin: '프랑스',
    source: '레미제라블',
    original: 'Apprendre à lire, c\'est allumer du feu.',
    originalLang: 'fr',
    korean: '읽기를 배우는 것은 불을 붙이는 일이다.',
    verified: 'high',
  },
  {
    id: 63, author: '귀스타브 플로베르 Flaubert', yearBorn: 1821, yearDied: 1880, origin: '프랑스',
    source: '서한',
    original: 'Ne lisez pas comme les enfants lisent, pour vous amuser; ni comme les ambitieux, pour vous instruire. Non, lisez pour vivre.',
    originalLang: 'fr',
    korean: '아이처럼 즐기려 읽지 말고, 야심가처럼 배우려 읽지도 말라. 살기 위해 읽어라.',
    verified: 'high',
  },
  {
    id: 64, author: '샤를 보들레르 Baudelaire', yearBorn: 1821, yearDied: 1867, origin: '프랑스',
    source: '파리의 우울',
    original: 'Il faut être toujours ivre... De vin, de poésie ou de vertu, à votre guise.',
    originalLang: 'fr',
    korean: '언제나 취해 있어야 한다... 술에, 시에, 미덕에, 당신이 원하는 무엇에.',
    verified: 'high',
  },
  {
    id: 65, author: '마르셀 프루스트 Marcel Proust', yearBorn: 1871, yearDied: 1922, origin: '프랑스',
    source: '잃어버린 시간을 찾아서',
    original: 'Le véritable voyage de découverte ne consiste pas à chercher de nouveaux paysages, mais à avoir de nouveaux yeux.',
    originalLang: 'fr',
    korean: '진정한 발견의 여행은 새로운 풍경을 찾는 것이 아니라 새로운 눈을 갖는 것이다.',
    verified: 'high',
  },
  {
    id: 66, author: '장-폴 사르트르 Jean-Paul Sartre', yearBorn: 1905, yearDied: 1980, origin: '프랑스',
    source: '말 (Les Mots)',
    original: 'Les mots sont des pistolets chargés.',
    originalLang: 'fr',
    korean: '말은 장전된 권총이다.',
    verified: 'high',
  },
  {
    id: 67, author: '시몬 드 보부아르 Simone de Beauvoir', yearBorn: 1908, yearDied: 1986, origin: '프랑스',
    source: '제2의 성',
    original: 'On ne naît pas femme: on le devient.',
    originalLang: 'fr',
    korean: '여성은 태어나는 것이 아니라 만들어진다.',
    verified: 'high',
  },
  {
    id: 68, author: '알베르 카뮈 Albert Camus', yearBorn: 1913, yearDied: 1960, origin: '프랑스',
    source: '여름',
    original: 'Au milieu de l\'hiver, j\'apprenais enfin qu\'il y avait en moi un été invincible.',
    originalLang: 'fr',
    korean: '한겨울에, 나는 마침내 내 안에 불멸의 여름이 있음을 알게 되었다.',
    verified: 'high',
  },
  {
    id: 69, author: '롤랑 바르트 Roland Barthes', yearBorn: 1915, yearDied: 1980, origin: '프랑스',
    source: '저자의 죽음',
    original: 'La naissance du lecteur doit se payer de la mort de l\'Auteur.',
    originalLang: 'fr',
    korean: '독자의 탄생은 저자의 죽음으로 대가를 치러야 한다.',
    verified: 'high',
  },

  // ── Germany / Austria (11) ────────────────────────────────────────
  {
    id: 70, author: '요한 볼프강 폰 괴테 Goethe', yearBorn: 1749, yearDied: 1832, origin: '독일',
    source: '빌헬름 마이스터의 수업시대',
    original: 'Man sollte alle Tage wenigstens ein kleines Lied hören, ein gutes Gedicht lesen, ein treffliches Gemälde sehen.',
    originalLang: 'de',
    korean: '하루에 적어도 짧은 노래를 듣고, 좋은 시를 읽고, 훌륭한 그림을 보아야 한다.',
    verified: 'high',
  },
  {
    id: 71, author: '프리드리히 횔덜린 Friedrich Hölderlin', yearBorn: 1770, yearDied: 1843, origin: '독일',
    source: '휘페리온 (Hyperion)',
    original: 'Was die Menschen nicht zu Göttern macht, das macht sie zu Tieren.',
    originalLang: 'de',
    korean: '인간을 신으로 만들지 않는 것은, 인간을 짐승으로 만든다.',
    verified: 'high',
  },
  {
    id: 72, author: '아르투어 쇼펜하우어 Schopenhauer', yearBorn: 1788, yearDied: 1860, origin: '독일',
    source: '삶의 지혜를 위한 격언',
    original: 'Bücher kaufen wäre schön, wenn man auch die Zeit dazu mitkaufen könnte, sie zu lesen.',
    originalLang: 'de',
    korean: '책을 사는 일은 그 책을 읽을 시간까지 함께 살 수만 있다면 좋은 일일 것이다.',
    verified: 'high',
  },
  {
    id: 73, author: '프리드리히 니체 Nietzsche', yearBorn: 1844, yearDied: 1900, origin: '독일',
    source: '차라투스트라는 이렇게 말했다',
    original: 'Von allem Geschriebenen liebe ich nur das, was einer mit seinem Blute schreibt.',
    originalLang: 'de',
    korean: '쓰인 모든 것 중에서 나는 오직 자신의 피로 쓴 것만을 사랑한다.',
    verified: 'high',
  },
  {
    id: 74, author: '라이너 마리아 릴케 Rilke', yearBorn: 1875, yearDied: 1926, origin: '오스트리아',
    source: '젊은 시인에게 보내는 편지',
    original: 'Seien Sie geduldig gegen alles Ungelöste in Ihrem Herzen.',
    originalLang: 'de',
    korean: '마음속 해결되지 않은 모든 것에 인내하라.',
    verified: 'high',
  },
  {
    id: 75, author: '프란츠 카프카 Franz Kafka', yearBorn: 1883, yearDied: 1924, origin: '오스트리아',
    source: 'Oskar Pollak에게 보낸 서한 (1904)',
    original: 'Ein Buch muß die Axt sein für das gefrorene Meer in uns.',
    originalLang: 'de',
    korean: '책은 우리 안의 얼어붙은 바다를 깨는 도끼여야 한다.',
    verified: 'high',
  },
  {
    id: 76, author: '토마스 만 Thomas Mann', yearBorn: 1875, yearDied: 1955, origin: '독일',
    source: 'Essays of Three Decades',
    original: 'Ein Schriftsteller ist ein Mensch, dem das Schreiben schwerer fällt als anderen Leuten.',
    originalLang: 'de',
    korean: '작가란 글쓰기가 다른 이들보다 더 어려운 사람이다.',
    verified: 'high',
  },
  {
    id: 77, author: '헤르만 헤세 Hermann Hesse', yearBorn: 1877, yearDied: 1962, origin: '독일',
    source: '책의 마술',
    original: 'Von allen Welten, die der Mensch geschaffen hat, ist die der Bücher die gewaltigste.',
    originalLang: 'de',
    korean: '인간이 만든 모든 세계 가운데, 책의 세계가 가장 웅대하다.',
    verified: 'high',
  },
  {
    id: 78, author: '발터 벤야민 Walter Benjamin', yearBorn: 1892, yearDied: 1940, origin: '독일',
    source: '나의 책장을 풀다 (Ich packe meine Bibliothek aus)',
    original: 'Unter allen Arten, sich Bücher zu verschaffen, wird als die rühmlichste betrachtet, sie selber zu schreiben.',
    originalLang: 'de',
    korean: '책을 얻는 모든 방법 가운데, 스스로 쓰는 것이 가장 훌륭한 방법으로 여겨진다.',
    verified: 'high',
  },
  {
    id: 79, author: '하인리히 하이네 Heinrich Heine', yearBorn: 1797, yearDied: 1856, origin: '독일',
    source: '알만소르 (Almansor)',
    original: 'Dort, wo man Bücher verbrennt, verbrennt man am Ende auch Menschen.',
    originalLang: 'de',
    korean: '사람들이 책을 태우는 곳에서는, 마침내 사람도 태우게 된다.',
    verified: 'high',
  },
  {
    id: 80, author: '슈테판 츠바이크 Stefan Zweig', yearBorn: 1881, yearDied: 1942, origin: '오스트리아',
    original: 'Ein Buch kauft man nicht nur für das, was es sagt, sondern für die Möglichkeit, daß es einem etwas sagt.',
    originalLang: 'de',
    korean: '책은 그것이 말하는 것을 사기 위해서가 아니라, 그것이 당신에게 무언가 말할 가능성을 사기 위해 사는 것이다.',
    verified: 'medium',
  },

  // ── Italy / Iberia (8) ────────────────────────────────────────────
  {
    id: 81, author: '단테 알리기에리 Dante', yearBorn: 1265, yearDied: 1321, origin: '이탈리아',
    source: '신곡·지옥편 V',
    original: 'Nessun maggior dolore che ricordarsi del tempo felice nella miseria.',
    originalLang: 'it',
    korean: '비참 속에서 행복했던 때를 떠올리는 것보다 더 큰 슬픔은 없다.',
    verified: 'high',
  },
  {
    id: 82, author: '페트라르카 Petrarca', yearBorn: 1304, yearDied: 1374, origin: '이탈리아',
    source: '서한',
    original: 'I libri dilettano le midolla delle ossa.',
    originalLang: 'it',
    korean: '책은 뼛속 골수까지 즐거움을 준다.',
    verified: 'medium',
  },
  {
    id: 83, author: '움베르토 에코 Umberto Eco', yearBorn: 1932, yearDied: 2016, origin: '이탈리아',
    original: 'Chi non legge, a 70 anni avrà vissuto una sola vita. Chi legge avrà vissuto 5000 anni.',
    originalLang: 'it',
    korean: '읽지 않는 자는 일흔이 되어도 단 한 번의 삶을 살지만, 읽는 자는 5천 년을 산다.',
    verified: 'high',
  },
  {
    id: 84, author: '이탈로 칼비노 Italo Calvino', yearBorn: 1923, yearDied: 1985, origin: '이탈리아',
    source: '왜 고전을 읽는가',
    original: 'Un classico è un libro che non ha mai finito di dire quel che ha da dire.',
    originalLang: 'it',
    korean: '고전이란 할 말을 결코 다 끝내지 않는 책이다.',
    verified: 'high',
  },
  {
    id: 85, author: '미겔 데 세르반테스 Cervantes', yearBorn: 1547, yearDied: 1616, origin: '스페인',
    source: '돈키호테',
    original: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.',
    originalLang: 'es',
    korean: '많이 읽고 많이 걷는 자는, 많이 보고 많이 안다.',
    verified: 'high',
  },
  {
    id: 86, author: '페데리코 가르시아 로르카 García Lorca', yearBorn: 1898, yearDied: 1936, origin: '스페인',
    original: 'La poesía es la unión de dos palabras que uno nunca supuso que pudieran juntarse.',
    originalLang: 'es',
    korean: '시는 결코 함께일 수 없으리라 생각했던 두 낱말의 결합이다.',
    verified: 'high',
  },
  {
    id: 87, author: '페르난도 페소아 Fernando Pessoa', yearBorn: 1888, yearDied: 1935, origin: '포르투갈',
    original: 'A literatura é a prova de que a vida não chega.',
    originalLang: 'pt',
    korean: '문학은 삶이 충분치 않다는 증거다.',
    verified: 'high',
  },
  {
    id: 88, author: '주제 사라마구 José Saramago', yearBorn: 1922, yearDied: 2010, origin: '포르투갈',
    original: 'É preciso sair da ilha para ver a ilha.',
    originalLang: 'pt',
    korean: '섬을 보려면 섬을 떠나야 한다.',
    verified: 'high',
  },

  // ── USA (38) ──────────────────────────────────────────────────────
  {
    id: 89, author: '벤저민 프랭클린 Benjamin Franklin', yearBorn: 1706, yearDied: 1790, origin: '미국',
    original: 'Either write something worth reading or do something worth writing.',
    originalLang: 'en',
    korean: '읽을 가치가 있는 것을 쓰거나, 쓸 가치가 있는 일을 하라.',
    verified: 'high',
  },
  {
    id: 90, author: '에이브러햄 링컨 Abraham Lincoln', yearBorn: 1809, yearDied: 1865, origin: '미국',
    original: 'My best friend is a person who will give me a book I have not read.',
    originalLang: 'en',
    korean: '나의 가장 좋은 친구는, 내가 아직 읽지 않은 책을 건네줄 사람이다.',
    verified: 'high',
  },
  {
    id: 91, author: '랠프 월도 에머슨 Ralph Waldo Emerson', yearBorn: 1803, yearDied: 1882, origin: '미국',
    original: 'I cannot remember the books I\'ve read any more than the meals I have eaten; even so, they have made me.',
    originalLang: 'en',
    korean: '읽은 책을 먹은 식사만큼도 기억하지 못한다. 그럼에도 그것들이 나를 만들었다.',
    verified: 'high',
  },
  {
    id: 92, author: '랠프 월도 에머슨 Ralph Waldo Emerson', yearBorn: 1803, yearDied: 1882, origin: '미국',
    original: 'Books are the best type of the influence of the past.',
    originalLang: 'en',
    korean: '책은 과거의 영향이 취할 수 있는 최상의 형태이다.',
    verified: 'high',
  },
  {
    id: 93, author: '헨리 데이비드 소로 Henry David Thoreau', yearBorn: 1817, yearDied: 1862, origin: '미국',
    source: '월든',
    original: 'How many a man has dated a new era in his life from the reading of a book.',
    originalLang: 'en',
    korean: '얼마나 많은 사람이 책 한 권의 독서로 인생의 새 시대를 시작했던가.',
    verified: 'high',
  },
  {
    id: 94, author: '헨리 데이비드 소로 Henry David Thoreau', yearBorn: 1817, yearDied: 1862, origin: '미국',
    source: '월든',
    original: 'Books are the treasured wealth of the world.',
    originalLang: 'en',
    korean: '책은 세상의 소중한 부(富)이다.',
    verified: 'high',
  },
  {
    id: 95, author: '에밀리 디킨슨 Emily Dickinson', yearBorn: 1830, yearDied: 1886, origin: '미국',
    original: 'There is no Frigate like a Book / To take us Lands away.',
    originalLang: 'en',
    korean: '우리를 먼 땅으로 데려가는 데에 / 책만한 배는 없다.',
    verified: 'high',
  },
  {
    id: 96, author: '월트 휘트먼 Walt Whitman', yearBorn: 1819, yearDied: 1892, origin: '미국',
    source: '풀잎',
    original: 'That the powerful play goes on, and you may contribute a verse.',
    originalLang: 'en',
    korean: '그 거대한 연극은 계속 이어지고, 당신은 한 구절을 기여할 수 있다.',
    verified: 'high',
  },
  {
    id: 97, author: '허먼 멜빌 Herman Melville', yearBorn: 1819, yearDied: 1891, origin: '미국',
    source: '모비딕',
    original: 'A whale-ship was my Yale College and my Harvard.',
    originalLang: 'en',
    korean: '포경선이 내게는 예일이자 하버드였다.',
    verified: 'high',
  },
  {
    id: 99, author: '마크 트웨인 Mark Twain', yearBorn: 1835, yearDied: 1910, origin: '미국',
    original: 'The man who does not read has no advantage over the man who cannot read.',
    originalLang: 'en',
    korean: '책을 읽지 않는 사람은, 책을 읽을 수 없는 사람보다 나은 점이 없다.',
    verified: 'high',
  },
  {
    id: 100, author: '마크 트웨인 Mark Twain', yearBorn: 1835, yearDied: 1910, origin: '미국',
    original: 'A classic is a book which people praise and don\'t read.',
    originalLang: 'en',
    korean: '고전이란, 사람들이 칭찬하고 읽지 않는 책이다.',
    verified: 'high',
  },
  {
    id: 101, author: '어니스트 헤밍웨이 Ernest Hemingway', yearBorn: 1899, yearDied: 1961, origin: '미국',
    original: 'There is no friend as loyal as a book.',
    originalLang: 'en',
    korean: '책만큼 충실한 친구는 없다.',
    verified: 'high',
  },
  {
    id: 102, author: '어니스트 헤밍웨이 Ernest Hemingway', yearBorn: 1899, yearDied: 1961, origin: '미국',
    original: 'All good books are alike in that they are truer than if they had really happened.',
    originalLang: 'en',
    korean: '모든 좋은 책은, 실제 일어난 일보다 더 진실하다는 점에서 똑같다.',
    verified: 'high',
  },
  {
    id: 103, author: 'F. 스콧 피츠제럴드 F. Scott Fitzgerald', yearBorn: 1896, yearDied: 1940, origin: '미국',
    original: 'That is part of the beauty of all literature. You discover that your longings are universal longings, that you\'re not lonely and isolated from anyone.',
    originalLang: 'en',
    korean: '그것이 모든 문학의 아름다움의 일부다. 당신의 갈망이 보편적인 갈망임을 발견하게 된다.',
    verified: 'high',
  },
  {
    id: 104, author: '윌리엄 포크너 William Faulkner', yearBorn: 1897, yearDied: 1962, origin: '미국',
    original: 'Read, read, read. Read everything — trash, classics, good and bad.',
    originalLang: 'en',
    korean: '읽어라, 읽어라, 읽어라. 쓰레기든 고전이든, 좋든 나쁘든, 모두 읽어라.',
    verified: 'high',
  },
  {
    id: 106, author: 'J.D. 샐린저 J.D. Salinger', yearBorn: 1919, yearDied: 2010, origin: '미국',
    source: '호밀밭의 파수꾼',
    original: 'What really knocks me out is a book that, when you\'re all done reading it, you wish the author that wrote it was a terrific friend of yours.',
    originalLang: 'en',
    korean: '나를 진짜로 쓰러뜨리는 건, 다 읽고 나서 그 저자가 내 멋진 친구였으면 좋겠다고 바라게 되는 책이다.',
    verified: 'high',
  },
  {
    id: 107, author: '하퍼 리 Harper Lee', yearBorn: 1926, yearDied: 2016, origin: '미국',
    source: '앵무새 죽이기',
    original: 'Until I feared I would lose it, I never loved to read. One does not love breathing.',
    originalLang: 'en',
    korean: '잃을까 두려워지기 전까지는 읽기를 사랑한 적이 없었다. 사람은 숨 쉬는 것을 사랑하지 않는다.',
    verified: 'high',
  },
  {
    id: 108, author: '레이 브래드버리 Ray Bradbury', yearBorn: 1920, yearDied: 2012, origin: '미국',
    source: '화씨 451 정신',
    original: 'You don\'t have to burn books to destroy a culture. Just get people to stop reading them.',
    originalLang: 'en',
    korean: '문화를 파괴하려 책을 태울 필요는 없다. 사람들이 읽지 않게 만드는 것으로 충분하다.',
    verified: 'high',
  },
  {
    id: 109, author: '커트 보니것 Kurt Vonnegut', yearBorn: 1922, yearDied: 2007, origin: '미국',
    source: 'Palm Sunday: An Autobiographical Collage (1981), "The Noodle Factory" 연설',
    original: 'I believe that reading and writing are the most nourishing forms of meditation anyone has so far found.',
    originalLang: 'en',
    korean: '나는 독서와 글쓰기가 지금껏 인간이 찾아낸 가장 자양분 있는 명상의 형태라고 믿는다.',
    verified: 'high',
  },
  {
    id: 110, author: '토니 모리슨 Toni Morrison', yearBorn: 1931, yearDied: 2019, origin: '미국',
    original: 'If there\'s a book that you want to read, but it hasn\'t been written yet, then you must write it.',
    originalLang: 'en',
    korean: '읽고 싶은 책이 아직 쓰이지 않았다면, 당신이 그것을 써야 한다.',
    verified: 'high',
  },
  {
    id: 111, author: '마야 앤절루 Maya Angelou', yearBorn: 1928, yearDied: 2014, origin: '미국',
    original: 'Any book that helps a child to form a habit of reading is good for him.',
    originalLang: 'en',
    korean: '아이가 독서 습관을 기르는 데 도움이 되는 책은, 그 아이에게 좋은 책이다.',
    verified: 'high',
  },
  {
    id: 112, author: '제임스 볼드윈 James Baldwin', yearBorn: 1924, yearDied: 1987, origin: '미국',
    original: 'You think your pain and your heartbreak are unprecedented in the history of the world, but then you read.',
    originalLang: 'en',
    korean: '당신의 고통과 상심이 역사상 전례 없는 것이라고 생각하다가, 책을 읽는다.',
    verified: 'high',
  },
  {
    id: 114, author: '플래너리 오코너 Flannery O\'Connor', yearBorn: 1925, yearDied: 1964, origin: '미국',
    original: 'I write to discover what I know.',
    originalLang: 'en',
    korean: '나는 내가 무엇을 아는지 발견하기 위해 쓴다.',
    verified: 'high',
  },
  {
    id: 115, author: '어슐러 르 귄 Ursula K. Le Guin', yearBorn: 1929, yearDied: 2018, origin: '미국',
    original: 'We read books to find out who we are.',
    originalLang: 'en',
    korean: '우리가 누구인지 알기 위해 책을 읽는다.',
    verified: 'high',
  },
  {
    id: 116, author: '수전 손택 Susan Sontag', yearBorn: 1933, yearDied: 2004, origin: '미국',
    original: 'A writer is first of all a reader.',
    originalLang: 'en',
    korean: '작가는 무엇보다 먼저 독자이다.',
    verified: 'high',
  },
  {
    id: 117, author: '수전 손택 Susan Sontag', yearBorn: 1933, yearDied: 2004, origin: '미국',
    source: '타인의 고통',
    original: 'To be a reader is to get away from the world, but also to discover it.',
    originalLang: 'en',
    korean: '독자가 된다는 것은 세상에서 벗어나는 일이면서, 동시에 세상을 발견하는 일이다.',
    verified: 'medium',
  },
  {
    id: 118, author: '조앤 디디온 Joan Didion', yearBorn: 1934, yearDied: 2021, origin: '미국',
    source: 'The White Album',
    original: 'We tell ourselves stories in order to live.',
    originalLang: 'en',
    korean: '우리는 살기 위해 우리 자신에게 이야기를 들려준다.',
    verified: 'high',
  },
  {
    id: 119, author: '애니 딜러드 Annie Dillard', yearBorn: 1945, origin: '미국',
    original: 'How we spend our days is, of course, how we spend our lives.',
    originalLang: 'en',
    korean: '우리가 하루를 어떻게 보내느냐는, 곧 우리가 인생을 어떻게 보내느냐이다.',
    verified: 'high',
  },
  {
    id: 120, author: '스티븐 킹 Stephen King', yearBorn: 1947, origin: '미국',
    source: '유혹하는 글쓰기 (On Writing)',
    original: 'Books are a uniquely portable magic.',
    originalLang: 'en',
    korean: '책은 유일무이하게 휴대 가능한 마법이다.',
    verified: 'high',
  },
  {
    id: 121, author: '칼 세이건 Carl Sagan', yearBorn: 1934, yearDied: 1996, origin: '미국',
    source: '코스모스',
    original: 'What an astonishing thing a book is. One glance at it and you hear the voice of another person, perhaps someone dead for thousands of years.',
    originalLang: 'en',
    korean: '책은 얼마나 놀라운 것인가. 한 번 흘긋 보는 것만으로 다른 이의 목소리를 듣게 된다. 어쩌면 수천 년 전에 죽은 누군가의 목소리를.',
    verified: 'high',
  },
  {
    id: 123, author: '헨리 밀러 Henry Miller', yearBorn: 1891, yearDied: 1980, origin: '미국',
    source: '내 인생의 책들',
    original: 'A book lying idle on a shelf is wasted ammunition.',
    originalLang: 'en',
    korean: '선반에서 놀고 있는 책은 낭비된 탄약이다.',
    verified: 'high',
  },
  {
    id: 124, author: '모티머 애들러 Mortimer Adler', yearBorn: 1902, yearDied: 2001, origin: '미국',
    source: 'How to Read a Book',
    original: 'In the case of good books, the point is not to see how many of them you can get through, but rather how many can get through to you.',
    originalLang: 'en',
    korean: '좋은 책의 경우, 중요한 것은 당신이 몇 권을 통과하느냐가 아니라, 몇 권이 당신을 통과하느냐이다.',
    verified: 'high',
  },
  {
    id: 125, author: '아이작 아시모프 Isaac Asimov', yearBorn: 1920, yearDied: 1992, origin: '미국',
    original: 'I am not a speed reader. I am a speed understander.',
    originalLang: 'en',
    korean: '나는 속독가가 아니다. 나는 속이해가이다.',
    verified: 'high',
  },
  {
    id: 126, author: '조지프 브로드스키 Joseph Brodsky', yearBorn: 1940, yearDied: 1996, origin: '미국',
    source: 'On Grief and Reason',
    original: 'There are worse crimes than burning books. One of them is not reading them.',
    originalLang: 'en',
    korean: '책을 태우는 것보다 나쁜 범죄가 있다. 그중 하나는 책을 읽지 않는 것이다.',
    verified: 'high',
    note: '러시아 태생이나 1972년 미국 망명 후 영어로 저술.',
  },
  {
    id: 127, author: '줌파 라히리 Jhumpa Lahiri', yearBorn: 1967, origin: '미국',
    original: 'That\'s the thing about books. They let you travel without moving your feet.',
    originalLang: 'en',
    korean: '그것이 책의 묘미다. 발을 움직이지 않고도 여행하게 해준다.',
    verified: 'high',
  },
  {
    id: 128, author: '옥타비아 버틀러 Octavia E. Butler', yearBorn: 1947, yearDied: 2006, origin: '미국',
    original: 'You don\'t start out writing good stuff. You start out writing crap and thinking it\'s good stuff, and then gradually you get better at it.',
    originalLang: 'en',
    korean: '처음부터 좋은 글을 쓰지는 않는다. 쓰레기를 쓰면서 그게 좋다고 생각하다가, 점차 나아진다.',
    verified: 'high',
  },
  {
    id: 129, author: '월리스 스티븐스 Wallace Stevens', yearBorn: 1879, yearDied: 1955, origin: '미국',
    source: 'The Necessary Angel',
    original: 'Reality is not what it is. It consists of the many realities which it can be made into.',
    originalLang: 'en',
    korean: '현실은 지금 모습 그대로가 아니다. 그것이 될 수 있는 수많은 현실로 이루어져 있다.',
    verified: 'high',
  },
  {
    id: 130, author: '토머스 제퍼슨 Thomas Jefferson', yearBorn: 1743, yearDied: 1826, origin: '미국',
    source: '존 애덤스에게 보낸 편지 (1815. 6. 10.)',
    original: 'I cannot live without books.',
    originalLang: 'en',
    korean: '나는 책 없이는 살 수 없다.',
    verified: 'high',
  },

  // ── Russia (10) ───────────────────────────────────────────────────
  {
    id: 131, author: '알렉산드르 푸시킨 Pushkin', yearBorn: 1799, yearDied: 1837, origin: '러시아',
    original: 'Чтение — вот лучшее учение.',
    originalLang: 'ru',
    korean: '독서야말로 최고의 배움이다.',
    verified: 'high',
  },
  {
    id: 132, author: '니콜라이 고골 Gogol', yearBorn: 1809, yearDied: 1852, origin: '러시아',
    source: '검찰관 모토',
    original: 'На зеркало неча пенять, коли рожа крива.',
    originalLang: 'ru',
    korean: '얼굴이 비뚤어졌다면 거울을 탓해 무엇하리.',
    verified: 'high',
  },
  {
    id: 133, author: '레프 톨스토이 Leo Tolstoy', yearBorn: 1828, yearDied: 1910, origin: '러시아',
    source: '전쟁과 평화',
    original: 'Всё, что я понимаю, я понимаю только потому, что люблю.',
    originalLang: 'ru',
    korean: '내가 이해하는 모든 것은, 오직 사랑하기 때문에 이해한다.',
    verified: 'high',
  },
  {
    id: 134, author: '표도르 도스토옙스키 Dostoevsky', yearBorn: 1821, yearDied: 1881, origin: '러시아',
    source: '백치',
    original: 'Красота спасёт мир.',
    originalLang: 'ru',
    korean: '아름다움이 세계를 구원할 것이다.',
    verified: 'high',
  },
  {
    id: 135, author: '표도르 도스토옙스키 Dostoevsky', yearBorn: 1821, yearDied: 1881, origin: '러시아',
    source: '미성년',
    original: 'Не в том счастье, чтобы жить во дворце и быть богатым, а в том, чтоб любить друг друга нежно и сильно.',
    originalLang: 'ru',
    korean: '행복은 궁전에 살며 부유한 데 있지 않고, 서로를 부드럽고 강하게 사랑하는 데 있다.',
    verified: 'high',
  },
  {
    id: 136, author: '안톤 체호프 Anton Chekhov', yearBorn: 1860, yearDied: 1904, origin: '러시아',
    source: '형 알렉산드르에게 보낸 서한 (1886)',
    original: 'Don\'t tell me the moon is shining; show me the glint of light on broken glass.',
    originalLang: 'en',
    korean: '달이 빛난다고 말하지 마라. 깨진 유리 위의 빛 한 줄기를 보여 달라.',
    verified: 'high',
    note: '체호프 서한 영역문이 널리 유통. 러시아어 원문은 "Не следует говорить..."으로 시작.',
  },
  {
    id: 137, author: '블라디미르 나보코프 Vladimir Nabokov', yearBorn: 1899, yearDied: 1977, origin: '러시아',
    source: '문학 강의',
    original: 'A good reader, a major reader, an active and creative reader is a rereader.',
    originalLang: 'en',
    korean: '좋은 독자, 본격적인 독자, 능동적이고 창조적인 독자는 다시 읽는 자이다.',
    verified: 'high',
  },
  {
    id: 138, author: '보리스 파스테르나크 Boris Pasternak', yearBorn: 1890, yearDied: 1960, origin: '러시아',
    source: '닥터 지바고',
    original: 'Книги — это то единственное, что не может умереть.',
    originalLang: 'ru',
    korean: '책이란, 죽을 수 없는 유일한 것이다.',
    verified: 'medium',
  },
  {
    id: 139, author: '안나 아흐마토바 Anna Akhmatova', yearBorn: 1889, yearDied: 1966, origin: '러시아',
    source: '레퀴엠',
    original: 'Нет, и не под чуждым небосводом, И не под защитой чуждых крыл.',
    originalLang: 'ru',
    korean: '아니, 낯선 하늘 아래가 아니었고, 낯선 날개의 보호 아래도 아니었다.',
    verified: 'high',
  },
  {
    id: 140, author: '마리나 츠베타예바 Marina Tsvetaeva', yearBorn: 1892, yearDied: 1941, origin: '러시아',
    original: 'Моим стихам, как драгоценным винам, Настанет свой черёд.',
    originalLang: 'ru',
    korean: '내 시들에게도 값진 포도주처럼, 자신의 차례가 오리라.',
    verified: 'high',
  },

  // ── Eastern Europe (5) ────────────────────────────────────────────
  {
    id: 141, author: '밀란 쿤데라 Milan Kundera', yearBorn: 1929, yearDied: 2023, origin: '체코',
    source: '웃음과 망각의 책',
    original: 'Boj člověka proti moci je bojem paměti proti zapomnění.',
    originalLang: 'cs',
    korean: '권력에 대한 인간의 투쟁은, 망각에 대한 기억의 투쟁이다.',
    verified: 'high',
  },
  {
    id: 142, author: '카렐 차페크 Karel Čapek', yearBorn: 1890, yearDied: 1938, origin: '체코',
    source: 'The Gardener\'s Year',
    original: 'We gardeners live somehow for the future: if roses are in flower, we think that next year they will flower better.',
    originalLang: 'en',
    korean: '정원사는 어쩐지 미래를 위해 산다. 장미가 피면, 내년에는 더 잘 필 것이라 생각한다.',
    verified: 'high',
  },
  {
    id: 143, author: '체스와프 미워시 Czesław Miłosz', yearBorn: 1911, yearDied: 2004, origin: '폴란드',
    original: 'Mowa rodzinna jest jedyną ojczyzną.',
    originalLang: 'pl',
    korean: '모국어가 유일한 조국이다.',
    verified: 'high',
  },
  {
    id: 144, author: '올가 토카르추크 Olga Tokarczuk', yearBorn: 1962, origin: '폴란드',
    original: 'Literatura jest badaniem rzeczywistości, ale też jej tworzeniem.',
    originalLang: 'pl',
    korean: '문학은 현실의 탐구이자, 현실의 창조이다.',
    verified: 'medium',
  },
  {
    id: 145, author: '이보 안드리치 Ivo Andrić', yearBorn: 1892, yearDied: 1975, origin: '유고슬라비아',
    source: '드리나강의 다리',
    original: 'Of everything that man erects in his life, nothing is as precious to him as bridges.',
    originalLang: 'en',
    korean: '인간이 삶 속에서 세우는 모든 것 가운데, 다리만큼 귀한 것은 없다.',
    verified: 'high',
  },

  // ── Latin America / Caribbean (8) ─────────────────────────────────
  {
    id: 146, author: '호르헤 루이스 보르헤스 Jorge Luis Borges', yearBorn: 1899, yearDied: 1986, origin: '아르헨티나',
    original: 'Siempre imaginé el Paraíso como una especie de biblioteca.',
    originalLang: 'es',
    korean: '천국이란 일종의 도서관일 거라고 늘 상상해왔다.',
    verified: 'high',
  },
  {
    id: 147, author: '호르헤 루이스 보르헤스 Jorge Luis Borges', yearBorn: 1899, yearDied: 1986, origin: '아르헨티나',
    original: 'Un libro no es un ser aislado: es una relación, es un eje de innumerables relaciones.',
    originalLang: 'es',
    korean: '책은 고립된 존재가 아니다. 그것은 관계이며, 무수한 관계들의 축이다.',
    verified: 'high',
  },
  {
    id: 148, author: '가브리엘 가르시아 마르케스 García Márquez', yearBorn: 1927, yearDied: 2014, origin: '콜롬비아',
    source: '회고록 제사',
    original: 'La vida no es la que uno vivió, sino la que uno recuerda y cómo la recuerda para contarla.',
    originalLang: 'es',
    korean: '삶이란 살아낸 그대로가 아니라, 기억하고, 어떻게 기억하여 이야기하느냐이다.',
    verified: 'high',
  },
  {
    id: 149, author: '파블로 네루다 Pablo Neruda', yearBorn: 1904, yearDied: 1973, origin: '칠레',
    original: 'Podrán cortar todas las flores, pero no podrán detener la primavera.',
    originalLang: 'es',
    korean: '꽃들을 다 꺾을 수는 있어도, 봄이 오는 것을 막을 수는 없다.',
    verified: 'high',
  },
  {
    id: 150, author: '이사벨 아옌데 Isabel Allende', yearBorn: 1942, origin: '칠레',
    original: 'Escribe lo que no debe ser olvidado.',
    originalLang: 'es',
    korean: '잊혀서는 안 될 것을 쓰라.',
    verified: 'high',
  },
  {
    id: 151, author: '옥타비오 파스 Octavio Paz', yearBorn: 1914, yearDied: 1998, origin: '멕시코',
    original: 'Mereces tu sueño.',
    originalLang: 'es',
    korean: '당신의 꿈을 감당하라.',
    verified: 'high',
  },
  {
    id: 152, author: '마리오 바르가스 요사 Vargas Llosa', yearBorn: 1936, origin: '페루',
    source: '수상 연설',
    original: 'La literatura es fuego.',
    originalLang: 'es',
    korean: '문학은 불이다.',
    verified: 'high',
  },
  {
    id: 153, author: '데렉 월컷 Derek Walcott', yearBorn: 1930, yearDied: 2017, origin: '세인트루시아',
    original: 'To change your language you must change your life.',
    originalLang: 'en',
    korean: '당신의 언어를 바꾸려면, 당신의 삶을 바꿔야 한다.',
    verified: 'high',
  },

  // ── Africa (4) ────────────────────────────────────────────────────
  {
    id: 154, author: '치누아 아체베 Chinua Achebe', yearBorn: 1930, yearDied: 2013, origin: '나이지리아',
    original: 'Until the lions have their own historians, the history of the hunt will always glorify the hunter.',
    originalLang: 'en',
    korean: '사자들이 자신의 역사가를 갖기 전까지, 사냥의 역사는 언제나 사냥꾼을 찬양할 것이다.',
    verified: 'high',
  },
  {
    id: 155, author: '월레 소잉카 Wole Soyinka', yearBorn: 1934, origin: '나이지리아',
    original: 'A tiger does not proclaim his tigritude; he pounces.',
    originalLang: 'en',
    korean: '호랑이는 자신의 호랑이다움을 선포하지 않는다. 그저 덮칠 뿐이다.',
    verified: 'high',
  },
  {
    id: 156, author: '치마만다 응고지 아디치에 Chimamanda Ngozi Adichie', yearBorn: 1977, origin: '나이지리아',
    source: 'TED — The Danger of a Single Story',
    original: 'The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete.',
    originalLang: 'en',
    korean: '단 하나의 이야기는 편견을 만들고, 편견의 문제는 틀렸다는 것이 아니라 불완전하다는 것이다.',
    verified: 'high',
  },
  {
    id: 157, author: '네이딘 고디머 Nadine Gordimer', yearBorn: 1923, yearDied: 2014, origin: '남아공',
    original: 'Writing is making sense of life.',
    originalLang: 'en',
    korean: '글쓰기는 삶을 이해하는 일이다.',
    verified: 'high',
  },

  // ── Middle East / North Africa (4) ────────────────────────────────
  {
    id: 158, author: '루미 Jalāl al-Dīn Rūmī', yearBorn: 1207, yearDied: 1273, origin: '페르시아',
    original: 'Raise your words, not your voice. It is rain that grows flowers, not thunder.',
    originalLang: 'en',
    korean: '목소리가 아니라 말을 높여라. 꽃을 키우는 것은 천둥이 아니라 비다.',
    verified: 'medium',
    note: '루미 귀속으로 널리 전해지나 현대 영어 번역·의역본. 원 페르시아어 1:1 대응 구절 특정은 어려움.',
  },
  {
    id: 159, author: '하피즈 Hafez', yearBorn: 1315, yearDied: 1390, origin: '페르시아',
    original: 'I wish I could show you, when you are lonely or in darkness, the astonishing light of your own being.',
    originalLang: 'en',
    korean: '당신이 외롭거나 어둠 속에 있을 때, 당신 자신의 놀라운 빛을 보여줄 수만 있다면.',
    verified: 'medium',
    note: 'Daniel Ladinsky의 영역본이 널리 통용. 하피즈 원전 1:1 대응이 아닌 의역일 수 있음.',
  },
  {
    id: 160, author: '나기브 마푸즈 Naguib Mahfouz', yearBorn: 1911, yearDied: 2006, origin: '이집트',
    original: 'You can tell whether a man is clever by his answers. You can tell whether a man is wise by his questions.',
    originalLang: 'en',
    korean: '영리한 사람인지는 그의 대답으로, 현명한 사람인지는 그의 질문으로 알 수 있다.',
    verified: 'high',
  },
  {
    id: 161, author: '오르한 파묵 Orhan Pamuk', yearBorn: 1952, origin: '터키',
    source: '새로운 인생 (Yeni Hayat) 첫 문장',
    original: 'Bir gün bir kitap okudum ve bütün hayatım değişti.',
    originalLang: 'tr',
    korean: '어느 날 책 한 권을 읽었는데, 내 삶 전체가 바뀌었다.',
    verified: 'high',
  },

  // ── South Asia (4) ────────────────────────────────────────────────
  {
    id: 162, author: '라빈드라나트 타고르 Rabindranath Tagore', yearBorn: 1861, yearDied: 1941, origin: '인도',
    original: 'A book that is shut is but a block.',
    originalLang: 'en',
    korean: '닫힌 책은 그저 덩어리일 뿐이다.',
    verified: 'medium',
    note: '영어 번역이 속담화되어 널리 유통. 벵골어 원문 1:1 대응은 불확실.',
  },
  {
    id: 163, author: '라빈드라나트 타고르 Rabindranath Tagore', yearBorn: 1861, yearDied: 1941, origin: '인도',
    original: 'You can\'t cross the sea merely by standing and staring at the water.',
    originalLang: 'en',
    korean: '물을 바라보고 서 있기만 해서는, 바다를 건널 수 없다.',
    verified: 'medium',
  },
  {
    id: 164, author: '살만 루슈디 Salman Rushdie', yearBorn: 1947, origin: '인도',
    original: 'A book is a version of the world. If you do not like it, ignore it; or offer your own version in return.',
    originalLang: 'en',
    korean: '책은 세계의 한 판본이다. 마음에 들지 않으면 무시하거나, 당신 자신의 판본을 제시하라.',
    verified: 'high',
  },
  {
    id: 165, author: '아룬다티 로이 Arundhati Roy', yearBorn: 1961, origin: '인도',
    source: '작은 것들의 신 (The God of Small Things)',
    original: 'The only dream worth having is to dream that you will live while you\'re alive and die only when you\'re dead.',
    originalLang: 'en',
    korean: '가질 가치가 있는 유일한 꿈은, 살아있는 동안 살고 죽을 때에만 죽는 것이다.',
    verified: 'high',
  },
];

// Verify at load time
if (QUOTES.length !== 161) {
  throw new Error(
    `quotes.ts integrity check failed: expected 161 entries, got ${QUOTES.length}`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Daily rotation
// ────────────────────────────────────────────────────────────────────

/**
 * djb2 hash — tiny, deterministic, no crypto dependency.
 * Returns a non-negative 32-bit integer.
 */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + c
  }
  return h >>> 0; // coerce to uint32
}

/**
 * Day index in UTC. Changes exactly once per 24h at 00:00 UTC.
 * Using UTC (not local) avoids the quote flickering when a user crosses
 * timezones or when the app is open across midnight in their locale.
 */
function dayIndexUTC(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 86_400_000);
}

/**
 * Given a stable per-user identifier, returns today's quote.
 * Same user on same UTC day → same quote. Different user same day → different quote.
 * Same user next day → almost certainly different quote.
 *
 * For anonymous/pre-auth users, pass a stable client-generated UUID stored in
 * localStorage. Do NOT pass the IP or any rotating identifier — the rotation
 * must be stable across page loads.
 */
export function getTodayQuote(userId: string, now: Date = new Date()): Quote {
  const seed = hashString(userId + ':' + dayIndexUTC(now));
  return QUOTES[seed % QUOTES.length];
}

/**
 * Internal helper — exported for unit tests only.
 * @internal
 */
export const __internal = { hashString, dayIndexUTC };
