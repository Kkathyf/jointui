import './App.css';
import React, { useState } from 'react';
import CropWorker from './cropWorker.worker.js';


function Score({ image, jointData }) {//original image and array of joints
    const [croppedImage, setCroppedImage] = useState(null);  
    const [loading, setLoading] = useState(false);  
    const [predictLoading, setPredictLoading] = useState(null);
    const [table, setTable] = useState(null);

    const cropImage = (image, jointData) => {
        return new Promise((resolve, reject) => {
            setLoading(true);
            const cropWorker = new CropWorker('cropWorker.worker.js');
            // console.log("create new worker");

            // send data to worker
            cropWorker.postMessage({image, jointData});

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

    async function sendToWristApi(croppedImage){
        const url = 'https://sqbislam-rajointscoreprediction.hf.space/predict/wrist';
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
            try {
                // pip
                const pipData = jointData.PIP;
                const cropPipPromises = pipData.map(pip => cropImage(image, pip));
                const croppedPips = await Promise.all(cropPipPromises);

                // mcp
                const mcpData = jointData.MCP;
                const cropMcpPromises = mcpData.map(mcp => cropImage(image, mcp));
                const croppedMcps = await Promise.all(cropMcpPromises);

                // ulna
                const ulnaData = jointData.Ulna;
                const cropUlnaPromises = ulnaData.map(ulna => cropImage(image, ulna));
                const croppedUlnas = await Promise.all(cropUlnaPromises);

                // radius
                const radiusData = jointData.Radius;
                const cropRadiusPromises = radiusData.map(raduis => cropImage(image, raduis));
                const croppedRadiuss = await Promise.all(cropRadiusPromises);
                
                // Wrist
                const wristData = jointData.Wrist;
                const cropWristPromises = wristData.map(wrist => cropImage(image, wrist));
                const croppedWrists = await Promise.all(cropWristPromises);

                
                ///////////////////// sending to API ///////////////////

                // set cropped image to null
                setCroppedImage(null);

                // tableData
                let tableData = [];

                // add rows to tableData
                const addRows = (newRows, type) => {
                    if (type === 'Wrist') {
                        newRows.map((row, index) =>
                            tableData.push({
                                id: jointCounter + "-" + index, 
                                Type: type, 
                                Erosion: row.erosion_score, 
                                Narrowing: row.jsn_score, 
                                Total: row.erosion_score + row.jsn_score
                            })
                        );
                    } else {
                        newRows.map((row, index) =>
                            tableData.push({
                                id: jointCounter + "-" + index, 
                                Type: type, 
                                Erosion: row.lunate + row.mc1 + row.mul + row.nav, 
                                Narrowing: row.cap + row.cmc3 + row.cmc4 + row.cmc5 + row.mna + row.rad, 
                                Total: row.lunate + row.mc1 + row.mul + row.nav +
                                    row.cap + row.cmc3 + row.cmc4 + row.cmc5 + row.mna + row.rad
                            })
                        );
                    }
                    jointCounter++;
                };
                
                // Create an array of promises for all API calls
                const apiPromises = [];

                // PIP
                const apiPipPromises = croppedPips.map(croppedPip => sendToFingerApi(croppedPip));
                const apiPipResponses = await Promise.all(apiPipPromises);
                apiPromises.push({type: 'PIP', apiData: apiPipResponses});

                // MCP
                const apiMcpPromises = croppedMcps.map(croppedMcp => sendToFingerApi(croppedMcp));
                const apiMcpResponses = await Promise.all(apiMcpPromises);
                apiPromises.push({type: 'MCP', apiData: apiMcpResponses});

                // Ulna
                const apiUlnaPromises = croppedUlnas.map(croppedUlna => sendToFingerApi(croppedUlna));
                const apiUlnaResponses = await Promise.all(apiUlnaPromises);
                apiPromises.push({type: 'Ulna', apiData: apiUlnaResponses});

                // Radius
                const apiRadiusPromises = croppedRadiuss.map(croppedRadius => sendToFingerApi(croppedRadius));
                const apiRadiusResponses = await Promise.all(apiRadiusPromises);
                apiPromises.push({type: 'Radius', apiData: apiRadiusResponses});

                // Wrist
                const apiWristPromises = croppedWrists.map(croppedWrist => sendToWristApi(croppedWrist));
                const apiWristResponses = await Promise.all(apiWristPromises);
                apiPromises.push({type: 'Wrist', apiData: apiWristResponses});

                // Wait for all promises to complete
                await Promise.all(apiPromises);

                ///////////////////// add rows to table //////////////////

                console.log(apiPromises);

                apiPromises.map(data => (addRows(data.apiData, data.type)));

                setPredictLoading(false);
                setTable(tableData);
                
            } catch (error) {
                console.log(error);
                setPredictLoading(false);
            }
        } else {
            alert('Please upload an image first.');
        }
    }

    /* const tableData = [
        {id: 0, Type: 'MCP', Erosion: 0, Narrowing: 5, Total: 5},
        {id: 1, Type: 'MCP', Erosion: 3, Narrowing: 0, Total: 3},
        {id: 2, Type: 'PIP', Erosion: 4, Narrowing: 4, Total: 8},
        {id: 3, Type: 'PIP', Erosion: 1, Narrowing: 5, Total: 6},
        {id: 4, Type: 'PIP', Erosion: 2, Narrowing: 2, Total: 4},
        {id: 5, Type: 'Radius', Erosion: 0, Narrowing: 1, Total: 1},
        {id: 6, Type: 'Ulna', Erosion: 1, Narrowing: 1, Total: 2},
        {id: 7, Type: 'Wrist', Erosion: 2, Narrowing: 2, Total: 4},
    ];*/

    return (
        <div>
            <button onClick={scoreJoints}>
                {'Score joints'}
            </button>
            <button onClick={clearScore}>
                {'Clear Scores'}
            </button>
            <div>
                {loading && <p>Processing image...</p>}
                {predictLoading && (
                    <>
                        <p>Processing Predictions... </p>
                        <p>It might take a few minutes</p>
                        <div className="spinner" />
                    </>
                )}
            </div>
            <div>
                <img src={croppedImage}/>
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
                        {table && table.map((row) => (
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