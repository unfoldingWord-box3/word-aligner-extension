import React, { FC, MouseEvent, useEffect, useRef, useState } from "react";
// @ts-ignore
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

// @ts-ignore
/// unfortunately, this doesn't work in the webview, fs is undefined
// import * as fs from 'node:fs';

console.log("FileSaveButton")

export type LoadedFileType = {
  fileUrl: string,
  fileData: string | undefined,
};

export interface OnFileLoadType {
  (data: LoadedFileType): void;
}

export type FileSaveParams = {
  // onFileLoad: OnFileLoadType,
  title: string,
  fileText: string,
  fileName: string,
};


const FileSaveButton: FC<FileSaveParams> = ({
  title,
  fileText,
  fileName,
}) => {
  // const handleDownload = (event: MouseEvent) => {
  //   event.preventDefault();
  //
  //   // Create a blob from the data
  //   const blob = new Blob([fileText], { type: 'text/plain' });
  //   const url = URL.createObjectURL(blob);
  //
  //   // Create a link element
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = 'file.txt' // fileName;
  //
  //   // Append the link to the body
  //   document.body.appendChild(link);
  //
  //   // Simulate a click on the link
  //   link.click();
  //
  //   // Remove the link from the body
  //   document.body.removeChild(link);
  // };
  //
  // return <button
  //   onClick={handleDownload}
  // >
  //   {title}
  // </button>;
  
  const saveFile = useRef(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    const blobData = new Blob([fileText || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blobData);
    setBlobUrl(url)
  }, [ fileText ])
  
  return <a
    ref={saveFile}
    href={blobUrl}
    download={"file.usfm"}
  >
    {title}
  </a>
};

export default FileSaveButton;
