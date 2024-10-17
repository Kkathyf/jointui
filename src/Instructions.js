import './App.css';

function instructions() {
    return(
    <div className='instructions'>
        <h2>Instructions</h2>
          <p style={{textAlign: "left", paddingLeft: "50px", paddingRight: "50px"}}>
            1. Upload an image of a hand x-ray by selecting. <br />
            2. Wait for joints to be detected, it may take around 10 seconds. <br />
            3. Click button to detect SVH scores.<br />
            4. Check the SVH scores results.<br />
          </p>
          <p>Supported file types: JPG, PNG, JPEG, or TIF.</p>
    </div>
  );
}
export default instructions;