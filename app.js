// Global variables
let isMobile = false;
let cameraActive = false;
let upscaleLevel = 1.0;
let processingCanvas = null;
let processingCtx = null;
let cameraVideo = null;
let animationFrame = null;

// Device detection
function detectDevice() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    
    // Apply appropriate styling
    document.body.className = isMobile ? 'mobile-mode' : 'desktop-mode';
    
    // Check if browser supports true transparency
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transparent') === 'true' || window.chrome) {
        document.body.classList.add('true-transparent');
        console.log('True transparency mode enabled');
    }
    
    console.log('Device detected:', isMobile ? 'Mobile' : 'Desktop');
    return isMobile;
}

// Initialize canvas for processing
function initializeCanvas() {
    processingCanvas = document.getElementById('processingCanvas');
    processingCtx = processingCanvas.getContext('2d');
    
    // Set canvas size to window size
    processingCanvas.width = window.innerWidth;
    processingCanvas.height = window.innerHeight;
}

// Camera functionality
async function initializeCamera() {
    cameraVideo = document.getElementById('cameraBackground');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: window.innerWidth },
                height: { ideal: window.innerHeight }
            }
        });
        
        cameraVideo.srcObject = stream;
        console.log('Camera initialized');
        return true;
    } catch (error) {
        console.error('Camera access denied or not available:', error);
        return false;
    }
}

// Toggle camera for mobile
async function toggleCamera() {
    const cameraButton = document.getElementById('cameraButton');
    
    if (!cameraActive) {
        const success = await initializeCamera();
        if (success) {
            cameraVideo.style.display = 'block';
            cameraActive = true;
            cameraButton.textContent = '📷 Stop';
            cameraButton.classList.add('active');
            startProcessing();
        }
    } else {
        stopCamera();
    }
}

// Stop camera
function stopCamera() {
    if (cameraVideo && cameraVideo.srcObject) {
        const tracks = cameraVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        cameraVideo.srcObject = null;
    }
    
    cameraVideo.style.display = 'none';
    cameraActive = false;
    
    const cameraButton = document.getElementById('cameraButton');
    cameraButton.textContent = '📷 Camera';
    cameraButton.classList.remove('active');
    
    stopProcessing();
}

// Voxel upscaling effect (simplified version)
function applyVoxelUpscale(sourceCanvas, targetCanvas, scale) {
    const sourceCtx = sourceCanvas.getContext('2d');
    const targetCtx = targetCanvas.getContext('2d');
    
    // Get source image data
    const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const sourcePixels = sourceData.data;
    
    // Calculate new dimensions
    const newWidth = Math.floor(sourceCanvas.width / scale);
    const newHeight = Math.floor(sourceCanvas.height / scale);
    
    // Create temporary canvas for downscaling
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    // Downsample with pixelation effect
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
    
    // Scale back up for voxel effect
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(tempCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
}

// Process desktop content (capture and upscale what's behind the window)
function processDesktopContent() {
    if (!processingCanvas || !processingCtx) return;
    
    // For desktop mode, we'll create a subtle voxel overlay effect
    // This simulates processing the content behind the transparent window
    
    const canvas = processingCanvas;
    const ctx = processingCtx;
    
    // Create a gradient pattern that simulates voxel processing
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 * (upscaleLevel - 1)})`);
    gradient.addColorStop(0.5, `rgba(128, 255, 255, ${0.05 * (upscaleLevel - 1)})`);
    gradient.addColorStop(1, `rgba(255, 128, 255, ${0.1 * (upscaleLevel - 1)})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add voxel-like grid overlay when upscale > 1
    if (upscaleLevel > 1.1) {
        const gridSize = Math.max(2, Math.floor(upscaleLevel * 4));
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (upscaleLevel - 1)})`;
        ctx.lineWidth = 1;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}

// Process camera feed with voxel upscaling
function processCameraFeed() {
    if (!cameraActive || !cameraVideo || !processingCanvas) return;
    
    // Create a temporary canvas to capture video frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cameraVideo.videoWidth || window.innerWidth;
    tempCanvas.height = cameraVideo.videoHeight || window.innerHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw current video frame
    tempCtx.drawImage(cameraVideo, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Apply voxel upscaling effect
    if (upscaleLevel > 1.1) {
        applyVoxelUpscale(tempCanvas, processingCanvas, upscaleLevel);
    } else {
        // Just draw normally if upscale is close to 1
        processingCtx.drawImage(tempCanvas, 0, 0, processingCanvas.width, processingCanvas.height);
    }
}

// Main processing loop
function processFrame() {
    if (isMobile && cameraActive) {
        processCameraFeed();
    } else if (!isMobile) {
        processDesktopContent();
    }
    
    if (cameraActive || (!isMobile && upscaleLevel > 1.1)) {
        animationFrame = requestAnimationFrame(processFrame);
    }
}

// Start processing
function startProcessing() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    processFrame();
}

// Stop processing
function stopProcessing() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    // Clear the processing canvas
    if (processingCtx) {
        processingCtx.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
    }
}

// Handle upscale slider changes
function handleUpscaleChange(value) {
    upscaleLevel = parseFloat(value);
    console.log('Upscale level:', upscaleLevel);
    
    // Start processing if we're above 1x upscale
    if (upscaleLevel > 1.1 && !cameraActive && !isMobile) {
        startProcessing();
    } else if (upscaleLevel <= 1.1 && !cameraActive) {
        stopProcessing();
    }
}

// Window resize handler
function handleResize() {
    if (processingCanvas) {
        processingCanvas.width = window.innerWidth;
        processingCanvas.height = window.innerHeight;
    }
}

// Initialize the application
function initialize() {
    detectDevice();
    initializeCanvas();
    
    // Set up event listeners
    const upscaleSlider = document.getElementById('upscaleSlider');
    const cameraButton = document.getElementById('cameraButton');
    
    upscaleSlider.addEventListener('input', (e) => handleUpscaleChange(e.target.value));
    
    if (isMobile) {
        cameraButton.addEventListener('click', toggleCamera);
    }
    
    window.addEventListener('resize', handleResize);
    
    console.log('AI Voxel Upscaler initialized');
}

// Start the application when the page loads
window.addEventListener('DOMContentLoaded', initialize);