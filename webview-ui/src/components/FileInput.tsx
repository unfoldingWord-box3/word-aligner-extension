import React, { useRef } from 'react';

console.log("FileInput")

function FileInput() {
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
      console.log("FileInput - loaded file", reader.result);
    };

    console.log("FileInput - selected file", file);
    reader.readAsText(file);
  };

  return (
    <div>
      <input type='file' id='file' ref={inputFile} style={{ display: 'none' }} onChange={handleFileUpload} />
      <button onClick={onButtonClick}>Open file upload window</button>
    </div>
  );
}

export default FileInput;
