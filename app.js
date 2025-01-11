// Global variables
let image = null;
let canvas = null;
let ctx = null;
let model = null;

// Load the model using a proxy for CORS workaround
async function loadModel() {
    try {
        // Assuming you're running a local proxy server on port 3000
        const proxyUrl = 'http://localhost:3000/proxy/captain-pool/esrgan-tf2/1';
        model = await tf.loadGraphModel(proxyUrl, {fromTFHub: true});
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
    console.log("going to enhance")
    if (!model || !image) return;
    console.log("enhancing")
    // Convert canvas to tensor
    const tensor = tf.browser.fromPixels(canvas).toFloat().expandDims();
    
    // Normalize if your model expects normalized input
    const normalized = tensor.div(tf.scalar(255));
    
    // Predict with model
    const prediction = await model.execute(normalized);
    
    // Convert prediction back to image
    // Note: Adjust this part based on the model's output format. Here, we assume a single output tensor.
    const enhancedImage = prediction.squeeze().clipByValue(0, 1).mul(255).cast('int32');
    
    // Draw on canvas
    tf.browser.toPixels(enhancedImage, canvas);
    
    // Clean up
    tensor.dispose();
    normalized.dispose();
    prediction.dispose();
    enhancedImage.dispose();
    console.log("enhanced")
}

// Event listeners
document.getElementById('fileInput').addEventListener('change', function(e) {
    loadImageToCanvas(e.target.files[0]);
});

document.getElementById('enhanceBtn').addEventListener('click', enhanceImage);

// Load model when the page loads
window.onload = loadModel;