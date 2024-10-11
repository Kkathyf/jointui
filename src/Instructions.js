import './App.css';

function instructions() {
    return(
    <div className='instructions'>
        <h2>Instructions</h2>
          <p style={{textAlign: "left"}}>
            1. Upload an image of a hand x-ray by selecting. <br />
            2. Wait for joints to be detected, it may take around 30 seconds. <br />
            3. Click button to detect SVH scores.<br />
          </p>
          <p>Supported file types: JPG, PNG, JPEG, WEBP, or TIF.</p>
    </div>
  );
}
export default instructions;