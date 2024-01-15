import React, { useEffect, useState } from "react";
// @ts-ignore
import usfmjs from 'usfm-js';
// @ts-ignore
import { usfmHelpers } from 'word-aligner-rcl';
// @ts-ignore
import {
  VSCodeButton,
  VSCodeTextField,
  VSCodeDropdown,
  VSCodeOption
} from "@vscode/webview-ui-toolkit/react";

import { vscode } from "./utilities/vscode";
import "./App.css";
import {
  alignmentFinishedType,
  OnAlignmentFinishedType,
  ScriptureReferenceType,
  WordAlignerDialog,
} from "./components/WordAlignerDialog";
import { FileInput, LoadedFileType } from "./components/FileInput";
import { sortReferences } from "./utilities/bibleUtils";
import FileSaveButton from "./components/FileSaveButton";

console.log("starting app")

// select colors
const blue = "#00B0FF"; // a shade of blue
const white = "#FFFFFF";
const black = "#000000";
const bibleRefStyle = { color: white, background: blue }; // set forground and background colors

export interface OnChangeType {
  (): void;
}

function getBookId(bookObjects: Object):string|null {
  const details = usfmHelpers.getUSFMDetails(bookObjects)
  return details?.book?.id
}

function App() {
  const [targetBookObj, setTargetBookObj] = useState<object|null>(null);
  const [targetBookPath, setTargetBookPath] = useState<string|null>(null);
  const [originalBookObj, setOrginalBookObj] = useState<object|null>(null);
  const [bookId, setBookId] = useState<string>('');
  const [chapter, setChapter] = useState<string>('1');
  const [chapterList, setChapterList] = useState<string[]>([]);
  const [verse, setVerse] = useState<string>('1');
  const [verseList, setVerseList] = useState<string[]>([]);
  const [targetVerseObj, setTargetVerseObj] = useState<object|null>(null);
  const [originalVerseObj, setOriginalVerseObj] = useState<object|null>(null);
  const [showAligner, setShowAligner] = useState<boolean>(false);
  const [fileModified, setFileModified] = useState<boolean>(false);
  const reference = { bookId, chapter, verse }
  
  // function doSaveChanges() { // TODO: convert back to USFM and save file
    vscode.postMessage({
      command: "save",
      text: targetBookObj,
      filePath: targetBookPath
    });
  }

  function onAlignmentFinished(data: alignmentFinishedType): void {
    setShowAligner(false)
    console.log(`onAlignmentFinished: alignmentChanged: ${data?.alignmentChanged}`, data)
    if (data?.alignmentChanged && data?.targetVerseObj) {
      // @ts-ignore
      const verses = targetBookObj?.chapters?.[chapter]
      // make shallow copy of verses and update with new verse content
      const newVerses = { ...verses }
      newVerses[verse || ''] = data?.targetVerseObj
      const _targetBookObj = targetBookObj
      // @ts-ignore
      _targetBookObj.chapters[chapter] = newVerses;
      setTargetBookObj(_targetBookObj) // save revised
      updateVerseObjects(_targetBookObj); // update for current verse
      setFileModified(true)
    }
  }

  function onAlignedBibleLoad(data: LoadedFileType): void {
    const bookUsfm = data?.fileData;
    console.log('onAlignedBibleLoad data', bookUsfm?.substring(0, 100))
    const bookObjects = bookUsfm && usfmjs.toJSON(bookUsfm)
    if (bookObjects) {
      setTargetBookObj(bookObjects)
      const _bookId = getBookId(bookObjects)
      if (bookId !== _bookId) {
        setBookId(_bookId || '')
        setOrginalBookObj(null) // clear original book since book has changed
        setTargetBookPath(data?.fileUrl)
        setFileModified(false)
      }
    }
  }
  
  function onOriginalBibleLoad(data: LoadedFileType): void {
    const bookUsfm = data?.fileData;
    console.log('onOriginalBibleLoad data', bookUsfm?.substring(0, 100))
    const bookObjects = bookUsfm && usfmjs.toJSON(bookUsfm)
    if (bookObjects) {
      const _bookId = getBookId(bookObjects)
      if (bookId === _bookId) {
        setOrginalBookObj(bookObjects)
        const chapters = bookObjects?.chapters
        const _chapterList = sortReferences(Object.keys(chapters))
        setChapterList(_chapterList)
        const _chapter = '1';
        setChapter(_chapter)
        updateVerses(bookObjects || {}, _chapter)
      } else {
        console.error(`onOriginalBibleLoad: invalid original book '${_bookId}' loaded, should be '${bookId}'`)
      }
    }
  }

  function updateVerses(originalBookObj:object, chapter:string) {
    // @ts-ignore
    const chapters = originalBookObj?.chapters || {};
    const verses = chapters[chapter];
    const _verseList = verses && sortReferences(Object.keys(verses)) || [];
    setVerseList(_verseList);
    setVerse("1");
  }

  useEffect(() => {
    updateVerses(originalBookObj || {}, chapter)
  }, [ originalBookObj, chapter ])
  
  const haveBooksLoaded = targetBookObj && originalBookObj
  const alignmentsReady = haveBooksLoaded && targetVerseObj && originalVerseObj

  function updateVerseObjects(targetBookObj:object|null):boolean {
    // @ts-ignore
    const _targetVerseObj = targetBookObj?.chapters?.[chapter]?.[verse];
    setTargetVerseObj(_targetVerseObj);
    // @ts-ignore
    const _originalVerseObj = originalBookObj?.chapters?.[chapter]?.[verse];
    setOriginalVerseObj(_originalVerseObj);
    return _targetVerseObj && _originalVerseObj
  }

  function showSelectedVerse() {
    if (haveBooksLoaded && bookId && chapter && verse) { // extract the selected verse
      if (updateVerseObjects(targetBookObj)) {
        setShowAligner(true);
      }
    }
  }

  useEffect(() => {
    if (!alignmentsReady) {
      showSelectedVerse();
    }
  }, [ alignmentsReady, haveBooksLoaded ])

  function showAlignmentPrompt() {
    if (haveBooksLoaded) {
      return <VSCodeButton style={{ margin: "10px 50px" }} onClick={() => showSelectedVerse()}>
        Align Verse
      </VSCodeButton>;
    }
    
    let prompt = ''
    if (!targetBookObj) {
      prompt = "Need to Open Aligned Book USFM"
    } else if (!originalBookObj) {
      prompt = "Need to Open Original Book USFM"
    }
    
    return <div style={{ padding: "20px"}}> <b> {prompt} </b></div>
  }
  
  function getInputValue(e:any):string {
    return e?.target?.value || ''
  }

  function getOptions(options:string[]) {
    return options.map((option, index) => (
        <VSCodeOption key={index}>{option}</VSCodeOption>
      ))
  }

  return (
    <main>
      <h1>Word Aligner Demo</h1>
      <div>
        <label htmlFor="chapter-dropdown">Chapter</label>
        <VSCodeDropdown
          id="chapter-dropdown"
          value={chapter}
          disabled={showAligner}
          onChange={e => setChapter(getInputValue(e))}
        >
          {getOptions(chapterList)}
        </VSCodeDropdown>

        <label htmlFor="verse-dropdown">Verse</label>
        <VSCodeDropdown
          id="verse-dropdown"
          value={verse}
          disabled={showAligner}
          onChange={e => setVerse(getInputValue(e))}
        >
          {getOptions(verseList)}
        </VSCodeDropdown>
      </div>
      <div style={{ "height": "40px" }}></div>
      {showAligner ?
        <WordAlignerDialog
          targetVerseObj={targetVerseObj}
          originalVerseObj={originalVerseObj}
          onAlignmentFinished={onAlignmentFinished}
          reference={reference}
        />
        : showAlignmentPrompt()
      }
      {(!showAligner && fileModified) &&
        <VSCodeButton onClick={doSaveChanges}>Save Modified File</VSCodeButton>
        //     <FileSaveButton
        //     title={"Save Changes to file"}
        //   fileText={JSON.stringify(targetBookObj)}
        //   fileName={targetBookPath || ''}
        // />
      }
      <FileInput
        onFileLoad={onAlignedBibleLoad}
        title={"Open Aligned Bible Book USFM"}
        open={!showAligner}
      />
      <FileInput
        onFileLoad={onOriginalBibleLoad}
        title={"Open Original Bible Book USFM"}
        open={!showAligner && !!targetBookObj}
      />
    </main>
  );
}

export default App;
