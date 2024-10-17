/* eslint-disable no-restricted-globals */
import Tiff from 'tiff.js'

self.onmessage = function (event) {
    // console.log("Received message from worker " + event.data);
    const { image, jointData, type, id } = event.data;
    cropImage(image, jointData, type, id)
        .then((croppedImage) => {
            self.postMessage({croppedImage});
        })
        .catch((error) => {
            console.error("Error cropping image in worker: ",error);
            self.postMessage({error});
        });
};

async function cropImage(imageDataURL, jointData, type, id) {

    const response = await fetch(imageDataURL);

    const contentType = response.headers.get('Content-Type');

    let img;

    if (contentType === 'image/tiff' || contentType === 'image/tif') {
        const arrayBuffer = await response.arrayBuffer();
        const tiff = new Tiff({ buffer: arrayBuffer });
        const width = tiff.width();
        const height = tiff.height();
        const rgba = tiff.readRGBAImage(0, 0, width, height); // Get pixel data as RGBA
        img = new ImageData(new Uint8ClampedArray(rgba), width, height); // Create an ImageData object
    } else {
        const blob = await response.blob();
        img = await createImageBitmap(blob);
    }

    const cropX = img.width * (jointData.x - jointData.width / 2);
    const cropY = img.height * (jointData.y - jointData.height / 2);
    const cropWidth = img.width * jointData.width;
    const cropHeight = img.height * jointData.height;

    // Set canvas dimensions
    let canvasWidth = cropWidth;
    let canvasHeight = cropHeight;

    const showJointSize = 360;

    if (canvasWidth >= canvasHeight) {
        canvasWidth = showJointSize;
        canvasHeight = showJointSize * cropHeight / cropWidth;
    } else {
        canvasHeight = showJointSize;
        canvasWidth = showJointSize * cropWidth / cropHeight;
    }

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    if (img instanceof ImageData) {
        // Draw the cropped ImageData directly onto the canvas
        const tiffcanvas = new OffscreenCanvas(img.width, img.height);
        const tiffctx = tiffcanvas.getContext('2d');
        tiffctx.putImageData(img, 0, 0);
        
        ctx.drawImage(
            tiffcanvas, 
            cropX, cropY,
            cropWidth, cropHeight,
            0, 0, 
            canvasWidth, canvasHeight
        );
    } else {
        ctx.drawImage(
            img, 
            cropX, cropY,
            cropWidth, cropHeight,
            0, 0, 
            canvasWidth, canvasHeight
        );
    }

    const blobdata = await canvas.convertToBlob();
    // console.log(blobdata);
    const imageFile = new File([blobdata], 'cropped-image' + jointData.x + '.png', { type: blobdata.type });
    const fileToBase64 = (file) => {//converts uploaded image to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const cropped = await fileToBase64(imageFile);

    return {cropped, imageFile};
}