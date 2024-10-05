import './App.css';
import React, { useState } from 'react';
import CropWorker from './cropWorker.worker.js';
import test from './images/test.jpg';


function Score({ image, jointData }) {//original image and array of joints
    const [croppedImage, setCroppedImage] = useState(null);  
    const [loading, setLoading] = useState(false);  

    const cropImage = () => {
        if (image && jointData) {
            const testJoint = jointData.Wrist[0];
            console.log("cropImageif");
            console.log(image);
            console.log(testJoint);
            setLoading(true);
            const cropWorker = new CropWorker('cropWorker.worker.js');
            //const cropWorker = new CropWorker();
            console.log("create new worker");

            // send data to worker
            cropWorker.postMessage({image, jointData});

            cropWorker.onmessage = (event) => {
                console.log(event.data);
                setCroppedImage(event.data.croppedImage.cropped);
                setLoading(false);
                cropWorker.terminate();
                console.log(event.data.croppedImage);
            };
            cropWorker.onerror = (error) => {
                console.error('Error in cropWorker: ', error);
                setLoading(false);
                cropWorker.terminate();
            };
        } else {
            alert('Please upload an image first.');
        }
    };

    async function sendToFingerApi(croppedImage){
        const url = 'https://sqbislam-rajointscoreprediction.hf.space/predict/fingers';
        const formData = new FormData();
        formData.append('file',croppedImage);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept' : 'application/json',
                },
                body: formData,
            });
            if (!response.ok){
                throw new Error('Failed to send file to API');
            }
            const data = await response.json();
            return data;

        } catch(error){
            console.error('Error during API call: ',error)
            throw error;
        }
    }
    async function sentToWristApi(croppedImage){

    }

    async function scoreJoints(image, jointDataArray){
        try {
            const pipData = jointDataArray.PIP;
            /*
            const mcpData = jointDataArray.MCP;
            const ulnaData = jointDataArray.Ulna;
            const radiusData = jointDataArray.Wrist;
            */
            
            const cropPipPromises = pipData.map(pip => cropImage(image,pip));
            
            const croppedPips = await Promise.all(cropPipPromises);

            const apiPipPromises = croppedPips.map(croppedPip => sendToFingerApi(croppedPip));

            const apiPipResponses = await Promise.all(apiPipPromises);
            
            const results = [];
            results.push(apiPipResponses);
            return results;
            
        } catch (error) {

        }
    };

    const tableData = [
        {id: 0, Type: 'MCP', Erosion: 0, Narrowing: 5, Total: 5},
        {id: 1, Type: 'MCP', Erosion: 3, Narrowing: 0, Total: 3},
        {id: 2, Type: 'PIP', Erosion: 4, Narrowing: 4, Total: 8},
        {id: 3, Type: 'PIP', Erosion: 1, Narrowing: 5, Total: 6},
        {id: 4, Type: 'PIP', Erosion: 2, Narrowing: 2, Total: 4},
        {id: 5, Type: 'Radius', Erosion: 0, Narrowing: 1, Total: 1},
        {id: 6, Type: 'Ulna', Erosion: 1, Narrowing: 1, Total: 2},
        {id: 7, Type: 'Wrist', Erosion: 2, Narrowing: 2, Total: 4},
    ];

    return (
        <div>
            <button onClick={cropImage}>
                {'Score joints'}
            </button>
            <button>
                {'Clear Scores'}
            </button>
            <div>
                {loading && <p>Processing image...</p>}
            </div>
            <div>
                <img src={croppedImage}></img>
            </div>
            <div>
            <h2>Score Predictions</h2>
      <table style={{ width: '90%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Erosion</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Narrowing</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.Type}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.Erosion}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.Narrowing}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.Total}</td>
            </tr>
          ))}
        </tbody>
      </table>
            </div>
        </div>
    );
}

export default Score;
