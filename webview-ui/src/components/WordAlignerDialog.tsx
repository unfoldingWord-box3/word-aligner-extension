import React, { useEffect, useState } from 'react';
// @ts-ignore
import { AlignmentHelpers, UsfmFileConversionHelpers, WordAligner } from 'word-aligner-rcl';
import {NT_ORIG_LANG} from '../common/constants';

// import * as alignedVerseJson from '../__tests__/fixtures/alignments/en_ult_tit_1_1.json';
import * as alignedVerseJson from '../../__tests__/fixtures/alignments/en_ult_tit_1_1_partial.json';
import * as originalVerseJson from '../../__tests__/fixtures/alignments/grk_tit_1_1.json';
import * as LexiconData_ from "../../__tests__/fixtures/lexicon/lexicons.json";
const LexiconData: Record<string, Record<string, Record<string,string>>> = LexiconData_

console.log("WordAlignerDialog")


const translate = (key: string) => {
  console.log(`translate(${key})`)
};

const targetVerseUSFM = alignedVerseJson.usfm;
const sourceVerseUSFM = originalVerseJson.usfm;

const {targetWords: targetWords_, verseAlignments: verseAlignments_} = AlignmentHelpers.parseUsfmToWordAlignerData(targetVerseUSFM, sourceVerseUSFM);

const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(targetWords_, verseAlignments_);
console.log(`Alignments are ${alignmentComplete ? 'COMPLETE!' : 'incomplete'}`);

export type WordAlignerParams = {
  targetVerseObj: Object,
  originalVerseObj: Object,
};

export function WordAlignerDialog(params: WordAlignerParams) {
  const {
    targetVerseObj,
    originalVerseObj,
  } = params
  const [state, setState] = useState({targetWords: targetWords_, verseAlignments: verseAlignments_});
  const {targetWords, verseAlignments} = state;

  const targetLanguageFont = '';
  const sourceLanguage = NT_ORIG_LANG;
  const lexicons = {};
  const contextId = {
    "reference": {
      "bookId": "tit",
      "chapter": 1,
      "verse": 1
    },
    "tool": "wordAlignment",
    "groupId": "chapter_1"
  };

  useEffect(() => {
    if (targetVerseObj && originalVerseObj) { // initialize aligner data from current verseObjects
      const targetVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(targetVerseObj)
      const originalVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(originalVerseObj)
      const {targetWords: targetWords_, verseAlignments: verseAlignments_} = AlignmentHelpers.parseUsfmToWordAlignerData(targetVerseUsfm, originalVerseUsfm);
      setState({targetWords: targetWords_, verseAlignments: verseAlignments_})
    }
  }, [ targetVerseObj, originalVerseObj ])
  
  const showPopover = (PopoverTitle:any, wordDetails:any, positionCoord:any, rawData:any) => {
    console.log(`showPopover()`, rawData)
    window.prompt(`User clicked on ${JSON.stringify(rawData.token)}`)
  };
  const loadLexiconEntry = (key:string) => {
    console.log(`loadLexiconEntry(${key})`)
  };
  const getLexiconData_ = (lexiconId:string, entryId:string) => {
    console.log(`loadLexiconEntry(${lexiconId}, ${entryId})`)
    const entryData = (LexiconData && LexiconData[lexiconId]) ? LexiconData[lexiconId][entryId] : null;
    return {[lexiconId]: {[entryId]: entryData}};
  };

  function onChange(results:any) {
    console.log(`WordAligner() - alignment changed, results`, results);// merge alignments into target verse and convert to USFM
    const {targetWords, verseAlignments} = results;
    const verseUsfm = AlignmentHelpers.addAlignmentsToVerseUSFM(targetWords, verseAlignments, targetVerseUSFM);
    console.log(verseUsfm);
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(targetWords, verseAlignments);
    console.log(`Alignments are ${alignmentComplete ? 'COMPLETE!' : 'incomplete'}`);
  }

  function onReset() {
    console.log("WordAligner() - reset Alignments")
    const alignmentData = AlignmentHelpers.resetAlignments(verseAlignments, targetWords)
    setState({
      verseAlignments: alignmentData.verseAlignments,
      targetWords: alignmentData.targetWords,
    })
  }

  return (
     <>
      <div>
        <button
          style={{margin: '10px'}}
          onClick={onReset}
        >
          {"Reset Alignments"}
        </button>
      </div>
      <div style={{height: '650px', width: '800px'}}>
          <WordAligner
            styles={{ maxHeight: '450px', overflowY: 'auto' }}
            verseAlignments={verseAlignments}
            targetWords={targetWords}
            translate={translate}
            contextId={contextId}
            targetLanguageFont={targetLanguageFont}
            sourceLanguage={sourceLanguage}
            showPopover={showPopover}
            lexicons={lexicons}
            loadLexiconEntry={loadLexiconEntry}
            onChange={onChange}
            getLexiconData={getLexiconData_}
            resetAlignments={onReset}
          />
      </div>
    </>
  );
}

export default WordAlignerDialog;
