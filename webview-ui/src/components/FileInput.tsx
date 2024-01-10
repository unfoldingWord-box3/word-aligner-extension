import React, { useRef } from 'react';
// @ts-ignore
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

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
};

export const FileInput: React.FC<FileInputParams> = ({
  onFileLoad,
  open,
  title
}) => {
  const inputFile = useRef(null);

  const onButtonClick = () => {
    // `current` points to the mounted file input element
    console.log("FileInput - on button click")
    // @ts-ignore
    inputFile.current.click();
  };

  // @ts-ignore
  const handleFileUpload = event => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      // The file's text will be printed here
      const fileData = reader?.result?.toString()
      console.log("FileInput - loaded file", fileData?.substring(0, 100));
      onFileLoad?.({
        fileUrl: file?.path,
        fileData: fileData,
      })
      // console.log(`fs`, fs)
      // const exists = fs.existsSync(file?.path)
      // console.log(`verified file: ${exists}`)
    };

    console.log("FileInput - selected file", file);
    reader.readAsText(file);
  };

  return (
    open ?
      <div style={{"padding": "10px"}}>
        <input type='file' id='file' ref={inputFile} style={{ display: 'none' }} onChange={handleFileUpload} />
        <VSCodeButton onClick={onButtonClick}>{title}</VSCodeButton>
      </div>
    :
      <></>
  );
}

export default FileInput;
