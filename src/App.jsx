import React, { useState, useEffect } from 'react';
    import { useDropzone } from 'react-dropzone';
    import axios from 'axios';
    import { v4 as uuidv4 } from 'uuid';
    import ReactJson from 'react-json-view';

    function App() {
      const [name, setName] = useState('');
      const [description, setDescription] = useState('');
      const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);
      const [image, setImage] = useState(null);
      const [imageUrl, setImageUrl] = useState('');
      const [errors, setErrors] = useState({});
      const [metadata, setMetadata] = useState(null);
      const [uploadProgress, setUploadProgress] = useState(0);
      const [metadataSchema, setMetadataSchema] = useState('ERC-721');
      const [bulkMetadata, setBulkMetadata] = useState('');

      const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        setImage(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrl(event.target.result);
        };
        reader.readAsDataURL(file);
      };

      const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/*' });

      const handleAddAttribute = () => {
        setAttributes([...attributes, { trait_type: '', value: '' }]);
      };

      const handleAttributeChange = (index, event) => {
        const newAttributes = [...attributes];
        newAttributes[index][event.target.name] = event.target.value;
        setAttributes(newAttributes);
      };

      const handleRemoveAttribute = (index) => {
        const newAttributes = [...attributes];
        newAttributes.splice(index, 1);
        setAttributes(newAttributes);
      };

      const validateMetadata = () => {
        const newErrors = {};
        if (!name) newErrors.name = 'Name is required';
        if (!description) newErrors.description = 'Description is required';
        if (!imageUrl) newErrors.image = 'Image is required';

        attributes.forEach((attr, index) => {
          if (!attr.trait_type) newErrors[`trait_type_${index}`] = `Trait type is required for attribute ${index + 1}`;
          if (!attr.value) newErrors[`value_${index}`] = `Value is required for attribute ${index + 1}`;
        });

        if (imageUrl && !isValidUrl(imageUrl) && !imageUrl.startsWith('data:image')) {
          newErrors.image = 'Image URL is not valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const isValidUrl = (string) => {
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;
        }
      };

      const handleGenerateMetadata = async () => {
        if (!validateMetadata()) {
          return;
        }

        const metadata = {
          name: name,
          description: description,
          image: imageUrl,
          attributes: attributes.filter(attr => attr.trait_type && attr.value),
        };

        setMetadata(metadata);
      };

      const handleUploadToIPFS = async () => {
        if (!metadata) {
          alert('Generate metadata first!');
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', image);

          const uploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            },
          });

          const ipfsHash = uploadResponse.data.IpfsHash;
          const metadataWithIpfsImage = { ...metadata, image: `ipfs://${ipfsHash}` };

          const metadataJson = JSON.stringify(metadataWithIpfsImage, null, 2);
          const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
          const metadataFile = new File([metadataBlob], 'metadata.json');

          const metadataFormData = new FormData();
          metadataFormData.append('file', metadataFile);

          const metadataUploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', metadataFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            },
          });

          const metadataIpfsHash = metadataUploadResponse.data.IpfsHash;
          alert(`Metadata uploaded to IPFS with hash: ipfs://${metadataIpfsHash}`);
        } catch (error) {
          console.error('Error uploading to IPFS:', error);
          alert('Failed to upload to IPFS.');
        } finally {
          setUploadProgress(0);
        }
      };

      const handleDownloadMetadata = () => {
        if (!metadata) {
          alert('Generate metadata first!');
          return;
        }
        const json = JSON.stringify(metadata, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'metadata.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      const handleBulkMetadataChange = (event) => {
        setBulkMetadata(event.target.value);
      };

      const handleGenerateBulkMetadata = () => {
        try {
          const parsedMetadata = JSON.parse(bulkMetadata);
          if (!Array.isArray(parsedMetadata)) {
            alert('Bulk metadata must be a JSON array.');
            return;
          }
          console.log('Bulk Metadata:', parsedMetadata);
          alert('Bulk metadata generated. Check console for output.');
        } catch (error) {
          alert('Invalid JSON format for bulk metadata.');
        }
      };

      useEffect(() => {
        if (metadata) {
          console.log('Metadata:', metadata);
        }
      }, [metadata]);

      return (
        <div className="container">
          <h1>NFT Metadata Xpress for Web3</h1>
          <div className="form-group">
            <label>
              Name
              <span className="tooltip">
                <i style={{ marginLeft: '5px' }}>(?)</i>
                <span className="tooltiptext">The name of your NFT.</span>
              </span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>
              Description
              <span className="tooltip">
                <i style={{ marginLeft: '5px' }}>(?)</i>
                <span className="tooltiptext">A brief description of your NFT.</span>
              </span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            {errors.description && <div className="error">{errors.description}</div>}
          </div>
          <div className="form-group">
            <label>
              Image
              <span className="tooltip">
                <i style={{ marginLeft: '5px' }}>(?)</i>
                <span className="tooltiptext">Drag and drop an image or click to select.</span>
              </span>
            </label>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dragover' : ''}`}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop an image here, or click to select an image</p>
            </div>
            {imageUrl && <img src={imageUrl} alt="Preview" className="image-preview" />}
            {errors.image && <div className="error">{errors.image}</div>}
          </div>
          <div className="form-group">
            <label>
              Attributes
              <span className="tooltip">
                <i style={{ marginLeft: '5px' }}>(?)</i>
                <span className="tooltiptext">Add specific traits to your NFT.</span>
              </span>
            </label>
            <div className="attributes-container">
              {attributes.map((attribute, index) => (
                <div key={index} className="attribute-row">
                  <input
                    type="text"
                    name="trait_type"
                    placeholder="Trait Type"
                    value={attribute.trait_type}
                    onChange={(e) => handleAttributeChange(index, e)}
                  />
                  {errors[`trait_type_${index}`] && <div className="error">{errors[`trait_type_${index}`]}</div>}
                  <input
                    type="text"
                    name="value"
                    placeholder="Value"
                    value={attribute.value}
                    onChange={(e) => handleAttributeChange(index, e)}
                  />
                  {errors[`value_${index}`] && <div className="error">{errors[`value_${index}`]}</div>}
                  <button type="button" onClick={() => handleRemoveAttribute(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddAttribute}>
              Add Attribute
            </button>
          </div>
          <div className="form-group">
            <label>Metadata Schema</label>
            <select value={metadataSchema} onChange={(e) => setMetadataSchema(e.target.value)}>
              <option value="ERC-721">ERC-721</option>
              <option value="ERC-1155">ERC-1155</option>
            </select>
          </div>
          <button onClick={handleGenerateMetadata}>Generate Metadata</button>
          {metadata && (
            <div>
              <button onClick={handleUploadToIPFS} disabled={uploadProgress > 0}>
                Upload to IPFS {uploadProgress > 0 ? `(${uploadProgress}%)` : ''}
              </button>
              <button onClick={handleDownloadMetadata}>Download Metadata</button>
            </div>
          )}
          {metadata && (
            <div className="metadata-preview">
              <label>Metadata Preview</label>
              <ReactJson src={metadata} theme="monokai" collapsed={false} />
            </div>
          )}
          <div className="form-group">
            <label>
              Bulk Metadata (JSON Array)
              <span className="tooltip">
                <i style={{ marginLeft: '5px' }}>(?)</i>
                <span className="tooltiptext">
                  Paste a JSON array of metadata objects to generate multiple metadata files.
                </span>
              </span>
            </label>
            <textarea value={bulkMetadata} onChange={handleBulkMetadataChange} placeholder="[{}, {}, ...]"></textarea>
            <button onClick={handleGenerateBulkMetadata}>Generate Bulk Metadata</button>
          </div>
        </div>
      );
    }

    export default App;
