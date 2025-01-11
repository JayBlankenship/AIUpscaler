// Global variables
let image = null;
let canvas = null;
let ctx = null;
let model = null;

// Load the model from the local directory
async function loadModel() {
    try {
        model = await tf.loadLayersModel('model.json');
        console.log('Model loaded');
    } catch (error) {
        console.error('Failed to load the model:', error);
    }
}

// Function to load image onto canvas
function loadImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        image = new Image();
        image.onload = function() {
            if (!canvas) {
                canvas = document.createElement('canvas');
                ctx = canvas.getContext('2d');
                document.getElementById('imageContainer').appendChild(canvas);
            }
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
        }
        image.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// Function to enhance the image
async function enhanceImage() {
    if (!model || !image) return;
    
    // Convert canvas to tensor
    const tensor = tf.browser.fromPixels(canvas).toFloat().expandDims();
    
    // Normalize if your model expects normalized input
    const normalized = tensor.div(tf.scalar(255));
    
    // Predict with model
    const prediction = await model.predict(normalized);
    
    // Convert prediction back to image
    const enhancedImage = prediction.squeeze().clipByValue(0, 1).mul(255).cast('int32');
    
    // Draw on canvas
    tf.browser.toPixels(enhancedImage, canvas);
    
    // Clean up
    tensor.dispose();
    normalized.dispose();
    prediction.dispose();
    enhancedImage.dispose();
}

// Event listeners
document.getElementById('fileInput').addEventListener('change', function(e) {
    loadImageToCanvas(e.target.files[0]);
});

document.getElementById('enhanceBtn').addEventListener('click', enhanceImage);

// Load model when the page loads
window.onload = loadModel;