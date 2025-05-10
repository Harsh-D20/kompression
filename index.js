// no image on loading website
let originalImageData = null;
// image has not been compressed yet
let isCompressed = false;

// bind listeners to components
document.getElementById("imgInput").addEventListener("change", handleImageUpload);
document.getElementById("compressBtn").addEventListener("click", handleCompress);
document.getElementById("downloadBtn").addEventListener("click", downloadOutput);

// draw image to a canvas and save the image data
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        const inputCanvas = document.getElementById("inputCanvas");
        const ctx = inputCanvas.getContext("2d");
        inputCanvas.width = img.width;
        inputCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Save original image data for compression later
        originalImageData = ctx.getImageData(0, 0, img.width, img.height);
    };
    img.src = URL.createObjectURL(file);
    isCompressed = false;
}

// calls the k-means++ algorithm and writes the output to the output canvas
function handleCompress() {
    // if no image was uploaded
    if (!originalImageData) {
        alert("Please upload an image first.");
        return;
    }

    const rgbArray = imageDataTo3DArray(originalImageData);
    // k = 8, n = 10 as default
    // TODO: add dynamic k,n
    const [compressedRGB] = kMeansPlusPlus(rgbArray, 8, 10);
    const compressedImageData = rgb3DToImageData(compressedRGB);

    const outputCanvas = document.getElementById("outputCanvas");
    outputCanvas.width = originalImageData.width;
    outputCanvas.height = originalImageData.height;
    outputCanvas.getContext("2d").putImageData(compressedImageData, 0, 0);

    isCompressed = true;
}

// iterates over the image and saves RGB values
function imageDataTo3DArray(imageData) {
    const { width, height, data } = imageData;
    const pixels = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => [0, 0, 0])
    );
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        pixels[y][x] = [data[i], data[i + 1], data[i + 2]];
    }
    return pixels;
}

// iterates over the RGB values and constructs an image 
function rgb3DToImageData(rgbArray) {
    const height = rgbArray.length;
    const width = rgbArray[0].length;
    const imageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const [r, g, b] = rgbArray[y][x];
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 255;
        }
    }
    return imageData;
}

// downloads the image drawn to the output canvas
function downloadOutput() {
    if (!isCompressed) {
        alert("No image uploaded or image uploaded has not been compressed yet.");
        return;
    }

    const canvas = document.getElementById("outputCanvas");
    const link = document.createElement("a");
    link.download = "compressed-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}