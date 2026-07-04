/**
 * PDF to Images - UI Controller
 */

const PdfToImageController = (function() {
    'use strict';

    let currentFile = null;
    let resultImages = [];

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
                        <h2>📄 PDF → Images</h2>
                        <p>Extract all pages from a PDF as individual images</p>
                    </div>

                    <div class="upload-area" id="pdfUploadArea">
                        <input type="file" id="pdfFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop your PDF here or click to browse</div>
                        <div class="upload-hint">Supports up to 100MB</div>
                    </div>

                    <div class="settings-group">
                        <label>
                            DPI:
                            <select id="dpiSelect">
                                <option value="72">72 (Web)</option>
                                <option value="150" selected>150 (Print)</option>
                                <option value="300">300 (High)</option>
                                <option value="600">600 (Ultra)</option>
                            </select>
                        </label>
                        <label>
                            Format:
                            <select id="imageFormatSelect">
                                <option value="image/png" selected>PNG</option>
                                <option value="image/jpeg">JPEG</option>
                                <option value="image/webp">WebP</option>
                            </select>
                        </label>
                        <label>
                            Quality:
                            <input type="range" id="qualityRange" min="1" max="100" value="92">
                            <span id="qualityLabel">92%</span>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="convertPdfBtn" disabled>
                        🔄 Convert to Images
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="pdfInfo" style="margin: 10px 0; display: none;">
                        <span id="fileInfo"></span>
                    </div>

                    <div class="preview-area" id="pdfPreview">
                        <p style="text-align: center; color: #999; padding: 20px;">
                            Upload a PDF to see preview
                        </p>
                    </div>

                    <div id="downloadSection" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadAllBtn">📥 Download All</button>
                        <button class="btn btn-secondary" id="downloadZipBtn">📦 Download as ZIP</button>
                    </div>
                </div>
            </section>
        `;

        // Attach event listeners
        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('pdfFileInput');
        const uploadArea = document.getElementById('pdfUploadArea');
        const convertBtn = document.getElementById('convertPdfBtn');
        const dpiSelect = document.getElementById('dpiSelect');
        const formatSelect = document.getElementById('imageFormatSelect');
        const qualityRange = document.getElementById('qualityRange');
        const qualityLabel = document.getElementById('qualityLabel');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        const downloadZipBtn = document.getElementById('downloadZipBtn');

        // Quality range label update
        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file) {
                    handleFile(file);
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
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFile(files[0]);
                }
            });
        }

        // Convert button
        if (convertBtn) {
            convertBtn.addEventListener('click', function() {
                const dpi = parseInt(document.getElementById('dpiSelect').value);
                const format = document.getElementById('imageFormatSelect').value;
                const quality = parseInt(document.getElementById('qualityRange').value) / 100;
                convertPdf(dpi, format, quality);
            });
        }

        // Download buttons
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', downloadAll);
        }

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadZip);
        }
    }

    /**
     * Handle file upload
     */
    function handleFile(file) {
        if (!Validators.isPDF(file)) {
            showToast('error', 'Please upload a valid PDF file');
            return;
        }

        if (!Validators.checkFileSize(file, 100)) {
            showToast('error', 'File is too large. Maximum size is 100MB');
            return;
        }

        currentFile = file;
        const convertBtn = document.getElementById('convertPdfBtn');
        if (convertBtn) convertBtn.disabled = false;

        // Show file info
        const infoDiv = document.getElementById('pdfInfo');
        const fileInfo = document.getElementById('fileInfo');
        if (infoDiv && fileInfo) {
            infoDiv.style.display = 'block';
            fileInfo.textContent = `📄 ${file.name} (${FileHelpers.formatFileSize(file.size)})`;
        }

        // Reset previous results
        resultImages = [];
        const preview = document.getElementById('pdfPreview');
        if (preview) {
            preview.innerHTML = `
                <p style="text-align: center; color: #4caf50; padding: 20px;">
                    ✅ Ready to convert: ${file.name}
                </p>
            `;
        }

        // Get PDF info
        PDFProcessor.getPDFInfo(file).then(info => {
            console.log('PDF Info:', info);
        }).catch(err => {
            console.warn('Could not get PDF info:', err);
        });

        // Hide download section
        document.getElementById('downloadSection').style.display = 'none';
    }

    /**
     * Convert PDF to images
     */
    async function convertPdf(dpi, format, quality) {
        if (!currentFile) {
            showToast('error', 'Please upload a PDF file first');
            return;
        }

        const convertBtn = document.getElementById('convertPdfBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = '⏳ Processing...';

        try {
            resultImages = await PDFProcessor.pdfToImages(currentFile, {
                dpi: dpi,
                format: format,
                quality: quality
            });

            // Display results
            displayResults(resultImages);
            showToast('success', `Successfully extracted ${resultImages.length} pages`);

            // Show download section
            document.getElementById('downloadSection').style.display = 'block';

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', `Conversion failed: ${error.message}`);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = '🔄 Convert to Images';
        }
    }

    /**
     * Display results
     */
    function displayResults(images) {
        const preview = document.getElementById('pdfPreview');
        if (!preview) return;

        if (!images || images.length === 0) {
            preview.innerHTML = '<p style="text-align: center; color: #999;">No images extracted</p>';
            return;
        }

        let html = '<div class="preview-grid">';
        
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const dataURL = img.canvas.toDataURL('image/png');
            html += `
                <div class="preview-item">
                    <img src="${dataURL}" alt="Page ${img.page}">
                    <span class="page-number">Page ${img.page}</span>
                </div>
            `;
        }
        
        html += '</div>';
        preview.innerHTML = html;
    }

    /**
     * Download all images individually
     */
    function downloadAll() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        for (const img of resultImages) {
            const filename = `page_${img.page}.png`;
            const dataURL = img.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showToast('success', `Downloaded ${resultImages.length} images`);
    }

    /**
     * Download as ZIP
     */
    async function downloadZip() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        try {
            showToast('info', 'Creating ZIP file...');
            
            const files = [];
            for (const img of resultImages) {
                const blob = await FileHelpers.canvasToBlob(img.canvas, 'image/png');
                files.push({
                    filename: `page_${img.page}.png`,
                    data: blob
                });
            }
            
            const zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_images.zip');
            
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

// Make PdfToImageController globally available
window.PdfToImageController = PdfToImageController;