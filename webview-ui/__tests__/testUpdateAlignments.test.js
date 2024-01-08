/* eslint-env jest */
import {describe, expect, test} from '@jest/globals'
import {
  areAlgnmentsComplete,
  extractAlignmentsFromTargetVerse,
  parseUsfmToWordAlignerData,
  updateAlignmentsToTargetVerse,
  updateAlignmentsToTargetVerseWithOriginal,
} from "../utils/alignmentHelpers";
import {removeUsfmMarkers, usfmVerseToJson} from "../utils/usfmHelpers";
import Lexer from "wordmap-lexer";
import {isMigrated, migrateTargetAlignmentsToOriginal} from "../utils/migrateOriginalLanguageHelpers";
import {convertVerseDataToUSFM, getUsfmForVerseContent} from "../utils/UsfmFileConversionHelpers";
import path from "path-extra";
import fs from 'fs-extra';

jest.unmock('fs-extra');

const simpleUpdatesPath = path.join(__dirname, './fixtures/alignments/simpleEditsTests.json');
const otMigrationUpdatesPath = path.join(__dirname, './fixtures/alignments/otMigrationEditsTests.json');
const ntMigrationUpdatesPath = path.join(__dirname, './fixtures/alignments/ntMigrationEditsTests.json');


describe('testing edit of aligned target text', () => {
  const tests = fs.readJsonSync(simpleUpdatesPath)
  const testNames = Object.keys(tests)
  // console.log(tests)
  for (const testName of testNames) {
    const test_ = tests[testName]
    test(`${testName}`, () => {
      let {
        initialAlignedUsfm,
        initialEditText,
        steps,
      } = test_

      let currentVerseObjects = usfmVerseToJson(initialAlignedUsfm); // set initial test conditions
      const expectedInitialEditText = getUsfmForVerseContent({ verseObjects: currentVerseObjects })
      expect(initialEditText).toEqual(expectedInitialEditText)

      for (const step of steps) {
        ////////////
        // Given

        const {newEditText, expectedFinalUsfm} = step

        ////////////
        // When

        const results = updateAlignmentsToTargetVerse(currentVerseObjects, newEditText)

        ////////////
        // Then

        expect(results.targetVerseText).toEqual(expectedFinalUsfm)

        const initialWords = Lexer.tokenize(removeUsfmMarkers(newEditText))
        const { targetWords: targetWords } = parseUsfmToWordAlignerData(results.targetVerseText, null)
        expect(targetWords.length).toEqual(initialWords.length)

        // final conditions of step become initial conditions for next step
        currentVerseObjects = results.targetVerseObjects
      }
    })
  }
})

describe('testing alignment operations', () => {
  const testaments = [
    {
      name: "New Testament",
      path: ntMigrationUpdatesPath,
    },
    {
      name: "Old Testament",
      path: otMigrationUpdatesPath,
    }]

  for (const testament of testaments) {

    // create a describe block for each testament
    const {name: testamentName, path: testamentPath} = testament
    console.log(testamentName)

    describe(`${testamentName} edit tests with original language validation`, () => {
      const tests = fs.readJsonSync(testamentPath)
      const testNames = Object.keys(tests)
      // console.log(tests)
      for (const testName of testNames) {
        const test_ = tests[testName]

        test(`${testName}`, () => {
          let {
            initialAlignedUsfm,
            initialEditText,
            originalLanguageUsfm,
            steps,
          } = test_

          let currentVerseObjects = usfmVerseToJson(initialAlignedUsfm); // set initial test conditions
          // make sure initial text matches the expected
          const expectedInitialEditText = getUsfmForVerseContent({ verseObjects: currentVerseObjects })
          expect(initialEditText).toEqual(expectedInitialEditText)
          const originalLanguageVerseObjects = usfmVerseToJson(originalLanguageUsfm); // set initial test conditions

          for (const step of steps) {

            ////////////
            // Given

            const {newEditText, expectedFinalUsfm} = step

            ////////////
            // when

            // apply edited text
            const results = updateAlignmentsToTargetVerseWithOriginal(currentVerseObjects, newEditText, originalLanguageVerseObjects)

            ////////////
            // then

            expect(results.targetVerseText).toEqual(expectedFinalUsfm)
          }
        })
      }
    })

    describe(`${testamentName} migration tests`, () => {
      const tests = fs.readJsonSync(testamentPath)
      const testNames = Object.keys(tests)

      // create a test for each item in json file
      for (const testName of testNames) {
        const test_ = tests[testName]

        test(`${testName}`, () => {
          let {
            initialAlignedUsfm,
            originalLanguageUsfm,
            steps,
          } = test_

          let currentVerseObjects = usfmVerseToJson(initialAlignedUsfm); // set initial test conditions
          const originalLanguageVerseObjects = usfmVerseToJson(originalLanguageUsfm); // set initial test conditions

          for (const step of steps) {

            ////////////
            // Given

            const {newEditText, migrationExpected} = step

            ////////////
            // When

            const targetVerseObjects = migrateTargetAlignmentsToOriginal(currentVerseObjects, originalLanguageVerseObjects)

            ////////////
            // Then

            validateMigrations(currentVerseObjects, targetVerseObjects, migrationExpected);
          }
        })
      }
    })
  }
})


