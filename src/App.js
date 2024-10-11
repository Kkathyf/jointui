import './App.css';
import Header from './Header.js';
import UploadImage from './UploadImage.js';
import React, { useState } from 'react';
import Score from './Score.js';



function App() {
  const [image, setImage] = useState(null);
  const [jointData, setJointData] = useState(null);
 

  const handleUpload = (originalImage) => {
    setImage(originalImage);
  };

  const handleJointData = (data) => {
    setJointData(data);
  };

  return (
    <div className="App">
      <Header/>
      <div className='container'>
        <div className='column'>
          <UploadImage onUpload={handleUpload} onJointData={handleJointData}/>
        </div>
        {image && <div className='column'>
          <Score image ={image} jointData={jointData}/>
        </div>}
      </div>
    </div>
  );
}
export default App;