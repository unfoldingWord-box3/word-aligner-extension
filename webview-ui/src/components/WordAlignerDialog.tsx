import React, { useEffect, useState } from 'react';
// @ts-ignore
import { AlignmentHelpers, UsfmFileConversionHelpers, usfmHelpers, WordAligner } from "word-aligner-rcl";
import { NT_ORIG_LANG, OT_ORIG_LANG } from "../common/constants";

import * as LexiconData_ from "../../__tests__/fixtures/lexicon/lexicons.json";
import { isNT } from "../common/BooksOfTheBible";
const LexiconData: Record<string, Record<string, Record<string,string>>> = LexiconData_

console.log("WordAlignerDialog")

const translate = (key: string) => {
  console.log(`translate(${key})`)
};

const targetWords_: object[] = [], verseAlignments_: object[] = []

export interface ScriptureReferenceType {
  bookId: string|null;
  chapter: number|string;
  verse: number|string;
}

export type alignmentFinishedType = {
  targetVerseObj?: Object,
  alignmentChanged: boolean,
};

export interface OnAlignmentFinishedType {
  (data: alignmentFinishedType): void;
}

export type WordAlignerParams = {
  onAlignmentFinished: OnAlignmentFinishedType,
  originalVerseObj: Object|null,
  reference: ScriptureReferenceType,
  targetVerseObj: Object|null,
};

export function WordAlignerDialog(params: WordAlignerParams) {
  const {
    onAlignmentFinished,
    originalVerseObj,
    reference,
    targetVerseObj,
  } = params
  const [state, setState_] = useState({
    targetWords: targetWords_,
    verseAlignments: verseAlignments_,
    alignmentChanged: false,
    updatedTargetWords: null,
    updatedVerseAlignments: null,
  });
  const {
    targetWords,
    verseAlignments,
    alignmentChanged,
    updatedTargetWords,
    updatedVerseAlignments,
  } = state;
  
  const targetLanguageFont = '';
  const sourceLanguage = isNT(reference?.bookId) ? NT_ORIG_LANG : OT_ORIG_LANG
  const lexicons = {};
  const contextId = {
    reference,
    tool: "wordAlignment",
    groupId: "chapter_1"
  };

  function setState(newState: object) {
    setState_(prevState => ({ ...prevState, ...newState }))
  }
  
  function initializeALignmentData() {
    const targetVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(targetVerseObj);
    const originalVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(originalVerseObj);
    const {
      targetWords: targetWords_,
      verseAlignments: verseAlignments_,
    } = AlignmentHelpers.parseUsfmToWordAlignerData(targetVerseUsfm, originalVerseUsfm);
    setState({
      targetWords: targetWords_,
      verseAlignments: verseAlignments_,
      alignmentChanged: false,
      updatedTargetWords: null,
      updatedVersAlignments: null,
    });
  }

  useEffect(() => {
    if (targetVerseObj && originalVerseObj) { // initialize aligner data from current verseObjects
      initializeALignmentData();
    }
  }, [ targetVerseObj, originalVerseObj ])
  
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
    const targetVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(targetVerseObj);
    const verseUsfm = AlignmentHelpers.addAlignmentsToVerseUSFM(targetWords, verseAlignments, targetVerseUsfm);
    console.log(verseUsfm);
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(targetWords, verseAlignments);
    setState({
      alignmentChanged: true,
      updatedTargetWords: targetWords,
      updatedVerseAlignments: verseAlignments,
    })
    console.log(`Alignments are ${alignmentComplete ? 'COMPLETE!' : 'incomplete'}`);
  }

  function onReset() {
    console.log("WordAligner() - reset Alignments")
    const alignmentData_ = AlignmentHelpers.resetAlignments(verseAlignments, targetWords)
    setState({
      alignmentChanged: true,
      targetWords: alignmentData_.targetWords,
      verseAlignments: alignmentData_.verseAlignments,
    })
  }

  function onCancel() {
    console.log("WordAligner() - cancel Alignments")
    initializeALignmentData()
    onAlignmentFinished?.({ alignmentChanged: false })
  }

  function onFinish() {
    console.log("WordAligner() - finish Alignments")
    const newState = {
      alignmentChanged,

    };
    
    if (alignmentChanged) {
      const targetVerseUsfm = UsfmFileConversionHelpers.convertVerseDataToUSFM(targetVerseObj);
      const verseUsfm = AlignmentHelpers.addAlignmentsToVerseUSFM(updatedTargetWords, updatedVerseAlignments, targetVerseUsfm)
      const _targetVerseObj = usfmHelpers.usfmVerseToJson(verseUsfm)
      // @ts-ignore
      newState['targetVerseObj'] = _targetVerseObj
    }
    onAlignmentFinished?.(newState)
    setState(newState)
  }

  return (
     <>
      <div style={{height: '650px', width: '800px', paddingBottom: '60px'}}>
          <WordAligner
            styles={{ maxHeight: '450px', overflowY: 'auto' }}
            verseAlignments={verseAlignments}
            targetWords={targetWords}
            translate={translate}
            contextId={contextId}
            targetLanguageFont={targetLanguageFont}
            sourceLanguage={sourceLanguage}
            showPopover={() => { }}
            lexicons={lexicons}
            loadLexiconEntry={loadLexiconEntry}
            onChange={onChange}
            getLexiconData={getLexiconData_}
            resetAlignments={onReset}
          />
      </div>
      <div>
         <button style={{ margin: '10px 50px' }} onClick={onCancel}>
           Cancel Alignments
         </button>
         <button style={{ margin: '10px 50px' }} onClick={onReset}>
           Reset Alignments
         </button>
         <button style={{ margin: '10px 50px' }} onClick={onFinish}>
           Alignments Done
         </button>
      </div>
    </>
  );
}

export default WordAlignerDialog;
