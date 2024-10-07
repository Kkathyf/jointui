/* eslint-disable no-restricted-globals */

self.onmessage = function (event) {
    // console.log("Received message from worker " + event.data);
    const { image, jointData } = event.data;
    cropImage(image, jointData)
        .then((croppedImage) => {
            self.postMessage({croppedImage});
        })
        .catch((error) => {
            console.error("Error cropping image in worker: ",error);
            self.postMessage({error});
        });
};

async function cropImage(imageDataURL, jointData) {
    // const img = await loadImage(imageDataURL);

    // const jointData = jointDatas.Wrist[0];
    // console.log(jointDatas);
    // const jointData = jointDatas[0];

    const response = await fetch(imageDataURL);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    const cropX = img.width * (jointData.x - jointData.width / 2);
    const cropY = img.height * (jointData.y - jointData.height / 2);
    const cropWidth = img.width * jointData.width;
    const cropHeight = img.height * jointData.height;

    let canvasWidth = 360;
    let canvasHeight = 360;
    if (img.width > 500) {
        canvasWidth = 5 * cropWidth;
        canvasHeight = 5 * cropHeight;
    } else {
        canvasWidth = 10 * cropWidth;
        canvasHeight = 10 * cropHeight;
    }

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    // ctx.drawImage(img, 0, 0);

    ctx.drawImage(
        img, 
        cropX, cropY,
        cropWidth, cropHeight,
        0, 0, 
        canvasWidth, canvasHeight
    );

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

    // return canvasToFile(canvas);
}

/* function loadImage(src){//base64 to data URL

    return new Promise((resolve,reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
    // const response = await fetch(src);
    // const blob = await response.blob();
    // const imageBitmap = await createImageBitmap(blob);

    // return imageBitmap;
}*/


/* function canvasToFile(canvas) {
    const blob = canvas.convertToBlob();
    return new File([blob], 'cropped-image.png', { type: blob.type });
}

function canvasToDataUrl(canvas) {//canvas to data url 
    return canvas.convertToBlob().then((blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    });
}

//canvas to base64, depending on what the model requires
function canvasToBase64(canvas) {
    const imageFile = canvasToFile(canvas);
    const fileToBase64 = (file) => {//converts uploaded image to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };
    return fileToBase64(imageFile);
}*/
