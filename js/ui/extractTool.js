/**
 * Extract Images from PDF - UI Controller
 */

const ExtractToolController = (function() {
    'use strict';

    let currentFile = null;
    let extractedImages = [];

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
                        <h2>🔍 Extract Images from PDF</h2>
                        <p>Extract all embedded images from a PDF document</p>
                    </div>

                    <div class="upload-area" id="extractUploadArea">
                        <input type="file" id="extractFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF here or click to browse</div>
                        <div class="upload-hint">Extract images embedded in the PDF</div>
                    </div>

                    <div id="extractInfo" style="margin: 10px 0; display: none;">
                        <span id="extractFileInfo"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Minimum Image Size:
                            <select id="minImageSize">
                                <option value="100">100 bytes</option>
                                <option value="1000">1 KB</option>
                                <option value="10000" selected>10 KB</option>
                                <option value="50000">50 KB</option>
                                <option value="100000">100 KB</option>
                            </select>
                        </label>
                        <label>
                            Output Format:
                            <select id="extractFormat">
                                <option value="image/png">PNG</option>
                                <option value="image/jpeg">JPEG</option>
                                <option value="image/webp">WebP</option>
                            </select>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="extractBtn" disabled>
                        🔍 Extract Images
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="extractResult" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadExtractBtn">📥 Download All</button>
                        <button class="btn btn-secondary" id="downloadExtractZipBtn">📦 Download as ZIP</button>
                        <span id="extractInfoText" style="margin-left: 10px;"></span>
                    </div>

                    <div id="extractPreview" class="preview-area" style="margin-top: 10px; display: none;"></div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('extractFileInput');
        const uploadArea = document.getElementById('extractUploadArea');
        const extractBtn = document.getElementById('extractBtn');
        const downloadBtn = document.getElementById('downloadExtractBtn');
        const downloadZipBtn = document.getElementById('downloadExtractZipBtn');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                } else {
                    showToast('error', 'Please upload a valid PDF');
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
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                }
            });
        }

        // Extract
        if (extractBtn) {
            extractBtn.addEventListener('click', extractImages);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadAll);
        }

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadZip);
        }
    }

    /**
     * Handle file upload
     */
    async function handleFile(file) {
        currentFile = file;
        
        try {
            const info = await PDFProcessor.getPDFInfo(file);
            
            const infoDiv = document.getElementById('extractInfo');
            const infoSpan = document.getElementById('extractFileInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = `📄 ${file.name} (${info.totalPages} pages, ${FileHelpers.formatFileSize(file.size)})`;
            }

            document.getElementById('extractBtn').disabled = false;
            document.getElementById('extractResult').style.display = 'none';
            document.getElementById('extractPreview').style.display = 'none';
            
            showToast('success', `Loaded PDF with ${info.totalPages} pages`);

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', `Failed to read PDF: ${error.message}`);
        }
    }

    /**
     * Extract images
     */
    async function extractImages() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const extractBtn = document.getElementById('extractBtn');
        extractBtn.disabled = true;
        extractBtn.textContent = '⏳ Extracting...';

        try {
            const minSize = parseInt(document.getElementById('minImageSize').value);
            const format = document.getElementById('extractFormat').value;

            const images = await PDFProcessor.extractImagesFromPDF(currentFile, {
                minSize,
                format
            });

            if (images.length === 0) {
                showToast('warning', 'No images found in the PDF');
                return;
            }

            extractedImages = images;

            // Show result
            const resultDiv = document.getElementById('extractResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            const infoSpan = document.getElementById('extractInfoText');
            if (infoSpan) {
                infoSpan.textContent = `${images.length} images extracted`;
            }

            // Show preview
            const preview = document.getElementById('extractPreview');
            if (preview) {
                preview.style.display = 'block';
                let html = '<div class="preview-grid">';
                for (let i = 0; i < Math.min(images.length, 12); i++) {
                    const img = images[i];
                    if (img.blob) {
                        const url = URL.createObjectURL(img.blob);
                        html += `
                            <div class="preview-item">
                                <img src="${url}" alt="Image ${i + 1}" style="width:100%;height:120px;object-fit:cover;">
                                <span class="page-number">Page ${img.page}</span>
                            </div>
                        `;
                        setTimeout(() => URL.revokeObjectURL(url), 10000);
                    }
                }
                if (images.length > 12) {
                    html += `<div class="preview-item" style="display:flex;align-items:center;justify-content:center;background:#f5f5f5;">
                        +${images.length - 12} more
                    </div>`;
                }
                html += '</div>';
                preview.innerHTML = html;
            }

            showToast('success', `Extracted ${images.length} images`);

        } catch (error) {
            console.error('Extraction error:', error);
            showToast('error', `Extraction failed: ${error.message}`);
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔍 Extract Images';
        }
    }

    /**
     * Download all images
     */
    function downloadAll() {
        if (extractedImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        for (let i = 0; i < extractedImages.length; i++) {
            const img = extractedImages[i];
            if (img.blob) {
                const filename = `image_${i + 1}_page_${img.page}.${img.format.split('/')[1] || 'png'}`;
                DownloadHelpers.downloadBlob(img.blob, filename);
            }
        }

        showToast('success', `Downloaded ${extractedImages.length} images`);
    }

    /**
     * Download as ZIP
     */
    async function downloadZip() {
        if (extractedImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        try {
            showToast('info', 'Creating ZIP...');
            
            const files = [];
            for (let i = 0; i < extractedImages.length; i++) {
                const img = extractedImages[i];
                if (img.blob) {
                    const ext = img.format.split('/')[1] || 'png';
                    files.push({
                        filename: `image_${i + 1}_page_${img.page}.${ext}`,
                        data: img.blob
                    });
                }
            }
            
            const zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'extracted_images.zip');
            
            showToast('success', 'ZIP file downloaded');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', `Failed to create ZIP: ${error.message}`);
        }
    }

    // Public API
    return {
        render
    };

})();

// Make ExtractToolController globally available
window.ExtractToolController = ExtractToolController;