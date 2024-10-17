import './App.css';
import React, { useState } from 'react';
import CropWorker from './cropWorker.worker.js';
import svhscorescale from './images/svhscorescale.png';


function Score({ image, jointData }) {//original image and array of joints
    const [croppedImage, setCroppedImage] = useState(null);  
    const [loading, setLoading] = useState(false);  
    const [predictLoading, setPredictLoading] = useState(null);
    const [table, setTable] = useState(null);

    const predictUrl = 'http://127.0.0.1:8082/';
    // const predictUrl = 'https://sqbislam-rajointscoreprediction.hf.space/';

    const cropImage = (image, jointData, type, id) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            // const cropWorker = new CropWorker('cropWorker.worker.js');
            const cropWorker = new CropWorker();
            // console.log("create new worker");

            // send data to worker
            cropWorker.postMessage({image, jointData, type, id});

            cropWorker.onmessage = (event) => {
                setCroppedImage(event.data.croppedImage.cropped);
                setLoading(false);
                cropWorker.terminate();
                resolve(event.data.croppedImage.imageFile);
            };
            cropWorker.onerror = (error) => {
                console.error('Error in cropWorker: ', error);
                setLoading(false);
                cropWorker.terminate();
                reject(error);
            };
        });
    };

    async function sendToFingerApi(croppedImage){
        const url = predictUrl + 'predict/fingers';
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

    async function sendToWristApi(croppedImage){
        const url = predictUrl + 'predict/wrist';;
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

    async function clearScore() {
        setTable(null);
    }

    async function scoreJoints() {
        if (image && jointData) {
            setPredictLoading(true);
            let jointCounter = 0;
            let tableData = [];
            try {
                // add rows to tableData
                const addRows = (newRows) => {
                    if (newRows.type === 'Wrist') {
                        newRows.apiData.map((row, index) =>
                            tableData.push({
                                id: jointCounter + "-" + index, 
                                Type: newRows.type, 
                                Erosion: row.lunate + row.mc1 + row.mul + row.nav, 
                                Narrowing: row.cap + row.cmc3 + row.cmc4 + row.cmc5 + row.mna + row.rad, 
                                Total: row.lunate + row.mc1 + row.mul + row.nav +
                                    row.cap + row.cmc3 + row.cmc4 + row.cmc5 + row.mna + row.rad
                            })
                        );
                    } else {
                        newRows.apiData.map((row, index) =>
                            tableData.push({
                                id: jointCounter + "-" + index, 
                                Type: newRows.type, 
                                Erosion: row.erosion_score, 
                                Narrowing: row.jsn_score, 
                                Total: row.erosion_score + row.jsn_score
                            })
                        );
                    }
                    jointCounter++;
                };
                 
                // Create an array of promises for all API calls
                const apiPromises = [];

                // pip
                const pipData = jointData.PIP;
                if (pipData) {
                    const cropPipPromises = pipData.map((pip, idx) => cropImage(image, pip, "PIP", idx));
                    const croppedPips = await Promise.all(cropPipPromises);
                    const apiPipPromises = croppedPips.map(croppedPip => sendToFingerApi(croppedPip));
                    const apiPipResponses = await Promise.all(apiPipPromises);
                    apiPromises.push({type: 'PIP', apiData: apiPipResponses});
                }

                // mcp
                const mcpData = jointData.MCP;
                if (mcpData) {
                    const cropMcpPromises = mcpData.map((mcp, idx) => cropImage(image, mcp, "MCP", idx));
                    const croppedMcps = await Promise.all(cropMcpPromises);
                    const apiMcpPromises = croppedMcps.map(croppedMcp => sendToFingerApi(croppedMcp));
                    const apiMcpResponses = await Promise.all(apiMcpPromises);
                    apiPromises.push({type: 'MCP', apiData: apiMcpResponses});
                }

                // ulna
                const ulnaData = jointData.Ulna;
                if (ulnaData) {
                    const cropUlnaPromises = ulnaData.map((ulna, idx) => cropImage(image, ulna, "Ulna", idx));
                    const croppedUlnas = await Promise.all(cropUlnaPromises);
                    const apiUlnaPromises = croppedUlnas.map(croppedUlna => sendToFingerApi(croppedUlna));
                    const apiUlnaResponses = await Promise.all(apiUlnaPromises);
                    apiPromises.push({type: 'Ulna', apiData: apiUlnaResponses});
                }

                // radius
                const radiusData = jointData.Radius;
                if (radiusData) {
                    const cropRadiusPromises = radiusData.map((radius, idx) => cropImage(image, radius, "Radius", idx));
                    const croppedRadiuss = await Promise.all(cropRadiusPromises);
                    const apiRadiusPromises = croppedRadiuss.map(croppedRadius => sendToFingerApi(croppedRadius));
                    const apiRadiusResponses = await Promise.all(apiRadiusPromises);
                    apiPromises.push({type: 'Radius', apiData: apiRadiusResponses});
                }
                
                // Wrist
                const wristData = jointData.Wrist;
                if (wristData) {
                    const cropWristPromises = wristData.map((wrist, idx) => cropImage(image, wrist, "Wrist", idx));
                    const croppedWrists = await Promise.all(cropWristPromises);
                    const apiWristPromises = croppedWrists.map(croppedWrist => sendToWristApi(croppedWrist));
                    const apiWristResponses = await Promise.all(apiWristPromises);
                    apiPromises.push({type: 'Wrist', apiData: apiWristResponses});
                }

                // Wait for all promises to complete
                await Promise.all(apiPromises);

                ///////////////////// add rows to table //////////////////

                apiPromises.map(data => addRows(data));
                
            } catch (error) {
                console.log(error);
                setPredictLoading(false);
            } finally{
                setCroppedImage(null);
                setPredictLoading(false);
                setTable(tableData);
            }
        } else {
            alert('Please upload an image first.');
        }
    }

    /* {table && <div className='svhscoreimg'>
                <h2>SVH Score Legend</h2>
                <img src={svhscorescale} style={{ width: "50%" }} alt='score legend'/>
    </div>} */

    return (
        <div className='columnright'>
            {table && <div>
                <h2>Score Prediction</h2>
            </div>}
            <div className='buttons'>
                <button className='button submit-btn' onClick={scoreJoints} disabled={predictLoading}>
                    {predictLoading? 'Processing...' : 'Score Joints'}
                </button>
                <button className="button clear-btn" onClick={clearScore}>
                    {'Clear Scores'}
                </button>
            </div>
            <div className='loadingImg'>
                {loading && <p>Processing image...</p>}
                {predictLoading && (
                    <>
                        <p>Processing Predictions... </p>
                        <p>This might take a few minutes</p>
                        <div className="spinner" />
                    </>
                )}
                {croppedImage && <img src={croppedImage} alt="cropped joint"/>}
            </div>
            {table && <div className='tableData'>
                <h2>SVH Score Results</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                        {table.map((row) => (
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
            </div>}
        </div>
    );
}

export default Score;