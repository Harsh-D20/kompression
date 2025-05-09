let originalImageData = null;

document.getElementById("imgInput").addEventListener("change", handleImageUpload);
document.getElementById("compressBtn").addEventListener("click", handleCompress);

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
}

function handleCompress() {
    if (!originalImageData) {
        alert("Please upload an image first.");
        return;
    }

    const rgbArray = imageDataTo3DArray(originalImageData);
    const [compressedRGB] = betterQuantizeImage(rgbArray, 8, 10);
    const compressedImageData = rgb3DToImageData(compressedRGB);

    const outputCanvas = document.getElementById("outputCanvas");
    outputCanvas.width = originalImageData.width;
    outputCanvas.height = originalImageData.height;
    outputCanvas.getContext("2d").putImageData(compressedImageData, 0, 0);
}

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
