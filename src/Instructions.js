import './App.css';
import svhscorescale from './images/svhscorescale.png';

function instructions() {
    return(
        <div className='instructions'>
          <div className='container'>
            <div className='column1'>
            <h2 style={{paddingLeft: 250}}>Instructions</h2>
              <p style={{textAlign: "left", paddingLeft: 200}}>
                1. Upload an image of a hand x-ray by dragging or selecting.<br />
                2. wait for joints to be detected, it may take around 10 seconds. <br />
                3. Adjust and resize joints to desired locations.<br />
                4. Click button to detect SVH scores.
              </p>
            </div>
            <div className='column1' style={{paddingRight: 250}}>
            <h2>SVH Score Legend</h2>
            <img src={svhscorescale} style={{ width: "50%" }} alt='score legend'/>
            </div>
          </div>
        </div>
    );
}
export default instructions;