import type { Card, CardGroup } from './cards';

type Entry = [kana: string, romaji: string, meaning: string, notes: string[]];

const ROWS: [group: CardGroup, entries: Entry[]][] = [
  [
    { id: 'time', label: 'Time of day', preview: 'おはよう' },
    [
      ['おはようございます', 'ohayou gozaimasu', 'Good morning', ['Polite; with friends and family just say おはよう.', 'Used until about 10 or 11 in the morning.']],
      ['こんにちは', 'konnichiwa', 'Hello', ['The last は is read “wa”, like the particle.', 'A daytime hello; people rarely say it to their own family.']],
      ['こんばんは', 'konbanwa', 'Good evening', ['Like こんにちは, the last は is read “wa”.']],
      ['おやすみなさい', 'oyasuminasai', 'Good night', ['Said before going to bed; casual: おやすみ.']],
      ['さようなら', 'sayounara', 'Goodbye', ['Sounds quite final, like “farewell”; friends usually say じゃあね or またね.']],
    ],
  ],
  [
    { id: 'polite', label: 'Polite basics', preview: 'ありがとう' },
    [
      ['ありがとうございます', 'arigatou gozaimasu', 'Thank you', ['Casual: ありがとう. Even more polite: どうもありがとうございます.']],
      ['どういたしまして', 'douitashimashite', 'You’re welcome', ['The textbook reply to ありがとう; in everyday talk people often just say いいえ (“not at all”).']],
      ['すみません', 'sumimasen', 'Excuse me', ['Gets attention (calling a waiter), apologises lightly, and can even mean “thanks for the trouble”.']],
      ['ごめんなさい', 'gomennasai', 'I’m sorry', ['A sincere, personal apology; casual: ごめん.']],
      ['おねがいします', 'onegaishimasu', 'Please', ['Used when asking for something: コーヒー、おねがいします (“Coffee, please”).']],
    ],
  ],
  [
    { id: 'meeting', label: 'Meeting people', preview: 'はじめまして' },
    [
      ['はじめまして', 'hajimemashite', 'How do you do?', ['Only said the first time you meet someone, before giving your name.']],
      ['よろしくおねがいします', 'yoroshiku onegaishimasu', 'Nice to meet you', ['Said after introducing yourself; literally “please treat me well”.']],
      ['おげんきですか', 'ogenki desu ka', 'How are you?', ['For someone you haven’t seen in a while, not an everyday “how’s it going”.']],
      ['げんきです', 'genki desu', 'I’m fine', ['The answer to おげんきですか; げんき means healthy, full of energy.']],
      ['おひさしぶりです', 'ohisashiburi desu', 'Long time no see', ['Casual: ひさしぶり!']],
    ],
  ],
  [
    { id: 'going', label: 'Coming & going', preview: 'ただいま' },
    [
      ['いってきます', 'ittekimasu', 'I’m off!', ['Said when you leave home; literally “I’ll go and come back”.']],
      ['いってらっしゃい', 'itterasshai', 'Have a good day!', ['The reply from whoever stays home: “go and come back safely”.']],
      ['ただいま', 'tadaima', 'I’m home!', ['Said when you get back home.']],
      ['おかえりなさい', 'okaerinasai', 'Welcome home', ['The reply to ただいま; casual: おかえり.']],
      ['またね', 'mata ne', 'See you!', ['A casual goodbye between friends; またあした means “see you tomorrow”.']],
    ],
  ],
  [
    { id: 'manners', label: 'Meals & manners', preview: 'いただきます' },
    [
      ['いただきます', 'itadakimasu', 'Let’s eat!', ['Said before eating, often with hands together; literally “I humbly receive”.']],
      ['ごちそうさまでした', 'gochisousama deshita', 'Thanks for the meal', ['Said after eating, to the cook or whoever paid.']],
      ['おつかれさまです', 'otsukaresama desu', 'Thanks for your hard work', ['Said to coworkers or teammates, for example when leaving work.']],
      ['おめでとうございます', 'omedetou gozaimasu', 'Congratulations', ['For birthdays, weddings and the new year; casual: おめでとう.']],
      ['しつれいします', 'shitsurei shimasu', 'Pardon me (entering)', ['Said when entering or leaving a room such as an office; literally “I’m being rude”.']],
    ],
  ],
];

export const GREETING_GROUPS: CardGroup[] = ROWS.map(([g]) => g);

export const GREETINGS: Card[] = ROWS.flatMap(([g, entries]) =>
  entries.map(([kana, romaji, answer, notes]) => ({
    id: `greetings:${kana}`,
    deck: 'greetings' as const,
    group: g.id,
    kana,
    romaji,
    answer,
    notes,
  })),
);
