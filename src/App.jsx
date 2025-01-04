import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

function App() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const onDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !description || !image) {
      alert('Please fill all fields and upload an image.');
      return;
    }
    const newMetadata = { name, description, image };
    setMetadata(newMetadata);
  };

  return (
    <div className="App">
      <h1>NFT Metadata Xpress</h1>
      <form onSubmit={handleSubmit}>
        <label>Name: </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label>Description: </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <label>Image:</label>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drag & drop an image, or click to select</p>
        </div>
        <button type="submit">Generate Metadata</button>
      </form>

      {metadata && (
        <div>
          <h2>Metadata Preview</h2>
          <pre>{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
