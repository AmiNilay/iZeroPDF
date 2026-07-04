/**
 * Resize Tool - UI Controller
 */

const ResizeToolController = (function() {
    'use strict';

    let currentImage = null;
    let resizedCanvas = null;

    /**
     * Render the tool UI
     */
    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <section class="page active">
                <div class="tool-page">
                    <div class="tool-header">
                        <h2>📐 Resize Image</h2>
                        <p>Change the dimensions of your image</p>
                    </div>

                    <div class="upload-area" id="resizeUploadArea">
                        <input type="file" id="resizeFileInput" accept="image/*">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop an image here or click to browse</div>
                    </div>

                    <div id="originalInfo" style="margin: 10px 0; display: none;">
                        <span id="originalSizeInfo"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Width (px):
                            <input type="number" id="resizeWidth" value="800" min="1" max="10000" style="width:100px;">
                        </label>
                        <label>
                            Height (px):
                            <input type="number" id="resizeHeight" value="600" min="1" max="10000" style="width:100px;">
                        </label>
                        <label>
                            <input type="checkbox" id="maintainAspect" checked> Maintain Aspect Ratio
                        </label>
                        <label>
                            Method:
                            <select id="resizeMethod">
                                <option value="bicubic">Bicubic (Best)</option>
                                <option value="bilinear">Bilinear</option>
                                <option value="nearest">Nearest (Fastest)</option>
                            </select>
                        </label>
                    </div>

                    <div class="settings-group">
                        <label>
                            Resize by Percentage:
                            <input type="range" id="resizePercent" min="10" max="200" value="100" style="width:200px;">
                            <span id="percentLabel">100%</span>
                        </label>
                    </div>

                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="applyResizeBtn" disabled>📐 Apply Resize</button>
                        <button class="btn btn-success" id="downloadResizeBtn" disabled>📥 Download Resized</button>
                    </div>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <div>
                            <h4>Original</h4>
                            <div id="originalPreview" style="border:1px solid #ddd;border-radius:8px;padding:10px;min-height:200px;display:flex;align-items:center;justify-content:center;">
                                <p style="color:#999;">No image loaded</p>
                            </div>
                            <p id="originalDimensions" style="text-align:center;margin-top:5px;"></p>
                        </div>
                        <div>
                            <h4>Resized (Preview)</h4>
                            <div id="resizedPreview" style="border:1px solid #ddd;border-radius:8px;padding:10px;min-height:200px;display:flex;align-items:center;justify-content:center;">
                                <p style="color:#999;">Resize preview will appear here</p>
                            </div>
                            <p id="resizedDimensions" style="text-align:center;margin-top:5px;"></p>
                        </div>
                    </div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('resizeFileInput');
        const uploadArea = document.getElementById('resizeUploadArea');
        const applyBtn = document.getElementById('applyResizeBtn');
        const downloadBtn = document.getElementById('downloadResizeBtn');
        const widthInput = document.getElementById('resizeWidth');
        const heightInput = document.getElementById('resizeHeight');
        const percentSlider = document.getElementById('resizePercent');
        const percentLabel = document.getElementById('percentLabel');
        const maintainAspect = document.getElementById('maintainAspect');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                } else {
                    showToast('error', 'Please upload a valid image');
                }
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && Validators.isImage(file)) {
                    loadImage(file);
                }
            });
        }

        // ✅ FIXED: Width/Height sync - Removed line break
        if (widthInput && heightInput) {
            widthInput.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    const ratio = currentImage.height / currentImage.width;
                    const newHeight = Math.round(parseInt(this.value) * ratio);
                    heightInput.value = newHeight;
                }
                updatePreview();
            });

            heightInput.addEventListener('change', function() {
                if (maintainAspect && maintainAspect.checked && currentImage) {
                    const ratio = currentImage.width / currentImage.height;
                    const newWidth = Math.round(parseInt(this.value) * ratio);
                    widthInput.value = newWidth;
                }
                updatePreview();
            });
        }

        // Percentage slider
        if (percentSlider && percentLabel) {
            percentSlider.addEventListener('input', function() {
                const percent = parseInt(this.value);
                percentLabel.textContent = percent + '%';
                
                if (currentImage) {
                    const newWidth = Math.round(currentImage.width * percent / 100);
                    const newHeight = Math.round(currentImage.height * percent / 100);
                    widthInput.value = newWidth;
                    heightInput.value = newHeight;
                    updatePreview();
                }
            });
        }

        // Apply resize
        if (applyBtn) {
            applyBtn.addEventListener('click', applyResize);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadResized);
        }
    }

    /**
     * Load image
     */
    async function loadImage(file) {
        try {
            currentImage = await FileHelpers.loadImage(file);
            
            // Show original info
            const infoDiv = document.getElementById('originalInfo');
            const infoSpan = document.getElementById('originalSizeInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = `📷 ${file.name} (${currentImage.width} × ${currentImage.height})`;
            }

            // Set initial dimensions
            document.getElementById('resizeWidth').value = currentImage.width;
            document.getElementById('resizeHeight').value = currentImage.height;

            // Show original preview
            const preview = document.getElementById('originalPreview');
            if (preview) {
                preview.innerHTML = `<img src="${currentImage.src}" style="max-width:100%;max-height:400px;">`;
            }

            // Update dimensions
            document.getElementById('originalDimensions').textContent = 
                `${currentImage.width} × ${currentImage.height}`;

            // Enable apply button
            document.getElementById('applyResizeBtn').disabled = false;

            // Update preview
            updatePreview();

            showToast('success', 'Image loaded');

        } catch (error) {
            console.error('Error loading image:', error);
            showToast('error', `Failed to load image: ${error.message}`);
        }
    }

    /**
     * Update resize preview
     */
    function updatePreview() {
        if (!currentImage) return;

        const width = parseInt(document.getElementById('resizeWidth').value) || currentImage.width;
        const height = parseInt(document.getElementById('resizeHeight').value) || currentImage.height;

        // Update dimensions display
        document.getElementById('resizedDimensions').textContent = `${width} × ${height}`;

        // Create preview
        const preview = document.getElementById('resizedPreview');
        if (preview) {
            const canvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            preview.innerHTML = `<img src="${canvas.toDataURL('image/png')}" style="max-width:100%;max-height:400px;">`;
        }
    }

    /**
     * Apply resize
     */
    function applyResize() {
        if (!currentImage) {
            showToast('warning', 'Please load an image first');
            return;
        }

        const width = parseInt(document.getElementById('resizeWidth').value);
        const height = parseInt(document.getElementById('resizeHeight').value);

        if (width < 1 || height < 1) {
            showToast('error', 'Invalid dimensions');
            return;
        }

        try {
            resizedCanvas = CanvasHelpers.resizeImage(currentImage, width, height, false);
            
            // Show in preview
            const preview = document.getElementById('resizedPreview');
            if (preview) {
                preview.innerHTML = `<img src="${resizedCanvas.toDataURL('image/png')}" style="max-width:100%;max-height:400px;">`;
            }

            document.getElementById('downloadResizeBtn').disabled = false;
            showToast('success', `Image resized to ${width} × ${height}`);

        } catch (error) {
            console.error('Resize error:', error);
            showToast('error', `Resize failed: ${error.message}`);
        }
    }

    /**
     * Download resized image
     */
    function downloadResized() {
        if (!resizedCanvas) {
            showToast('warning', 'Please apply resize first');
            return;
        }

        const dataURL = resizedCanvas.toDataURL('image/png', 0.92);
        const link = document.createElement('a');
        link.download = `resized_${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('success', 'Resized image downloaded');
    }

    // Public API
    return {
        render
    };

})();

// Make ResizeToolController globally available
window.ResizeToolController = ResizeToolController;