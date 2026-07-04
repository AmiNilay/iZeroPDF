/**
 * PDF to JPG - UI Controller
 */

const PdfToJpgController = (function() {
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
                        <h2>🖼️ PDF → JPG</h2>
                        <p>Convert PDF pages to JPG images</p>
                    </div>

                    <div class="upload-area" id="pdfJpgUploadArea">
                        <input type="file" id="pdfJpgFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop your PDF here or click to browse</div>
                        <div class="upload-hint">Exports each page as a JPG image</div>
                    </div>

                    <div id="pdfJpgInfo" style="margin: 10px 0; display: none;">
                        <span id="pdfJpgFileDetails"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Quality:
                            <input type="range" id="jpgQuality" min="10" max="100" value="85">
                            <span id="jpgQualityValue">85%</span>
                        </label>
                        <label>
                            DPI:
                            <select id="jpgDpi">
                                <option value="72">72 (Web)</option>
                                <option value="150" selected>150 (Print)</option>
                                <option value="300">300 (High Quality)</option>
                            </select>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="convertToJpgBtn" disabled>
                        🖼️ Convert to JPG
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="jpgResult" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadJpgAll">📥 Download All</button>
                        <button class="btn btn-secondary" id="downloadJpgZip">📦 Download as ZIP</button>
                        <span id="jpgInfo" style="margin-left: 10px;"></span>
                    </div>

                    <div id="jpgPreview" class="preview-area" style="margin-top: 10px; display: none;"></div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('pdfJpgFileInput');
        const uploadArea = document.getElementById('pdfJpgUploadArea');
        const convertBtn = document.getElementById('convertToJpgBtn');
        const qualityRange = document.getElementById('jpgQuality');
        const qualityLabel = document.getElementById('jpgQualityValue');

        // Quality range
        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

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

        // Convert
        if (convertBtn) {
            convertBtn.addEventListener('click', convertToJpg);
        }

        // Download buttons
        document.getElementById('downloadJpgAll').addEventListener('click', downloadAll);
        document.getElementById('downloadJpgZip').addEventListener('click', downloadZip);
    }

    /**
     * Handle file upload
     */
    async function handleFile(file) {
        currentFile = file;
        
        try {
            const info = await PDFProcessor.getPDFInfo(file);
            
            const infoDiv = document.getElementById('pdfJpgInfo');
            const details = document.getElementById('pdfJpgFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = `📄 ${file.name} (${info.totalPages} pages)`;
            }

            document.getElementById('convertToJpgBtn').disabled = false;
            document.getElementById('jpgResult').style.display = 'none';
            document.getElementById('jpgPreview').style.display = 'none';
            
            showToast('success', `Loaded PDF with ${info.totalPages} pages`);

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', `Failed to read PDF: ${error.message}`);
        }
    }

    /**
     * Convert to JPG
     */
    async function convertToJpg() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const convertBtn = document.getElementById('convertToJpgBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = '⏳ Converting...';

        try {
            const dpi = parseInt(document.getElementById('jpgDpi').value);
            const quality = parseInt(document.getElementById('jpgQuality').value) / 100;

            // Use existing PDFProcessor with JPG format
            resultImages = await PDFProcessor.pdfToImages(currentFile, {
                dpi: dpi,
                format: 'image/jpeg',
                quality: quality
            });

            // Show results
            displayResults(resultImages);
            
            document.getElementById('jpgResult').style.display = 'block';
            document.getElementById('jpgInfo').textContent = `${resultImages.length} pages converted`;

            showToast('success', `Converted ${resultImages.length} pages to JPG`);

        } catch (error) {
            console.error('Conversion error:', error);
            showToast('error', `Conversion failed: ${error.message}`);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = '🖼️ Convert to JPG';
        }
    }

    /**
     * Display results
     */
    function displayResults(images) {
        const preview = document.getElementById('jpgPreview');
        if (!preview) return;

        if (!images || images.length === 0) {
            preview.innerHTML = '<p style="text-align: center; color: #999;">No images extracted</p>';
            preview.style.display = 'block';
            return;
        }

        let html = '<div class="preview-grid">';
        
        for (let i = 0; i < Math.min(images.length, 12); i++) {
            const img = images[i];
            const dataURL = img.canvas.toDataURL('image/jpeg', 0.85);
            html += `
                <div class="preview-item">
                    <img src="${dataURL}" alt="Page ${img.page}">
                    <span class="page-number">Page ${img.page}</span>
                </div>
            `;
        }
        
        if (images.length > 12) {
            html += `<div class="preview-item" style="display:flex;align-items:center;justify-content:center;background:#f5f5f5;">
                +${images.length - 12} more
            </div>`;
        }
        
        html += '</div>';
        preview.innerHTML = html;
        preview.style.display = 'block';
    }

    /**
     * Download all images
     */
    function downloadAll() {
        if (resultImages.length === 0) {
            showToast('warning', 'No images to download');
            return;
        }

        for (const img of resultImages) {
            const dataURL = img.canvas.toDataURL('image/jpeg', 0.85);
            const link = document.createElement('a');
            link.download = `page_${img.page}.jpg`;
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
            showToast('info', 'Creating ZIP...');
            
            const files = [];
            for (const img of resultImages) {
                const blob = await FileHelpers.canvasToBlob(img.canvas, 'image/jpeg', 0.85);
                files.push({
                    filename: `page_${img.page}.jpg`,
                    data: blob
                });
            }
            
            const zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'pdf_pages.zip');
            
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

// Make PdfToJpgController globally available
window.PdfToJpgController = PdfToJpgController;