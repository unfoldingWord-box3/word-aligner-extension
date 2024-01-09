import React, { useEffect, useState } from "react";
// @ts-ignore
import usfmjs from 'usfm-js';
// @ts-ignore
import { usfmHelpers } from 'word-aligner-rcl';
// @ts-ignore
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { WordAlignerDialog } from "./components/WordAlignerDialog";
import { FileInput, LoadedFileType } from "./components/FileInput";

console.log("starting app")

function getBookId(bookObjects: Object):string|null {
  const details = usfmHelpers.getUSFMDetails(bookObjects)
  return details?.book?.id
}

function App() {
  const [targetBookObj, setTargetBookObj] = useState<object|null>(null);
  const [originalBookObj, setOrginalBookObj] = useState<object|null>(null);
  const [bookId, setBookId] = useState<string|null>(null);
  const [targetVerseObj, setTargetVerseObj] = useState<object|null>(null);
  const [originalVerseObj, setOriginalVerseObj] = useState<object|null>(null);
  
  const { state: bibleRefState, actions: bibleRefActions } = useBibleReference({
    initialBook: null,
    initialChapter: '1',
    initialVerse: '1',
    onChange: null,
    onPreChange: null,
    addChapterFront: 'front',
  })
  
  const { chapter, verse } = bibleRefState

  function handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  function onAlignedBibleLoad(data: LoadedFileType): void {
    const bookUsfm = data?.fileData;
    console.log('onAlignedBibleLoad data', bookUsfm?.substring(0, 100))
    const bookObjects = bookUsfm && usfmjs.toJSON(bookUsfm)
    if (bookObjects) {
      setTargetBookObj(bookObjects)
      const _bookId = getBookId(bookObjects)
      if (bookId !== _bookId) {
        setBookId(_bookId)
        setOrginalBookObj(null) // clear original book since book has changed
        bibleRefActions.applyBooksFilter([_bookId])
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
      } else {
        console.error(`onOriginalBibleLoad: invalid original book '${_bookId}' loaded, should be '${bookId}'`)
      }
    }
  }

  const haveBooksLoaded = targetBookObj && originalBookObj
  const alignmentsReady = haveBooksLoaded && targetVerseObj && originalVerseObj

  useEffect(() => {
    if (!alignmentsReady) {
      if (haveBooksLoaded && bookId && chapter && verse) { // extract the selected verse
        // @ts-ignore
        const _targetVerseObj = targetBookObj?.chapters?.[chapter]?.[verse];
        setTargetVerseObj(_targetVerseObj)
        // @ts-ignore
        const _originalVerseObj = originalBookObj?.chapters?.[chapter]?.[verse];
        setOriginalVerseObj(_originalVerseObj)
      }
    }
  }, [ alignmentsReady, haveBooksLoaded, bookId, chapter, verse ])
  
  return (
    <main>
      <h1>Word Aligner Demo</h1>
      <BibleReference
        status={bibleRefState}
        actions={bibleRefActions}
        inputProps={{ }}
        style={{ }}
      />
      {alignmentsReady &&
        <WordAlignerDialog
          targetVerseObj={targetVerseObj}
          originalVerseObj={originalVerseObj}
        />
      }      <div style={{"height": "40px"}}></div>
      <FileInput
        onFileLoad={onAlignedBibleLoad}
        title={"Open Aligned Bible Book USFM"}
        open={true}
      />
      <FileInput
        onFileLoad={onOriginalBibleLoad}
        title={"Open Original Bible Book USFM"}
        open={!!targetBookObj}
      />
      {/* <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton> */}
    </main>
  );
}

export default App;