const newVerseText = "### Description\n\nWhen people tell a story, they tell about an event or a series of events. Often they put certain information at the beginning of the story, such as who the story is about, when it happened, and where it happened. This information that the writer gives before the events of the story begin is called the setting of the story. Some new events in a story also have a setting because they might involve new people, new times, and new places. In some languages, people also tell if they saw the event or heard about it from someone else.\n\nWhen your people tell about events, what information do they give at the beginning? Is there a certain order that they put it in? In your translation, you will need to follow the way your language introduces new information at the beginning of a story or a new event rather than the way the source language did that. In this way your translation will sound natural and communicate clearly in your language.\n\n### Examples From the Bible\n\n> **In the days of Herod**, king of Judea, **there was a certain priest named Zechariah**, from the division of Abijah. And **his wife was** from the daughters of Aaron, and her name was Elizabeth. (Luke 1:5 ULT)\n\nThe verses above introduce a story about Zechariah. The first bolded phrase tells when it happened, and the next two bolded phrases introduce the main people. The next two verses go on to explain that Zechariah and Elizabeth were old and did not have any children. All of this is the setting. Then the phrase “And it happened that” in Luke 1:8 helps to introduce the first event in this story:\n\n> **And it happened that** in his performing as priest before God, in the order of his division, according to the custom of the priesthood, he came up by lot to enter into the temple of the Lord to burn incense. (Luke 1:8-9 ULT)\n\n> **The birth of Jesus Christ happened in the following way.** His mother, Mary, was engaged to marry Joseph, but before they came together, she was found to be pregnant by the Holy Spirit. (Matthew 1:18 ULT)\n\nThe bolded sentence above makes it explicit that a story about Jesus is being introduced. The story will tell about how the birth of Jesus happened.\n\n> **Now after Jesus was born in Bethlehem of Judea in the days of Herod the king**, behold, learned men from the east arrived in Jerusalem. (Matthew 2:1 ULT)\n\nThe bolded phrase above shows that the events concerning the learned men happened **after** Jesus was born.\n\n> **Now in those days** John the Baptist came preaching in the wilderness of Judea. (Matthew 3:1-22 ULT)\n\nThe bolded phrase above shows that John the Baptist came preaching around the time of the previous events. It is probably very general and refers to when Jesus lived in Nazareth.\n\n> **Then** Jesus came from Galilee to the Jordan River to John, to be baptized by him. (Matthew 3:13 ULT)\n\nThe word “then” shows that Jesus came to the Jordan River some time after the events in the previous verses.\n\n> Now there was **a man from the** **Pharisees whose name was Nicodemus, a Jewish leader**. This man came to Jesus at night. (John 3:1-2a ULT)\n\nThe author first introduced the new person and then told about what he did and when he did it. In some languages, it might be more natural to tell about the time first.\n\n> 6 Noah was 600 years old when the flood came upon the earth. 7 Noah, his sons, his wife, and his sons’ wives went into the ark together because of the waters of the flood. (Genesis 7:6-7 ULT)\n\nVerse 6 is a statement of the events that happen in the rest of chapter 7. Chapter 6 already told about how God told Noah that there would be a flood, and how Noah prepared for it. Chapter 7 verse 6 introduces the part of the story that tells about Noah and his family and the animals going into the ship, the rain starting, and the rain flooding the earth. Some languages might need to make it clear that this verse simply introduces the event, or move this verse after verse 7. Verse 6 is not one of the events of the story. The people went into the ship before the flood came.\n\n### Translation Strategies\n\nIf the information given at the beginning of a new event is clear and natural to your readers, consider translating it as it is in the ULT or UST. If not, consider one of these strategies:\n\n(1) Put the information that introduces the event in the order that your people put it.\n\n(2) If readers would expect certain information but it is not in the Bible, consider using an indefinite word or phrase to fill in that information, such as: “another time” or “someone.”\n\n(3) If the introduction is a summary of the whole event, use your language’s way of showing that it is a summary.\n\n(4) If it would be strange in the target language to give a summary of the event at the beginning, indicate that the event would actually happen later in the story.\n\n### Examples of Translation Strategies Applied\n\n(1) Put the information that introduces the event in the order that your people put it.\n\n> Now there was **a man from the** **Pharisees whose name was Nicodemus, a Jewish leader**. This man came to Jesus at night. (John 3:1-2a ULT)\n>\n> > There was a **man whose name was Nicodemus. He was a Pharisee and a member of the Jewish Council**. One night he came to Jesus.\n\n> > One night **a man named Nicodemus, who was a Pharisee and a member of the Jewish Council**, came to Jesus.\n\n> As he passed by, **he saw Levi the son of Alpheus, sitting** at the tax collector’s tent, and he said to him … (Mark 2:14a ULT)\n>\n> > As he passed by, **Levi the son of Alpheus was sitting** at the tax collector’s tent. Jesus saw him and and said to him …\n\n> > As he passed by, **there was a man sitting** at the tax collector’s tent. His name was Levi, and he was the son of Alpheus. Jesus saw him and said to him …\n\n> > As he passed by, **there was a tax collector** sitting at the tax collector’s tent. His name was Levi, and he was the son of Alpheus. Jesus saw him and said to him …\n\n(2) If readers would expect certain information, but it is not in the Bible, consider using an indefinite word or phrase such as “another time,” or “someone.”\n\n> Noah was 600 years old when the flood came upon the earth. (Genesis 7:6 ULT) — If people expect to be told something about when the new event happened, the phrase “after that” can help them see that it happened after the events already mentioned.\n>\n> > **After that**, when Noah was 600 years old, the flood came upon the earth.\n\n> **Again he began** to teach beside the sea. (Mark 4:1a ULT) — In chapter 3 Jesus was teaching at someone’s house. Readers may need to be told that this new event happened at another time, or that Jesus actually went to the sea.\n>\n> > **Another time** Jesus began to teach people again beside the sea.\n\n> > Jesus went to the sea and **began to teach people again** there.\n\n(3) If the introduction is a summary of the whole event, use your language’s way of showing that it is a summary.\n\n> Noah was 600 years old when the flood came upon the earth. (Genesis 7:6 ULT)\n>\n> > **Now this is what happened when** Noah was 600 years old and the flood came upon the earth.\n\n> > **This part tells about what happened when** the flood came upon the earth. It happened when Noah was 600 years old.\n\n(4) If it would be strange in the target language to give a summary of the event at the beginning, show that the event will actually happen later in the story.\n\n> Noah was 600 years old when the flood came upon the earth. Noah, his sons, his wife, and his sons’ wives went into the ark together because of the waters of the flood. (Genesis 7:6-7 ULT)\n>\n> > **Now this is what happened when** Noah was 600 years old. Noah, his sons, his wife, and his sons’ wives went into the ark together because **God had said that the waters of the flood would come**."
const initialVerseText = "During the time that judges ruled {Israel}, there was a famine in that country. A man from the town of Bethlehem in the region of Judah {in the country of Israel} left there and went to live for a while in the country of Moab. His wife and his two sons went with him. \n"
const currentVerseObjects = [
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H1961",
    "lemma": "הָיָה",
    "morph": "He,C:Vqw3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וַ⁠יְהִ֗י",
    "children": [
      {
        "tag": "zaln",
        "type": "milestone",
        "strong": "b:H3117",
        "lemma": "יוֹם",
        "morph": "He,R:Ncmpc",
        "occurrence": "1",
        "occurrences": "1",
        "content": "בִּ⁠ימֵי֙",
        "children": [
          {
            "text": "During",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "1"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "the",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "5"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "time",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "1"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "that",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "2"
          }
        ],
        "endTag": "zaln-e\\*"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "d:H8199",
    "lemma": "שָׁפַט",
    "morph": "He,Td:Vqrmpa",
    "occurrence": "1",
    "occurrences": "1",
    "content": "הַ⁠שֹּׁפְטִ֔ים",
    "children": [
      {
        "text": "judges",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H8199",
    "lemma": "שָׁפַט",
    "morph": "He,Vqc",
    "occurrence": "1",
    "occurrences": "1",
    "content": "שְׁפֹ֣ט",
    "children": [
      {
        "text": "ruled",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " {"
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "b:H0776",
    "lemma": "אֶרֶץ",
    "morph": "He,Rd:Ncbsa",
    "occurrence": "1",
    "occurrences": "1",
    "content": "בָּ⁠אָ֑רֶץ",
    "children": [
      {
        "text": "Israel",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "2"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": "}, "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H1961",
    "lemma": "הָיָה",
    "morph": "He,C:Vqw3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וַ⁠יְהִ֥י",
    "children": [
      {
        "text": "there",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "was",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H7458",
    "lemma": "רָעָב",
    "morph": "He,Ncmsa",
    "occurrence": "1",
    "occurrences": "1",
    "content": "רָעָ֖ב",
    "children": [
      {
        "text": "a",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "famine",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "b:H0776",
    "lemma": "אֶרֶץ",
    "morph": "He,Rd:Ncbsa",
    "occurrence": "1",
    "occurrences": "1",
    "content": "בָּ⁠אָ֑רֶץ",
    "children": [
      {
        "text": "in",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "that",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "country",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "3"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": ". "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H0376",
    "lemma": "אִישׁ",
    "morph": "He,Ncmsa",
    "occurrence": "1",
    "occurrences": "1",
    "content": "אִ֜ישׁ",
    "children": [
      {
        "text": "A",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "man",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "m:H1035",
    "lemma": "בֵּית לֶחֶם",
    "morph": "He,R:Np",
    "occurrence": "1",
    "occurrences": "1",
    "content": "מִ⁠בֵּ֧ית",
    "children": [
      {
        "tag": "zaln",
        "type": "milestone",
        "strong": "H1035",
        "lemma": "בֵּית לֶחֶם",
        "morph": "He,Np",
        "occurrence": "1",
        "occurrences": "1",
        "content": "לֶ֣חֶם",
        "children": [
          {
            "text": "from",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "1"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "the",
            "tag": "w",
            "type": "word",
            "occurrence": "2",
            "occurrences": "5"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "town",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "1"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "of",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "4"
          },
          {
            "type": "text",
            "text": " "
          },
          {
            "text": "Bethlehem",
            "tag": "w",
            "type": "word",
            "occurrence": "1",
            "occurrences": "1"
          }
        ],
        "endTag": "zaln-e\\*"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H3063",
    "lemma": "יְהוּדָה",
    "morph": "He,Np",
    "occurrence": "1",
    "occurrences": "1",
    "content": "יְהוּדָ֗ה",
    "children": [
      {
        "text": "in",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "the",
        "tag": "w",
        "type": "word",
        "occurrence": "3",
        "occurrences": "5"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "region",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "of",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "Judah",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " {"
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H3063",
    "lemma": "יְהוּדָה",
    "morph": "He,Np",
    "occurrence": "1",
    "occurrences": "1",
    "content": "יְהוּדָ֗ה",
    "children": [
      {
        "text": "in",
        "tag": "w",
        "type": "word",
        "occurrence": "3",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "the",
        "tag": "w",
        "type": "word",
        "occurrence": "4",
        "occurrences": "5"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "country",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "3"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "of",
        "tag": "w",
        "type": "word",
        "occurrence": "3",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "Israel",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": "} "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H3212",
    "lemma": "יָלַךְ",
    "morph": "He,C:Vqw3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וַ⁠יֵּ֨לֶךְ",
    "children": [
      {
        "text": "left",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "there",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "and",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "went",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "2"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "l:H1481a",
    "lemma": "גּוּר",
    "morph": "He,R:Vqc",
    "occurrence": "1",
    "occurrences": "1",
    "content": "לָ⁠גוּר֙",
    "children": [
      {
        "text": "to",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "live",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "for",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "a",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "while",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "b:H7704b",
    "lemma": "שָׂדֶה",
    "morph": "He,R:Ncmpc",
    "occurrence": "1",
    "occurrences": "1",
    "content": "בִּ⁠שְׂדֵ֣י",
    "children": [
      {
        "text": "in",
        "tag": "w",
        "type": "word",
        "occurrence": "4",
        "occurrences": "4"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "the",
        "tag": "w",
        "type": "word",
        "occurrence": "5",
        "occurrences": "5"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "country",
        "tag": "w",
        "type": "word",
        "occurrence": "3",
        "occurrences": "3"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "of",
        "tag": "w",
        "type": "word",
        "occurrence": "4",
        "occurrences": "4"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H4124",
    "lemma": "מוֹאָב",
    "morph": "He,Np",
    "occurrence": "1",
    "occurrences": "1",
    "content": "מוֹאָ֔ב",
    "children": [
      {
        "text": "Moab",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": ". "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H0802",
    "lemma": "אִשָּׁה",
    "morph": "He,C:Ncfsc:Sp3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וְ⁠אִשְׁתּ֖⁠וֹ",
    "children": [
      {
        "text": "His",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      },
      {
        "type": "text",
        "text": " "
      },
      {
        "text": "wife",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H8147",
    "lemma": "שְׁנַיִם",
    "morph": "He,C:Acmdc",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וּ⁠שְׁנֵ֥י",
    "children": [
      {
        "text": "and",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H1121a",
    "lemma": "בֵּן",
    "morph": "He,Ncmpc:Sp3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "בָנָֽי⁠ו",
    "children": [
      {
        "text": "his",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H8147",
    "lemma": "שְׁנַיִם",
    "morph": "He,C:Acmdc",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וּ⁠שְׁנֵ֥י",
    "children": [
      {
        "text": "two",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H1121a",
    "lemma": "בֵּן",
    "morph": "He,Ncmpc:Sp3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "בָנָֽי⁠ו",
    "children": [
      {
        "text": "sons",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H3212",
    "lemma": "יָלַךְ",
    "morph": "He,C:Vqw3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וַ⁠יֵּ֨לֶךְ",
    "children": [
      {
        "text": "went",
        "tag": "w",
        "type": "word",
        "occurrence": "2",
        "occurrences": "2"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "c:H0802",
    "lemma": "אִשָּׁה",
    "morph": "He,C:Ncfsc:Sp3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "וְ⁠אִשְׁתּ֖⁠וֹ",
    "children": [
      {
        "text": "with",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "tag": "zaln",
    "type": "milestone",
    "strong": "H1931",
    "lemma": "הוּא",
    "morph": "He,Pp3ms",
    "occurrence": "1",
    "occurrences": "1",
    "content": "ה֥וּא",
    "children": [
      {
        "text": "him",
        "tag": "w",
        "type": "word",
        "occurrence": "1",
        "occurrences": "1"
      }
    ],
    "endTag": "zaln-e\\*"
  },
  {
    "type": "text",
    "text": ". \n"
  }
]
const originalLanguageVerseObjects = [
  {
    "text": "וַ⁠יְהִ֗י",
    "tag": "w",
    "type": "word",
    "lemma": "הָיָה",
    "strong": "c:H1961",
    "morph": "He,C:Vqw3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "בִּ⁠ימֵי֙",
    "tag": "w",
    "type": "word",
    "lemma": "יוֹם",
    "strong": "b:H3117",
    "morph": "He,R:Ncmpc",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "שְׁפֹ֣ט",
    "tag": "w",
    "type": "word",
    "lemma": "שָׁפַט",
    "strong": "H8199",
    "morph": "He,Vqc",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "הַ⁠שֹּׁפְטִ֔ים",
    "tag": "w",
    "type": "word",
    "lemma": "שָׁפַט",
    "strong": "d:H8199",
    "morph": "He,Td:Vqrmpa",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "וַ⁠יְהִ֥י",
    "tag": "w",
    "type": "word",
    "lemma": "הָיָה",
    "strong": "c:H1961",
    "morph": "He,C:Vqw3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "רָעָ֖ב",
    "tag": "w",
    "type": "word",
    "lemma": "רָעָב",
    "strong": "H7458",
    "morph": "He,Ncmsa",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "בָּ⁠אָ֑רֶץ",
    "tag": "w",
    "type": "word",
    "lemma": "אֶרֶץ",
    "strong": "b:H0776",
    "morph": "He,Rd:Ncbsa",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "וַ⁠יֵּ֨לֶךְ",
    "tag": "w",
    "type": "word",
    "lemma": "יָלַךְ",
    "strong": "c:H3212",
    "morph": "He,C:Vqw3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "אִ֜ישׁ",
    "tag": "w",
    "type": "word",
    "lemma": "אִישׁ",
    "strong": "H0376",
    "morph": "He,Ncmsa",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "מִ⁠בֵּ֧ית",
    "tag": "w",
    "type": "word",
    "lemma": "בֵּית לֶחֶם",
    "strong": "m:H1035",
    "morph": "He,R:Np",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "לֶ֣חֶם",
    "tag": "w",
    "type": "word",
    "lemma": "בֵּית לֶחֶם",
    "strong": "H1035",
    "morph": "He,Np",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": "\n "
  },
  {
    "text": "יְהוּדָ֗ה",
    "tag": "w",
    "type": "word",
    "lemma": "יְהוּדָה",
    "strong": "H3063",
    "morph": "He,Np",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "לָ⁠גוּר֙",
    "tag": "w",
    "type": "word",
    "lemma": "גּוּר",
    "strong": "l:H1481a",
    "morph": "He,R:Vqc",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "בִּ⁠שְׂדֵ֣י",
    "tag": "w",
    "type": "word",
    "lemma": "שָׂדֶה",
    "strong": "b:H7704b",
    "morph": "He,R:Ncmpc",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "מוֹאָ֔ב",
    "tag": "w",
    "type": "word",
    "lemma": "מוֹאָב",
    "strong": "H4124",
    "morph": "He,Np",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "ה֥וּא",
    "tag": "w",
    "type": "word",
    "lemma": "הוּא",
    "strong": "H1931",
    "morph": "He,Pp3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "וְ⁠אִשְׁתּ֖⁠וֹ",
    "tag": "w",
    "type": "word",
    "lemma": "אִשָּׁה",
    "strong": "c:H0802",
    "morph": "He,C:Ncfsc:Sp3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "וּ⁠שְׁנֵ֥י",
    "tag": "w",
    "type": "word",
    "lemma": "שְׁנַיִם",
    "strong": "c:H8147",
    "morph": "He,C:Acmdc",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": " "
  },
  {
    "text": "בָנָֽי⁠ו",
    "tag": "w",
    "type": "word",
    "lemma": "בֵּן",
    "strong": "H1121a",
    "morph": "He,Ncmpc:Sp3ms",
    "occurrence": 1,
    "occurrences": 1
  },
  {
    "type": "text",
    "text": "׃\n\n"
  }
]

test(`migrateTargetAlignmentsToOriginal`, () => {

  ////////////
  // Given

  const migrationExpected = true

  ////////////
  // When

  const targetVerseObjects = migrateTargetAlignmentsToOriginal(currentVerseObjects, originalLanguageVerseObjects)


  ////////////
  // Then

  const migrated = isMigrated('prefix', targetVerseObjects, currentVerseObjects)
  expect(migrated).toEqual(true)

  validateMigrations(currentVerseObjects, targetVerseObjects, migrationExpected);
})

test(`updateAlignmentsToTargetVerse`, () => {

  ////////////
  // Given


  ////////////
  // When

  const {targetVerseObjects} = updateAlignmentsToTargetVerse(currentVerseObjects, newVerseText)


  ////////////
  // Then

  // validateMigrations(currentVerseObjects, targetVerseObjects, false);
  expect(true).toEqual(false)
})

//////////////////////////////
// Testing Support functions
//////////////////////////////

function getWordCountFromVerseObjects(verseObjects) {
  let count = 0
  for (const vo of verseObjects) {
    if (vo?.type === 'word') {
      count++
    }
    if (vo?.children) {
      const _count = getWordCountFromVerseObjects(vo.children)
      count += _count
    }
  }
  return count
}

function getWordCountFromAlignments(verseAlignments) {
  let count = 0
  for (const alignment of verseAlignments) {
    if (alignment?.sourceNgram) {
      count += alignment?.sourceNgram?.length
    }
  }
  return count
}

function _areAlgnmentsComplete(targetVerseUSFM, originalVerseObjects) {
  const {
    alignments,
    wordBank
  } = extractAlignmentsFromTargetVerse(targetVerseUSFM, originalVerseObjects)
  return areAlgnmentsComplete(wordBank, alignments)
}

function getVerseObjectsFromUsfms(initialAlignment) {
  const initialVerseObjects = usfmVerseToJson(initialAlignment);
  const originalLanguageVerseObjects = usfmVerseToJson(psa_73_5_originalVerseText);
  const areInitialAlignmentsComplete = _areAlgnmentsComplete(initialAlignment, originalLanguageVerseObjects)
  return {initialVerseObjects, originalLanguageVerseObjects, areInitialAlignmentsComplete};
}

function validateFinalAlignment(areInitialAlignmentsComplete, expectInitialAlignmentsValid, results, newText, expectedOriginalWords, expectFinalAlignmentsValid, originalLanguageVerseObjects) {
  expect(areInitialAlignmentsComplete).toEqual(expectInitialAlignmentsValid)
  expect(results).toMatchSnapshot()
  const initialWords = Lexer.tokenize(removeUsfmMarkers(newText));
  const alignerResults = parseUsfmToWordAlignerData(results.targetVerseText, psa_73_5_originalVerseText);
  expect(alignerResults).toMatchSnapshot()
  const {targetWords, verseAlignments} = alignerResults;
  expect(targetWords.length).toEqual(initialWords.length)
  const finalOriginalWords = getWordCountFromAlignments(verseAlignments)
  expect(finalOriginalWords).toEqual(expectedOriginalWords)
  const areAlignmentsComplete = _areAlgnmentsComplete(results.targetVerseText, originalLanguageVerseObjects)
  expect(areAlignmentsComplete).toEqual(expectFinalAlignmentsValid)
}

function validateMigrations(initialVerseObjects, migratedVerseObjects, expectMigration) {
  const initialVerseText = convertVerseDataToUSFM({verseObjects: initialVerseObjects})
  const migratedVerseText = convertVerseDataToUSFM({verseObjects: migratedVerseObjects});
  if (expectMigration) {
    expect(migratedVerseText).not.toEqual(initialVerseText)
  } else {
    expect(migratedVerseText).toEqual(initialVerseText)
  }
}
