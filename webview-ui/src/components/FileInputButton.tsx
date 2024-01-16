import React, { useRef } from 'react';
// @ts-ignore
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { vscode } from '../utilities/vscode';

// @ts-ignore
/// unfortunately, this doesn't work in the webview, fs is undefined
// import * as fs from 'node:fs';

console.log("FileInput")

export type LoadedFileType = {
  fileUrl: string,
  fileData: string | undefined,
};

export interface OnFileLoadType {
  (data: LoadedFileType): void;
}

export type FileInputParams = {
  onFileLoad: OnFileLoadType,
  open: boolean,
  title: string,
  id: string,
};

export const FileInputButton: React.FC<FileInputParams> = ({
  onFileLoad,
  open,
  title,
  id
}) => {
  const inputFile = useRef(null);

  const onButtonClick = () => {
    let listener:any = null

    // @ts-ignore
    listener = event => { // catch the response of the file picker
      const message = event.data;
      if (message.command === 'WEBVIEW_FILE_PICKER_RESULTS') {
        const fileUrl = message?.results?.filePath
        const fileData = message?.results?.contents
        console.log(`file picker finished: ${fileUrl}`)

        // @ts-ignore
        listener && window.removeEventListener('message', listener) // remove listener

        console.log("FileInput - loaded file", fileData?.substring(0, 100));
        onFileLoad?.({
          fileUrl,
          fileData,
        })
      }
    };

    window.addEventListener('message', listener);
    
    vscode.postMessage({
      command:'openFilePicker',
      canSelectMany: false,
      label: 'Open USFM',
      key: id,
      filters: {
        'USFM files': ['usfm'],
        'All files': ['*']
      }
    });
  };

  return (
    open ?
      <div style={{"padding": "10px"}}>
        <VSCodeButton
          onClick={onButtonClick}
          id={id}
        >
          {title}
        </VSCodeButton>
      </div>
    :
      <></>
  );
}

export default FileInputButton;
