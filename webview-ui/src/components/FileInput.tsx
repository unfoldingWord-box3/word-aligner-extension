import React, { useRef } from 'react';

console.log("FileInput")

export type LoadedFileType = {
  fileUrl: string,
  fileData: string | undefined,
};

export interface OnFileLoadType {
  (data: LoadedFileType): void;
}

export type AppParams = {
  onFileLoad: OnFileLoadType,
  open: boolean,
  title: string,
};

export const FileInput: React.FC<AppParams> = ({
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
    };

    console.log("FileInput - selected file", file);
    reader.readAsText(file);
  };

  return (
    open ?
      <div style={{"padding": "10px"}}>
        <input type='file' id='file' ref={inputFile} style={{ display: 'none' }} onChange={handleFileUpload} />
        <button onClick={onButtonClick}>{title}</button>
      </div>
    :
      <></>
  );
}

export default FileInput;
